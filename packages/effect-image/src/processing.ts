/**
 * ML Image Preprocessing Operations
 *
 * Provides machine learning-specific image processing functions including
 * normalization, tensor conversion, and preprocessing pipelines.
 *
 * @module processing
 */

import { Effect } from "effect";
import type {
  ImageData,
  ImageFormat,
  MLPreprocessConfig,
  NormalizeOptions,
  TensorData,
} from "./types.js";
import { InvalidInputError, ImageOperationError } from "./errors.js";
import {
  imageTensorFromData,
  normalizeTensor,
  tensorToImageData,
  denormalizeTensor,
} from "./utils/tensor.js";
import { validateImageData, validateTensorData } from "./utils/validation.js";
import * as API from "./api.js";

/**
 * Normalize image data (pixel value statistics)
 *
 * Applies per-channel normalization using mean and standard deviation.
 * Useful before feeding images to ML models.
 *
 * **Normalization Formula**: `normalized = (pixel - mean) / std`
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to normalize
 * @param options - Normalization parameters (mean, std)
 * @returns Effect yielding ImageData with normalized values
 * @example
 * ```typescript
 * // ImageNet normalization
 * const normalized = await Effect.runPromise(
 *   normalize(imageData, {
 *     mean: [0.485, 0.456, 0.406],
 *     std: [0.229, 0.224, 0.225]
 *   })
 * )
 * ```
 */
export const normalize = (
  image: ImageData,
  options: NormalizeOptions
): Effect.Effect<ImageData, InvalidInputError> =>
  Effect.gen(function* () {
    // Validate input
    yield* validateImageData(image);

    // Convert to tensor for normalization
    const tensor = imageTensorFromData(image, 3);

    // Apply normalization
    const normalized = normalizeTensor(tensor, options);

    // Convert back to image
    return yield* tensorToImageData(
      normalized,
      image.width,
      image.height,
      image.format
    );
  });

/**
 * Convert image to tensor format
 *
 * Converts ImageData to Float32Array in [Height, Width, Channels] format
 * with values normalized to 0-1 range.
 *
 * **Tensor Format**: HWC (Height-Width-Channels)
 * - Shape: [height, width, channels]
 * - Values: Float32Array with values in 0-1 range
 * - Channels: 3 (RGB) or 4 (RGBA)
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to convert
 * @param channels - Number of channels (3=RGB, 4=RGBA)
 * @returns Effect yielding TensorData
 * @example
 * ```typescript
 * const tensor = await Effect.runPromise(
 *   toTensor(imageData, 3)
 * )
 * // tensor.shape = [height, width, 3]
 * // tensor.data = Float32Array
 * ```
 */
export const toTensor = (
  image: ImageData,
  channels: 3 | 4 = 3
): Effect.Effect<TensorData, InvalidInputError> =>
  Effect.gen(function* () {
    // Validate input
    yield* validateImageData(image);

    if (channels !== 3 && channels !== 4) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: "Channels must be 3 (RGB) or 4 (RGBA)",
          parameter: "channels",
          receivedValue: channels,
        })
      );
    }

    return imageTensorFromData(image, channels);
  });

/**
 * Convert tensor back to image
 *
 * Converts Float32Array tensor in HWC format back to ImageData.
 * Reverses the toTensor operation.
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param tensor - The tensor to convert
 * @param width - Image width (must match tensor shape[1])
 * @param height - Image height (must match tensor shape[0])
 * @param format - Target image format
 * @returns Effect yielding ImageData
 * @example
 * ```typescript
 * const imageData = await Effect.runPromise(
 *   fromTensor(tensorData, 224, 224, "jpeg")
 * )
 * ```
 */
export const fromTensor = (
  tensor: TensorData,
  width: number,
  height: number,
  format: ImageFormat = "jpeg"
): Effect.Effect<ImageData, InvalidInputError> =>
  Effect.gen(function* () {
    // Validate tensor
    yield* validateTensorData(tensor);

    return yield* tensorToImageData(
      {
        shape: tensor.shape,
        data: tensor.data,
      },
      width,
      height,
      format
    );
  });

