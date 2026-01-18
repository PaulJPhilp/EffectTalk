/**
 * Tensor Conversion Utilities for ML Preprocessing
 *
 * Provides functions to convert between ImageData and tensor formats.
 *
 * @module utils/tensor
 */

import type { ImageData, NormalizeOptions, TensorData } from "../types.js";
import { InvalidInputError } from "../errors.js";
import { Effect } from "effect";

/**
 * Convert ImageData to normalized tensor (HWC format)
 *
 * Converts RGBA buffer to Float32Array in [Height, Width, Channels] format.
 * Values are normalized to 0-1 range by default.
 *
 * @param image - The image to convert
 * @param channels - Number of channels to include (3=RGB, 4=RGBA)
 * @returns TensorData with normalized values
 * @example
 * ```typescript
 * const tensor = imageTensorFromData(imageData, 3)
 * // tensor.shape = [height, width, 3]
 * // tensor.data = Float32Array with values in 0-1 range
 * ```
 */
export const imageTensorFromData = (
  image: ImageData,
  channels: 3 | 4 = 3
): TensorData => {
  const { width, height, data } = image;
  const tensorSize = height * width * channels;
  const tensorData = new Float32Array(tensorSize);

  // Convert RGBA buffer to tensor
  // Input: 4 bytes per pixel (RGBA)
  // Output: 3 or 4 values per pixel in tensor
  let tensorIdx = 0;

  for (let i = 0; i < data.length; i += 4) {
    // Normalize to 0-1 by dividing by 255
    tensorData[tensorIdx++] = data[i]! / 255; // R
    tensorData[tensorIdx++] = data[i + 1]! / 255; // G
    tensorData[tensorIdx++] = data[i + 2]! / 255; // B

    if (channels === 4) {
      tensorData[tensorIdx++] = data[i + 3]! / 255; // A
    }
  }

  return {
    shape: [height, width, channels] as const,
    data: tensorData,
  };
};

/**
 * Convert tensor to ImageData
 *
 * Converts Float32Array tensor back to RGBA ImageData.
 * Input tensor should be in [Height, Width, Channels] format with values in 0-1 range.
 *
 * @param tensor - Input tensor data
 * @param width - Width of the image
 * @param height - Height of the image
 * @param format - Image format for the result
 * @returns ImageData with RGBA buffer
 * @example
 * ```typescript
 * const imageData = tensorToImageData(tensorData, 224, 224, "png")
 * ```
 */
export const tensorToImageData = (
  tensor: { readonly data: Float32Array; readonly shape: readonly number[] },
  width: number,
  height: number,
  format: "jpeg" | "png" | "webp" = "jpeg"
): Effect.Effect<ImageData, InvalidInputError> =>
  Effect.gen(function* () {
    const [h, w, c] = tensor.shape;

    // Validate tensor dimensions
    if (h !== height || w !== width) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: `Tensor shape [${h}, ${w}, ${c}] does not match image dimensions ${width}x${height}`,
          parameter: "tensor",
          receivedValue: tensor.shape,
        })
      );
    }

    if (c !== 3 && c !== 4) {
      return yield* Effect.fail(
        new InvalidInputError({
          message: `Invalid number of channels: ${c} (expected 3 or 4)`,
          parameter: "tensor.shape[2]",
          receivedValue: c,
        })
      );
    }

    // Allocate RGBA buffer
    const buffer = Buffer.alloc(height * width * 4);
    let bufferIdx = 0;
    let tensorIdx = 0;

    // Convert tensor values back to 0-255 range
    for (let i = 0; i < height * width; i++) {
      // Clamp values to 0-1 range before converting
      buffer[bufferIdx++] = Math.round(
        Math.max(0, Math.min(1, tensor.data[tensorIdx++]!)) * 255
      ); // R
      buffer[bufferIdx++] = Math.round(
        Math.max(0, Math.min(1, tensor.data[tensorIdx++]!)) * 255
      ); // G
      buffer[bufferIdx++] = Math.round(
        Math.max(0, Math.min(1, tensor.data[tensorIdx++]!)) * 255
      ); // B

      if (c === 4) {
        buffer[bufferIdx++] = Math.round(
          Math.max(0, Math.min(1, tensor.data[tensorIdx++]!)) * 255
        ); // A
      } else {
        buffer[bufferIdx++] = 255; // Full opacity
      }
    }

    return {
      width,
      height,
      channels: 4,
      format,
      data: buffer,
    } as ImageData;
  });

