/**
 * Core types for blob storage
 *
 * @module types
 */

/**
 * Unique identifier for blobs
 * Can be UUID, hash-based, or custom ID
 */
export type BlobId = string

/**
 * Metadata for a stored blob
 */
export interface BlobMetadata {
  /** Unique identifier */
  readonly id: BlobId
  /** MIME type (e.g., 'image/jpeg', 'application/pdf') */
  readonly mimeType: string
  /** Size in bytes */
  readonly sizeBytes: number
  /** Creation timestamp */
  readonly createdAt: Date
  /** Last modified timestamp */
  readonly updatedAt: Date
  /** Optional custom metadata as key-value pairs */
  readonly customMetadata?: Record<string, string>
}

/**
 * Complete blob with data and metadata
 */
export interface Blob {
  /** Metadata */
  readonly metadata: BlobMetadata
  /** Binary content */
  readonly data: Buffer
}

/**
 * Options for saving blobs
 */
export interface SaveOptions {
  /** Explicit ID (if not provided, backend generates one) */
  readonly id?: BlobId
  /** Custom metadata */
  readonly customMetadata?: Record<string, string>
  /** Whether to overwrite existing blob with same ID */
  readonly overwrite?: boolean
}

/**
 * Options for listing blobs
 */
export interface ListOptions {
  /** Maximum number of results */
  readonly limit?: number
  /** Pagination cursor (backend-specific) */
  readonly cursor?: string
  /** Filter by MIME type prefix (e.g., 'image/') */
  readonly mimeTypePrefix?: string
}

/**
 * Result of listing blobs with pagination support
 */
export interface ListResult {
  /** Blob metadata (without content) */
  readonly items: readonly BlobMetadata[]
  /** Next page cursor (if more results available) */
  readonly nextCursor?: string
  /** Total count (if supported by backend) */
  readonly totalCount?: number
}
