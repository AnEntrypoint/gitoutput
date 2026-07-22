/** Configuration constants for gitingest. Values must stay in lockstep with the Python package. */

import os from 'node:os';
import path from 'node:path';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // Maximum size of a single file to process (10 MB)
export const MAX_DIRECTORY_DEPTH = 20; // Maximum depth of directory traversal
export const MAX_FILES = 10_000; // Maximum number of files to process
export const MAX_TOTAL_SIZE_BYTES = 500 * 1024 * 1024; // Maximum size of output file (500 MB)
export const DEFAULT_TIMEOUT = 60_000; // ms (Python: 60 seconds)
export const OUTPUT_CHUNK_SIZE = 80_000; // Max characters per output file when chunking

export const TMP_BASE_PATH = path.join(os.tmpdir(), 'gitingest');