/**
 * Apply normalization to tensor data
 *
 * Performs standard normalization: (value - mean) / std
 *
 * @param tensor - Input tensor
 * @param options - Normalization parameters (mean and std)
 * @returns New tensor with normalized values
 * @example
 * ```typescript
 * // ImageNet normalization
 * const normalized = normalizeTensor(tensor, {
 *   mean: [0.485, 0.456, 0.406],
 *   std: [0.229, 0.224, 0.225]
 * })
 * ```
 */
export const normalizeTensor = (
  tensor: TensorData,
  options: NormalizeOptions
): TensorData => {
  const { mean = [0], std = [1] } = options;
  const [height, width, channels] = tensor.shape;

  const normalized = new Float32Array(tensor.data.length);

  // Apply normalization per channel
  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      for (let c = 0; c < channels; c++) {
        const idx = (h * width + w) * channels + c;
        const value = tensor.data[idx]!;
        const m = mean[c] ?? 0;
        const s = std[c] ?? 1;

        normalized[idx] = (value - m) / s;
      }
    }
  }

  return {
    shape: tensor.shape,
    data: normalized,
  };
};

/**
 * Denormalize tensor after processing
 *
 * Reverses standard normalization: value * std + mean
 *
 * @param tensor - Normalized tensor
 * @param options - Normalization parameters (same as used for normalization)
 * @returns Tensor with values in original range
 */
export const denormalizeTensor = (
  tensor: TensorData,
  options: NormalizeOptions
): TensorData => {
  const { mean = [0], std = [1] } = options;
  const [height, width, channels] = tensor.shape;

  const denormalized = new Float32Array(tensor.data.length);

  // Apply denormalization per channel
  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      for (let c = 0; c < channels; c++) {
        const idx = (h * width + w) * channels + c;
        const value = tensor.data[idx]!;
        const m = mean[c] ?? 0;
        const s = std[c] ?? 1;

        denormalized[idx] = value * s + m;
      }
    }
  }

  return {
    shape: tensor.shape,
    data: denormalized,
  };
};

/**
 * Reshape tensor from CHW to HWC format (PyTorch to TensorFlow)
 *
 * Converts from Channels-Height-Width to Height-Width-Channels.
 * Useful for model interchange between frameworks.
 *
 * @param tensor - Tensor in CHW format
 * @param height - Image height
 * @param width - Image width
 * @returns Tensor in HWC format
 * @example
 * ```typescript
 * // Convert PyTorch CHW to TensorFlow HWC
 * const chwTensor = { shape: [3, 224, 224], data: chwData }
 * const hwcTensor = reshapeCHWtoHWC(chwTensor, 224, 224)
 * ```
 */
export const reshapeCHWtoHWC = (
  tensor: { readonly data: Float32Array; readonly shape: readonly number[] },
  height: number,
  width: number
): TensorData => {
  const [c, h, w] = tensor.shape as [number, number, number];

  if (h !== height || w !== width) {
    throw new Error(
      `Tensor shape [${h}, ${w}] does not match provided dimensions ${width}x${height}`
    );
  }

  const hwc = new Float32Array(c * h * w);

  // Reshape from CHW to HWC
  for (let ch = 0; ch < c; ch++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const chw_idx = ch * h * w + y * w + x;
        const hwc_idx = (y * w + x) * c + ch;
        hwc[hwc_idx] = tensor.data[chw_idx]!;
      }
    }
  }

  return {
    shape: [height, width, c] as const,
    data: hwc,
  };
};

/**
 * Reshape tensor from HWC to CHW format (TensorFlow to PyTorch)
 *
 * Converts from Height-Width-Channels to Channels-Height-Width.
 *
 * @param tensor - Tensor in HWC format
 * @param height - Image height
 * @param width - Image width
 * @returns Tensor in CHW format
 */
export const reshapeHWCtoCHW = (
  tensor: { readonly data: Float32Array; readonly shape: readonly number[] },
  height: number,
  width: number
): TensorData => {
  const [h, w, c] = tensor.shape as [number, number, number];

  if (h !== height || w !== width) {
    throw new Error(
      `Tensor shape [${h}, ${w}] does not match provided dimensions ${width}x${height}`
    );
  }

  const chw = new Float32Array(c * h * w);

  // Reshape from HWC to CHW
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let ch = 0; ch < c; ch++) {
        const hwc_idx = (y * w + x) * c + ch;
        const chw_idx = ch * h * w + y * w + x;
        chw[chw_idx] = tensor.data[hwc_idx]!;
      }
    }
  }

  return {
    shape: [c, height, width] as const,
    data: chw,
  };
};
