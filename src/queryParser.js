/** Parses a source (URL/slug/local path) into a structured IngestionQuery. Mirrors query_parser.py. */

import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { TMP_BASE_PATH } from './config.js';
import { fetchRemoteBranchesOrTags, resolveCommit } from './gitUtils.js';
import {
    PathKind,
    fallbackToRoot,
    getUserAndRepoFromPath,
    isValidGitCommitHash,
    normaliseSource,
} from './queryParserUtils.js';
import { IngestionQuery } from './schemas.js';

/**
 * Parse a repository URL or "user/repo" slug into an IngestionQuery.
 * @param {string} source
 * @param {string|null} token
 * @returns {Promise<IngestionQuery>}
 */
export async function parseRemoteRepo(source, token = null) {
    const parsedUrl = await normaliseSource(source, token);
    const host = parsedUrl.netloc;
    const [user, repo] = getUserAndRepoFromPath(parsedUrl.path);

    const id = randomUUID();
    const slug = `${user}-${repo}`;
    const localPath = path.join(TMP_BASE_PATH, id, slug);
    const url = `https://${host}/${user}/${repo}`;

    const query = new IngestionQuery({
        host,
        userName: user,
        repoName: repo,
        url,
        localPath,
        slug,
        id,
    });

    const pathParts = parsedUrl.path.replace(/^\/+|\/+$/g, '').split('/')
        .slice(2);

    if (pathParts.length === 0) {
        return fallbackToRoot(query, token);
    }

    const kindValue = pathParts.shift();
    const kind = Object.values(PathKind).includes(kindValue) ? kindValue : null;

    if (kind === null) {
        throw new Error(`'${kindValue}' is not a valid PathKind`);
    }
    query.type = kind;

    if (query.type === PathKind.ISSUES || query.type === PathKind.PULL) {
        const msg = `Warning: Issues and pull requests are not yet supported: ${url}. Returning repository root.`;

        return fallbackToRoot(query, token, msg);
    }

    if (pathParts.length === 0) {
        const msg = `Warning: No extra path parts: ${url}. Returning repository root.`;

        return fallbackToRoot(query, token, msg);
    }

    if (query.type !== PathKind.TREE && query.type !== PathKind.BLOB) {
        const msg = `Warning: Type '${query.type}' is not yet supported: ${url}. Returning repository root.`;

        return fallbackToRoot(query, token, msg);
    }

    // Commit, branch, or tag
    const ref = pathParts[0];

    if (isValidGitCommitHash(ref)) {
        query.commit = ref;
        pathParts.shift();
    } else {
        query.tag = await configureBranchOrTag(pathParts, { url, refType: 'tags', token });
        if (!query.tag) {
            query.branch = await configureBranchOrTag(pathParts, { url, refType: 'branches', token });
        }
    }

    if (pathParts.length > 0 && (query.commit || query.branch || query.tag)) {
        query.subpath += pathParts.join('/');
    }

    query.commit = await resolveCommit(query.extractCloneConfig(), token);

    return query;
}

/**
 * Parse a local filesystem path into an IngestionQuery.
 * @param {string} pathStr
 * @returns {IngestionQuery}
 */
export function parseLocalDirPath(pathStr) {
    const pathObj = path.resolve(pathStr);
    const slug = pathStr === '.' ? path.basename(pathObj) : pathStr.replace(/^\/+|\/+$/g, '');

    return new IngestionQuery({ localPath: pathObj, slug, id: randomUUID() });
}

async function configureBranchOrTag(pathParts, { url, refType, token }) {
    let branchesOrTags;

    try {
        branchesOrTags = await fetchRemoteBranchesOrTags(url, { refType, token });
    } catch (exc) {
        console.error(`Warning: Failed to fetch ${refType}: ${exc.message}`);

        return pathParts.length > 0 ? pathParts.shift() : null;
    }

    const candidateParts = [];

    for (const part of pathParts) {
        candidateParts.push(part);
        const candidateName = candidateParts.join('/');

        if (branchesOrTags.includes(candidateName)) {
            pathParts.splice(0, candidateParts.length);

            return candidateName;
        }
    }

    return null;
}
