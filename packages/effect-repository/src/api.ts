/**
 * High-level Repository API
 *
 * Provides convenience functions for working with any backend
 *
 * @module api
 */

import type { RepositoryBackend } from "./backends/types.js";
import type { BlobId, ListOptions, SaveOptions } from "./types.js";

/**
 * Save blob to repository
 *
 * @param backend - The repository backend to use
 * @param data - Binary data to store
 * @param mimeType - MIME type of the data
 * @param options - Save options (ID, metadata, overwrite)
 * @returns Effect yielding saved blob metadata
 */
export const save = (
  backend: RepositoryBackend,
  data: Buffer,
  mimeType: string,
  options?: SaveOptions
) => backend.save(data, mimeType, options);

/**
 * Get blob with data from repository
 *
 * @param backend - The repository backend to use
 * @param id - Blob identifier
 * @returns Effect yielding blob with data and metadata
 */
export const get = (backend: RepositoryBackend, id: BlobId) => backend.get(id);

/**
 * Get blob metadata without fetching binary data
 *
 * @param backend - The repository backend to use
 * @param id - Blob identifier
 * @returns Effect yielding blob metadata
 */
export const getMetadata = (backend: RepositoryBackend, id: BlobId) =>
  backend.getMetadata(id);

/**
 * Check if blob exists
 *
 * @param backend - The repository backend to use
 * @param id - Blob identifier
 * @returns Effect yielding true if blob exists
 */
export const exists = (backend: RepositoryBackend, id: BlobId) =>
  backend.exists(id);

/**
 * Delete blob from repository
 *
 * @param backend - The repository backend to use
 * @param id - Blob identifier
 * @returns Effect yielding void on success
 */
export const deleteBlob = (backend: RepositoryBackend, id: BlobId) =>
  backend.delete(id);

/**
 * List blobs with optional filtering and pagination
 *
 * @param backend - The repository backend to use
 * @param options - List options (limit, cursor, filters)
 * @returns Effect yielding paginated list result
 */
export const list = (backend: RepositoryBackend, options?: ListOptions) =>
  backend.list(options);
