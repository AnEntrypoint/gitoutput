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
            // TextDecoder with fatal:true throws on invalid UTF-8 sequences. `chunk` is a
            // fixed-size prefix read of the file, so a multi-byte character can be cut off
            // mid-sequence right at the boundary -- trim any incomplete trailing sequence
            // before validating, so a truncated (not actually malformed) character doesn't
            // misclassify a real text file as binary.
            new TextDecoder('utf-8', { fatal: true }).decode(trimIncompleteUtf8Tail(chunk));

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

/**
 * Drop a trailing incomplete UTF-8 multi-byte sequence from `chunk`, if any.
 * @param {Buffer} chunk
 * @returns {Buffer}
 */
function trimIncompleteUtf8Tail(chunk) {
    const len = chunk.length;

    if (len === 0) {return chunk;}

    // Scan back at most 3 bytes (the longest a UTF-8 sequence can trail by) looking
    // for the lead byte of a multi-byte sequence that the chunk cuts off before its
    // full length.
    for (let back = 1; back <= 3 && back <= len; back++) {
        const byte = chunk[len - back];

        if ((byte & 0xc0) === 0x80) {continue;} // continuation byte, keep scanning back

        const seqLen = byte >= 0xf0 ? 4 : byte >= 0xe0 ? 3 : byte >= 0xc0 ? 2 : 1;

        if (seqLen > back) {
            return chunk.subarray(0, len - back);
        }

        break;
    }

    return chunk;
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
