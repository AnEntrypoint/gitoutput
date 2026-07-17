# Changelog

## Unreleased

### ⚠ BREAKING CHANGES

* **rewrite:** gitingest is now a Node.js CLI tool. The Python implementation (FastAPI
  web server, self-hosting support, browser extension backend, and the `gitingest`
  PyPI package) has been fully retired and replaced with a Node.js port distributed
  via npm. The `gitingest` command prints its digest directly to `STDOUT` by default
  in one shot; pass `--output/-o <file>` to write to a file instead.
