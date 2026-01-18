/**
 * effect-storage - Type-safe, schema-driven file storage with metadata support
 * @packageDocumentation
 */

// Convenience Functions (Primary API)
export { createFileStorage, createMemoryStorage } from "./service.js";

// Types and Schemas
export type {
  StorageConfig,
  StorageBackend,
  StorageServiceApi,
} from "./types.js";

export {
  NotFoundError,
  StorageError,
  ValidationError,
  AlreadyExistsError,
} from "./errors.js";

export {
  generateHashPrefix,
  getContentPath,
  getMetadataPath,
  getItemDirectory,
  ensureDirectory,
  extractIdsFromDirectory,
} from "./utils/path-utils.js";

export { createMemoryBackend } from "./backends/memory.js";
export { createFileSystemBackend } from "./backends/file-system.js";
