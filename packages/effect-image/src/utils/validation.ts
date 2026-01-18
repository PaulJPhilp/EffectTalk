/**
 * Input Validation Utilities
 *
 * Provides validation functions for image operations.
 *
 * @module utils/validation
 */

import { Effect } from "effect";
import type {
  DimensionConstraints,
  ImageData,
  ImageFormat,
  TensorData,
} from "../types.js";
import {
  InvalidDimensionsError,
  InvalidInputError,
  UnsupportedFormatError,
} from "../errors.js";

const SUPPORTED_FORMATS: readonly ImageFormat[] = ["jpeg", "png", "webp"];

/**
 * Validate image format
 *
 * @param format - Format to validate
 * @returns Effect that succeeds if valid, fails with UnsupportedFormatError otherwise
 */
export const validateFormat = (
  format: string
): Effect.Effect<ImageFormat, UnsupportedFormatError> =>
  Effect.gen(function* () {
    if (SUPPORTED_FORMATS.includes(format as ImageFormat)) {
      return format as ImageFormat;
    }

    return yield* Effect.fail(
      new UnsupportedFormatError({
        message: `Unsupported image format: ${format}`,
        format,
        supportedFormats: SUPPORTED_FORMATS,
      })
    );
  });

/**
 * Validate image dimensions
 *
 * @param width - Width to validate
 * @param height - Height to validate
 * @param constraints - Optional dimension constraints (defaults to 1-16384)
 * @returns Effect that succeeds if valid, fails with InvalidDimensionsError otherwise
 */
export const validateDimensions = (
  width: number,
  height: number,
  constraints?: DimensionConstraints
): Effect.Effect<void, InvalidDimensionsError> =>
  Effect.gen(function* () {
    const minWidth = constraints?.minWidth ?? 1;
    const maxWidth = constraints?.maxWidth ?? 16384;
    const minHeight = constraints?.minHeight ?? 1;
    const maxHeight = constraints?.maxHeight ?? 16384;

    if (!Number.isFinite(width) || width < minWidth || width > maxWidth) {
      return yield* Effect.fail(
        new InvalidDimensionsError({
          message: `Width must be between ${minWidth} and ${maxWidth}`,
          width,
          height,
          constraint: `${minWidth} <= width <= ${maxWidth}`,
        })
      );
    }

    if (!Number.isFinite(height) || height < minHeight || height > maxHeight) {
      return yield* Effect.fail(
        new InvalidDimensionsError({
          message: `Height must be between ${minHeight} and ${maxHeight}`,
          width,
          height,
          constraint: `${minHeight} <= height <= ${maxHeight}`,
        })
      );
    }
  });

/**
 * Validate ImageData structure
 *
 * @param image - Image data to validate
 * @returns Effect that succeeds if valid, fails with InvalidInputError otherwise
 */
export const validateImageData = (
  image: ImageData
): Effect.Effect<void, InvalidInputError> =>
  Effect.gen(function* () {
    if (!image) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "ImageData must not be null or undefined",
          parameter: "image",
          receivedValue: image,
        })
      );
    }

    if (!Number.isFinite(image.width) || image.width <= 0) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "ImageData.width must be a positive number",
          parameter: "image.width",
          receivedValue: image.width,
        })
      );
    }

    if (!Number.isFinite(image.height) || image.height <= 0) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "ImageData.height must be a positive number",
          parameter: "image.height",
          receivedValue: image.height,
        })
      );
    }

    if (image.channels !== 3 && image.channels !== 4) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "ImageData.channels must be 3 (RGB) or 4 (RGBA)",
          parameter: "image.channels",
          receivedValue: image.channels,
        })
      );
    }

    if (!Buffer.isBuffer(image.data) || image.data.length === 0) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "ImageData.data must be a non-empty Buffer",
          parameter: "image.data",
          receivedValue: image.data,
        })
      );
    }

    // Validate buffer size matches dimensions
    const expectedSize = image.width * image.height * image.channels;
    if (image.data.length !== expectedSize) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: `ImageData.data size (${image.data.length}) does not match expected size for ${image.width}x${image.height}x${image.channels} (${expectedSize})`,
          parameter: "image.data",
          receivedValue: image.data.length,
        })
      );
    }
  });

/**
 * Validate TensorData structure
 *
 * @param tensor - Tensor data to validate
 * @returns Effect that succeeds if valid, fails with InvalidInputError otherwise
 */
export const validateTensorData = (
  tensor: TensorData
): Effect.Effect<void, InvalidInputError> =>
  Effect.gen(function* () {
    if (!tensor) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "TensorData must not be null or undefined",
          parameter: "tensor",
          receivedValue: tensor,
        })
      );
    }

    const [height, width, channels] = tensor.shape;

    if (!Number.isFinite(height) || height <= 0) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "Tensor height must be a positive number",
          parameter: "tensor.shape[0]",
          receivedValue: height,
        })
      );
    }

    if (!Number.isFinite(width) || width <= 0) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "Tensor width must be a positive number",
          parameter: "tensor.shape[1]",
          receivedValue: width,
        })
      );
    }

    if (channels !== 1 && channels !== 3 && channels !== 4) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "Tensor channels must be 1, 3, or 4",
          parameter: "tensor.shape[2]",
          receivedValue: channels,
        })
      );
    }

    if (!(tensor.data instanceof Float32Array)) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "Tensor.data must be a Float32Array",
          parameter: "tensor.data",
          receivedValue: tensor.data,
        })
      );
    }

    // Validate data size
    const expectedSize = height * width * channels;
    if (tensor.data.length !== expectedSize) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: `Tensor.data size (${tensor.data.length}) does not match expected size for shape [${height}, ${width}, ${channels}] (${expectedSize})`,
          parameter: "tensor.data",
          receivedValue: tensor.data.length,
        })
      );
    }
  });

/**
 * Detect image format from buffer magic bytes
 *
 * Checks that buffer starts with known image magic bytes.
 *
 * @param buffer - Buffer to detect format from
 * @returns Detected format ("jpeg", "png", "webp") or undefined if unknown
 */
export const detectImageFormat = (buffer: Buffer): ImageFormat | undefined => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return undefined;
  }

  // Check magic bytes
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg"; // JPEG: FF D8 FF
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png"; // PNG: 89 50 4E 47
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp"; // WebP: RIFF ... WEBP
  }

  return undefined;
};

/**
 * Validate quality parameter
 *
 * @param quality - Quality value (should be 1-100)
 * @returns Effect that succeeds if valid, fails if out of range
 */
export const validateQuality = (
  quality: number | undefined
): Effect.Effect<number | undefined, InvalidInputError> =>
  Effect.gen(function* () {
    if (quality === undefined) {
      return undefined;
    }

    if (!Number.isFinite(quality) || quality <= 0 || quality > 100) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "Quality must be an integer between 1 and 100",
          parameter: "quality",
          receivedValue: quality,
        })
      );
    }

    if (!Number.isInteger(quality)) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "Quality must be an integer between 1 and 100",
          parameter: "quality",
          receivedValue: quality,
        })
      );
    }

    return quality;
  });
