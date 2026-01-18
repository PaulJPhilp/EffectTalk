/**
 * Core Image Processing API
 *
 * High-level functions for decoding, encoding, and converting images.
 * All operations return Effect for composability and error handling.
 *
 * @module api
 */

import { FileSystem } from "@effect/platform";
import { Effect } from "effect";
import type {
  EncodeOptions,
  ImageData,
  ImageFormat,
  ImageMetadata,
  ResizeOptions,
  CropOptions,
} from "./types.js";
import {
  FileIOError,
  FileNotFoundError,
  ImageOperationError,
  InvalidDimensionsError,
  InvalidInputError,
  UnsupportedFormatError,
} from "./errors.js";
import { SharpBackend } from "./backends/sharp.js";
import type { ImageBackend } from "./backends/types.js";

const SUPPORTED_FORMATS: readonly ImageFormat[] = ["jpeg", "png", "webp"];
const MAX_DIMENSION = 16384;
const MIN_DIMENSION = 1;

/**
 * Decode image from binary buffer
 *
 * Automatically detects image format from buffer contents.
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param buffer - Image data as Buffer
 * @param format - Optional format hint (auto-detected if not provided)
 * @returns Effect yielding decoded ImageData
 * @example
 * ```typescript
 * const imageData = await Effect.runPromise(
 *   decode(jpegBuffer)
 * )
 * ```
 */
export const decode = (buffer: Buffer, format?: ImageFormat) =>
  Effect.gen(function* () {
    const backend = yield* SharpBackend;

    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "Buffer must be non-empty",
          parameter: "buffer",
          receivedValue: buffer,
        })
      );
    }

    return yield* backend.decode(buffer, format);
  });

/**
 * Decode image from file path
 *
 * Reads file and decodes to ImageData.
 *
 * **Effect Requirements**: Requires SharpBackend and FileSystem to be provided
 *
 * @param path - File path to image
 * @param format - Optional format hint
 * @returns Effect yielding decoded ImageData
 * @example
 * ```typescript
 * const imageData = await Effect.runPromise(
 *   decodeFromFile("path/to/image.jpg")
 * )
 * ```
 */
export const decodeFromFile = (path: string, format?: ImageFormat) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const backend = yield* SharpBackend;

    const exists = yield* fs.exists(path);
    if (!exists) {
      return yield* Effect.fail(
        new FileNotFoundError({
          message: `File not found: ${path}`,
          path,
        })
      );
    }

    const fileData = yield* fs.readFile(path).pipe(
      Effect.mapError(
        (error) =>
          new FileIOError({
            message: `Failed to read file`,
            path,
            operation: "read",
            cause: error instanceof Error ? error : undefined,
          })
      )
    );

    const buffer = Buffer.isBuffer(fileData)
      ? fileData
      : Buffer.from(fileData as Uint8Array);

    return yield* backend.decode(buffer, format);
  });

/**
 * Get image metadata without decoding full pixel data
 *
 * Fast operation for inspection before decoding.
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param buffer - Image data as Buffer
 * @returns Effect yielding ImageMetadata
 * @example
 * ```typescript
 * const metadata = await Effect.runPromise(
 *   getMetadata(buffer)
 * )
 * console.log(`${metadata.width}x${metadata.height}`)
 * ```
 */
export const getMetadata = (buffer: Buffer) =>
  Effect.gen(function* () {
    const backend = yield* SharpBackend;

    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "Buffer must be non-empty",
          parameter: "buffer",
          receivedValue: buffer,
        })
      );
    }

    return yield* backend.getMetadata(buffer);
  });

/**
 * Get image metadata from file without decoding full pixel data
 *
 * **Effect Requirements**: Requires SharpBackend and FileSystem to be provided
 *
 * @param path - File path to image
 * @returns Effect yielding ImageMetadata
 * @example
 * ```typescript
 * const metadata = await Effect.runPromise(
 *   getMetadataFromFile("image.png")
 * )
 * ```
 */
