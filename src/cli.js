#!/usr/bin/env node
/** Command-line interface for gitoutput. Mirrors __main__.py. */

import { Command } from 'commander';

import { MAX_FILE_SIZE } from './config.js';
import { ingestAsync } from './entrypoint.js';

const program = new Command();

program
    .name('gitoutput')
    .description('Run the CLI entry point to analyze a repo / directory and dump its contents to stdout.')
    .argument('[source]', 'A directory path or a Git repository URL', '.')
    .option('-s, --max-size <bytes>', 'Maximum file size to process in bytes', String(MAX_FILE_SIZE))
    .option('-e, --exclude-pattern <pattern...>', 'Shell-style patterns to exclude.', collectPatterns, [])
    .option('-i, --include-pattern <pattern...>', 'Shell-style patterns to include.', collectPatterns, [])
    .option('-b, --branch <branch>', 'Branch to clone and ingest')
    .option('--include-gitignored', 'Include files matched by .gitignore and .gitingestignore', false)
    .option('--exclude-submodules', "Exclude repository's submodules from the analysis (included by default)", false)
    .option(
        '-t, --token <token>',
        'GitHub personal access token (PAT) for accessing private repositories. ' +
      'If omitted, the CLI will look for the GITHUB_TOKEN environment variable.',
    )
    .option(
        '-o, --output <path>',
        "Output file base path. Written as chunked files named '<base>-<n>.<ext>' (80k chars per chunk). " +
      "Defaults to '<gitprojectname>-<n>.txt'. Pass '-' to print a single digest to stdout instead.",
    )
    .addHelpText(
        'after',
        `
Examples:
  Basic usage (writes chunked files, e.g. gitoutput-1.txt, gitoutput-2.txt, ...):
    $ gitoutput
    $ gitoutput /path/to/repo
    $ gitoutput https://github.com/user/repo

  Choose a base output name (writes digest-1.txt, digest-2.txt, ...):
    $ gitoutput -o digest.txt
    $ gitoutput https://github.com/user/repo --output digest.txt

  Print a single digest to stdout instead:
    $ gitoutput -o -

  With filtering:
    $ gitoutput -i "*.py" -e "*.log"
    $ gitoutput --include-pattern "*.js" --exclude-pattern "node_modules/*"

  Private repositories:
    $ gitoutput https://github.com/user/private-repo -t ghp_token
    $ GITHUB_TOKEN=ghp_token gitoutput https://github.com/user/private-repo

  Exclude submodules (included by default):
    $ gitoutput https://github.com/user/repo --exclude-submodules
`,
    )
    .action(async (source, cliOpts) => {
        const outputTarget = cliOpts.output ?? null;

        try {
            await ingestAsync(source, {
                maxFileSize: Number(cliOpts.maxSize),
                includePatterns: new Set(cliOpts.includePattern ?? []),
                excludePatterns: new Set(cliOpts.excludePattern ?? []),
                branch: cliOpts.branch ?? null,
                includeGitignored: Boolean(cliOpts.includeGitignored),
                includeSubmodules: !cliOpts.excludeSubmodules,
                token: cliOpts.token ?? null,
                output: outputTarget,
            });
        } catch (exc) {
            process.stderr.write(`Error: ${exc.message}\n`);
            process.exitCode = 1;

            return;
        }

        if (outputTarget !== '-') {
            process.stdout.write('Analysis complete! Output written to chunked file(s).\n');
        }
    });

function collectPatterns(value, previous) {
    previous.push(value);

    return previous;
}

program.parseAsync(process.argv);
