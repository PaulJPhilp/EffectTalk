/**
 * Backend exports for effect-repository
 *
 * @module backends
 */

export type { RepositoryBackend } from "./types.js"

export { InMemoryBackend, InMemoryBackendLayer } from "./memory.js"
export type { } from "./memory.js"

export {
  FileSystemBackend,
  FileSystemBackendLayer,
  type FileSystemBackendConfig,
} from "./filesystem.js"

export {
  PostgreSQLBackend,
  PostgreSQLBackendLayer,
  type PostgreSQLBackendConfig,
} from "./postgresql.js"
