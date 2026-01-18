/**
 * ImageBackend Interface and Types
 *
 * Defines the contract for image processing backends (Sharp, future WASM, etc.)
 * This abstraction allows multiple implementations to be swapped.
 *
 * @module backends/types
 */

import { Effect } from "effect";
import type {
  CropOptions,
  EncodeOptions,
  ImageData,
  ImageFormat,
  ImageMetadata,
  ResizeOptions,
} from "../types.js";
import type {
  BackendError,
  ImageDecodeError,
  ImageEncodeError,
  ImageProcessError,
} from "../errors.js";

/**
 * ImageBackend - Interface for image processing implementations
 *
 * All operations return Effect for composability and error handling.
 * Errors are tagged for selective catchTag handling.
 */
export interface ImageBackend {
  /**
   * Decode image from binary buffer
   *
   * Automatically detects format if not specified.
   *
   * @param buffer - Image data as Buffer
   * @param format - Optional format hint
   * @returns Effect that yields ImageData or fails with ImageDecodeError | BackendError
   */
  readonly decode: (
    buffer: Buffer,
    format?: ImageFormat
  ) => Effect.Effect<ImageData, ImageDecodeError | BackendError>;

  /**
   * Get image metadata without decoding full image
   *
   * Fast operation for inspection before decoding.
   *
   * @param buffer - Image data as Buffer
   * @returns Effect that yields ImageMetadata or fails with ImageDecodeError | BackendError
   */
  readonly getMetadata: (
    buffer: Buffer
  ) => Effect.Effect<ImageMetadata, ImageDecodeError | BackendError>;

  /**
   * Encode ImageData to binary buffer
   *
   * Converts internal representation to specified format.
   *
   * @param image - The image to encode
   * @param format - Target format (jpeg, png, webp)
   * @param options - Encoding options (quality, etc.)
   * @returns Effect that yields encoded Buffer or fails with ImageEncodeError | BackendError
   */
  readonly encode: (
    image: ImageData,
    format: ImageFormat,
    options?: EncodeOptions
  ) => Effect.Effect<Buffer, ImageEncodeError | BackendError>;

  /**
   * Resize image to specified dimensions
   *
   * @param image - The image to resize
   * @param width - Target width in pixels
   * @param height - Target height in pixels
   * @param options - Resize options (fit strategy, quality, etc.)
   * @returns Effect that yields resized ImageData or fails with ImageProcessError | BackendError
   */
  readonly resize: (
    image: ImageData,
    width: number,
    height: number,
    options?: ResizeOptions
  ) => Effect.Effect<ImageData, ImageProcessError | BackendError>;

  /**
   * Crop image to region
   *
   * @param image - The image to crop
   * @param options - Crop region specification (left, top, width, height)
   * @returns Effect that yields cropped ImageData or fails with ImageProcessError | BackendError
   */
  readonly crop: (
    image: ImageData,
    options: CropOptions
  ) => Effect.Effect<ImageData, ImageProcessError | BackendError>;

  /**
   * Convert image to grayscale
   *
   * Converts RGB/RGBA to single-channel grayscale representation.
   *
   * @param image - The image to convert
   * @returns Effect that yields grayscale ImageData or fails with ImageProcessError | BackendError
   */
  readonly toGrayscale: (
    image: ImageData
  ) => Effect.Effect<ImageData, ImageProcessError | BackendError>;

  /**
   * Rotate image by specified angle
   *
   * @param image - The image to rotate
   * @param angle - Rotation angle in degrees (0-360)
   * @returns Effect that yields rotated ImageData or fails with ImageProcessError | BackendError
   */
  readonly rotate: (
    image: ImageData,
    angle: number
  ) => Effect.Effect<ImageData, ImageProcessError | BackendError>;

  /**
   * Flip image horizontally
   *
   * @param image - The image to flip
   * @returns Effect that yields flipped ImageData or fails with ImageProcessError | BackendError
   */
  readonly flipHorizontal: (
    image: ImageData
  ) => Effect.Effect<ImageData, ImageProcessError | BackendError>;

  /**
   * Flip image vertically
   *
   * @param image - The image to flip
   * @returns Effect that yields flipped ImageData or fails with ImageProcessError | BackendError
   */
  readonly flipVertical: (
    image: ImageData
  ) => Effect.Effect<ImageData, ImageProcessError | BackendError>;
}