export const getMetadataFromFile = (path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const backend = yield* SharpBackend;

    const exists = yield* fs.exists(path);
    if (!exists) {
      return yield* Effect.fail(
        new FileNotFoundError({
          message: `File not found: ${path}`,
          path,
        })
      );
    }

    const fileData = yield* fs.readFile(path).pipe(
      Effect.mapError(
        (error) =>
          new FileIOError({
            message: `Failed to read file`,
            path,
            operation: "read",
            cause: error instanceof Error ? error : undefined,
          })
      )
    );

    const buffer = Buffer.isBuffer(fileData)
      ? fileData
      : Buffer.from(fileData as Uint8Array);

    return yield* backend.getMetadata(buffer);
  });

/**
 * Encode ImageData to binary buffer
 *
 * Converts internal ImageData representation to specified format.
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to encode
 * @param format - Target format (jpeg, png, webp)
 * @param options - Encoding options (quality, progressive, etc.)
 * @returns Effect yielding encoded Buffer
 * @example
 * ```typescript
 * const jpegBuffer = await Effect.runPromise(
 *   encode(imageData, "jpeg", { quality: 90 })
 * )
 * ```
 */
export const encode = (
  image: ImageData,
  format: ImageFormat,
  options?: EncodeOptions
) =>
  Effect.gen(function* () {
    const backend = yield* SharpBackend;

    // Validate format
    if (!SUPPORTED_FORMATS.includes(format)) {
      return yield* Effect.fail(
        new UnsupportedFormatError({
          message: `Unsupported image format: ${format}`,
          format,
          supportedFormats: SUPPORTED_FORMATS,
        })
      );
    }

    // Validate dimensions
    if (image.width < MIN_DIMENSION || image.width > MAX_DIMENSION) {
      return yield* Effect.fail(
        new InvalidDimensionsError({
          message: `Width must be between ${MIN_DIMENSION} and ${MAX_DIMENSION}`,
          width: image.width,
          height: image.height,
          constraint: `1 <= width <= ${MAX_DIMENSION}`,
        })
      );
    }

    if (image.height < MIN_DIMENSION || image.height > MAX_DIMENSION) {
      return yield* Effect.fail(
        new InvalidDimensionsError({
          message: `Height must be between ${MIN_DIMENSION} and ${MAX_DIMENSION}`,
          width: image.width,
          height: image.height,
          constraint: `1 <= height <= ${MAX_DIMENSION}`,
        })
      );
    }

    return yield* backend.encode(image, format, options);
  });

/**
 * Encode ImageData and save to file
 *
 * **Effect Requirements**: Requires SharpBackend and FileSystem to be provided
 *
 * @param image - The image to encode
 * @param path - Output file path
 * @param format - Target format (jpeg, png, webp)
 * @param options - Encoding options
 * @returns Effect
 * @example
 * ```typescript
 * await Effect.runPromise(
 *   encodeToFile(imageData, "output.jpg", "jpeg", { quality: 90 })
 * )
 * ```
 */
export const encodeToFile = (
  image: ImageData,
  path: string,
  format: ImageFormat,
  options?: EncodeOptions
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const buffer = yield* encode(image, format, options);

    yield* fs.writeFile(path, buffer).pipe(
      Effect.mapError(
        (error) =>
          new FileIOError({
            message: `Failed to write file`,
            path,
            operation: "write",
            cause: error instanceof Error ? error : undefined,
          })
      )
    );
  });

/**
 * Convert image between formats
 *
 * Decodes from one format and encodes to another.
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param buffer - Source image data
 * @param targetFormat - Target format
 * @param options - Encoding options for target format
 * @returns Effect yielding converted Buffer
 * @example
 * ```typescript
 * const webpBuffer = await Effect.runPromise(
 *   convert(jpegBuffer, "webp", { quality: 80 })
 * )
 * ```
 */
