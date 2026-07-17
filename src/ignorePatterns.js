/** Default ignore patterns and .gitignore/.gitingestignore file loading, mirroring ignore_patterns.py. */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_IGNORE_PATTERNS = new Set([
    // Python
    '*.pyc',
    '*.pyo',
    '*.pyd',
    '__pycache__',
    '.pytest_cache',
    '.coverage',
    '.tox',
    '.nox',
    '.mypy_cache',
    '.ruff_cache',
    '.hypothesis',
    'poetry.lock',
    'Pipfile.lock',
    // JavaScript/FileSystemNode
    'node_modules',
    'bower_components',
    'package-lock.json',
    'yarn.lock',
    '.npm',
    '.yarn',
    '.pnpm-store',
    'bun.lock',
    'bun.lockb',
    // Java
    '*.class',
    '*.jar',
    '*.war',
    '*.ear',
    '*.nar',
    '.gradle/',
    'build/',
    '.settings/',
    '.classpath',
    'gradle-app.setting',
    '*.gradle',
    // IDEs and editors / Java
    '.project',
    // C/C++
    '*.o',
    '*.obj',
    '*.dll',
    '*.dylib',
    '*.exe',
    '*.lib',
    '*.out',
    '*.a',
    '*.pdb',
    // Binary
    '*.bin',
    // Swift/Xcode
    '.build/',
    '*.xcodeproj/',
    '*.xcworkspace/',
    '*.pbxuser',
    '*.mode1v3',
    '*.mode2v3',
    '*.perspectivev3',
    '*.xcuserstate',
    'xcuserdata/',
    '.swiftpm/',
    // Ruby
    '*.gem',
    '.bundle/',
    'vendor/bundle',
    'Gemfile.lock',
    '.ruby-version',
    '.ruby-gemset',
    '.rvmrc',
    // Rust
    'Cargo.lock',
    '**/*.rs.bk',
    // Java / Rust
    'target/',
    // Go
    'pkg/',
    // .NET/C#
    'obj/',
    '*.suo',
    '*.user',
    '*.userosscache',
    '*.sln.docstates',
    '*.nupkg',
    // Go / .NET / C#
    'bin/',
    // Version control
    '.git',
    '.svn',
    '.hg',
    '.gitignore',
    '.gitattributes',
    '.gitmodules',
    // Images and media
    '*.svg',
    '*.png',
    '*.jpg',
    '*.jpeg',
    '*.gif',
    '*.ico',
    '*.pdf',
    '*.mov',
    '*.mp4',
    '*.mp3',
    '*.wav',
    // Virtual environments
    'venv',
    '.venv',
    'env',
    '.env',
    'virtualenv',
    // IDEs and editors
    '.idea',
    '.vscode',
    '.vs',
    '*.swo',
    '*.swn',
    '.settings',
    '*.sublime-*',
    // Temporary and cache files
    '*.log',
    '*.bak',
    '*.swp',
    '*.temp',
    '*.tmp',
    '.cache',
    '.sass-cache',
    '.eslintcache',
    '.DS_Store',
    'Thumbs.db',
    'desktop.ini',
    // Build directories and artifacts
    'build',
    'dist',
    'target',
    'out',
    '*.egg-info',
    '*.egg',
    '*.whl',
    '*.so',
    // Documentation
    'site-packages',
    '.docusaurus',
    '.next',
    '.nuxt',
    // Database
    '*.db',
    '*.sqlite',
    '*.sqlite3',
    // Other common patterns
    '*.min.js',
    '*.min.css',
    '*.map',
    '*.tfstate*',
    'vendor/',
    // Gitingest
    'digest.txt',
]);

/**
 * Recursively walk `root` looking for files named `filename` (e.g. ".gitignore"),
 * parse each with git-wildmatch semantics, and return the union of patterns
 * (rewritten relative to `root`).
 *
 * @param {string} root
 * @param {string} filename
 * @returns {Promise<Set<string>>}
 */
export async function loadIgnorePatterns(root, filename) {
    const patterns = new Set();

    await walk(root, root, filename, patterns);

    return patterns;
}

async function walk(dir, root, filename, patterns) {
    let entries;

    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Never descend into VCS internals; matches typical rglob usage intent.
            if (entry.name === '.git') {continue;}
            await walk(full, root, filename, patterns);
        } else if (entry.isFile() && entry.name === filename) {
            const parsed = await parseIgnoreFile(full, root);

            for (const p of parsed) {patterns.add(p);}
        }
    }
}

async function parseIgnoreFile(ignoreFile, root) {
    const patterns = new Set();
    const relDir = path.relative(root, path.dirname(ignoreFile));
    const baseDir = relDir === '' ? '' : relDir.split(path.sep).join('/');

    const raw = await readFile(ignoreFile, 'utf-8');

    for (const rawLine of raw.split(/\r?\n/)) {
        let line = rawLine.trim();

        if (!line || line.startsWith('#')) {continue;}

        const negated = line.startsWith('!');

        if (negated) {line = line.slice(1);}

        if (line.startsWith('/')) {line = line.replace(/^\/+/, '');}

        const patternBody = baseDir ? `${baseDir}/${line}` : line;

        patterns.add(negated ? `!${patternBody}` : patternBody);
    }

    return patterns;
}
