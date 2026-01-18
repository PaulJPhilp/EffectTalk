/**
 * Effect.Schema definitions for artifact types
 * Provides runtime validation and transformation
 */

import { Schema } from "effect";
import type {
  Artifact,
  ArtifactMetadata,
  ArtifactQueryOptions,
  ArtifactType,
  ArtifactVersionDiff,
  ModelInfo,
  RenderingHints,
} from "./types.js";

// ============================================================================
// Atomic Schemas
// ============================================================================

export const ArtifactCategorySchema = Schema.Literal(
  "code",
  "document",
  "diagram",
  "data",
  "media",
  "markup",
  "configuration"
);

export const ModelInfoSchema: Schema.Schema<ModelInfo> = Schema.Struct({
  provider: Schema.String,
  model: Schema.String,
  timestamp: Schema.DateFromSelf,
});

// ============================================================================
// ArtifactType Discriminated Union Schemas
// ============================================================================

const CodeTypeSchema = Schema.Struct({
  category: Schema.Literal("code"),
  language: Schema.String,
  framework: Schema.optional(Schema.String),
});

const DocumentTypeSchema = Schema.Struct({
  category: Schema.Literal("document"),
  format: Schema.Literal("markdown", "plaintext", "html"),
});

const DiagramTypeSchema = Schema.Struct({
  category: Schema.Literal("diagram"),
  diagramType: Schema.Literal("mermaid", "plantuml", "svg", "dot"),
});

const DataTypeSchema = Schema.Struct({
  category: Schema.Literal("data"),
  dataFormat: Schema.Literal("json", "csv", "yaml", "toml", "xml"),
});

const MediaTypeSchema = Schema.Struct({
  category: Schema.Literal("media"),
  mediaType: Schema.Literal("image", "audio"),
  mimeType: Schema.String,
  encoding: Schema.Literal("base64"),
});

const MarkupTypeSchema = Schema.Struct({
  category: Schema.Literal("markup"),
  markupType: Schema.Literal("html", "xml", "jsx", "tsx"),
});

const ConfigurationTypeSchema = Schema.Struct({
  category: Schema.Literal("configuration"),
  configType: Schema.String,
});

export const ArtifactTypeSchema: Schema.Schema<ArtifactType> = Schema.Union(
  CodeTypeSchema,
  DocumentTypeSchema,
  DiagramTypeSchema,
  DataTypeSchema,
  MediaTypeSchema,
  MarkupTypeSchema,
  ConfigurationTypeSchema
);

// ============================================================================
// RenderingHints Schema
// ============================================================================

export const RenderingHintsSchema: Schema.Schema<RenderingHints> =
  Schema.Struct({
    syntaxHighlighting: Schema.optional(Schema.Boolean),
    lineNumbers: Schema.optional(Schema.Boolean),
    theme: Schema.optional(Schema.Literal("light", "dark", "auto")),
    collapsible: Schema.optional(Schema.Boolean),
    maxHeight: Schema.optional(Schema.Number),
    readOnly: Schema.optional(Schema.Boolean),
    diffView: Schema.optional(Schema.Boolean),
    executionEnabled: Schema.optional(Schema.Boolean),
  });

// ============================================================================
// ArtifactMetadata Schema
// ============================================================================

export const ArtifactMetadataSchema: Schema.Schema<ArtifactMetadata> =
  Schema.Struct({
    version: Schema.String,
    created: Schema.DateFromSelf,
    updated: Schema.DateFromSelf,
    author: Schema.optional(Schema.String),
    title: Schema.String,
    description: Schema.optional(Schema.String),
    tags: Schema.Array(Schema.String),
    parentVersion: Schema.optional(Schema.String),
    generatedBy: Schema.optional(Schema.Literal("ai", "human", "mixed")),
    modelInfo: Schema.optional(ModelInfoSchema),
  });

// ============================================================================
// Artifact Schema
// ============================================================================

export const ArtifactSchema: Schema.Schema<Artifact> = Schema.Struct({
  id: Schema.String,
  type: ArtifactTypeSchema,
  content: Schema.String,
  metadata: ArtifactMetadataSchema,
  renderingHints: Schema.optional(RenderingHintsSchema),
});

// ============================================================================
// ArtifactVersionDiff Schema
// ============================================================================

export const ArtifactVersionDiffSchema: Schema.Schema<ArtifactVersionDiff> =
  Schema.Struct({
    oldVersion: ArtifactSchema,
    newVersion: ArtifactSchema,
    changes: Schema.Struct({
      contentChanged: Schema.Boolean,
      metadataChanged: Schema.Boolean,
      typeChanged: Schema.Boolean,
      diff: Schema.String,
    }),
  });

// ============================================================================
// ArtifactQueryOptions Schema
// ============================================================================

export const ArtifactQueryOptionsSchema: Schema.Schema<ArtifactQueryOptions> =
  Schema.Struct({
    category: Schema.optional(ArtifactCategorySchema),
    tags: Schema.optional(Schema.Array(Schema.String)),
    authorPattern: Schema.optional(Schema.String),
    generatedBy: Schema.optional(Schema.Literal("ai", "human", "mixed")),
    afterDate: Schema.optional(Schema.DateFromSelf),
    beforeDate: Schema.optional(Schema.DateFromSelf),
  });
