/**
 * Effect Schema Definitions for Image Types
 *
 * Provides schema validation for core image types.
 * Used for type-safe operations and runtime validation.
 *
 * @module schemas
 */

import { Schema } from "effect";
import type {
  ImageData,
  ImageFormat,
  ImageMetadata,
  TensorData,
  ResizeOptions,
  CropOptions,
  EncodeOptions,
  NormalizeOptions,
  MLPreprocessConfig,
} from "./types.js";

/**
 * Schema for ImageFormat type
 */
export const ImageFormatSchema = Schema.Union(
  Schema.Literal("jpeg"),
  Schema.Literal("png"),
  Schema.Literal("webp")
);

/**
 * Schema for ImageData
 */
export const ImageDataSchema = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  channels: Schema.Union(Schema.Literal(3), Schema.Literal(4)),
  format: ImageFormatSchema,
  data: Schema.instanceOf(Buffer),
});

/**
 * Type inferred from ImageDataSchema
 */
export type ImageDataType = Schema.Schema.Type<typeof ImageDataSchema>;

/**
 * Schema for TensorData
 */
export const TensorDataSchema = Schema.Struct({
  shape: Schema.Tuple(Schema.Number, Schema.Number, Schema.Number),
  data: Schema.instanceOf(Float32Array),
});

/**
 * Type inferred from TensorDataSchema
 */
export type TensorDataType = Schema.Schema.Type<typeof TensorDataSchema>;

/**
 * Schema for ImageMetadata
 */
export const ImageMetadataSchema = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  format: ImageFormatSchema,
  colorSpace: Schema.optional(Schema.String),
  hasAlpha: Schema.optional(Schema.Boolean),
  isProgressive: Schema.optional(Schema.Boolean),
});

/**
 * Type inferred from ImageMetadataSchema
 */
export type ImageMetadataType = Schema.Schema.Type<typeof ImageMetadataSchema>;

/**
 * Schema for ResizeOptions
 */
export const ResizeOptionsSchema = Schema.Struct({
  width: Schema.optional(Schema.Number),
  height: Schema.optional(Schema.Number),
  fit: Schema.optional(
    Schema.Union(
      Schema.Literal("cover"),
      Schema.Literal("contain"),
      Schema.Literal("fill"),
      Schema.Literal("inside"),
      Schema.Literal("outside")
    )
  ),
  quality: Schema.optional(Schema.Number),
  progressive: Schema.optional(Schema.Boolean),
});

/**
 * Type inferred from ResizeOptionsSchema
 */
export type ResizeOptionsType = Schema.Schema.Type<typeof ResizeOptionsSchema>;

/**
 * Schema for CropOptions
 */
export const CropOptionsSchema = Schema.Struct({
  left: Schema.Number,
  top: Schema.Number,
  width: Schema.Number,
  height: Schema.Number,
});

/**
 * Type inferred from CropOptionsSchema
 */
export type CropOptionsType = Schema.Schema.Type<typeof CropOptionsSchema>;

/**
 * Schema for EncodeOptions
 */
export const EncodeOptionsSchema = Schema.Struct({
  format: Schema.optional(ImageFormatSchema),
  quality: Schema.optional(Schema.Number.pipe(Schema.between(0, 100))),
  progressive: Schema.optional(Schema.Boolean),
  lossless: Schema.optional(Schema.Boolean),
});

/**
 * Type inferred from EncodeOptionsSchema
 */
export type EncodeOptionsType = Schema.Schema.Type<typeof EncodeOptionsSchema>;

/**
 * Schema for NormalizeOptions
 */
export const NormalizeOptionsSchema = Schema.Struct({
  mean: Schema.optional(Schema.Array(Schema.Number)),
  std: Schema.optional(Schema.Array(Schema.Number)),
});

/**
 * Type inferred from NormalizeOptionsSchema
 */
export type NormalizeOptionsType = Schema.Schema.Type<
  typeof NormalizeOptionsSchema
>;

/**
 * Schema for MLPreprocessConfig
 */
export const MLPreprocessConfigSchema = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  fit: Schema.optional(
    Schema.Union(
      Schema.Literal("cover"),
      Schema.Literal("contain"),
      Schema.Literal("fill")
    )
  ),
  normalize: Schema.optional(NormalizeOptionsSchema),
});

/**
 * Type inferred from MLPreprocessConfigSchema
 */
export type MLPreprocessConfigType = Schema.Schema.Type<
  typeof MLPreprocessConfigSchema
>;
