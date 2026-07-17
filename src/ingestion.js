/** Recursive file-tree walk honoring size/depth/count limits and include/exclude patterns. Mirrors ingestion.py. */

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { MAX_DIRECTORY_DEPTH, MAX_FILES, MAX_TOTAL_SIZE_BYTES } from './config.js';
import { shouldExclude, shouldInclude } from './ingestionUtils.js';
import { formatNode } from './outputFormatter.js';
import { FileSystemNode, FileSystemNodeType, FileSystemStats } from './schemas.js';

/**
 * Run the ingestion process for a parsed query: walk the tree (or handle a single file),
 * and return [summary, tree, content].
 * @param {import("./schemas.js").IngestionQuery} query
 * @returns {Promise<[string, string, string]>}
 */
export async function ingestQuery(query) {
    const subpath = query.subpath.replace(/^\/+|\/+$/g, '');
    const targetPath = subpath ? path.join(query.localPath, subpath) : query.localPath;

    const targetStat = await stat(targetPath).catch(() => null);

    if (targetStat === null) {
        throw new Error(`${query.slug} cannot be found`);
    }

    const localStat = await stat(query.localPath);
    const localIsFile = localStat.isFile();

    if ((query.type && query.type === 'blob') || localIsFile) {
        if (!targetStat.isFile()) {
            throw new Error(`Path ${targetPath} is not a file`);
        }

        const relativePath = relPathOrDot(query.localPath, targetPath);
        const fileNode = new FileSystemNode({
            name: path.basename(targetPath),
            type: FileSystemNodeType.FILE,
            size: targetStat.size,
            fileCount: 1,
            pathStr: relativePath,
            fsPath: targetPath,
        });

        const content = await fileNode.content();

        if (!content) {
            throw new Error(`File ${fileNode.name} has no content`);
        }

        return formatNode(fileNode, query);
    }

    const rootNode = new FileSystemNode({
        name: path.basename(targetPath),
        type: FileSystemNodeType.DIRECTORY,
        pathStr: relPathOrDot(query.localPath, targetPath),
        fsPath: targetPath,
    });

    const stats = new FileSystemStats();

    await processNode(rootNode, query, stats);

    return formatNode(rootNode, query);
}

async function processNode(node, query, stats) {
    if (limitExceeded(stats, node.depth)) {
        return;
    }

    let entries;

    try {
        entries = await readdir(node.fsPath, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        const subPath = path.join(node.fsPath, entry.name);

        if (query.ignorePatterns && query.ignorePatterns.size > 0 && shouldExclude(subPath, query.localPath, query.ignorePatterns)) {
            continue;
        }

        const isDirForInclude = entry.isDirectory() && !entry.isSymbolicLink();

        if (
            query.includePatterns &&
      query.includePatterns.size > 0 &&
      !shouldInclude(subPath, query.localPath, query.includePatterns, isDirForInclude)
        ) {
            continue;
        }

        if (entry.isSymbolicLink()) {
            processSymlink(subPath, node, stats, query.localPath);
            continue;
        }


        const st = await stat(subPath).catch(() => null);

        if (st === null) {
            continue; // broken entry (race, permissions, etc.) — skip like a stat() failure would
        }

        if (st.isFile()) {
            if (st.size > query.maxFileSize) {
                continue;
            }
            processFile(subPath, st, node, stats, query.localPath);
        } else if (st.isDirectory()) {
            const childDirectoryNode = new FileSystemNode({
                name: entry.name,
                type: FileSystemNodeType.DIRECTORY,
                pathStr: path.relative(query.localPath, subPath),
                fsPath: subPath,
                depth: node.depth + 1,
            });


            await processNode(childDirectoryNode, query, stats);

            if (childDirectoryNode.children.length === 0) {
                continue;
            }

            node.children.push(childDirectoryNode);
            node.size += childDirectoryNode.size;
            node.fileCount += childDirectoryNode.fileCount;
            node.dirCount += 1 + childDirectoryNode.dirCount;
        }
    // else: unknown file type (device, socket, fifo) — skip, matching the Python "else: warn" branch's practical effect
    }

    node.sortChildren();
}

function processSymlink(subPath, parentNode, stats, localPath) {
    const child = new FileSystemNode({
        name: path.basename(subPath),
        type: FileSystemNodeType.SYMLINK,
        pathStr: relPathOrDot(localPath, subPath),
        fsPath: subPath,
        depth: parentNode.depth + 1,
    });

    stats.totalFiles += 1;
    parentNode.children.push(child);
    parentNode.fileCount += 1;
}

function processFile(subPath, st, parentNode, stats, localPath) {
    if (stats.totalFiles + 1 > MAX_FILES) {
        return;
    }

    const fileSize = st.size;

    if (stats.totalSize + fileSize > MAX_TOTAL_SIZE_BYTES) {
        return;
    }

    stats.totalFiles += 1;
    stats.totalSize += fileSize;

    const child = new FileSystemNode({
        name: path.basename(subPath),
        type: FileSystemNodeType.FILE,
        size: fileSize,
        fileCount: 1,
        pathStr: relPathOrDot(localPath, subPath),
        fsPath: subPath,
        depth: parentNode.depth + 1,
    });

    parentNode.children.push(child);
    parentNode.size += fileSize;
    parentNode.fileCount += 1;
}

function limitExceeded(stats, depth) {
    if (depth > MAX_DIRECTORY_DEPTH) {return true;}
    if (stats.totalFiles >= MAX_FILES) {return true;}
    if (stats.totalSize >= MAX_TOTAL_SIZE_BYTES) {return true;}

    return false;
}

/**
 * Node's path.relative(base, target) returns "" when base === target, whereas Python's
 * Path.relative_to() stringifies the equivalent case as ".". Match Python's behaviour so
 * path_str values (used verbatim in digest headers) agree between the two implementations.
 */
function relPathOrDot(base, target) {
    const rel = path.relative(base, target);

    return rel === '' ? '.' : rel;
}
