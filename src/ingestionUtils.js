/** Include/exclude glob matching helpers, mirroring ingestion_utils.py's _should_exclude/_should_include. */

import path from 'node:path';
import ignore from 'ignore';

/**
 * Return the path relative to `base`, posix-style, or null if `target` is not inside `base`.
 * @param {string} target
 * @param {string} base
 * @returns {string|null}
 */
function relativeOrNull(target, base) {
    const rel = path.relative(base, target);

    if (rel.startsWith('..') || path.isAbsolute(rel)) {
        return null;
    }

    return rel.split(path.sep).join('/');
}

/**
 * Return true if `targetPath` matches any of `includePatterns` (git-wildmatch semantics),
 * or if it is a directory (directories are always kept so their children can still be visited).
 *
 * @param {string} targetPath - absolute path
 * @param {string} basePath - absolute root path
 * @param {Set<string>|string[]} includePatterns
 * @param {boolean} isDir
 * @returns {boolean}
 */
export function shouldInclude(targetPath, basePath, includePatterns, isDir) {
    const rel = relativeOrNull(targetPath, basePath);

    if (rel === null) {return false;}
    if (isDir) {return true;}

    const ig = ignore().add([...includePatterns]);

    return ig.ignores(rel);
}

/**
 * Return true if `targetPath` matches any of `ignorePatterns` (git-wildmatch semantics).
 * Paths outside `basePath` are treated as already excluded.
 *
 * @param {string} targetPath - absolute path
 * @param {string} basePath - absolute root path
 * @param {Set<string>|string[]} ignorePatterns
 * @returns {boolean}
 */
export function shouldExclude(targetPath, basePath, ignorePatterns) {
    const rel = relativeOrNull(targetPath, basePath);

    if (rel === null) {return true;}

    const ig = ignore().add([...ignorePatterns]);

    return ig.ignores(rel);
}
