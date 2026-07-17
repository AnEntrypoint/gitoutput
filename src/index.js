/** Library entrypoint for gitingest — exposes the same programmatic surface as the CLI. */

export { ingestAsync } from './entrypoint.js';
export { IngestionQuery, CloneConfig, FileSystemNode, FileSystemNodeType, FileSystemStats } from './schemas.js';
