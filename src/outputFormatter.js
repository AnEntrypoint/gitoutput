/** Builds the tree-view and content strings from a FileSystemNode tree. Mirrors output_formatter.py. */

import { getEncoding } from 'js-tiktoken';

import { FileSystemNodeType } from './schemas.js';

const TOKEN_THRESHOLDS = [
    [1_000_000, 'M'],
    [1_000, 'k'],
];

let cachedEncoding = null;

function getTokenEncoding() {
    if (!cachedEncoding) {
        cachedEncoding = getEncoding('o200k_base'); // gpt-4o, gpt-4o-mini
    }

    return cachedEncoding;
}

/**
 * Generate [summary, tree, content] for a given file system node (mirrors format_node).
 * @param {import("./schemas.js").FileSystemNode} node
 * @param {import("./schemas.js").IngestionQuery} query
 * @returns {Promise<[string, string, string]>}
 */
export async function formatNode(node, query) {
    const isSingleFile = node.type === FileSystemNodeType.FILE;
    let summary = createSummaryPrefix(query, isSingleFile);

    if (node.type === FileSystemNodeType.DIRECTORY) {
        summary += `Files analyzed: ${node.fileCount}\n`;
    } else if (node.type === FileSystemNodeType.FILE) {
        summary += `File: ${node.name}\n`;
        const content = await node.content();

        summary += `Lines: ${countLines(content).toLocaleString('en-US')}\n`;
    }

    const tree = `Directory structure:\n${ await createTreeStructure(query, node)}`;

    const content = await gatherFileContents(node);

    const tokenEstimate = formatTokenCount(tree + content);

    if (tokenEstimate) {
        summary += `\nEstimated tokens: ${tokenEstimate}`;
    }

    return [summary, tree, content];
}

function countLines(text) {
    if (text === '') {return 0;}

    return text.split(/\r\n|\r|\n/).length;
}

function createSummaryPrefix(query, singleFile = false) {
    const parts = [];

    if (query.userName) {
        parts.push(`Repository: ${query.userName}/${query.repoName}`);
    } else {
        parts.push(`Directory: ${query.slug}`);
    }

    if (query.tag) {
        parts.push(`Tag: ${query.tag}`);
    } else if (query.branch && query.branch !== 'main' && query.branch !== 'master') {
        parts.push(`Branch: ${query.branch}`);
    }

    if (query.commit) {
        parts.push(`Commit: ${query.commit}`);
    }

    if (query.subpath !== '/' && !singleFile) {
        parts.push(`Subpath: ${query.subpath}`);
    }

    return `${parts.join('\n') }\n`;
}

async function gatherFileContents(node) {
    if (node.type !== FileSystemNodeType.DIRECTORY) {
        return node.contentString();
    }
    const parts = await Promise.all(node.children.map((child) => gatherFileContents(child)));

    return parts.join('\n');
}

async function createTreeStructure(query, node, prefix = '', isLast = true) {
    if (!node.name) {
        node.name = query.slug;
    }

    let treeStr = '';
    const currentPrefix = isLast ? '└── ' : '├── ';

    let displayName = node.name;

    if (node.type === FileSystemNodeType.DIRECTORY) {
        displayName += '/';
    } else if (node.type === FileSystemNodeType.SYMLINK) {
        displayName += ` -> ${ await node._symlinkTargetName()}`;
    }

    treeStr += `${prefix}${currentPrefix}${displayName}\n`;

    if (node.type === FileSystemNodeType.DIRECTORY && node.children.length > 0) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');

        for (let i = 0; i < node.children.length; i++) {

            treeStr += await createTreeStructure(query, node.children[i], childPrefix, i === node.children.length - 1);
        }
    }

    return treeStr;
}

function formatTokenCount(text) {
    let totalTokens;

    try {
        const encoding = getTokenEncoding();

        totalTokens = encoding.encode(text, 'all').length;
    } catch {
        return null;
    }

    for (const [threshold, suffix] of TOKEN_THRESHOLDS) {
        if (totalTokens >= threshold) {
            return `${(totalTokens / threshold).toFixed(1)}${suffix}`;
        }
    }

    return String(totalTokens);
}
