/**
 * effect-image - Type-safe Image Processing Library
 *
 * A comprehensive, Effect-native image processing library for ML/AI workflows.
 * Built on Sharp for high-performance image handling.
 *
 * @packageDocumentation
 * @module effect-image
 *
 * @example Basic Image Processing
 * ```typescript
 * import { decode, resize, encodeToFile, SharpBackendLayer } from "effect-image"
 * import { Effect } from "effect"
 * import { NodeFileSystem } from "@effect/platform-node"
 *
 * const process = Effect.gen(function* () {
 *   const image = yield* decode(jpegBuffer)
 *   const resized = yield* resize(image, 256, 256, { fit: "cover" })
 *   yield* encodeToFile(resized, "output.jpg", "jpeg", { quality: 90 })
 * })
 *
 * await Effect.runPromise(
 *   process.pipe(
 *     Effect.provide(SharpBackendLayer),
 *     Effect.provide(NodeFileSystem.layer)
 *   )
 * )
 * ```
 *
 * @example ML Preprocessing
 * ```typescript
 * import { mlPreprocess, SharpBackendLayer } from "effect-image"
 * import { Effect } from "effect"
 *
 * // ResNet-50 preprocessing
 * const tensor = await Effect.runPromise(
 *   mlPreprocess(imageData, {
 *     width: 224,
 *     height: 224,
 *     normalize: {
 *       mean: [0.485, 0.456, 0.406],
 *       std: [0.229, 0.224, 0.225]
 *     }
 *   }).pipe(Effect.provide(SharpBackendLayer))
 * )
 * ```
 */

// Core types
export type {
  ImageData,
  ImageFormat,
  ImageFit,
  TensorData,
  ImageMetadata,
  ResizeOptions,
  CropOptions,
  EncodeOptions,
  NormalizeOptions,
  MLPreprocessConfig,
  DimensionConstraints,
} from "./types.js";

// Error types
export {
  ImageDecodeError,
  ImageEncodeError,
  UnsupportedFormatError,
  ImageProcessError,
  InvalidDimensionsError,
  InvalidInputError,
  FileNotFoundError,
  FileIOError,
  MemoryError,
  BackendError,
  type RetryableImageError,
  type ImageOperationError,
} from "./errors.js";

// Schema definitions
export {
  ImageFormatSchema,
  ImageDataSchema,
  TensorDataSchema,
  ImageMetadataSchema,
  ResizeOptionsSchema,
  CropOptionsSchema,
  EncodeOptionsSchema,
  NormalizeOptionsSchema,
  MLPreprocessConfigSchema,
  type ImageDataType,
  type TensorDataType,
  type ImageMetadataType,
  type ResizeOptionsType,
  type CropOptionsType,
  type EncodeOptionsType,
  type NormalizeOptionsType,
  type MLPreprocessConfigType,
} from "./schemas.js";

// Backend exports
export type { ImageBackend } from "./backends/types.js";
export {
  SharpBackend,
  SharpBackendLayer,
} from "./backends/sharp.js";

// Core API - Read Operations
export { decode, decodeFromFile } from "./api.js";

// Core API - Metadata
export { getMetadata, getMetadataFromFile } from "./api.js";

// Core API - Write Operations
export { encode, encodeToFile, convert } from "./api.js";

// Core API - Image Transformations
export {
  resize,
  crop,
  toGrayscale,
  rotate,
  flipHorizontal,
  flipVertical,
} from "./api.js";

// ML Processing - Tensor Operations
export { toTensor, fromTensor } from "./processing.js";

// ML Processing - Normalization
export { normalize } from "./processing.js";

// ML Processing - Pipelines
export { mlPreprocess, compose, batchProcess } from "./processing.js";

// ML Processing - Denormalization
export { denormalize, batchDenormalize } from "./processing.js";

// Utility exports - Tensor utilities
export {
  imageTensorFromData,
  tensorToImageData,
  normalizeTensor,
  denormalizeTensor,
  reshapeCHWtoHWC,
  reshapeHWCtoCHW,
} from "./utils/tensor.js";

// Utility exports - Validation
export {
  validateFormat,
  validateDimensions,
  validateImageData,
  validateTensorData,
  detectImageFormat,
  validateQuality,
} from "./utils/validation.js";

/**
 * Supported image formats
 * @const
 */
export const SUPPORTED_FORMATS = ["jpeg", "png", "webp"] as const;

/**
 * Default maximum image dimension (16384 pixels)
 * @const
 */
export const MAX_DIMENSION = 16384;

/**
 * Default minimum image dimension (1 pixel)
 * @const
 */
export const MIN_DIMENSION = 1;
