/**
 * Lightweight GitHub-only clone alternative: download the repo as a zipball (no .git
 * history, no object database) and extract it straight into a temp directory, including
 * submodules (resolved recursively via the GitHub Contents API + their own zipballs).
 * Used as the fast path for public github.com repos; anything a zipball genuinely can't
 * express (private-repo git-native auth edge cases, non-GitHub hosts, non-standard refs,
 * or any download/parse failure) still falls through to the git-clone path in clone.js.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import zlib from 'node:zlib';

const MAX_ZIP_SIZE = 200 * 1024 * 1024; // sanity cap; codeload has no Content-Length guarantee

/**
 * Download and extract a GitHub codeload zipball for `owner/repo` at `ref` into `destDir`,
 * then recursively resolve and fetch any submodules declared in `.gitmodules`.
 * The zip's single top-level directory (`<repo>-<ref>/...`) is stripped so `destDir`
 * directly contains the repo root, matching what a `git clone` into `destDir` would give.
 * @param {string} owner
 * @param {string} repo
 * @param {string} ref - branch, tag, or commit SHA
 * @param {string} destDir
 * @param {{token?: string|null, includeSubmodules?: boolean}} [opts]
 * @returns {Promise<void>}
 */
export async function downloadGithubZipball(owner, repo, ref, destDir, opts = {}) {
    const { token = null, includeSubmodules = true } = opts;
    const url = `https://codeload.github.com/${owner}/${repo}/zip/${encodeURIComponent(ref)}`;
    const buffer = await fetchBuffer(url, token);
    const entries = parseZip(buffer);

    await mkdir(destDir, { recursive: true });
    await extractEntries(entries, destDir);

    if (includeSubmodules) {
        await fetchSubmodulesRecursive(owner, repo, ref, destDir, token);
    }
}

/**
 * Read `.gitmodules` at `destDir` (if any), resolve each declared submodule's pinned
 * commit via the GitHub Contents API, and recursively download it into its own path.
 */
async function fetchSubmodulesRecursive(owner, repo, ref, destDir, token) {
    const submodules = await parseGitmodules(path.join(destDir, '.gitmodules'));

    for (const sub of submodules) {
        const subOwnerRepo = parseGithubUrl(sub.url);

        if (!subOwnerRepo) {continue;} // non-GitHub submodule URL -- leave the path empty, as a shallow git clone would too

        const pinnedSha = await fetchContentsSha(owner, repo, sub.path, ref, token);

        if (!pinnedSha) {continue;}

        const subDest = path.join(destDir, sub.path);

        await downloadGithubZipball(subOwnerRepo.owner, subOwnerRepo.repo, pinnedSha, subDest, { token, includeSubmodules: true });
    }
}

async function parseGitmodules(gitmodulesPath) {
    let raw;

    try {
        raw = await readFile(gitmodulesPath, 'utf-8');
    } catch {
        return [];
    }

    const submodules = [];
    let current = null;

    for (const rawLine of raw.split(/\r?\n/)) {
        const line = rawLine.trim();
        const sectionMatch = line.match(/^\[submodule\s+"(.+)"\]$/);

        if (sectionMatch) {
            current = { name: sectionMatch[1] };
            submodules.push(current);
            continue;
        }

        if (!current) {continue;}

        const kvMatch = line.match(/^(\w+)\s*=\s*(.+)$/);

        if (kvMatch) {current[kvMatch[1]] = kvMatch[2].trim();}
    }

    return submodules.filter((s) => s.path && s.url);
}

function parseGithubUrl(url) {
    const match = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);

    return match ? { owner: match[1], repo: match[2] } : null;
}

/** Resolve the pinned commit SHA a submodule gitlink points at, via the Contents API. */
async function fetchContentsSha(owner, repo, subPath, ref, token) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(subPath).replace(/%2F/g, '/')}?ref=${encodeURIComponent(ref)}`;
    const headers = { 'User-Agent': 'gitoutput', 'Accept': 'application/vnd.github+json' };

    if (token) {headers.Authorization = `token ${token}`;}

    const body = await fetchJson(apiUrl, headers);

    return body && typeof body.sha === 'string' ? body.sha : null;
}

function fetchJson(url, headers, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();

                if (redirectsLeft <= 0) {
                    reject(new Error('Too many redirects fetching GitHub API'));

                    return;
                }

                fetchJson(res.headers.location, headers, redirectsLeft - 1).then(resolve, reject);

                return;
            }

            if (res.statusCode !== 200) {
                res.resume();
                resolve(null); // submodule metadata lookup failure is non-fatal -- skip that submodule

                return;
            }

            const chunks = [];

            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
                } catch {
                    resolve(null);
                }
            });
            res.on('error', reject);
        }).on('error', reject);
    });
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
