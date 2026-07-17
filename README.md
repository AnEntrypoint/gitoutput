# Gitingest

<!-- Badges -->
<!-- markdownlint-disable MD033 -->
<p align="center">
  <!-- row 1 — install & compat -->
  <a href="https://www.npmjs.com/package/gitingest"><img src="https://img.shields.io/npm/v/gitingest.svg" alt="npm"></a>
  <a href="https://www.npmjs.com/package/gitingest"><img src="https://img.shields.io/node/v/gitingest.svg" alt="Node Versions"></a>
  <br>
  <!-- row 2 — quality & community -->
  <a href="https://github.com/AnEntrypoint/gitingest/actions/workflows/ci.yml?query=branch%3Amain"><img src="https://github.com/AnEntrypoint/gitingest/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://scorecard.dev/viewer/?uri=github.com/AnEntrypoint/gitingest"><img src="https://api.scorecard.dev/projects/github.com/AnEntrypoint/gitingest/badge" alt="OpenSSF Scorecard"></a>
  <br>
  <a href="https://github.com/AnEntrypoint/gitingest/blob/main/LICENSE"><img src="https://img.shields.io/github/license/AnEntrypoint/gitingest.svg" alt="License"></a>
  <a href="https://www.npmjs.com/package/gitingest"><img src="https://img.shields.io/npm/dt/gitingest.svg" alt="Downloads"></a>
  <a href="https://github.com/AnEntrypoint/gitingest"><img src="https://img.shields.io/github/stars/AnEntrypoint/gitingest" alt="GitHub Stars"></a>
</p>
<!-- markdownlint-enable MD033 -->

Turn any Git repository into a prompt-friendly text ingest for LLMs -- directly from your terminal, in one shot.

## 🚀 Features

- **Easy code context**: Get a text digest from a Git repository URL or a directory
- **One-shot stdout output**: Prints the digest straight to your terminal by default -- pipe it anywhere
- **Smart Formatting**: Optimized output format for LLM prompts
- **Statistics about**:
  - File and directory structure
  - Size of the extract
  - Token count
- **CLI tool**: Run it as a shell command
- **Node.js package**: Import it in your code

## 📚 Requirements

- Node.js 18+
- `git` installed and on your `PATH`
- For private repositories: A GitHub Personal Access Token (PAT). [Generate your token **here**!](https://github.com/settings/tokens/new?description=gitingest&scopes=repo)

### 📦 Installation

Gitingest is available on [npm](https://www.npmjs.com/package/gitingest).

```bash
npm install -g gitingest
```

Or run it without a global install:

```bash
npx gitingest /path/to/directory
```

## 💡 Command line usage

The `gitingest` command line tool analyzes a codebase and prints a text digest of its contents directly to your terminal.

```bash
# Basic usage -- prints the digest to stdout
gitingest /path/to/directory

# From URL
gitingest https://github.com/AnEntrypoint/gitingest

# or from specific subdirectory
gitingest https://github.com/AnEntrypoint/gitingest/tree/main/src

# Pipe it anywhere
gitingest . | pbcopy
gitingest . > digest.txt
```

For private repositories, use the `--token/-t` option.

```bash
# Get your token from https://github.com/settings/personal-access-tokens
gitingest https://github.com/username/private-repo --token github_pat_...

# Or set it as an environment variable
export GITHUB_TOKEN=github_pat_...
gitingest https://github.com/username/private-repo

# Include repository submodules
gitingest https://github.com/username/repo-with-submodules --include-submodules
```

By default, files listed in `.gitignore` and `.gitingestignore` are skipped. Use `--include-gitignored` if you
need those files in the digest.

By default, the digest is printed to `STDOUT`. Use `--output/-o <filename>` to write it to a file instead.

### Options

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

See more options and usage details with:

```bash
gitingest --help
```

## 📦 Node.js package usage

```js
import { ingestAsync } from "gitingest";

const [summary, tree, content] = await ingestAsync("https://github.com/AnEntrypoint/gitingest");

console.log(summary);
```

For private repositories, pass a token:

```js
// Using the token option
const [summary, tree, content] = await ingestAsync("https://github.com/username/private-repo", {
  token: "github_pat_...",
});

// Or set it as an environment variable
process.env.GITHUB_TOKEN = "github_pat_...";
const result = await ingestAsync("https://github.com/username/private-repo");

// Include repository submodules
const result2 = await ingestAsync("https://github.com/username/repo-with-submodules", {
  includeSubmodules: true,
});
```

By default, this won't write a file, but can be enabled with the `output` option (`"-"` for stdout, a path to write to a file).

## Supported Git hosts

Bare `user/repo` slugs and scheme-less URLs are resolved against known hosts: `github.com`, `gitlab.com`,
`bitbucket.org`, `gitea.com`, `codeberg.org`, and `gist.github.com`. Self-hosted instances are also recognized
heuristically when the hostname starts with `git.`, `gitlab.`, or `github.` (e.g. GitHub Enterprise).

## 🐳 Docker

Build and run the CLI in a container:

```bash
docker build -t gitingest .
docker run --rm gitingest https://github.com/AnEntrypoint/gitingest
```

## 🤝 Contributing

### Non-technical ways to contribute

- **Create an Issue**: If you find a bug or have an idea for a new feature, please [create an issue](https://github.com/AnEntrypoint/gitingest/issues/new) on GitHub. This will help us track and prioritize your request.
- **Spread the Word**: If you like Gitingest, please share it with your friends, colleagues, and on social media. This will help us grow the community and make Gitingest even better.
- **Use Gitingest**: The best feedback comes from real-world usage! If you encounter any issues or have ideas for improvement, please let us know by [creating an issue](https://github.com/AnEntrypoint/gitingest/issues/new) on GitHub.

### Technical ways to contribute

Gitingest aims to be friendly for first time contributors, with a simple Node.js codebase. For detailed instructions on how to make a pull request, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 🛠️ Stack

- [commander](https://github.com/tj/commander.js) - CLI framework
- [ignore](https://github.com/kaelzhang/node-ignore) - `.gitignore`-style pattern matching
- [js-tiktoken](https://github.com/dqbd/tiktoken) - Token estimation

## 🚀 Project Growth

[![Star History Chart](https://api.star-history.com/svg?repos=AnEntrypoint/gitingest&type=Date)](https://star-history.com/#AnEntrypoint/gitingest&Date)
