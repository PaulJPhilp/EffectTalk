/**
 * effect-repository - Generic blob storage abstraction
 *
 * Provides a backend-agnostic interface for storing and retrieving binary data (blobs)
 * with support for multiple backends (in-memory, filesystem, PostgreSQL).
 *
 * @module effect-repository
 */

// Core types
export type {
  BlobId,
  Blob,
  BlobMetadata,
  SaveOptions,
  ListOptions,
  ListResult,
} from "./types.js"

// Errors
export {
  BlobNotFoundError,
  BlobAlreadyExistsError,
  RepositoryError,
  InvalidBlobError,
  StorageQuotaError,
  type RetryableRepositoryError,
  type RepositoryErrorType,
} from "./errors.js"

// Schemas
export {
  BlobIdSchema,
  type BlobIdType,
  BlobMetadataSchema,
  type BlobMetadataType,
  SaveOptionsSchema,
  type SaveOptionsType,
  ListOptionsSchema,
  type ListOptionsType,
  ListResultSchema,
  type ListResultType,
} from "./schemas.js"

// Backend interface
export type { RepositoryBackend } from "./backends/types.js"

// Backends
export {
  InMemoryBackend,
  InMemoryBackendLayer,
} from "./backends/index.js"

export {
  FileSystemBackend,
  FileSystemBackendLayer,
  type FileSystemBackendConfig,
} from "./backends/index.js"

export {
  PostgreSQLBackend,
  PostgreSQLBackendLayer,
  type PostgreSQLBackendConfig,
} from "./backends/index.js"

// API functions
export {
  save,
  get,
  getMetadata,
  exists,
  deleteBlob,
  list,
} from "./api.js"

// Testing utilities
export {
  createTestBlobData,
  createTestBlobMetadata,
  createTestBlobs,
  assertBlobMatches,
} from "./testing.js"
