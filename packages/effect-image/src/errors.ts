/**
 * Error types for effect-image
 *
 * All errors are tagged using Effect's Data.TaggedError pattern
 * for composable error handling with catchTag.
 *
 * @module errors
 */

import { Data } from "effect";
import type { ImageFormat } from "./types.js";

/**
 * ImageDecodeError - Thrown when image decoding fails
 *
 * Occurs when attempting to decode image from a buffer.
 * This is a retryable error.
 */
export class ImageDecodeError extends Data.TaggedError("ImageDecodeError")<{
  readonly message: string;
  readonly format?: ImageFormat;
  readonly cause?: Error;
}> {}

/**
 * ImageEncodeError - Thrown when image encoding fails
 *
 * Occurs when attempting to encode an image to a specific format.
 * This is a retryable error.
 */
export class ImageEncodeError extends Data.TaggedError("ImageEncodeError")<{
  readonly message: string;
  readonly targetFormat: ImageFormat;
  readonly cause?: Error;
}> {}

/**
 * UnsupportedFormatError - Thrown when an unsupported image format is encountered
 *
 * This is NOT retryable - the format is not supported by this library.
 * User must provide a supported format.
 */
export class UnsupportedFormatError extends Data.TaggedError(
  "UnsupportedFormatError"
)<{
  readonly message: string;
  readonly format: string;
  readonly supportedFormats: readonly ImageFormat[];
}> {}

/**
 * ImageProcessError - Thrown when image processing operations fail
 *
 * Includes the operation that failed (resize, crop, normalize, etc.).
 * This is a retryable error (could be transient memory pressure, etc.).
 */
export class ImageProcessError extends Data.TaggedError("ImageProcessError")<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: Error;
}> {}

/**
 * InvalidDimensionsError - Thrown when image dimensions are invalid
 *
 * Occurs when:
 * - Width or height is outside allowed range
 * - Dimensions don't meet constraints (e.g., for ML models)
 *
 * This is NOT retryable - dimensions must be adjusted by the caller.
 */
export class InvalidDimensionsError extends Data.TaggedError(
  "InvalidDimensionsError"
)<{
  readonly message: string;
  readonly width: number;
  readonly height: number;
  readonly constraint: string;
}> {}

/**
 * InvalidInputError - Thrown for invalid input parameters
 *
 * Occurs when:
 * - Buffer is empty or invalid
 * - Invalid crop region
 * - Invalid normalization parameters
 *
 * This is NOT retryable - user must fix their input.
 */
export class InvalidInputError extends Data.TaggedError("InvalidInputError")<{
  readonly message: string;
  readonly parameter: string;
  readonly receivedValue: unknown;
}> {}

/**
 * FileNotFoundError - Thrown when a file cannot be located
 *
 * Occurs when attempting to read or write image files.
 * This could be retryable (race condition) or not (permission denied).
 */
export class FileNotFoundError extends Data.TaggedError("FileNotFoundError")<{
  readonly message: string;
  readonly path: string;
  readonly cause?: Error;
}> {}

/**
 * FileIOError - Thrown when file I/O operations fail
 *
 * Occurs when reading or writing files.
 * This is a retryable error (disk full, permission issues might be transient).
 */
export class FileIOError extends Data.TaggedError("FileIOError")<{
  readonly message: string;
  readonly path: string;
  readonly operation: "read" | "write";
  readonly cause?: Error;
}> {}

/**
 * MemoryError - Thrown when memory constraints are exceeded
 *
 * Occurs when an image is too large to process in available memory.
 * This is NOT retryable - user must provide a smaller image.
 */
export class MemoryError extends Data.TaggedError("MemoryError")<{
  readonly message: string;
  readonly reason: string;
}> {}

/**
 * BackendError - Thrown when the underlying image backend (Sharp) fails
 *
 * Wraps underlying Sharp library errors.
 * This is a retryable error.
 */
export class BackendError extends Data.TaggedError("BackendError")<{
  readonly message: string;
  readonly backend: string;
  readonly cause?: Error;
}> {}

/**
 * ImageDecodeError | ImageEncodeError | ImageProcessError union
 * Represents all retryable image operation errors
 */
export type RetryableImageError =
  | ImageDecodeError
  | ImageEncodeError
  | ImageProcessError
  | FileIOError
  | BackendError;

/**
 * All possible image operation errors
 */
export type ImageOperationError =
  | ImageDecodeError
  | ImageEncodeError
  | ImageProcessError
  | UnsupportedFormatError
  | InvalidDimensionsError
  | InvalidInputError
  | FileNotFoundError
  | FileIOError
  | MemoryError
  | BackendError;
