/**
 * effect-attachment - Chat attachment management
 *
 * Provides type-safe attachment management for chat applications.
 * Built on effect-repository for flexible storage backend support.
 *
 * @module effect-attachment
 */

// Types
export type {
  Attachment,
  AttachmentWithData,
  UploadOptions,
  AttachmentListOptions,
  AttachmentListResult,
  AttachmentServiceConfig,
} from "./types.js"

// Errors
export {
  AttachmentNotFoundError,
  InvalidAttachmentError,
  AttachmentSizeLimitError,
  UnsupportedAttachmentTypeError,
} from "./errors.js"

// Service
export {
  createAttachmentService,
  type AttachmentServiceSchema,
} from "./service.js"
