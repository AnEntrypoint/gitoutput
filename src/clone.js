/** Git clone orchestration: shallow/partial clone, fetch+checkout resolved commit, submodules. Mirrors clone.py. */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_TIMEOUT } from './config.js';
import {
    checkRepoExists,
    checkoutPartialClone,
    createAuthenticatedUrl,
    ensureGitInstalled,
    isGithubHost,
    resolveCommit,
    runGit,
} from './gitUtils.js';

/**
 * Clone a repository to a local path based on the provided CloneConfig.
 * @param {import("./schemas.js").CloneConfig} config
 * @param {string|null} token
 */
export async function cloneRepo(config, token = null) {
    await withTimeout(DEFAULT_TIMEOUT, async () => {
        const { url, localPath } = config;
        const partialClone = config.subpath !== '/';

        await ensureGitInstalled();
        await mkdir(path.dirname(localPath), { recursive: true });

        if (!(await checkRepoExists(url, token))) {
            throw new Error('Repository not found. Make sure it is public or that you have provided a valid token.');
        }

        const commit = await resolveCommit(config, token);

        const authUrl = createAuthenticatedUrl(url, token);

        try {
            if (partialClone) {
                await runGit([
                    'clone',
                    '--single-branch',
                    '--no-checkout',
                    '--depth=1',
                    '--filter=blob:none',
                    '--sparse',
                    authUrl,
                    localPath,
                ]);
            } else if (token && isGithubHost(url)) {
                await runGit(['clone', '--single-branch', '--no-checkout', '--depth=1', authUrl, localPath]);
            } else {
                await runGit(['clone', '--single-branch', '--no-checkout', '--depth=1', url, localPath]);
            }
        } catch (exc) {
            throw new Error(`Git clone failed: ${exc.message}`);
        }

        if (partialClone) {
            await checkoutPartialClone(config);
        }

        await performPostCloneOperations(config, localPath, url, token, commit);
    });
}

async function performPostCloneOperations(config, localPath, url, token, commit) {
    try {
        if (token && isGithubHost(url)) {
            const { createGitAuthHeader } = await import('./gitUtils.js');
            const { key, value } = createGitAuthHeader(token, url);

            await runGit(['config', key, value], { cwd: localPath });
        }

        await runGit(['fetch', '--depth=1', 'origin', commit], { cwd: localPath });
        await runGit(['checkout', commit], { cwd: localPath });

        if (config.includeSubmodules) {
            await runGit(['submodule', 'update', '--init', '--recursive', '--depth=1'], { cwd: localPath });
        }
    } catch (exc) {
        throw new Error(`Git operation failed: ${exc.message}`);
    }
}

async function withTimeout(ms, fn) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Operation timed out after ${ms / 1000} seconds`)), ms);
    });

    try {
        return await Promise.race([fn(), timeout]);
    } finally {
        clearTimeout(timer);
    }
}
