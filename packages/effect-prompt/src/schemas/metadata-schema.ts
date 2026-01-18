/**
 * Metadata Schema for Disk Serialization
 *
 * This schema is designed for parsing metadata from .meta.json files on disk.
 * It accepts string representations of dates and other JSON-compatible formats,
 * converting them to the proper types.
 */

import { Schema } from "effect";

/**
 * Schema for prompt metadata as stored in JSON files
 *
 * Dates are stored as ISO strings and converted to Date objects.
 * All fields are optional to support graceful degradation when loading
 * legacy or incomplete metadata files.
 */
export const PromptMetadataSchema = Schema.Struct({
	name: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	version: Schema.optional(Schema.String),
	created: Schema.optional(Schema.String),
	updated: Schema.optional(Schema.String),
	tags: Schema.optional(Schema.Array(Schema.String)),
	author: Schema.optional(Schema.String),
	extends: Schema.optional(Schema.String),
	maxTokens: Schema.optional(Schema.Number),
});

/**
 * Type-safe metadata type inferred from schema
 */
export type PromptMetadata = Schema.Schema.Type<typeof PromptMetadataSchema>;
