/**
 * Effect Schema definitions for repository types
 *
 * Provides schema validation for blob storage types
 *
 * @module schemas
 */

import { Schema } from "effect"
import type {
  BlobId,
  BlobMetadata,
  ListOptions,
  ListResult,
  SaveOptions,
} from "./types.js"

/**
 * Schema for BlobId type
 */
export const BlobIdSchema = Schema.String.pipe(Schema.minLength(1))

/**
 * Type inferred from BlobIdSchema
 */
export type BlobIdType = Schema.Schema.Type<typeof BlobIdSchema>

/**
 * Schema for BlobMetadata
 */
export const BlobMetadataSchema = Schema.Struct({
  id: BlobIdSchema,
  mimeType: Schema.String,
  sizeBytes: Schema.Number,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
  customMetadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
})

/**
 * Type inferred from BlobMetadataSchema
 */
export type BlobMetadataType = Schema.Schema.Type<typeof BlobMetadataSchema>

/**
 * Schema for SaveOptions
 */
export const SaveOptionsSchema = Schema.Struct({
  id: Schema.optional(BlobIdSchema),
  customMetadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
  overwrite: Schema.optional(Schema.Boolean),
})

/**
 * Type inferred from SaveOptionsSchema
 */
export type SaveOptionsType = Schema.Schema.Type<typeof SaveOptionsSchema>

/**
 * Schema for ListOptions
 */
export const ListOptionsSchema = Schema.Struct({
  limit: Schema.optional(Schema.Number.pipe(Schema.positive())),
  cursor: Schema.optional(Schema.String),
  mimeTypePrefix: Schema.optional(Schema.String),
})

/**
 * Type inferred from ListOptionsSchema
 */
export type ListOptionsType = Schema.Schema.Type<typeof ListOptionsSchema>

/**
 * Schema for ListResult
 */
export const ListResultSchema = Schema.Struct({
  items: Schema.Array(BlobMetadataSchema),
  nextCursor: Schema.optional(Schema.String),
  totalCount: Schema.optional(Schema.Number),
})

/**
 * Type inferred from ListResultSchema
 */
export type ListResultType = Schema.Schema.Type<typeof ListResultSchema>
