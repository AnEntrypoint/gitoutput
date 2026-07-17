/** URL/slug parsing helpers for remote-repo queries. Mirrors utils/query_parser_utils.py. */

import { checkRepoExists, resolveRefToSha } from './gitUtils.js';

const HEX_DIGITS = new Set('0123456789abcdefABCDEF');

export const KNOWN_GIT_HOSTS = [
    'github.com',
    'gitlab.com',
    'bitbucket.org',
    'gitea.com',
    'codeberg.org',
    'gist.github.com',
];

export const PathKind = Object.freeze({
    TREE: 'tree',
    BLOB: 'blob',
    ISSUES: 'issues',
    PULL: 'pull',
});

/** Fallback: point the query at the repo's HEAD commit (root of default branch). */
export async function fallbackToRoot(query, token, warnMsg = null) {
    query.commit = await resolveRefToSha(query.url, 'HEAD', token);
    if (warnMsg) {
        console.error(warnMsg);
    }

    return query;
}

/**
 * Normalise a raw source string (full URL, scheme-less URL, or bare "user/repo" slug)
 * into a URL-like object: {scheme, netloc (host), path}.
 */
export async function normaliseSource(raw, token) {
    raw = decodeURIComponent(raw);

    const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//.exec(raw);

    if (schemeMatch) {
        const parsed = new URL(raw);

        validateUrlScheme(parsed.protocol.replace(/:$/, ''));
        validateHost(parsed.hostname);

        return { scheme: parsed.protocol.replace(/:$/, ''), netloc: parsed.hostname, path: parsed.pathname };
    }

    // no scheme ("host/user/repo" or "user/repo")
    const host = raw.split('/', 1)[0].toLowerCase();

    if (host.includes('.')) {
        validateHost(host);
        const parsed = new URL(`https://${raw}`);

        return { scheme: 'https', netloc: parsed.hostname, path: parsed.pathname };
    }

    // "user/repo" slug
    const [userName, repoName] = getUserAndRepoFromPath(raw);
    const domain = await tryDomainsForUserAndRepo(userName, repoName, token);
    const parsed = new URL(`https://${domain}/${raw}`);

    return { scheme: 'https', netloc: parsed.hostname, path: parsed.pathname };
}

async function tryDomainsForUserAndRepo(userName, repoName, token) {
    for (const domain of KNOWN_GIT_HOSTS) {
        const candidate = `https://${domain}/${userName}/${repoName}`;
        const useToken = domain.startsWith('github.') ? token : null;


        if (await checkRepoExists(candidate, useToken)) {
            return domain;
        }
    }
    throw new Error(`Could not find a valid repository host for '${userName}/${repoName}'.`);
}

export function isValidGitCommitHash(commit) {
    const SHA_HEX_LENGTH = 40;

    if (commit.length !== SHA_HEX_LENGTH) {return false;}
    for (const c of commit) {
        if (!HEX_DIGITS.has(c)) {return false;}
    }

    return true;
}

function validateHost(host) {
    host = host.toLowerCase();
    if (!KNOWN_GIT_HOSTS.includes(host) && !looksLikeGitHost(host)) {
        throw new Error(`Unknown domain '${host}' in URL`);
    }
}

function looksLikeGitHost(host) {
    host = host.toLowerCase();

    return host.startsWith('git.') || host.startsWith('gitlab.') || host.startsWith('github.');
}

function validateUrlScheme(scheme) {
    scheme = scheme.toLowerCase();
    if (scheme !== 'https' && scheme !== 'http') {
        throw new Error(`Invalid URL scheme '${scheme}' in URL`);
    }
}

export function getUserAndRepoFromPath(pathStr) {
    const MIN_PATH_PARTS = 2;
    const parts = pathStr.toLowerCase().replace(/^\/+|\/+$/g, '')
        .split('/');

    if (parts.length < MIN_PATH_PARTS) {
        throw new Error(`Invalid repository URL '${pathStr}'`);
    }

    return [parts[0], parts[1]];
}
