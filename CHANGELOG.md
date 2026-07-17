# Changelog

## Unreleased

### ⚠ BREAKING CHANGES

* **rewrite:** gitingest is now a Node.js CLI tool. The Python implementation (FastAPI
  web server, self-hosting support, browser extension backend, and the `gitingest`
  PyPI package) has been fully retired and replaced with a Node.js port distributed
  via npm. The `gitingest` command prints its digest directly to `STDOUT` by default
  in one shot; pass `--output/-o <file>` to write to a file instead.

### Features

* **ignore-patterns:** expand the built-in default ignore list with additional
  binary/media/font/archive extensions, more package-manager caches and lockfiles,
  security-sensitive file patterns (`*.key`, `*.pem`, `credentials.json`, etc.), and
  crash-dump artifacts, so the digest stays focused on planning-relevant content.
  Documentation, tests, and config files (`README*`, `tsconfig.json`, `Dockerfile`,
  etc.) are deliberately still included by default, unlike some sibling code-search
  tools that drop them for search-embedding noise reduction.
