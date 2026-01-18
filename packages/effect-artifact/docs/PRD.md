# Product Requirement Document: effect-artifact

## 1. Executive Summary
**effect-artifact** is a production-grade, Effect-TS native library for managing AI-generated artifacts. It provides type-safe extraction, versioning, metadata management, and pluggable storage backends for structured content like code, diagrams, JSON, and documents.

**The Core Promise:** "Structured AI Output as Managed Assets."
AI responses often contain valuable structured data (artifacts) that need to be extracted, validated, versioned, and persisted independently of the raw chat history. effect-artifact treats these as first-class entities with a clear lifecycle.

## 2. Design Philosophy
- **Zero any:** All artifact data and metadata validated via @effect/schema.
- **Location Transparency:** Uniform API for artifacts stored locally (filesystem) or remotely (GCS/S3).
- **Versioning by Default:** Every update creates a new version with parent tracking and diff support.
- **Type-First Extraction:** Automatic detection of programming languages and artifact categories from raw text.

## 3. Functional Specifications

### 3.1. Domain Models
- **Artifact:** The core entity containing content, type info, and metadata.
- **ArtifactType:** Discriminated union of categories (code, diagram, data, document, etc.).
- **ArtifactMetadata:** System and user-defined fields (version, timestamps, author, tags).
- **ArtifactVersionDiff:** Structured comparison between two versions.

### 3.2. Extraction (The "Ingest" Path)
- **extractArtifactsFromString:** Parse raw AI responses and identify code blocks, Mermaid diagrams, SVG, and JSON.
- **extractArtifactsFromResponse:** Helper for integration with effect-models / Vercel AI SDK.

### 3.3. Artifact Service (The "Storage" Path)
- **create:** Create a new artifact with automatic type detection and initial v1.0.0.
- **get:** Retrieve a specific version or the latest version of an artifact.
- **update:** Create a new version of an existing artifact with parent tracking.
- **delete:** Remove all versions of an artifact.
- **list:** Filter artifacts by category, tags, author, and date range.
- **getVersionHistory:** Retrieve the complete lineage of an artifact.
- **diff:** Generate a structured diff between any two versions.

### 3.4. Type Detection
- **Smart Language Detection:** Identify 15+ programming languages from syntax.
- **Format Detection:** Recognize JSON, YAML, TOML, XML, CSV.
- **Diagram Recognition:** Support Mermaid, PlantUML, SVG, DOT.

## 4. Pluggable Backends
The library must support multiple storage strategies:
- **InMemory:** For ephemeral usage and testing.
- **FileSystem:** For local persistent storage.
- **GCS/S3 (Future):** For cloud-scale artifact management.

## 5. Developer Experience (DX) Requirements
- **Effect-Native:** All methods return Effect<T, E> for composable error handling.
- **Strict TypeScript:** 100% type safety with strict null checks.
- **Fluent API:** Clean, intuitive methods for artifact manipulation.

## 6. Implementation Roadmap
1. **Phase 1 (Core):** Type definitions, Schemas, and Extraction logic.
2. **Phase 2 (Service):** InMemory implementation of ArtifactService.
3. **Phase 3 (Persistence):** FileSystem backend and multi-version storage.
4. **Phase 4 (Cloud):** GCS/S3 backend integration.
