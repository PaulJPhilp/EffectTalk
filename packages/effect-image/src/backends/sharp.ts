/**
 * Sharp Backend Implementation for Image Processing
 *
 * Provides high-performance image processing using the Sharp library.
 * Implements the ImageBackend interface with all operations.
 *
 * Sharp is a high-performance Node.js image library.
 * @see https://sharp.pixelplumbing.com/
 *
 * @module backends/sharp
 */

import { Effect, Layer } from "effect";
import sharp from "sharp";
import type {
  CropOptions,
  EncodeOptions,
  ImageData,
  ImageFormat,
  ImageMetadata,
  ResizeOptions,
} from "../types.js";
import {
  BackendError,
  ImageDecodeError,
  ImageEncodeError,
  ImageProcessError,
} from "../errors.js";
import type { ImageBackend } from "./types.js";

/**
 * Helper to convert Error to BackendError
 */
const toBackendError = (error: unknown, operation: string): BackendError => {
  const message = error instanceof Error ? error.message : String(error);
  return new BackendError({
    message: `Sharp ${operation} failed: ${message}`,
    backend: "sharp",
    cause: error instanceof Error ? error : undefined,
  });
};

/**
 * SharpBackend Service
 *
 * Uses Effect.Service pattern for dependency injection.
 * All operations are Effect-based for composability.
 */
