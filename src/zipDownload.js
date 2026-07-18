/**
 * Lightweight GitHub-only clone alternative: download the repo as a zipball (no .git
 * history, no object database) and extract it straight into a temp directory. Used as
 * the fast path for public github.com repos with no submodules; everything else
 * (private repos, submodules, non-GitHub hosts, branch/tag/commit resolution edge
 * cases) still goes through the git-clone path in clone.js.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import zlib from 'node:zlib';

const MAX_ZIP_SIZE = 200 * 1024 * 1024; // sanity cap; codeload has no Content-Length guarantee

/**
 * Download and extract a GitHub codeload zipball for `owner/repo` at `ref` into `destDir`.
 * The zip's single top-level directory (`<repo>-<ref>/...`) is stripped so `destDir`
 * directly contains the repo root, matching what a `git clone` into `destDir` would give.
 * @param {string} owner
 * @param {string} repo
 * @param {string} ref - branch, tag, or commit SHA
 * @param {string} destDir
 * @param {string|null} [token]
 * @returns {Promise<void>}
 */
export async function downloadGithubZipball(owner, repo, ref, destDir, token = null) {
    const url = `https://codeload.github.com/${owner}/${repo}/zip/${encodeURIComponent(ref)}`;
    const buffer = await fetchBuffer(url, token);
    const entries = parseZip(buffer);

    await mkdir(destDir, { recursive: true });
    await extractEntries(entries, destDir);
}

function fetchBuffer(url, token, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        const headers = { 'User-Agent': 'gitoutput' };

        if (token) {headers.Authorization = `token ${token}`;}

        const req = https.get(url, { headers }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();

                if (redirectsLeft <= 0) {
                    reject(new Error('Too many redirects downloading zipball'));

                    return;
                }

                fetchBuffer(res.headers.location, token, redirectsLeft - 1).then(resolve, reject);

                return;
            }

            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`Zipball download failed: HTTP ${res.statusCode} for ${url}`));

                return;
            }

            const chunks = [];
            let total = 0;

            res.on('data', (chunk) => {
                total += chunk.length;

                if (total > MAX_ZIP_SIZE) {
                    req.destroy();
                    reject(new Error('Zipball exceeds maximum allowed size'));

                    return;
                }

                chunks.push(chunk);
            });
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });

        req.on('error', reject);
    });
}

/**
 * Minimal ZIP central-directory parser. Reads the End Of Central Directory record,
 * walks the central directory, and returns each entry's metadata plus its raw
 * (still-compressed) data slice from the buffer, resolved lazily on extraction.
 * @param {Buffer} buf
 * @returns {Array<{name: string, isDir: boolean, method: number, compressedData: Buffer}>}
 */
function parseZip(buf) {
    const eocdOffset = findEndOfCentralDirectory(buf);

    if (eocdOffset === -1) {
        throw new Error('Not a valid zip file (no End Of Central Directory record found)');
    }

    const entryCount = buf.readUInt16LE(eocdOffset + 10);
    const cdOffset = buf.readUInt32LE(eocdOffset + 16);

    const entries = [];
    let ptr = cdOffset;

    for (let i = 0; i < entryCount; i++) {
        if (buf.readUInt32LE(ptr) !== 0x02014b50) {
            throw new Error(`Malformed zip central directory entry at offset ${ptr}`);
        }

        const method = buf.readUInt16LE(ptr + 10);
        const compressedSize = buf.readUInt32LE(ptr + 20);
        const uncompressedSize = buf.readUInt32LE(ptr + 24);
        const nameLen = buf.readUInt16LE(ptr + 28);
        const extraLen = buf.readUInt16LE(ptr + 30);
        const commentLen = buf.readUInt16LE(ptr + 32);
        const externalAttrs = buf.readUInt32LE(ptr + 38);
        const localHeaderOffset = buf.readUInt32LE(ptr + 42);
        const name = buf.toString('utf-8', ptr + 46, ptr + 46 + nameLen);

        // Unix mode bits live in the top 16 bits of externalAttrs when the "made by" host
        // (upper byte of version-made-by, not read here) is Unix -- GitHub's codeload zips
        // always are. Directory entries also conventionally end with '/'.
        const unixMode = externalAttrs >>> 16;
        const isDir = name.endsWith('/') || (unixMode & 0o170000) === 0o040000;

        entries.push({
            name, isDir, method, compressedSize, uncompressedSize, localHeaderOffset,
        });

        ptr += 46 + nameLen + extraLen + commentLen;
    }

    for (const entry of entries) {
        if (entry.isDir) {continue;}
        entry.compressedData = readLocalFileData(buf, entry);
    }

    return entries;
}

function readLocalFileData(buf, entry) {
    const lfhOffset = entry.localHeaderOffset;

    if (buf.readUInt32LE(lfhOffset) !== 0x04034b50) {
        throw new Error(`Malformed zip local file header at offset ${lfhOffset}`);
    }

    const nameLen = buf.readUInt16LE(lfhOffset + 26);
    const extraLen = buf.readUInt16LE(lfhOffset + 28);
    const dataStart = lfhOffset + 30 + nameLen + extraLen;

    return buf.subarray(dataStart, dataStart + entry.compressedSize);
}

function findEndOfCentralDirectory(buf) {
    const sig = 0x06054b50;
    const minLen = 22;
    const maxCommentLen = 65535;
    const searchStart = Math.max(0, buf.length - minLen - maxCommentLen);

    for (let i = buf.length - minLen; i >= searchStart; i--) {
        if (buf.readUInt32LE(i) === sig) {return i;}
    }

    return -1;
}

async function extractEntries(entries, destDir) {
    // Every real GitHub codeload zipball wraps its contents in a single top-level
    // "<repo>-<ref>/" directory; strip it so destDir mirrors a plain `git clone`.
    const prefix = findCommonTopLevelDir(entries);

    for (const entry of entries) {
        if (entry.isDir) {continue;}

        const relName = prefix ? entry.name.slice(prefix.length) : entry.name;

        if (!relName) {continue;}

        const outPath = path.join(destDir, relName);

        await mkdir(path.dirname(outPath), { recursive: true });

        const data = entry.method === 0
            ? entry.compressedData
            : zlib.inflateRawSync(entry.compressedData);

        await writeFile(outPath, data);
    }
}

function findCommonTopLevelDir(entries) {
    const first = entries.find((e) => e.name.includes('/'));

    if (!first) {return null;}

    const top = `${first.name.split('/')[0]}/`;

    return entries.every((e) => e.name.startsWith(top)) ? top : null;
}
