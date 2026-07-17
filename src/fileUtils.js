/** File reading/binary-detection helpers, mirroring gitingest's Python file_utils.py heuristics. */

import { open } from 'node:fs/promises';
import iconv from 'iconv-lite';

const CHUNK_SIZE = 1024; // bytes

// Encodings to try, in priority order. Node has no locale-preferred-encoding concept like
// Python's locale.getpreferredencoding(), so we start from utf-8 and fall back through the
// same practical set the Python tool tries on Windows/other platforms.
const PREFERRED_ENCODINGS = ['utf-8', 'utf-16', 'utf-16le', 'utf8', 'latin1', 'win1252', 'iso88591'];

/**
 * Read the first CHUNK_SIZE bytes of a file. Returns null on any read error.
 * @param {string} filePath
 * @returns {Promise<Buffer|null>}
 */
export async function readChunk(filePath) {
    let handle;

    try {
        handle = await open(filePath, 'r');
        const buffer = Buffer.alloc(CHUNK_SIZE);
        const { bytesRead } = await handle.read(buffer, 0, CHUNK_SIZE, 0);

        return buffer.subarray(0, bytesRead);
    } catch {
        return null;
    } finally {
        await handle?.close().catch(() => {});
    }
}

/**
 * Return true if `chunk` decodes cleanly with `encoding` (no replacement/invalid-byte artifacts).
 * @param {Buffer} chunk
 * @param {string} encoding
 * @returns {boolean}
 */
export function decodes(chunk, encoding) {
    try {
        if (encoding === 'utf-8' || encoding === 'utf8') {
            // TextDecoder with fatal:true throws on invalid UTF-8 sequences.
            new TextDecoder('utf-8', { fatal: true }).decode(chunk);

            return true;
        }
        if (encoding === 'utf-16' || encoding === 'utf-16le') {
            // Node/browsers only support little-endian natively; treat "utf-16" as utf-16le
            // (matches the common case Python's codec also resolves to on most platforms).
            new TextDecoder('utf-16le', { fatal: true }).decode(chunk);

            return true;
        }
        if (!iconv.encodingExists(encoding)) {
            return false;
        }
        // iconv-lite has no strict/fatal mode; single-byte encodings (latin1/win1252/iso88591)
        // always "decode" (every byte maps to something), so this is a best-effort acceptance,
        // matching Python's behaviour where these encodings are likewise never rejected.
        iconv.decode(chunk, encoding);

        return true;
    } catch {
        return false;
    }
}

export function getPreferredEncodings() {
    return PREFERRED_ENCODINGS;
}

/**
 * Fully read a file's text content using the first encoding that decodes its leading chunk cleanly.
 * @param {string} filePath
 * @param {string} encoding
 * @returns {Promise<string>}
 */
export async function readFileWithEncoding(filePath, encoding) {
    const { readFile } = await import('node:fs/promises');
    const buffer = await readFile(filePath);

    if (encoding === 'utf-8' || encoding === 'utf8') {
        return buffer.toString('utf-8');
    }
    if (encoding === 'utf-16' || encoding === 'utf-16le') {
        return buffer.toString('utf16le');
    }

    return iconv.decode(buffer, encoding);
}
