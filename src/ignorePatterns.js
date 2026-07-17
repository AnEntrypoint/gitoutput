/** Default ignore patterns and .gitignore/.gitingestignore file loading, mirroring ignore_patterns.py. */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_IGNORE_PATTERNS = new Set([
    // Hidden files and directories, unconditionally -- dotfiles/dotdirs are
    // tool/editor/VCS/CI/agent-tooling metadata by convention, never
    // planning-relevant source. Matches at any depth (gitignore semantics:
    // no leading slash). Subsumes VCS internals, IDE/editor config, AI-agent
    // tooling state (.gm/, .claude/, .wfgy/, .plugkit-*/, .codeinsight,
    // .code-search/, etc.), dotfile lockfiles, and OS metadata dotfiles --
    // all listed individually below only where they are NOT dot-prefixed.
    '.*',
    // Python
    '*.pyc',
    '*.pyo',
    '*.pyd',
    '__pycache__',
    'poetry.lock',
    'Pipfile.lock',
    'uv.lock',
    'mlruns',
    'wandb',
    // JavaScript/FileSystemNode
    'node_modules',
    'bower_components',
    'jspm_packages',
    'web_modules',
    'package-lock.json',
    'yarn.lock',
    'yarn-error.log',
    'npm-debug.log*',
    'lerna-debug.log*',
    'bun.lock',
    'bun.lockb',
    'deno.lock',
    // Java
    '*.class',
    '*.jar',
    '*.war',
    '*.ear',
    '*.nar',
    'gradle-app.setting',
    '*.gradle',
    'nbproject',
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
    // Embedded/firmware
    '*.hex',
    '*.elf',
    '*.uf2',
    '*.dfu',
    // Swift/Xcode
    '*.xcodeproj/',
    '*.xcworkspace/',
    '*.pbxuser',
    '*.mode1v3',
    '*.mode2v3',
    '*.perspectivev3',
    '*.xcuserstate',
    'xcuserdata/',
    '*.ipa',
    '*.dSYM',
    'Carthage/Build/',
    'fastlane/report.xml',
    'fastlane/screenshots/',
    'fastlane/test_output/',
    // Android
    '*.apk',
    '*.aab',
    'local.properties',
    '*.keystore',
    '*.jks',
    // Ruby
    '*.gem',
    'vendor/bundle',
    'Gemfile.lock',
    // Rust
    'Cargo.lock',
    '**/*.rs.bk',
    // Java / Rust
    'target/',
    // Go
    'pkg/',
    'go.sum',
    // PHP
    'composer.lock',
    // .NET/C#
    'obj/',
    '*.suo',
    '*.user',
    '*.userosscache',
    '*.sln.docstates',
    '*.nupkg',
    '*.snupkg',
    // Go / .NET / C#
    'bin/',
    // Terraform / IaC
    '*.tfstate.backup',
    // Images and media
    '*.svg',
    '*.png',
    '*.jpg',
    '*.jpeg',
    '*.gif',
    '*.ico',
    '*.bmp',
    '*.webp',
    '*.tiff',
    '*.pdf',
    '*.mov',
    '*.mp4',
    '*.avi',
    '*.flv',
    '*.mkv',
    '*.webm',
    '*.mp3',
    '*.m4a',
    '*.wav',
    '*.flac',
    '*.ogg',
    // 3D models / game engine assets (binary, not source)
    '*.glb',
    '*.gltf',
    '*.vrm',
    '*.fbx',
    '*.blend',
    '*.blend1',
    '*.usdz',
    '*.hf',
    '*.uasset',
    '*.umap',
    // Compiled binaries
    '*.wasm',
    // Fonts
    '*.woff',
    '*.woff2',
    '*.ttf',
    '*.otf',
    '*.eot',
    // Archives
    '*.zip',
    '*.tar',
    '*.tar.gz',
    '*.tgz',
    '*.rar',
    '*.7z',
    '*.iso',
    '*.bz2',
    '*.xz',
    '*.lz4',
    '*.zst',
    '*.cab',
    '*.deb',
    '*.rpm',
    '*.dmg',
    '*.msi',
    // Office documents
    '*.doc',
    '*.docx',
    '*.xls',
    '*.xlsx',
    '*.ppt',
    '*.pptx',
    // Design tool binaries
    '*.psd',
    '*.ai',
    '*.sketch',
    '*.aep',
    // Crash/debug dumps
    '*.stackdump',
    '*.dmp',
    '*.core',
    '*.pid',
    '*.seed',
    '*.pid.lock',
    // Secrets / certificates (leak-prevention, independent of relevance)
    '*.key',
    '*.pem',
    '*.p12',
    '*.pfx',
    '*.p8',
    '*.crt',
    '*.cer',
    '*.der',
    'credentials.json',
    'secrets.yaml',
    'secrets.yml',
    // Virtual environments
    'venv',
    'env',
    'virtualenv',
    // Temporary and cache files
    '*.log',
    '*.bak',
    '*.temp',
    '*.tmp',
    'Thumbs.db',
    'desktop.ini',
    // Build directories and artifacts (including "mirrors source" dirs --
    // generated/compiled output that duplicates what's already in src/)
    'build',
    'dist',
    'target',
    'out',
    'bin',
    'output',
    'builds',
    'artifacts',
    'compiled',
    'generated',
    'gen',
    'public',
    'static',
    '_site',
    'site',
    '*.egg-info',
    '*.egg',
    '*.whl',
    '*.so',
    // Documentation build output
    'site-packages',
    // Data science / ML
    '*.pkl',
    '*.pickle',
    '*.h5',
    '*.hdf5',
    '*.parquet',
    '*.npy',
    '*.npz',
    '*.safetensors',
    '*.ckpt',
    '*.pt',
    '*.pth',
    '*.onnx',
    '*.gguf',
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
    // Gitoutput
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
