/**
 * Core Type Definitions for Image Processing
 *
 * This module provides the foundational types for image data representation,
 * tensor conversion, and image metadata.
 *
 * @module types
 */

/**
 * Supported image formats
 * - **jpeg**: JPEG/JPG format (lossy, wide browser support)
 * - **png**: PNG format (lossless, supports transparency)
 * - **webp**: WebP format (modern, smaller file sizes)
 */
export type ImageFormat = "jpeg" | "png" | "webp";

/**
 * Image fit strategies for resizing
 * - **cover**: Scale image to cover the target dimensions (may crop)
 * - **contain**: Scale image to fit within target dimensions (may have padding)
 * - **fill**: Stretch/squeeze to exactly match target dimensions
 */
export type ImageFit = "cover" | "contain" | "fill";

/**
 * Internal representation of decoded image data
 *
 * Contains raw pixel buffer and metadata needed for processing.
 * The buffer is in RGBA format (4 bytes per pixel), regardless of original format.
 */
export interface ImageData {
  /** Image width in pixels */
  readonly width: number;
  /** Image height in pixels */
  readonly height: number;
  /** Number of color channels: 3 (RGB) or 4 (RGBA with alpha) */
  readonly channels: 3 | 4;
  /** Original image format */
  readonly format: ImageFormat;
  /** Raw pixel data as Buffer (RGBA format) */
  readonly data: Buffer;
}

/**
 * Tensor representation for ML processing
 *
 * Float32 tensor in HWC (Height-Width-Channels) format.
 * Values are normalized to 0-1 range.
 */
export interface TensorData {
  /** Tensor shape as [Height, Width, Channels] */
  readonly shape: readonly [height: number, width: number, channels: number];
  /** Normalized pixel data (0-1 range) */
  readonly data: Float32Array;
}

/**
 * Image metadata for fast inspection
 *
 * Contains image properties without loading full pixel data.
 * Useful for validation and decision-making before decoding.
 */
export interface ImageMetadata {
  /** Image width in pixels */
  readonly width: number;
  /** Image height in pixels */
  readonly height: number;
  /** Image format (detected from header) */
  readonly format: ImageFormat;
  /** Whether image has transparency (alpha channel) */
  readonly hasAlpha: boolean;
  /** MIME type of the image */
  readonly mimeType: string;
  /** File size in bytes (if available) */
  readonly sizeBytes?: number;
  /** Color space (e.g., 'sRGB') */
  readonly colorSpace?: string;
}

/**
 * Options for image resizing
 */
export interface ResizeOptions {
  /** How to scale the image: 'cover', 'contain', or 'fill' */
  readonly fit?: ImageFit;
  /** Quality 0-100 (for lossy formats) */
  readonly quality?: number;
  /** Progressive encoding (for JPEG) */
  readonly progressive?: boolean;
}

/**
 * Options for image cropping
 */
export interface CropOptions {
  /** Left edge in pixels */
  readonly left: number;
  /** Top edge in pixels */
  readonly top: number;
  /** Width of crop region */
  readonly width: number;
  /** Height of crop region */
  readonly height: number;
}

/**
 * Options for image encoding
 */
export interface EncodeOptions {
  /** Quality 0-100 (applies to JPEG/WebP) */
  readonly quality?: number;
  /** Progressive JPEG encoding */
  readonly progressive?: boolean;
  /** WebP lossless mode */
  readonly lossless?: boolean;
}

/**
 * Options for image normalization (ML preprocessing)
 */
export interface NormalizeOptions {
  /** Mean values per channel for standard normalization (e.g., ImageNet: [0.485, 0.456, 0.406]) */
  readonly mean?: readonly number[];
  /** Standard deviation per channel (e.g., ImageNet: [0.229, 0.224, 0.225]) */
  readonly std?: readonly number[];
}

/**
 * Configuration for ML preprocessing pipelines
 */
export interface MLPreprocessConfig {
  /** Target width after resizing */
  readonly width: number;
  /** Target height after resizing */
  readonly height: number;
  /** Resize fit strategy */
  readonly fit?: ImageFit;
  /** Normalization options */
  readonly normalize?: NormalizeOptions;
}

/**
 * Dimension constraints for validation
 */
export interface DimensionConstraints {
  /** Minimum width in pixels (default: 1) */
  readonly minWidth?: number;
  /** Maximum width in pixels (default: 16384) */
  readonly maxWidth?: number;
  /** Minimum height in pixels (default: 1) */
  readonly minHeight?: number;
  /** Maximum height in pixels (default: 16384) */
  readonly maxHeight?: number;
}
