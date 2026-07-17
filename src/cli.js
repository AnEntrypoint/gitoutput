#!/usr/bin/env node
/** Command-line interface for gitingest. Mirrors __main__.py. */

import { Command } from 'commander';

import { MAX_FILE_SIZE } from './config.js';
import { ingestAsync } from './entrypoint.js';

const program = new Command();

program
    .name('gitingest')
    .description('Run the CLI entry point to analyze a repo / directory and dump its contents to stdout.')
    .argument('[source]', 'A directory path or a Git repository URL', '.')
    .option('-s, --max-size <bytes>', 'Maximum file size to process in bytes', String(MAX_FILE_SIZE))
    .option('-e, --exclude-pattern <pattern...>', 'Shell-style patterns to exclude.', collectPatterns, [])
    .option('-i, --include-pattern <pattern...>', 'Shell-style patterns to include.', collectPatterns, [])
    .option('-b, --branch <branch>', 'Branch to clone and ingest')
    .option('--include-gitignored', 'Include files matched by .gitignore and .gitingestignore', false)
    .option('--include-submodules', "Include repository's submodules in the analysis", false)
    .option(
        '-t, --token <token>',
        'GitHub personal access token (PAT) for accessing private repositories. ' +
      'If omitted, the CLI will look for the GITHUB_TOKEN environment variable.',
    )
    .option('-o, --output <path>', "Output file path. Defaults to '-' (stdout). Pass a file path to write to a file instead.", '-')
    .addHelpText(
        'after',
        `
Examples:
  Basic usage (prints the digest to stdout):
    $ gitingest
    $ gitingest /path/to/repo
    $ gitingest https://github.com/user/repo

  Write to a file instead:
    $ gitingest -o digest.txt
    $ gitingest https://github.com/user/repo --output digest.txt

  With filtering:
    $ gitingest -i "*.py" -e "*.log"
    $ gitingest --include-pattern "*.js" --exclude-pattern "node_modules/*"

  Private repositories:
    $ gitingest https://github.com/user/private-repo -t ghp_token
    $ GITHUB_TOKEN=ghp_token gitingest https://github.com/user/private-repo

  Include submodules:
    $ gitingest https://github.com/user/repo --include-submodules
`,
    )
    .action(async (source, cliOpts) => {
        const outputTarget = cliOpts.output ?? '-';

        try {
            await ingestAsync(source, {
                maxFileSize: Number(cliOpts.maxSize),
                includePatterns: new Set(cliOpts.includePattern ?? []),
                excludePatterns: new Set(cliOpts.excludePattern ?? []),
                branch: cliOpts.branch ?? null,
                includeGitignored: Boolean(cliOpts.includeGitignored),
                includeSubmodules: Boolean(cliOpts.includeSubmodules),
                token: cliOpts.token ?? null,
                output: outputTarget,
            });
        } catch (exc) {
            process.stderr.write(`Error: ${exc.message}\n`);
            process.exitCode = 1;

            return;
        }

        if (outputTarget !== '-') {
            process.stdout.write(`Analysis complete! Output written to: ${outputTarget}\n`);
        }
    });

function collectPatterns(value, previous) {
    previous.push(value);

    return previous;
}

program.parseAsync(process.argv);
