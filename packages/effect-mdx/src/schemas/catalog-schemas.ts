/**
 * Catalog Schema Definitions
 *
 * This module provides schema definitions for validating MDX catalog data.
 * Catalogs are persisted as JSON files and must conform to these schemas.
 */

import { Schema } from "effect";
import { PatternSchema, EnrichedPatternSchema } from "../catalog-types.js";

/**
 * Schema for the complete catalog structure
 *
 * This matches the output of the ingestPatterns function and is used to
 * validate catalog.json files before loading them.
 */
export const CatalogSchema = Schema.Struct({
  patterns: Schema.Array(PatternSchema),
  enrichedPatterns: Schema.Record({
    key: Schema.String,
    value: EnrichedPatternSchema,
  }),
  generatedAt: Schema.String,
});

/**
 * Type-safe catalog type inferred from schema
 */
export type Catalog = Schema.Schema.Type<typeof CatalogSchema>;
