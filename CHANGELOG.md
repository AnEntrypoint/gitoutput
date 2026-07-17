# Changelog

## [0.5.0](https://github.com/AnEntrypoint/gitingest/compare/gitingest-v0.4.0...gitingest-v0.5.0) (2026-07-17)


### ⚠ BREAKING CHANGES

* 
* 

### Features

* `include_submodules` option ([#313](https://github.com/AnEntrypoint/gitingest/issues/313)) ([38c2317](https://github.com/AnEntrypoint/gitingest/commit/38c23171a14556a2cdd05c0af8219f4dc789defd))
* add /llm.txt ([#307](https://github.com/AnEntrypoint/gitingest/issues/307)) ([1545dc8](https://github.com/AnEntrypoint/gitingest/commit/1545dc8f4270f94b56d5ca2735f7b770a9a36d27))
* add branch option to CLI and ingest function for cloning specific branches ([#155](https://github.com/AnEntrypoint/gitingest/issues/155)) ([361147a](https://github.com/AnEntrypoint/gitingest/commit/361147a6fde5146ff047c6e51a29da6bdaa7e326))
* add gist.github.com support and fix ingest_async bug ([#184](https://github.com/AnEntrypoint/gitingest/issues/184)) ([2a5e5a1](https://github.com/AnEntrypoint/gitingest/commit/2a5e5a1abd07c718f1945231dc56220565ca496b))
* add optional parameter to include notebook cell outputs in generated script ([#128](https://github.com/AnEntrypoint/gitingest/issues/128)) ([6039114](https://github.com/AnEntrypoint/gitingest/commit/60391143f668dc19ea9d4614ff092ea65898077d))
* add private-repo support to CLI & core (UI coming next) ([#282](https://github.com/AnEntrypoint/gitingest/issues/282)) ([1dd133c](https://github.com/AnEntrypoint/gitingest/commit/1dd133c3e02b899ff035a9863c6071af61a3479f))
* Add Python 3.7 Support and Restore Compatibility with Older Syntax ([#181](https://github.com/AnEntrypoint/gitingest/issues/181)) ([4397a45](https://github.com/AnEntrypoint/gitingest/commit/4397a452813dfb8bdaf4448fe53670f1a160cbf0))
* add support for improved handling of jupyter notebooks ([#105](https://github.com/AnEntrypoint/gitingest/issues/105)) ([d2825ea](https://github.com/AnEntrypoint/gitingest/commit/d2825eac2081dbcade75e042870e790ed8003bb5))
* add Tailwind CSS pipeline, tag-aware cloning & overhaul CI/CD ([#352](https://github.com/AnEntrypoint/gitingest/issues/352)) ([b683e59](https://github.com/AnEntrypoint/gitingest/commit/b683e59b5b1a31d27cc5c6ce8fb62da9b660613b))
* add Tailwind CSS pipeline, tag-aware cloning & overhaul CI/CD ([#352](https://github.com/AnEntrypoint/gitingest/issues/352)) ([016817d](https://github.com/AnEntrypoint/gitingest/commit/016817d5590c1412498b7532f6e854d20239c6be))
* **ci:** build Docker Image on PRs ([#382](https://github.com/AnEntrypoint/gitingest/issues/382)) ([bc8cdb4](https://github.com/AnEntrypoint/gitingest/commit/bc8cdb459482948c27e780b733ac7216d822529a))
* **cli:** Add Global CLI Tool for Local Directory Analysis ([#38](https://github.com/AnEntrypoint/gitingest/issues/38)) ([728c4af](https://github.com/AnEntrypoint/gitingest/commit/728c4af862cf276dea711132de1f516d7320d758))
* **cli:** Add support for .gitingest file processing in query ingestion ([#191](https://github.com/AnEntrypoint/gitingest/issues/191)) ([f90595d](https://github.com/AnEntrypoint/gitingest/commit/f90595de7c4844657938f43150a5882e7408e401))
* enhance parser domain-agnostic support ([#117](https://github.com/AnEntrypoint/gitingest/issues/117)) ([dd8f1e0](https://github.com/AnEntrypoint/gitingest/commit/dd8f1e0aaca864836f935c6f50bbd306688b1700))
* ignore .gitignore files by default (use --include-gitignored to stay  ([ba701a8](https://github.com/AnEntrypoint/gitingest/commit/ba701a80c9ce1e4623397ec3d03accce726ebdd2))
* Ignore the Bun lock files by default ([#163](https://github.com/AnEntrypoint/gitingest/issues/163)) ([a91191b](https://github.com/AnEntrypoint/gitingest/commit/a91191b3d5d92d544cb1bff54dfcc639c507c998)), closes [#162](https://github.com/AnEntrypoint/gitingest/issues/162)
* **ignore-patterns:** expand default ignore list, audited against sibling tools ([ae34716](https://github.com/AnEntrypoint/gitingest/commit/ae34716ce064902abb83255ff481aa78397568ad))
* implement prometheus exporter ([#406](https://github.com/AnEntrypoint/gitingest/issues/406)) ([1016f6e](https://github.com/AnEntrypoint/gitingest/commit/1016f6ecb3b1b066d541d1eba1ddffec49b15f16))
* implement S3 integration for storing and retrieving digest files ([#427](https://github.com/AnEntrypoint/gitingest/issues/427)) ([414e851](https://github.com/AnEntrypoint/gitingest/commit/414e85189fb9055491530ba8c0665c798474451e))
* integrate Sentry for error tracking and performance monitoring ([#408](https://github.com/AnEntrypoint/gitingest/issues/408)) ([590e55a](https://github.com/AnEntrypoint/gitingest/commit/590e55a4d28a4f5c0beafbd12c525828fa79e221))
* **logging:** implement loguru ([#473](https://github.com/AnEntrypoint/gitingest/issues/473)) ([d061b48](https://github.com/AnEntrypoint/gitingest/commit/d061b4877a253ba3f0480d329f025427c7f70177))
* Make TrustedHostMiddleware configurable via ALLOWED_HOSTS env var ([#31](https://github.com/AnEntrypoint/gitingest/issues/31)) ([1104242](https://github.com/AnEntrypoint/gitingest/commit/11042425bb7ae53d640583ffc4330a17bfbdd538))
* **parser:** relax host validation to support self-hosted GitLab & git.* domains ([#314](https://github.com/AnEntrypoint/gitingest/issues/314)) ([e5fadce](https://github.com/AnEntrypoint/gitingest/commit/e5fadce15864aa47418980d426a8a15a526737e8))
* partial cloning ([#188](https://github.com/AnEntrypoint/gitingest/issues/188)) ([f4fd4bb](https://github.com/AnEntrypoint/gitingest/commit/f4fd4bbe7ac712d9d5ed48808d11429870655203))
* Refactor backend to a rest api ([#346](https://github.com/AnEntrypoint/gitingest/issues/346)) ([2b1f228](https://github.com/AnEntrypoint/gitingest/commit/2b1f228ae1f6d1f7ee471794d258b13fcac25a96))
* replace non-MIT by excalidraw in EXAMPLE_REPOS ([#165](https://github.com/AnEntrypoint/gitingest/issues/165)) ([9aee15f](https://github.com/AnEntrypoint/gitingest/commit/9aee15f8ac07befa995da892894c47cb8d79ccd3))
* serve cached digest if available ([#462](https://github.com/AnEntrypoint/gitingest/issues/462)) ([efe5a26](https://github.com/AnEntrypoint/gitingest/commit/efe5a2686142b5ee4984061ebcec23c3bf3495d5))
* switch to o200k_base, require tiktoken ≥ 0.7.0, drop Python 3.7 ([2dea7c8](https://github.com/AnEntrypoint/gitingest/commit/2dea7c886530ef8a04d24f0901bfb56a7442fb62))
* **ui:** add inline PAT info tooltip inside token field ([#348](https://github.com/AnEntrypoint/gitingest/issues/348)) ([2592303](https://github.com/AnEntrypoint/gitingest/commit/25923037ea6cd2f8ef33a6cf1f0406c2b4f0c9b6))
* **ui:** show `<owner>/<repo>` in page title ([#303](https://github.com/AnEntrypoint/gitingest/issues/303)) ([09ffc44](https://github.com/AnEntrypoint/gitingest/commit/09ffc446a4e1313d4d39f9772d6d5caf165ee8eb))
* use gitpython for git stuff ([#504](https://github.com/AnEntrypoint/gitingest/issues/504)) ([c057f6e](https://github.com/AnEntrypoint/gitingest/commit/c057f6e06271372f1e5dd054d62e416872620b10))
* **web-ui:** add private-GitHub ingestion via PAT ([#286](https://github.com/AnEntrypoint/gitingest/issues/286)) ([3869aa3](https://github.com/AnEntrypoint/gitingest/commit/3869aa32e30c794b1fb07721d42a541a7c14d394))
* **web:** add version info display ([#483](https://github.com/AnEntrypoint/gitingest/issues/483)) ([867c2d9](https://github.com/AnEntrypoint/gitingest/commit/867c2d904e57ef2b329ba863661062cc92be39c9))


### Bug Fixes

* Add proper test isolation for CLI stdout output test ([#298](https://github.com/AnEntrypoint/gitingest/issues/298)) ([db7ee0c](https://github.com/AnEntrypoint/gitingest/commit/db7ee0cc070c140de5d5996e9c0676fb47fc639b))
* adding missing suggested changes from [#252](https://github.com/AnEntrypoint/gitingest/issues/252) ([#256](https://github.com/AnEntrypoint/gitingest/issues/256)) ([d36b3a0](https://github.com/AnEntrypoint/gitingest/commit/d36b3a08d317d16e015ec4f1d07736022825d750))
* append https:// to urls without it ([#14](https://github.com/AnEntrypoint/gitingest/issues/14)) ([300b9ec](https://github.com/AnEntrypoint/gitingest/commit/300b9ec537443924ab32ef2da1fcb7786666c05c))
* cleanup webui links ([#300](https://github.com/AnEntrypoint/gitingest/issues/300)) ([49b941e](https://github.com/AnEntrypoint/gitingest/commit/49b941e1282a60600f25a7e4d549c0a59e8ad93b))
* correct title attribute for Edge Add-ons link ([#199](https://github.com/AnEntrypoint/gitingest/issues/199)) ([c96a7d3](https://github.com/AnEntrypoint/gitingest/commit/c96a7d3d48255117afda124e551467f7b21f3322))
* enable metrics if env var is defined instead of being "True" ([#407](https://github.com/AnEntrypoint/gitingest/issues/407)) ([fa2e192](https://github.com/AnEntrypoint/gitingest/commit/fa2e192c05864c8db90bda877e9efb9b03caf098))
* fix docker container not launching ([#449](https://github.com/AnEntrypoint/gitingest/issues/449)) ([998cea1](https://github.com/AnEntrypoint/gitingest/commit/998cea15b4f79c5d6f840b5d3d916f83c8be3a07))
* fix README linting issues and correct spelling error ([96bc395](https://github.com/AnEntrypoint/gitingest/commit/96bc3958a3b3409e009c80d7ac89a97c4c9520fa))
* frontend directory tree ([#363](https://github.com/AnEntrypoint/gitingest/issues/363)) ([0fcf8a9](https://github.com/AnEntrypoint/gitingest/commit/0fcf8a956f7ec8403a025177f998f92ddee96de0))
* **git_form:** prevent PAT “Get your token” link from overlapping sample-repo buttons ([#305](https://github.com/AnEntrypoint/gitingest/issues/305)) ([65a0bbd](https://github.com/AnEntrypoint/gitingest/commit/65a0bbdfe578a280fad78b35e5d26447bfcda05a))
* gitignore and gitingestignore files are now correctly processed … ([#416](https://github.com/AnEntrypoint/gitingest/issues/416)) ([74e503f](https://github.com/AnEntrypoint/gitingest/commit/74e503fa1140feb74aa5350a32f0025c43097da1))
* handle network errors gracefully in token count estimation ([#437](https://github.com/AnEntrypoint/gitingest/issues/437)) ([5fbb445](https://github.com/AnEntrypoint/gitingest/commit/5fbb445cd8725e56972f43ec8b5e12cb299e9e83))
* handling of branch names with slashes ([#131](https://github.com/AnEntrypoint/gitingest/issues/131)) ([3ce8e7e](https://github.com/AnEntrypoint/gitingest/commit/3ce8e7e21e37ad3e9c0cf75717d7d3c8f8402e3f))
* http error ([#94](https://github.com/AnEntrypoint/gitingest/issues/94)) ([8d58d53](https://github.com/AnEntrypoint/gitingest/commit/8d58d538209434cbbc6dfb13363297562ddfa7f0))
* improved server side cleanup after ingest ([#477](https://github.com/AnEntrypoint/gitingest/issues/477)) ([2df0eb4](https://github.com/AnEntrypoint/gitingest/commit/2df0eb43989731ae40a9dd82d310ff76a794a46d))
* include patterns ([#76](https://github.com/AnEntrypoint/gitingest/issues/76)) ([d77741b](https://github.com/AnEntrypoint/gitingest/commit/d77741bddf2c8855a28ad02ae961a315597ee694))
* issue [#40](https://github.com/AnEntrypoint/gitingest/issues/40) : Bug: Branch names with "/" in the branch name are not cloned correctly ([#52](https://github.com/AnEntrypoint/gitingest/issues/52)) ([16def8a](https://github.com/AnEntrypoint/gitingest/commit/16def8ab9f5d6dc9c858da7238dd5aa6a7b2df50))
* make cache aware of subpaths ([#481](https://github.com/AnEntrypoint/gitingest/issues/481)) ([8b59bef](https://github.com/AnEntrypoint/gitingest/commit/8b59bef541f858ef44eba8fce6ace77df9dea01c))
* move dependabot.yml to the correct directory ([#132](https://github.com/AnEntrypoint/gitingest/issues/132)) ([5d5edee](https://github.com/AnEntrypoint/gitingest/commit/5d5edeecc86f08bd71064cedef7417a5dd2d60af))
* **parse_query:** make URL handling case insensitive ([#115](https://github.com/AnEntrypoint/gitingest/issues/115)) ([551d09a](https://github.com/AnEntrypoint/gitingest/commit/551d09ac9a9966778949f131c86e398149214698))
* Potential fix for code scanning alert no. 75: Uncontrolled data used in path expression ([#421](https://github.com/AnEntrypoint/gitingest/issues/421)) ([9ceaf6c](https://github.com/AnEntrypoint/gitingest/commit/9ceaf6cbbb0cdefbc79f78c5285406b9188b2d3d))
* **readme:** fix linting issues and correct spelling error ([0133021](https://github.com/AnEntrypoint/gitingest/commit/0133021c53cddc8573aca101372c850d86d7880b))
* Refine async_timeout to properly handle TypeVar usage ([d3f3070](https://github.com/AnEntrypoint/gitingest/commit/d3f3070694a1fae598707ac6eded4ff513ffae3b))
* remove logarithm conversion from the backend and correctly process max file size in kb ([#464](https://github.com/AnEntrypoint/gitingest/issues/464)) ([932bfef](https://github.com/AnEntrypoint/gitingest/commit/932bfef85db66704985c83f3f7c427756bd14023))
* reset pattern form when switching between include/exclude patterns ([#417](https://github.com/AnEntrypoint/gitingest/issues/417)) ([7085e13](https://github.com/AnEntrypoint/gitingest/commit/7085e138a74099b1df189b3bf9b8a333c8769380))
* resolve CI failures in Docker build and eslint ([bcdad68](https://github.com/AnEntrypoint/gitingest/commit/bcdad68d242d30c326dd77450325b66d53f57b65))
* Skip files where decoding raises an exception ([#250](https://github.com/AnEntrypoint/gitingest/issues/250)) ([688c1d0](https://github.com/AnEntrypoint/gitingest/commit/688c1d0b1d418dfae29c1b0c520cdc9003eaf7b1))
* temp files cleanup after ingest([#309](https://github.com/AnEntrypoint/gitingest/issues/309)) ([e669e44](https://github.com/AnEntrypoint/gitingest/commit/e669e444fa1e6130f3f22952dd81f0ca3fe08fa5))
* traverse directories to allow pattern matching of files within them ([#259](https://github.com/AnEntrypoint/gitingest/issues/259)) ([789be9b](https://github.com/AnEntrypoint/gitingest/commit/789be9b339f80e215505bf07b48383cccc6041c5))
* **ui:** update directory-picker logic to compute full file paths ([#295](https://github.com/AnEntrypoint/gitingest/issues/295)) ([3c53843](https://github.com/AnEntrypoint/gitingest/commit/3c5384322c6ba79e3e1ff4f2cab27c931c2b5ed4))
* **ui:** update layout in PAT section to avoid overlaps & overflows ([#331](https://github.com/AnEntrypoint/gitingest/issues/331)) ([b39ef54](https://github.com/AnEntrypoint/gitingest/commit/b39ef5416c1f8a7993a8249161d2a898b7387595))
* **ui:** use proper decimal prefixes (kB / MB) in file-size selector ([#294](https://github.com/AnEntrypoint/gitingest/issues/294)) ([327958e](https://github.com/AnEntrypoint/gitingest/commit/327958eae8377bdc7b97a49624dd27b3e2abf7c1))
* use default GITHUB_TOKEN for release-please ([42846d2](https://github.com/AnEntrypoint/gitingest/commit/42846d2ab9a5250c514f3aad748dcdb7a6b48a54))
* **windows:** warn if Git long path support is disabled, do not fail ([b8e375f](https://github.com/AnEntrypoint/gitingest/commit/b8e375f71cae7d980cf431396c4414a6dbd0588c))


### Code Refactoring

* centralize PAT validation, streamline repo checks & misc cleanup ([#349](https://github.com/AnEntrypoint/gitingest/issues/349)) ([cea0edd](https://github.com/AnEntrypoint/gitingest/commit/cea0eddce8c6846bc6271cb3a8d15320e103214c))
* centralize PAT validation, streamline repo checks & misc cleanup ([#349](https://github.com/AnEntrypoint/gitingest/issues/349)) ([f8d397e](https://github.com/AnEntrypoint/gitingest/commit/f8d397e66e3382d12f8a0ed05d291a39db830bda))

## Changelog

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
