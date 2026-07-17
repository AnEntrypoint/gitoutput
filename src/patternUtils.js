/** Normalizes include/exclude CLI pattern arguments into pattern sets. Mirrors pattern_utils.py. */

import { DEFAULT_IGNORE_PATTERNS } from './ignorePatterns.js';

const PATTERN_SPLIT_RE = /[,\s]+/;

/**
 * @param {Iterable<string>|string|null|undefined} excludePatterns
 * @param {Iterable<string>|string|null|undefined} includePatterns
 * @returns {{ignorePatterns: Set<string>, includePatterns: Set<string>|null}}
 */
export function processPatterns(excludePatterns, includePatterns) {
    const ignorePatternsSet = new Set(DEFAULT_IGNORE_PATTERNS);

    if (excludePatterns && sizeOf(excludePatterns) > 0) {
        for (const p of parsePatterns(excludePatterns)) {ignorePatternsSet.add(p);}
    }

    let parsedInclude = null;

    if (includePatterns && sizeOf(includePatterns) > 0) {
        parsedInclude = parsePatterns(includePatterns);
        for (const p of parsedInclude) {ignorePatternsSet.delete(p);}
    }

    return { ignorePatterns: ignorePatternsSet, includePatterns: parsedInclude };
}

function sizeOf(value) {
    if (typeof value === 'string') {return value.length;}
    if (value instanceof Set) {return value.size;}
    if (Array.isArray(value)) {return value.length;}

    return [...value].length;
}

/**
 * @param {Iterable<string>|string} patterns
 * @returns {Set<string>}
 */
function parsePatterns(patterns) {
    const list = typeof patterns === 'string' ? [patterns] : [...patterns];
    const out = new Set();

    for (const pat of list) {
        for (const part of pat.trim().split(PATTERN_SPLIT_RE)) {
            if (part) {out.add(part.replace(/\\/g, '/'));}
        }
    }

    return out;
}
