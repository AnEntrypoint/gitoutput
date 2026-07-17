# Gitingest

<!-- Badges -->
<!-- markdownlint-disable MD033 -->
<p align="center">
  <a href="https://www.npmjs.com/package/gitingest"><img src="https://img.shields.io/npm/v/gitingest.svg" alt="npm"></a>
  <a href="https://github.com/AnEntrypoint/gitingest/actions/workflows/ci.yml?query=branch%3Amain"><img src="https://github.com/AnEntrypoint/gitingest/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://github.com/AnEntrypoint/gitingest/blob/main/LICENSE"><img src="https://img.shields.io/github/license/AnEntrypoint/gitingest.svg" alt="License"></a>
</p>
<!-- markdownlint-enable MD033 -->

Turn any Git repository or local directory into a single, prompt-friendly text digest for LLMs — no install required, straight from `npx`.

## Quick start

```bash
npx gitingest /path/to/directory
```

```bash
npx gitingest https://github.com/AnEntrypoint/gitingest
```

That's it — the digest (a summary, a file tree, and the content of every included file) prints straight to your terminal in one shot. `npx` fetches the latest published version each time, so there's nothing to install or keep up to date.

```bash
# Pipe it wherever you need it
npx gitingest . | pbcopy
npx gitingest . > digest.txt

# Point it at a subdirectory or branch
npx gitingest https://github.com/AnEntrypoint/gitingest/tree/main/src
npx gitingest . --branch develop
```

## Requirements

- Node.js 18+ (ships with `npx`)
- `git` installed and on your `PATH`
- For private repositories: a GitHub Personal Access Token (PAT). [Generate one here](https://github.com/settings/tokens/new?description=gitingest&scopes=repo).

## Private repositories

```bash
npx gitingest https://github.com/username/private-repo --token github_pat_...

# or via environment variable
export GITHUB_TOKEN=github_pat_...
npx gitingest https://github.com/username/private-repo
```

## Filtering what's included

By default, everything not matched by `.gitignore`/`.gitingestignore` or gitingest's own built-in ignore list (build artifacts, binaries, lockfiles, secrets, caches, etc.) is included — the goal is a digest with exactly what an agent needs to plan changes, nothing more.

```bash
npx gitingest . --exclude-pattern "*.test.js"
npx gitingest . --include-pattern "src/**"
npx gitingest . --include-gitignored   # also include .gitignore'd files
```

## Writing to a file instead of stdout

```bash
npx gitingest . --output digest.txt
```

## All options

| Flag                     | Short | Description                                                                 |
| ------------------------ | ----- | ----------------------------------------------------------------------------|
| `--max-size <bytes>`     | `-s`  | Maximum file size to process, in bytes (default: 10 MB)                     |
| `--exclude-pattern <p>`  | `-e`  | Shell-style glob pattern to exclude (repeatable)                            |
| `--include-pattern <p>`  | `-i`  | Shell-style glob pattern to include (repeatable)                            |
| `--branch <name>`        | `-b`  | Branch to clone and ingest                                                  |
| `--include-gitignored`   |       | Include files matched by `.gitignore` / `.gitingestignore`                  |
| `--include-submodules`   |       | Recursively include Git submodules                                          |
| `--token <token>`        | `-t`  | GitHub PAT for private repositories (falls back to `GITHUB_TOKEN` env var)  |
| `--output <path>`        | `-o`  | Output file path. Defaults to `-` (stdout)                                  |

```bash
npx gitingest --help
```

## Supported Git hosts

Bare `user/repo` slugs and scheme-less URLs are resolved against known hosts: `github.com`, `gitlab.com`,
`bitbucket.org`, `gitea.com`, `codeberg.org`, and `gist.github.com`. Self-hosted instances are also recognized
heuristically when the hostname starts with `git.`, `gitlab.`, or `github.` (e.g. GitHub Enterprise).

## Using it as a library

If you're building a Node.js tool on top of gitingest rather than shelling out to the CLI:

```bash
npm install gitingest
```

```js
import { ingestAsync } from "gitingest";

const [summary, tree, content] = await ingestAsync("https://github.com/AnEntrypoint/gitingest");

console.log(summary);
```

## Docker

```bash
docker build -t gitingest .
docker run --rm gitingest https://github.com/AnEntrypoint/gitingest
```

## Contributing

Issues and pull requests welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Stack

- [commander](https://github.com/tj/commander.js) — CLI framework
- [ignore](https://github.com/kaelzhang/node-ignore) — `.gitignore`-style pattern matching
- [js-tiktoken](https://github.com/dqbd/tiktoken) — token estimation
