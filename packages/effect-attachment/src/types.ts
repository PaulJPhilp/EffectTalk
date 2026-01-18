/**
 * Core types for chat attachments
 *
 * @module types
 */

import type { BlobId } from "effect-repository";

/**
 * Attachment metadata without binary data
 */
export interface Attachment {
  /** Unique identifier (same as blob ID) */
  readonly id: BlobId;
  /** Original filename */
  readonly filename: string;
  /** MIME type */
  readonly mimeType: string;
  /** Size in bytes */
  readonly sizeBytes: number;
  /** Upload timestamp */
  readonly uploadedAt: Date;
  /** Optional: Associated chat/conversation ID */
  readonly chatId?: string;
  /** Optional: User ID who uploaded */
  readonly userId?: string;
}

/**
 * Attachment with binary data
 */
export interface AttachmentWithData extends Attachment {
  /** Binary content */
  readonly data: Buffer;
}

/**
 * Options for uploading attachments
 */
export interface UploadOptions {
  /** Associated chat ID */
  readonly chatId?: string;
  /** User ID */
  readonly userId?: string;
  /** Custom attachment ID (if not provided, auto-generated) */
  readonly id?: BlobId;
}

/**
 * Options for listing attachments
 */
export interface AttachmentListOptions {
  /** Filter by chat ID */
  readonly chatId?: string;
  /** Filter by user ID */
  readonly userId?: string;
  /** Filter by MIME type prefix (e.g., 'image/') */
  readonly mimeTypePrefix?: string;
  /** Maximum number of results */
  readonly limit?: number;
  /** Pagination cursor */
  readonly cursor?: string;
}

/**
 * Attachment list result
 */
export interface AttachmentListResult {
  /** Attachments (without binary data) */
  readonly items: readonly Attachment[];
  /** Next page cursor */
  readonly nextCursor?: string;
  /** Total count (if available) */
  readonly totalCount?: number;
}

/**
 * Attachment service configuration
 */
export interface AttachmentServiceConfig {
  /** Maximum attachment size in bytes (default: 10MB) */
  readonly maxSizeBytes?: number;
  /** Allowed MIME types (empty = all allowed) */
  readonly allowedMimeTypes?: readonly string[];
}
