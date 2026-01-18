/**
 * Tagged error types for blob repository operations
 *
 * All errors extend Data.TaggedError for type-safe error handling
 *
 * @module errors
 */

import { Data } from "effect"
import type { BlobId } from "./types.js"

/**
 * BlobNotFoundError - Thrown when blob does not exist
 *
 * Discriminator: "BlobNotFoundError"
 */
export class BlobNotFoundError extends Data.TaggedError("BlobNotFoundError")<{
  readonly message: string
  readonly id: BlobId
  readonly backend: string
}> {}

/**
 * BlobAlreadyExistsError - Thrown when saving with existing ID and overwrite=false
 *
 * Discriminator: "BlobAlreadyExistsError"
 */
export class BlobAlreadyExistsError extends Data.TaggedError(
  "BlobAlreadyExistsError"
)<{
  readonly message: string
  readonly id: BlobId
  readonly backend: string
}> {}

/**
 * RepositoryError - Generic repository operation error
 *
 * Discriminator: "RepositoryError"
 */
export class RepositoryError extends Data.TaggedError("RepositoryError")<{
  readonly message: string
  readonly operation:
    | "save"
    | "get"
    | "delete"
    | "list"
    | "exists"
    | "getMetadata"
  readonly backend: string
  readonly cause?: Error
}> {}

/**
 * InvalidBlobError - Thrown when blob data is invalid
 *
 * Discriminator: "InvalidBlobError"
 */
export class InvalidBlobError extends Data.TaggedError("InvalidBlobError")<{
  readonly message: string
  readonly reason: string
  readonly receivedValue?: unknown
}> {}

/**
 * StorageQuotaError - Thrown when storage quota is exceeded
 *
 * Discriminator: "StorageQuotaError"
 */
export class StorageQuotaError extends Data.TaggedError("StorageQuotaError")<{
  readonly message: string
  readonly backend: string
  readonly quotaBytes?: number
  readonly usedBytes?: number
}> {}

/**
 * Union type for retryable errors
 */
export type RetryableRepositoryError =
  | RepositoryError
  | StorageQuotaError
  | BlobAlreadyExistsError

/**
 * Union type for all repository errors
 */
export type RepositoryErrorType =
  | BlobNotFoundError
  | BlobAlreadyExistsError
  | RepositoryError
  | InvalidBlobError
  | StorageQuotaError
