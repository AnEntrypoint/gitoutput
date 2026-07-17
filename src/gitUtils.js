/** Utility functions for shelling out to the real `git` binary. Mirrors utils/git_utils.py. */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { InvalidGitHubTokenError } from './errors.js';

const execFileAsync = promisify(execFile);

// GitHub Personal-Access tokens (classic + fine-grained).
//   - ghp_ / gho_ / ghu_ / ghs_ / ghr_  -> 36 alphanumerics
//   - github_pat_                       -> 22 alphanumerics + "_" + 59 alphanumerics
const GITHUB_PAT_PATTERN = /^(?:gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59})$/;

const EXEC_OPTS = { maxBuffer: 64 * 1024 * 1024 };

/** Run `git <args>` and return {stdout, stderr}, throwing RuntimeError-equivalent on non-zero exit. */
async function runGit(args, options = {}) {
    try {
        const { stdout, stderr } = await execFileAsync('git', args, { ...EXEC_OPTS, ...options });

        return { stdout, stderr };
    } catch (exc) {
        const stderr = (exc.stderr ?? '').toString().trim();
        const msg = `Command failed: git ${args.join(' ')}\nError: ${stderr || exc.message}`;

        throw new Error(msg);
    }
}

export function isGithubHost(url) {
    try {
        const hostname = new URL(url).hostname ?? '';

        return hostname.startsWith('github.');
    } catch {
        return false;
    }
}

/** Ensure git is installed and accessible; warns (does not throw) about Windows long-path config. */
export async function ensureGitInstalled() {
    try {
        await execFileAsync('git', ['--version'], EXEC_OPTS);
    } catch {
        throw new Error('Git is not installed or not accessible. Please install Git first.');
    }

    if (process.platform === 'win32') {
        try {
            const { stdout } = await execFileAsync('git', ['config', 'core.longpaths'], EXEC_OPTS);

            if (stdout.trim().toLowerCase() !== 'true') {

                console.error(
                    'Warning: Git clone may fail on Windows due to long file paths. ' +
            "Consider enabling long path support with: 'git config --global core.longpaths true'. " +
            'Note: This command may require administrator privileges.',
                );
            }
        } catch {
            // Ignore if checking core.longpaths fails (e.g. unset).
        }
    }
}

/** Check whether a remote Git repository is reachable (HEAD resolves). */
export async function checkRepoExists(url, token = null) {
    try {
        await resolveRefToSha(url, 'HEAD', token);
    } catch {
        return false;
    }

    return true;
}

/**
 * Fetch the list of branch or tag names available on a remote repository.
 * @param {string} url
 * @param {{refType: "branches"|"tags", token?: string|null}} opts
 * @returns {Promise<string[]>}
 */
export async function fetchRemoteBranchesOrTags(url, { refType, token = null }) {
    if (refType !== 'branches' && refType !== 'tags') {
        throw new Error(`Invalid fetch type: ${refType}`);
    }

    await ensureGitInstalled();

    const fetchTags = refType === 'tags';
    const toFetch = fetchTags ? 'tags' : 'heads';

    const cmdArgs = ['ls-remote', `--${toFetch}`];

    if (fetchTags) {cmdArgs.push('--refs');}

    const authUrl = createAuthenticatedUrl(url, token);

    cmdArgs.push(authUrl);

    let stdout;

    try {
        ({ stdout } = await runGit(cmdArgs));
    } catch (exc) {
        throw new Error(`Failed to fetch ${refType} from ${url}: ${exc.message}`);
    }

    const marker = `refs/${toFetch}/`;

    return stdout
        .split('\n')
        .filter((line) => line.trim() && line.includes(marker))
        .map((line) => line.split(marker, 2)[1] ?? line.slice(line.indexOf(marker) + marker.length));
}

/** Build the Basic-auth-embedded URL used for authenticated GitHub git operations. */
export function createAuthenticatedUrl(url, token = null) {
    if (!(token && isGithubHost(url))) {
        return url;
    }
    const parsed = new URL(url);

    parsed.username = 'x-oauth-basic';
    parsed.password = token;

    return parsed.toString();
}

/** Build the `http.<url>.extraheader` git-config value for GitHub Basic auth. */
export function createGitAuthHeader(token, url = 'https://github.com') {
    const hostname = new URL(url).hostname;

    if (!hostname) {
        throw new Error(`Invalid GitHub URL: ${JSON.stringify(url)}`);
    }
    const basic = Buffer.from(`x-oauth-basic:${token}`).toString('base64');

    return { key: `http.https://${hostname}/.extraheader`, value: `Authorization: Basic ${basic}` };
}

export function validateGithubToken(token) {
    if (!GITHUB_PAT_PATTERN.test(token)) {
        throw new InvalidGitHubTokenError();
    }
}

/** Configure sparse-checkout for a partially-cloned repository (subpath-only clones). */
export async function checkoutPartialClone(config) {
    let subpath = config.subpath.replace(/^\/+/, '');

    if (config.blob) {
    // Drop the file name from the subpath when ingesting a blob/branch/path/file.txt URL.
        const parts = subpath.split('/');

        parts.pop();
        subpath = parts.join('/');
    }

    try {
        await runGit(['sparse-checkout', 'set', subpath], { cwd: config.localPath });
    } catch (exc) {
        throw new Error(`Failed to configure sparse-checkout: ${exc.message}`);
    }
}

/** Resolve which commit SHA to check out, based on config.commit/tag/branch (else HEAD). */
export async function resolveCommit(config, token = null) {
    if (config.commit) {return config.commit;}
    if (config.tag) {return resolveRefToSha(config.url, `refs/tags/${config.tag}*`, token);}
    if (config.branch) {return resolveRefToSha(config.url, `refs/heads/${config.branch}`, token);}

    return resolveRefToSha(config.url, 'HEAD', token);
}

/** Return the commit SHA that `pattern` resolves to on the remote, via `git ls-remote`. */
export async function resolveRefToSha(url, pattern, token = null) {
    const authUrl = createAuthenticatedUrl(url, token);
    let stdout;

    try {
        ({ stdout } = await runGit(['ls-remote', authUrl, pattern]));
    } catch (exc) {
        throw new Error(`Failed to resolve ${pattern} in ${url}:\n${exc.message}`);
    }

    const lines = stdout.split('\n');
    const sha = pickCommitSha(lines);

    if (!sha) {
        throw new Error(`${JSON.stringify(pattern)} not found in ${url}`);
    }

    return sha;
}

function pickCommitSha(lines) {
    let firstNonPeeled = null;

    for (const ln of lines) {
        if (!ln.trim()) {continue;}
        const idx = ln.indexOf('\t');
        const spaceIdx = idx === -1 ? ln.indexOf(' ') : -1;
        const sepIdx = idx !== -1 ? idx : spaceIdx;

        if (sepIdx === -1) {continue;}
        const sha = ln.slice(0, sepIdx);
        const ref = ln.slice(sepIdx + 1);

        if (ref.endsWith('^{}')) {
            return sha; // peeled commit of an annotated tag — best match
        }
        if (firstNonPeeled === null) {
            firstNonPeeled = sha;
        }
    }

    return firstNonPeeled;
}

export { runGit };
