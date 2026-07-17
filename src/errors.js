/** Custom error classes for gitingest. */

export class AsyncTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AsyncTimeoutError';
    }
}

export class InvalidNotebookError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidNotebookError';
    }
}

export class InvalidGitHubTokenError extends Error {
    constructor() {
        super(
            'Invalid GitHub token format. To generate a token, go to ' +
        'https://github.com/settings/tokens/new?description=gitoutput&scopes=repo.',
        );
        this.name = 'InvalidGitHubTokenError';
    }
}