export class SharpBackend extends Effect.Service<SharpBackend>()(
  "SharpBackend",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      return {
        /**
         * Decode image from buffer to ImageData
         */
        decode: (buffer: Buffer, format?: ImageFormat) =>
          Effect.gen(function* () {
            if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
              return yield* Effect.fail(
                new ImageDecodeError({
                  message: "Buffer is empty or invalid",
                  format,
                })
              );
            }

            return yield* Effect.tryPromise({
              try: async () => {
                const image = sharp(buffer);
                const metadata = await image.metadata();

                // Validate that we got valid dimensions
                if (!metadata.width || !metadata.height) {
                  throw new Error("Could not determine image dimensions");
                }

                // Convert to RGBA for consistent internal representation
                const data = await image
                  .ensureAlpha()
                  .raw()
                  .toBuffer({ resolveWithObject: true });

                return {
                  width: metadata.width,
                  height: metadata.height,
                  channels: 4, // RGBA always
                  format: (metadata.format as ImageFormat) || "jpeg",
                  data: data.data,
                } as ImageData;
              },
              catch: (error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                return new ImageDecodeError({
                  message: `Failed to decode image: ${message}`,
                  format,
                  cause: error instanceof Error ? error : undefined,
                });
              },
            });
          }),

        /**
         * Get image metadata without decoding full pixel data
         */
        getMetadata: (buffer: Buffer) =>
          Effect.gen(function* () {
            if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
              return yield* Effect.fail(
                new ImageDecodeError({
                  message: "Buffer is empty or invalid",
                })
              );
            }

            return yield* Effect.tryPromise({
              try: async () => {
                const metadata = await sharp(buffer).metadata();

                if (!metadata.width || !metadata.height) {
                  throw new Error("Could not determine image dimensions");
                }

                // Determine MIME type based on format
                const mimeTypeMap: Record<string, string> = {
                  jpeg: "image/jpeg",
                  png: "image/png",
                  webp: "image/webp",
                  gif: "image/gif",
                  tiff: "image/tiff",
                  svg: "image/svg+xml",
                };

                return {
                  width: metadata.width,
                  height: metadata.height,
                  format: (metadata.format as ImageFormat) || "jpeg",
                  hasAlpha:
                    metadata.hasAlpha ||
                    metadata.format === "png" ||
                    metadata.format === "webp",
                  mimeType:
                    mimeTypeMap[metadata.format || "jpeg"] || "image/jpeg",
                  sizeBytes: buffer.length,
                  colorSpace: metadata.space || "sRGB",
                } as ImageMetadata;
              },
              catch: (error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                return new ImageDecodeError({
                  message: `Failed to read metadata: ${message}`,
                  cause: error instanceof Error ? error : undefined,
                });
              },
            });
          }),

        /**
         * Encode ImageData to buffer in specified format
         */
        encode: (
          image: ImageData,
          format: ImageFormat,
          options?: EncodeOptions
        ) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: async () => {
                // Create Sharp image from raw buffer
                let sharpImage = sharp(image.data, {
                  raw: {
                    width: image.width,
                    height: image.height,
                    channels: 4, // Our internal format is always RGBA
                  },
                });

                // Apply format-specific encoding
                switch (format) {
                  case "jpeg":
                    sharpImage = sharpImage.jpeg({
                      quality: options?.quality ?? 80,
                      progressive: options?.progressive ?? false,
                      mozjpeg: true, // Better quality
                    });
                    break;

                  case "png":
                    sharpImage = sharpImage.png({
                      quality: options?.quality,
                      progressive: options?.progressive ?? true,
                    });
                    break;

                  case "webp":
                    sharpImage = sharpImage.webp({
                      quality: options?.quality ?? 80,
                      lossless: options?.lossless ?? false,
                    });
                    break;

                  default:
                    throw new Error(`Unsupported format: ${format}`);
                }

                return await sharpImage.toBuffer();
              },
              catch: (error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                return new ImageEncodeError({
                  message: `Failed to encode to ${format}: ${message}`,
                  targetFormat: format,
                  cause: error instanceof Error ? error : undefined,
                });
              },
            });
          }),

        /**
         * Resize image to specified dimensions
         */
        resize: (
          image: ImageData,
          width: number,
          height: number,
          options?: ResizeOptions
        ) =>
          Effect.gen(function* () {
            if (!Number.isFinite(width) || !Number.isFinite(height)) {
              return yield* Effect.fail(
                new ImageProcessError({
                  message: "Invalid dimensions for resize",
                  operation: "resize",
                })
              );
            }

            return yield* Effect.tryPromise({
              try: async () => {
                const fit = options?.fit ?? "cover";

                const resized = await sharp(image.data, {
                  raw: {
                    width: image.width,
                    height: image.height,
                    channels: 4,
                  },
                })
                  .resize(width, height, {
                    fit: fit as any, // Sharp's fit matches our type
                    position: "center",
                  })
                  .ensureAlpha()
                  .raw()
                  .toBuffer({ resolveWithObject: true });

                return {
                  width: width,
                  height: height,
                  channels: 4,
                  format: image.format,
                  data: resized.data,
                } as ImageData;
              },
              catch: (error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                return new ImageProcessError({
                  message: `Failed to resize image: ${message}`,
                  operation: "resize",
                  cause: error instanceof Error ? error : undefined,
                });
              },
            });
          }),

        /**
         * Crop image to specified region
         */
        crop: (image: ImageData, options: CropOptions) =>
          Effect.gen(function* () {
            // Validate crop region is within bounds
            if (
              options.left + options.width > image.width ||
              options.top + options.height > image.height
            ) {
              return yield* Effect.fail(
                new ImageProcessError({
                  message: "Crop region exceeds image bounds",
                  operation: "crop",
                })
              );
            }

            return yield* Effect.tryPromise({
              try: async () => {
                const cropped = await sharp(image.data, {
                  raw: {
                    width: image.width,
                    height: image.height,
                    channels: 4,
                  },
                })
                  .extract({
                    left: Math.floor(options.left),
                    top: Math.floor(options.top),
                    width: Math.floor(options.width),
                    height: Math.floor(options.height),
                  })
                  .ensureAlpha()
                  .raw()
                  .toBuffer({ resolveWithObject: true });

                return {
                  width: options.width,
                  height: options.height,
                  channels: 4,
                  format: image.format,
                  data: cropped.data,
                } as ImageData;
              },
              catch: (error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                return new ImageProcessError({
                  message: `Failed to crop image: ${message}`,
                  operation: "crop",
                  cause: error instanceof Error ? error : undefined,
                });
              },
            });
          }),

        /**
         * Convert image to grayscale
         */
        toGrayscale: (image: ImageData) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: async () => {
                const grayscale = await sharp(image.data, {
                  raw: {
                    width: image.width,
                    height: image.height,
                    channels: 4,
                  },
                })
                  .grayscale()
                  .ensureAlpha()
                  .raw()
                  .toBuffer({ resolveWithObject: true });

                return {
                  width: image.width,
                  height: image.height,
                  channels: 4,
                  format: image.format,
                  data: grayscale.data,
                } as ImageData;
              },
              catch: (error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                return new ImageProcessError({
                  message: `Failed to convert to grayscale: ${message}`,
                  operation: "toGrayscale",
                  cause: error instanceof Error ? error : undefined,
                });
              },
            });
          }),

        /**
         * Rotate image
         */
        rotate: (image: ImageData, angle: number) =>
          Effect.gen(function* () {
            if (!Number.isFinite(angle)) {
              return yield* Effect.fail(
                new ImageProcessError({
                  message: "Invalid rotation angle",
                  operation: "rotate",
                })
              );
            }

            return yield* Effect.tryPromise({
              try: async () => {
                // Normalize angle to 0-360
                const normalizedAngle = ((angle % 360) + 360) % 360;

                const rotated = await sharp(image.data, {
                  raw: {
                    width: image.width,
                    height: image.height,
                    channels: 4,
                  },
                })
                  .rotate(normalizedAngle)
                  .ensureAlpha()
                  .raw()
                  .toBuffer({ resolveWithObject: true });

                // Note: rotation may change dimensions for non-90-degree angles
                // For simplicity, we keep original dimensions
                return {
                  width: image.width,
                  height: image.height,
                  channels: 4,
                  format: image.format,
                  data: rotated.data,
                } as ImageData;
              },
              catch: (error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                return new ImageProcessError({
                  message: `Failed to rotate image: ${message}`,
                  operation: "rotate",
                  cause: error instanceof Error ? error : undefined,
                });
              },
            });
          }),

        /**
         * Flip image horizontally
         */
        flipHorizontal: (image: ImageData) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: async () => {
                const flipped = await sharp(image.data, {
                  raw: {
                    width: image.width,
                    height: image.height,
                    channels: 4,
                  },
                })
                  .flop()
                  .ensureAlpha()
                  .raw()
                  .toBuffer({ resolveWithObject: true });

                return {
                  width: image.width,
                  height: image.height,
                  channels: 4,
                  format: image.format,
                  data: flipped.data,
                } as ImageData;
              },
              catch: (error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                return new ImageProcessError({
                  message: `Failed to flip image horizontally: ${message}`,
                  operation: "flipHorizontal",
                  cause: error instanceof Error ? error : undefined,
                });
              },
            });
          }),

        /**
         * Flip image vertically
         */
        flipVertical: (image: ImageData) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: async () => {
                const flipped = await sharp(image.data, {
                  raw: {
                    width: image.width,
                    height: image.height,
                    channels: 4,
                  },
                })
                  .flip()
                  .ensureAlpha()
                  .raw()
                  .toBuffer({ resolveWithObject: true });

                return {
                  width: image.width,
                  height: image.height,
                  channels: 4,
                  format: image.format,
                  data: flipped.data,
                } as ImageData;
              },
              catch: (error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                return new ImageProcessError({
                  message: `Failed to flip image vertically: ${message}`,
                  operation: "flipVertical",
                  cause: error instanceof Error ? error : undefined,
                });
              },
            });
          }),
      } satisfies ImageBackend;
    }),
  }
) {}

/**
 * Default Sharp Backend Layer
 *
 * Provides SharpBackend implementation for Effect.provide
 */
export const SharpBackendLayer = SharpBackend.Default;
