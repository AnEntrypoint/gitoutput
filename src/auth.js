/** Token resolution: explicit arg wins, then GITHUB_TOKEN env var. Mirrors utils/auth.py. */

import { validateGithubToken } from './gitUtils.js';

/**
 * @param {string|null|undefined} token
 * @returns {string|null}
 */
export function resolveToken(token) {
    const resolved = token || process.env.GITHUB_TOKEN || null;

    if (resolved) {
        validateGithubToken(resolved);
    }

    return resolved;
}
