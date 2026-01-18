/**
 * Backend abstraction for blob storage
 *
 * Defines the contract that all storage backends must implement
 *
 * @module backends/types
 */

import { Effect } from "effect";
import type {
  Blob,
  BlobId,
  BlobMetadata,
  ListOptions,
  ListResult,
  SaveOptions,
} from "../types.js";
import type {
  BlobNotFoundError,
  BlobAlreadyExistsError,
  RepositoryError,
} from "../errors.js";

/**
 * RepositoryBackend - Interface for blob storage implementations
 *
 * All operations return Effect for composability and error handling.
 * Errors are tagged for selective error handling with catchTag.
 */
export interface RepositoryBackend {
  /**
   * Save blob to storage
   *
   * @param data - Binary data to store
   * @param mimeType - MIME type of the data
   * @param options - Save options (ID, metadata, overwrite)
   * @returns Effect yielding saved blob metadata
   * @throws BlobAlreadyExistsError - If blob exists and overwrite=false
   * @throws RepositoryError - On storage operation failure
   */
  readonly save: (
    data: Buffer,
    mimeType: string,
    options?: SaveOptions
  ) => Effect.Effect<BlobMetadata, BlobAlreadyExistsError | RepositoryError>;

  /**
   * Get blob by ID with binary data
   *
   * @param id - Blob identifier
   * @returns Effect yielding blob with data and metadata
   * @throws BlobNotFoundError - If blob does not exist
   * @throws RepositoryError - On storage operation failure
   */
  readonly get: (
    id: BlobId
  ) => Effect.Effect<Blob, BlobNotFoundError | RepositoryError>;

  /**
   * Get blob metadata without fetching binary data
   *
   * Fast operation for inspection before fetching full blob.
   *
   * @param id - Blob identifier
   * @returns Effect yielding blob metadata
   * @throws BlobNotFoundError - If blob does not exist
   * @throws RepositoryError - On storage operation failure
   */
  readonly getMetadata: (
    id: BlobId
  ) => Effect.Effect<BlobMetadata, BlobNotFoundError | RepositoryError>;

  /**
   * Check if blob exists
   *
   * @param id - Blob identifier
   * @returns Effect yielding true if blob exists, false otherwise
   * @throws RepositoryError - On storage operation failure
   */
  readonly exists: (id: BlobId) => Effect.Effect<boolean, RepositoryError>;

  /**
   * Delete blob by ID
   *
   * @param id - Blob identifier
   * @returns Effect yielding void on success
   * @throws BlobNotFoundError - If blob does not exist
   * @throws RepositoryError - On storage operation failure
   */
  readonly delete: (
    id: BlobId
  ) => Effect.Effect<void, BlobNotFoundError | RepositoryError>;

  /**
   * List blobs with optional filtering and pagination
   *
   * @param options - List options (limit, cursor, filters)
   * @returns Effect yielding paginated list result with metadata
   * @throws RepositoryError - On storage operation failure
   */
  readonly list: (
    options?: ListOptions
  ) => Effect.Effect<ListResult, RepositoryError>;
}