/**
 * Complete ML preprocessing pipeline
 *
 * Combines resize, normalization, and tensor conversion in one operation.
 * Optimized for common ML model input requirements.
 *
 * **Default Behavior**:
 * - Resizes to target dimensions
 * - Converts to RGB (3 channels)
 * - Optionally applies normalization
 * - Returns as tensor in 0-1 range (or normalized)
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param image - The image to preprocess
 * @param config - ML preprocessing configuration
 * @returns Effect yielding preprocessed TensorData
 * @example
 * ```typescript
 * // ResNet-50 preprocessing
 * const tensor = await Effect.runPromise(
 *   mlPreprocess(imageData, {
 *     width: 224,
 *     height: 224,
 *     fit: "center",
 *     normalize: {
 *       mean: [0.485, 0.456, 0.406],
 *       std: [0.229, 0.224, 0.225]
 *     }
 *   })
 * )
 * ```
 */
export const mlPreprocess = (image: ImageData, config: MLPreprocessConfig) =>
  Effect.gen(function* () {
    // Step 1: Resize to target dimensions
    const resized = yield* API.resize(image, config.width, config.height, {
      fit: config.fit ?? "cover",
    });

    // Step 2: Convert to tensor
    const tensor = imageTensorFromData(resized, 3);

    // Step 3: Apply normalization if provided
    let processed = tensor;
    if (config.normalize) {
      processed = normalizeTensor(tensor, config.normalize);
    }

    return processed;
  });

/**
 * Compose multiple image operations into a pipeline
 *
 * Allows chaining multiple image transformations in sequence.
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param operations - Array of image transformation functions
 * @returns Function that takes ImageData and applies all operations
 * @example
 * ```typescript
 * const pipeline = compose(
 *   (img) => API.resize(img, 256, 256),
 *   (img) => API.toGrayscale(img),
 *   (img) => normalize(img, { mean: [0.5], std: [0.5] })
 * )
 *
 * const result = await Effect.runPromise(
 *   pipeline(imageData)
 * )
 * ```
 */
export const compose =
  <E1, E2>(
    ...operations: Array<
      (
        image: ImageData
      ) => Effect.Effect<ImageData, E1 | E2 | ImageOperationError>
    >
  ): ((
    image: ImageData
  ) => Effect.Effect<ImageData, E1 | E2 | ImageOperationError>) =>
  (image: ImageData) =>
    Effect.gen(function* () {
      let current = image;
      for (const operation of operations) {
        current = yield* operation(current);
      }
      return current;
    });

/**
 * Batch process multiple images
 *
 * Applies the same processing to multiple images.
 * Useful for preprocessing datasets.
 *
 * **Effect Requirements**: Requires SharpBackend to be provided
 *
 * @param images - Array of images to process
 * @param processor - Function to apply to each image
 * @returns Effect yielding array of processed images
 * @example
 * ```typescript
 * const processed = await Effect.runPromise(
 *   batchProcess(images, (img) =>
 *     mlPreprocess(img, { width: 224, height: 224 })
 *   )
 * )
 * ```
 */
export const batchProcess = <E>(
  images: ImageData[],
  processor: (
    image: ImageData
  ) => Effect.Effect<ImageData, E | ImageOperationError>
): Effect.Effect<ImageData[], E | ImageOperationError> =>
  Effect.gen(function* () {
    return yield* Effect.forEach(images, (image) => processor(image));
  });

/**
 * Denormalize tensor after model processing
 *
 * Reverses normalization applied during preprocessing.
 * Useful for displaying model outputs or visualizing processed images.
 *
 * @param tensor - Normalized tensor from preprocessing
 * @param options - Same normalization options used for preprocessing
 * @returns TensorData with denormalized values
 * @example
 * ```typescript
 * // Reverse ImageNet normalization
 * const denormalized = denormalizeTensor(modelOutput, {
 *   mean: [0.485, 0.456, 0.406],
 *   std: [0.229, 0.224, 0.225]
 * })
 * ```
 */
export const denormalize = (
  tensor: TensorData,
  options: NormalizeOptions
): TensorData => {
  return denormalizeTensor(tensor, options);
};

/**
 * Batch denormalize tensors
 *
 * Denormalizes multiple tensors with the same parameters.
 *
 * @param tensors - Array of tensors to denormalize
 * @param options - Normalization options used for preprocessing
 * @returns Array of denormalized tensors
 */
export const batchDenormalize = (
  tensors: TensorData[],
  options: NormalizeOptions
): TensorData[] => {
  return tensors.map((tensor) => denormalizeTensor(tensor, options));
};