export const convert = (
  buffer: Buffer,
  targetFormat: ImageFormat,
  options?: EncodeOptions
) =>
  Effect.gen(function* () {
    // Validate format
    if (!SUPPORTED_FORMATS.includes(targetFormat)) {
      return yield* Effect.fail(
        new UnsupportedFormatError({
          message: `Unsupported target format: ${targetFormat}`,
          format: targetFormat,
          supportedFormats: SUPPORTED_FORMATS,
        })
      );
    }

    const image = yield* decode(buffer);
    return yield* encode(image, targetFormat, options);
  });

/**
 * Resize image to specified dimensions
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to resize
 * @param width - Target width in pixels
 * @param height - Target height in pixels
 * @param options - Resize options (fit strategy, quality, etc.)
 * @returns Effect yielding resized ImageData
 * @example
 * ```typescript
 * const resized = await Effect.runPromise(
 *   resize(imageData, 256, 256, { fit: "cover" })
 * )
 * ```
 */
export const resize = (
  image: ImageData,
  width: number,
  height: number,
  options?: ResizeOptions
) =>
  Effect.gen(function* () {
    const backend = yield* SharpBackend;

    // Validate dimensions
    if (width < MIN_DIMENSION || width > MAX_DIMENSION) {
      return yield* Effect.fail(
        new InvalidDimensionsError({
          message: `Target width must be between ${MIN_DIMENSION} and ${MAX_DIMENSION}`,
          width,
          height,
          constraint: `1 <= width <= ${MAX_DIMENSION}`,
        })
      );
    }

    if (height < MIN_DIMENSION || height > MAX_DIMENSION) {
      return yield* Effect.fail(
        new InvalidDimensionsError({
          message: `Target height must be between ${MIN_DIMENSION} and ${MAX_DIMENSION}`,
          width,
          height,
          constraint: `1 <= height <= ${MAX_DIMENSION}`,
        })
      );
    }

    return yield* backend.resize(image, width, height, options);
  });

/**
 * Crop image to specified region
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to crop
 * @param options - Crop region (left, top, width, height)
 * @returns Effect yielding cropped ImageData
 * @example
 * ```typescript
 * const cropped = await Effect.runPromise(
 *   crop(imageData, { left: 10, top: 10, width: 100, height: 100 })
 * )
 * ```
 */
export const crop = (image: ImageData, options: CropOptions) =>
  Effect.gen(function* () {
    const backend = yield* SharpBackend;
    return yield* backend.crop(image, options);
  });

/**
 * Convert image to grayscale
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to convert
 * @returns Effect yielding grayscale ImageData
 * @example
 * ```typescript
 * const gray = await Effect.runPromise(
 *   toGrayscale(imageData)
 * )
 * ```
 */
export const toGrayscale = (image: ImageData) =>
  Effect.gen(function* () {
    const backend = yield* SharpBackend;
    return yield* backend.toGrayscale(image);
  });

/**
 * Rotate image by specified angle
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to rotate
 * @param angle - Rotation angle in degrees (0-360)
 * @returns Effect yielding rotated ImageData
 * @example
 * ```typescript
 * const rotated = await Effect.runPromise(
 *   rotate(imageData, 90)
 * )
 * ```
 */
export const rotate = (image: ImageData, angle: number) =>
  Effect.gen(function* () {
    const backend = yield* SharpBackend;
    return yield* backend.rotate(image, angle);
  });

/**
 * Flip image horizontally
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to flip
 * @returns Effect yielding flipped ImageData
 * @example
 * ```typescript
 * const flipped = await Effect.runPromise(
 *   flipHorizontal(imageData)
 * )
 * ```
 */
export const flipHorizontal = (image: ImageData) =>
  Effect.gen(function* () {
    const backend = yield* SharpBackend;
    return yield* backend.flipHorizontal(image);
  });

/**
 * Flip image vertically
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to flip
 * @returns Effect yielding flipped ImageData
 * @example
 * ```typescript
 * const flipped = await Effect.runPromise(
 *   flipVertical(imageData)
 * )
 * ```
 */
export const flipVertical = (image: ImageData) =>
  Effect.gen(function* () {
    const backend = yield* SharpBackend;
    return yield* backend.flipVertical(image);
  });
