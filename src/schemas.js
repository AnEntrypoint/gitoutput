/** Data shapes for gitingest: FileSystemNode tree, IngestionQuery, CloneConfig. */

import { lstat, readlink as fsReadlink } from 'node:fs/promises';
import path from 'node:path';

import { MAX_FILE_SIZE } from './config.js';
import { decodes, getPreferredEncodings, readChunk, readFileWithEncoding } from './fileUtils.js';
import { processNotebook } from './notebook.js';

// Tiktoken counts 2 tokens if a separator run exceeds 48 chars, so we match that exactly.
export const SEPARATOR = '='.repeat(48);

export const FileSystemNodeType = Object.freeze({
    DIRECTORY: 'DIRECTORY',
    FILE: 'FILE',
    SYMLINK: 'SYMLINK',
});

export class FileSystemStats {
    totalFiles = 0;
    totalSize = 0;
}

/**
 * A node (file, directory, or symlink) in the ingested file tree.
 */
export class FileSystemNode {
    /**
   * @param {object} opts
   * @param {string} opts.name
   * @param {string} opts.type - one of FileSystemNodeType
   * @param {string} opts.pathStr - path relative to the ingestion root (posix-style string)
   * @param {string} opts.fsPath - absolute filesystem path
   * @param {number} [opts.size]
   * @param {number} [opts.fileCount]
   * @param {number} [opts.dirCount]
   * @param {number} [opts.depth]
   */
    constructor({ name, type, pathStr, fsPath, size = 0, fileCount = 0, dirCount = 0, depth = 0 }) {
        this.name = name;
        this.type = type;
        this.pathStr = pathStr;
        this.fsPath = fsPath;
        this.size = size;
        this.fileCount = fileCount;
        this.dirCount = dirCount;
        this.depth = depth;
        /** @type {FileSystemNode[]} */
        this.children = [];
    }

    /** Sort children: README first, then regular files, hidden files, regular dirs, hidden dirs — alphanumeric within each group. */
    sortChildren() {
        if (this.type !== FileSystemNodeType.DIRECTORY) {
            throw new Error('Cannot sort children of a non-directory node');
        }

        const sortKey = (child) => {
            const name = child.name.toLowerCase();

            if (child.type === FileSystemNodeType.FILE) {
                if (name === 'readme' || name.startsWith('readme.')) {
                    return [0, name];
                }

                return [name.startsWith('.') ? 2 : 1, name];
            }

            return [name.startsWith('.') ? 4 : 3, name];
        };

        this.children.sort((a, b) => {
            const [ga, na] = sortKey(a);
            const [gb, nb] = sortKey(b);

            if (ga !== gb) {return ga - gb;}

            return na < nb ? -1 : na > nb ? 1 : 0;
        });
    }

    /** Resolve the target name of a symlink (basename only), or empty string if unresolvable. */
    async _symlinkTargetName() {
        try {
            const target = await fsReadlink(this.fsPath);

            return path.basename(target);
        } catch {
            return '';
        }
    }

    /** Return file content (if text/notebook) or an explanatory placeholder. */
    async content() {
        if (this.type === FileSystemNodeType.DIRECTORY) {
            throw new Error('Cannot read content of a directory node');
        }

        if (this.type === FileSystemNodeType.SYMLINK) {
            return '';
        }

        if (this.fsPath.endsWith('.ipynb')) {
            try {
                return await processNotebook(this.fsPath);
            } catch (exc) {
                return `Error processing notebook: ${exc.message}`;
            }
        }

        const chunk = await readChunk(this.fsPath);

        if (chunk === null) {
            return 'Error reading file';
        }
        if (chunk.length === 0) {
            return '[Empty file]';
        }
        if (!decodes(chunk, 'utf-8')) {
            return '[Binary file]';
        }

        const goodEncoding = getPreferredEncodings().find((enc) => decodes(chunk, enc));

        if (!goodEncoding) {
            return 'Error: Unable to decode file with available encodings';
        }

        try {
            return await readFileWithEncoding(this.fsPath, goodEncoding);
        } catch (exc) {
            return `Error reading file with ${JSON.stringify(goodEncoding)}: ${exc.message}`;
        }
    }

    /** Return the full "=== TYPE: path ===\ncontent\n\n" block used in the digest content section. */
    async contentString() {
        const displayPath = String(this.pathStr).split(path.sep)
            .join('/');
        const symlinkSuffix =
      this.type === FileSystemNodeType.SYMLINK ? ` -> ${await this._symlinkTargetName()}` : '';
        const parts = [SEPARATOR, `${this.type}: ${displayPath}${symlinkSuffix}`, SEPARATOR, await this.content()];

        return `${parts.join('\n') }\n\n`;
    }
}

/**
 * Configuration for cloning a Git repository.
 */
export class CloneConfig {
    constructor({
        url,
        localPath,
        commit = null,
        branch = null,
        tag = null,
        subpath = '/',
        blob = false,
        includeSubmodules = true,
    }) {
        this.url = url;
        this.localPath = localPath;
        this.commit = commit;
        this.branch = branch;
        this.tag = tag;
        this.subpath = subpath;
        this.blob = blob;
        this.includeSubmodules = includeSubmodules;
    }
}

/**
 * Parsed details of the repository or local path being ingested.
 */
export class IngestionQuery {
    constructor({
        host = null,
        userName = null,
        repoName = null,
        localPath,
        url = null,
        slug,
        id,
        subpath = '/',
        type = null,
        branch = null,
        commit = null,
        tag = null,
        maxFileSize = MAX_FILE_SIZE,
        ignorePatterns = new Set(),
        includePatterns = null,
        includeSubmodules = true,
    }) {
        this.host = host;
        this.userName = userName;
        this.repoName = repoName;
        this.localPath = localPath;
        this.url = url;
        this.slug = slug;
        this.id = id;
        this.subpath = subpath;
        this.type = type;
        this.branch = branch;
        this.commit = commit;
        this.tag = tag;
        this.maxFileSize = maxFileSize;
        this.ignorePatterns = ignorePatterns;
        this.includePatterns = includePatterns;
        this.includeSubmodules = includeSubmodules;
    }

    extractCloneConfig() {
        if (!this.url) {
            throw new Error("The 'url' parameter is required.");
        }

        return new CloneConfig({
            url: this.url,
            localPath: this.localPath,
            commit: this.commit,
            branch: this.branch,
            tag: this.tag,
            subpath: this.subpath,
            blob: this.type === 'blob',
            includeSubmodules: this.includeSubmodules,
        });
    }
}

/** lstat wrapper used by ingestion.js to distinguish symlinks without following them. */
export async function lstatSafe(fsPath) {
    try {
        return await lstat(fsPath);
    } catch {
        return null;
    }
}
