# Gitoutput

<!-- Badges -->
<!-- markdownlint-disable MD033 -->
<p align="center">
  <a href="https://www.npmjs.com/package/gitoutput"><img src="https://img.shields.io/npm/v/gitoutput.svg" alt="npm"></a>
  <a href="https://github.com/AnEntrypoint/gitoutput/actions/workflows/ci.yml?query=branch%3Amain"><img src="https://github.com/AnEntrypoint/gitoutput/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/AnEntrypoint/gitoutput/blob/main/LICENSE"><img src="https://img.shields.io/github/license/AnEntrypoint/gitoutput.svg" alt="License"></a>
</p>
<!-- markdownlint-enable MD033 -->

Turn any Git repository or local directory into a prompt-friendly text digest for LLMs — no install required, straight from `npx`.

## Quick start

```bash
npx gitoutput /path/to/directory
```

```bash
npx gitoutput https://github.com/AnEntrypoint/gitoutput
```

That's it — gitoutput writes a chunked digest (summary + mcp-thorns report in chunk 1, directory tree and file contents split across the rest) to `<gitprojectname>-1.txt`, `-2.txt`, etc. in the current directory. `npx` fetches the latest published version each time, so there's nothing to install or keep up to date.

```bash
# Print a single digest to stdout instead of writing files
npx gitoutput . --output -
npx gitoutput . --output - | pbcopy

# Point it at a subdirectory or branch
npx gitoutput https://github.com/AnEntrypoint/gitoutput/tree/main/src
npx gitoutput . --branch develop
```

## Requirements

- Node.js 18+ (ships with `npx`)
- `git` installed and on your `PATH` — used as a fallback for private repos, non-GitHub hosts, and anything a plain zip download can't express. Public `github.com` repos are fetched directly as a zipball instead, with no `git` subprocess involved.
- For private repositories: a GitHub Personal Access Token (PAT). [Generate one here](https://github.com/settings/tokens/new?description=gitoutput&scopes=repo).

## Private repositories

```bash
npx gitoutput https://github.com/username/private-repo --token github_pat_...

# or via environment variable
export GITHUB_TOKEN=github_pat_...
npx gitoutput https://github.com/username/private-repo
```

## Filtering what's included

By default, everything not matched by `.gitignore`/`.gitingestignore` or gitoutput's own built-in ignore list is included — the goal is a digest with exactly what an agent needs to plan changes, nothing more. The built-in list unconditionally excludes:

- **All hidden files and directories** (anything starting with `.` — `.github/`, `.eslintrc`, `.env.example`, editor/IDE config, AI-agent tooling state, VCS internals, etc.)
- **Build/output directories** that mirror or duplicate source (`build/`, `dist/`, `out/`, `output/`, `builds/`, `artifacts/`, `generated/`, `public/`, `static/`, etc.)
- **Binaries and compiled artifacts** across every major language/platform (executables, object files, ML model weights, 3D/game-engine assets, archives, media, fonts, office documents)
- **Lockfiles, caches, and secrets** (`node_modules`, `*.lock`, `*.key`/`*.pem`/`credentials.json`, etc.)

```bash
npx gitoutput . --exclude-pattern "*.test.js"
npx gitoutput . --include-pattern "src/**"
npx gitoutput . --include-gitignored   # also include .gitignore'd files
```

## Output

By default, gitoutput writes chunked files instead of printing to stdout: `<gitprojectname>-1.txt`,
`<gitprojectname>-2.txt`, etc., each at most 80,000 characters. Chunk 1 contains the summary and an
[mcp-thorns](https://www.npmjs.com/package/mcp-thorns) codebase report; later chunks contain the
directory tree and file contents.

```bash
npx gitoutput .                       # writes gitoutput-1.txt, gitoutput-2.txt, ...
npx gitoutput . --output digest.txt   # writes digest-1.txt, digest-2.txt, ...
npx gitoutput . --output -            # print a single digest to stdout instead
```

## All options

| Flag                     | Short | Description                                                                 |
| ------------------------ | ----- | ----------------------------------------------------------------------------|
| `--max-size <bytes>`     | `-s`  | Maximum file size to process, in bytes (default: 10 MB)                     |
| `--exclude-pattern <p>`  | `-e`  | Shell-style glob pattern to exclude (repeatable)                            |
| `--include-pattern <p>`  | `-i`  | Shell-style glob pattern to include (repeatable)                            |
| `--branch <name>`        | `-b`  | Branch to clone and ingest                                                  |
| `--include-gitignored`   |       | Include files matched by `.gitignore` / `.gitingestignore`                  |
| `--exclude-submodules`   |       | Exclude Git submodules (recursively included by default)                    |
| `--token <token>`        | `-t`  | GitHub PAT for private repositories (falls back to `GITHUB_TOKEN` env var)  |
| `--output <path>`        | `-o`  | Output file base name for chunked files. Defaults to `<gitprojectname>.txt`. Pass `-` for stdout |

```bash
npx gitoutput --help
```

## Supported Git hosts

Bare `user/repo` slugs and scheme-less URLs are resolved against known hosts: `github.com`, `gitlab.com`,
`bitbucket.org`, `gitea.com`, `codeberg.org`, and `gist.github.com`. Self-hosted instances are also recognized
heuristically when the hostname starts with `git.`, `gitlab.`, or `github.` (e.g. GitHub Enterprise).

## Using it as a library

If you're building a Node.js tool on top of gitoutput rather than shelling out to the CLI:

```bash
npm install gitoutput
```

```js
import { ingestAsync } from "gitoutput";

const [summary, tree, content] = await ingestAsync("https://github.com/AnEntrypoint/gitoutput");

console.log(summary);
```

## Docker

```bash
docker build -t gitoutput .
docker run --rm gitoutput https://github.com/AnEntrypoint/gitoutput
```

## Contributing

Issues and pull requests welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Stack

- [commander](https://github.com/tj/commander.js) — CLI framework
- [ignore](https://github.com/kaelzhang/node-ignore) — `.gitignore`-style pattern matching
- [js-tiktoken](https://github.com/dqbd/tiktoken) — token estimation
