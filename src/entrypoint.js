/** Orchestrates parse -> clone (if remote) -> apply gitignores -> ingest -> write output -> cleanup. Mirrors entrypoint.py. */

import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { analyze } from 'mcp-thorns';

import { resolveToken } from './auth.js';
import { cloneRepo } from './clone.js';
import { MAX_FILE_SIZE, OUTPUT_CHUNK_SIZE } from './config.js';
import { loadIgnorePatterns } from './ignorePatterns.js';
import { ingestQuery } from './ingestion.js';
import { processPatterns } from './patternUtils.js';
import { parseLocalDirPath, parseRemoteRepo } from './queryParser.js';
import { KNOWN_GIT_HOSTS } from './queryParserUtils.js';

/**
 * Ingest a source (URL or local path) and return [summary, tree, content], optionally writing output.
 * @param {string} source
 * @param {object} [opts]
 * @param {number} [opts.maxFileSize]
 * @param {Set<string>|string[]|null} [opts.includePatterns]
 * @param {Set<string>|string[]|null} [opts.excludePatterns]
 * @param {string|null} [opts.branch]
 * @param {string|null} [opts.tag]
 * @param {boolean} [opts.includeGitignored]
 * @param {boolean} [opts.includeSubmodules] - defaults to true; pass false to exclude submodules
 * @param {string|null} [opts.token]
 * @param {string|null} [opts.output] - "-" for stdout; a file path or null/undefined writes chunked
 *   files of at most OUTPUT_CHUNK_SIZE characters each, named "<base>-<n><ext>". Chunk 1 holds the
 *   summary plus an mcp-thorns codebase report; later chunks hold the directory tree and file contents.
 * @returns {Promise<[string, string, string]>}
 */
export async function ingestAsync(source, opts = {}) {
    const {
        maxFileSize = MAX_FILE_SIZE,
        includePatterns = null,
        excludePatterns = null,
        branch = null,
        tag = null,
        includeGitignored = false,
        includeSubmodules = true,
        token: tokenArg = null,
        output = null,
    } = opts;

    const token = resolveToken(tokenArg);

    source = removeSuffix(source.trim(), '.git');

    let query;
    let isRemoteScheme = false;

    try {
        const url = new URL(source);

        isRemoteScheme = url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        isRemoteScheme = false;
    }

    if (isRemoteScheme || KNOWN_GIT_HOSTS.some((h) => source.includes(h))) {
        query = await parseRemoteRepo(source, token);
        query.includeSubmodules = includeSubmodules;
        overrideBranchAndTag(query, branch, tag);
    } else {
        query = parseLocalDirPath(source);
    }

    query.maxFileSize = maxFileSize;
    const { ignorePatterns, includePatterns: parsedInclude } = processPatterns(excludePatterns, includePatterns);

    query.ignorePatterns = ignorePatterns;
    query.includePatterns = parsedInclude;

    if (query.url) {
        overrideBranchAndTag(query, branch, tag);
    }

    query.includeSubmodules = includeSubmodules;

    let cleanupDir = null;

    try {
        if (query.url) {
            const cloneConfig = query.extractCloneConfig();

            await cloneRepo(cloneConfig, token);
            cleanupDir = path.dirname(query.localPath);
        }

        if (!includeGitignored) {
            await applyGitignores(query);
        }

        const [summary, tree, content] = await ingestQuery(query);
        const thornsReport = analyzeWithThorns(query.localPath);

        await writeOutput({ summary, tree, content, thornsReport, query, target: output });

        return [summary, tree, content];
    } finally {
        if (cleanupDir) {
            await rm(cleanupDir, { recursive: true, force: true, maxRetries: 3 });
        }
    }
}

function overrideBranchAndTag(query, branch, tag) {
    if (tag && query.tag && tag !== query.tag) {
        console.error(`Warning: The specified tag '${tag}' overrides the tag found in the URL '${query.tag}'.`);
    }
    query.tag = tag || query.tag;

    if (branch && query.branch && branch !== query.branch) {
        console.error(`Warning: The specified branch '${branch}' overrides the branch found in the URL '${query.branch}'.`);
    }
    query.branch = branch || query.branch;

    if (tag && branch) {
        console.error('Warning: Both tag and branch are specified. The tag will be used.');
    }

    if (query.tag) {
        query.branch = null;
    }
}

async function applyGitignores(query) {
    for (const fname of ['.gitignore', '.gitingestignore']) {

        const patterns = await loadIgnorePatterns(query.localPath, fname);

        for (const p of patterns) {query.ignorePatterns.add(p);}
    }
}

function analyzeWithThorns(localPath) {
    try {
        return analyze(localPath);
    } catch (exc) {
        return `mcp-thorns analysis failed: ${exc.message}`;
    }
}

async function writeOutput({ summary, tree, content, thornsReport, query, target }) {
    if (target === '-') {
        const data = `${summary}\n${tree}\n${content}`;

        await new Promise((resolve, reject) => {
            process.stdout.write(data, (err) => (err ? reject(err) : resolve()));
        });

        return;
    }

    const basePath = target != null ? target : defaultOutputBasePath(query);
    const firstChunk = `${summary}\n\n${thornsReport}`;
    const rest = `${tree}\n${content}`;
    const chunks = [firstChunk, ...splitIntoChunks(rest, OUTPUT_CHUNK_SIZE)];

    await Promise.all(chunks.map((chunk, i) => writeFile(chunkPath(basePath, i + 1), chunk, 'utf-8')));
}

function defaultOutputBasePath(query) {
    const rawName = query.repoName ?? query.slug ?? 'gitoutput';
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]+/g, '-');

    return `${safeName}.txt`;
}

function chunkPath(basePath, chunkNum) {
    const { dir, name, ext } = path.parse(basePath);

    return path.join(dir, `${name}-${chunkNum}${ext}`);
}

function splitIntoChunks(text, size) {
    if (text.length === 0) {return [];}

    const chunks = [];

    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }

    return chunks;
}

function removeSuffix(s, suffix) {
    return s.endsWith(suffix) ? s.slice(0, -suffix.length) : s;
}
