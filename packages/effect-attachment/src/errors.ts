/**
 * Tagged error types for attachment operations
 *
 * @module errors
 */

import { Data } from "effect";
import type { BlobId } from "effect-repository";

/**
 * AttachmentNotFoundError - Thrown when attachment does not exist
 *
 * Discriminator: "AttachmentNotFoundError"
 */
export class AttachmentNotFoundError extends Data.TaggedError(
  "AttachmentNotFoundError"
)<{
  readonly message: string;
  readonly id: BlobId;
}> {}

/**
 * InvalidAttachmentError - Thrown when attachment data is invalid
 *
 * Discriminator: "InvalidAttachmentError"
 */
export class InvalidAttachmentError extends Data.TaggedError(
  "InvalidAttachmentError"
)<{
  readonly message: string;
  readonly reason: string;
  readonly filename?: string;
}> {}

/**
 * AttachmentSizeLimitError - Thrown when attachment exceeds size limit
 *
 * Discriminator: "AttachmentSizeLimitError"
 */
export class AttachmentSizeLimitError extends Data.TaggedError(
  "AttachmentSizeLimitError"
)<{
  readonly message: string;
  readonly filename: string;
  readonly sizeBytes: number;
  readonly limitBytes: number;
}> {}

/**
 * UnsupportedAttachmentTypeError - Thrown when MIME type is not allowed
 *
 * Discriminator: "UnsupportedAttachmentTypeError"
 */
export class UnsupportedAttachmentTypeError extends Data.TaggedError(
  "UnsupportedAttachmentTypeError"
)<{
  readonly message: string;
  readonly mimeType: string;
  readonly allowedTypes: readonly string[];
}> {}
