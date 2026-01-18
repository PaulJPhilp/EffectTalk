/**
 * TypeDetectionService - Detects artifact types from content
 * Pure logic service with no external dependencies
 */

import { Effect } from "effect";
import { InvalidArtifactTypeError } from "../errors.js";
import type { ArtifactType } from "../types.js";

// ============================================================================
// Regex Patterns
// ============================================================================

const CODE_BLOCK_REGEX = /^```(\w+)?/;

// ============================================================================
// Service API Interface
// ============================================================================

export interface TypeDetectionServiceSchema {
  readonly detectType: (
    content: string,
    hints?: {
      readonly filename?: string;
      readonly mimeType?: string;
    }
  ) => Effect.Effect<ArtifactType, InvalidArtifactTypeError>;

  readonly detectLanguage: (content: string) => Effect.Effect<string, never>;
}

// ============================================================================
// Implementation
// ============================================================================

export class TypeDetectionService extends Effect.Service<TypeDetectionService>()(
  "TypeDetectionService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Type detection requires checking many language patterns
      const detectLanguage = (content: string): string => {
        // TypeScript/JavaScript
        if (
          content.includes("interface") &&
          content.includes("type") &&
          (content.includes("{") || content.includes(":"))
        ) {
          return "typescript";
        }

        // Python
        if (
          content.includes("def ") ||
          content.includes("class ") ||
          content.includes("import ") ||
          content.includes("from ")
        ) {
          return "python";
        }

        // Rust
        if (
          (content.includes("fn ") || content.includes("struct ")) &&
          content.includes("{")
        ) {
          return "rust";
        }

        // Go
        if (content.includes("package ") && content.includes("func ")) {
          return "go";
        }

        // Java
        if (
          (content.includes("public ") || content.includes("class ")) &&
          content.includes("{")
        ) {
          return "java";
        }

        // C/C++
        if (content.includes("#include") || content.includes("int main")) {
          return "cpp";
        }

        // C#
        if (
          content.includes("using ") &&
          (content.includes("namespace ") || content.includes("class "))
        ) {
          return "csharp";
        }

        // Ruby
        if (content.includes("def ") || content.includes(".each")) {
          return "ruby";
        }

        // PHP
        if (content.includes("<?php") || content.includes("function ")) {
          return "php";
        }

        // Shell script
        if (content.startsWith("#!/")) {
          return "shell";
        }

        // SQL
        if (
          content.includes("SELECT ") ||
          content.includes("INSERT ") ||
          content.includes("UPDATE ") ||
          content.includes("DELETE ")
        ) {
          return "sql";
        }

        // JavaScript
        if (
          content.includes("function") ||
          content.includes("const ") ||
          content.includes("let ") ||
          content.includes("var ")
        ) {
          return "javascript";
        }

        return "text";
      };

      const detectFromExtension = (
        filename: string
      ): ArtifactType | undefined => {
        const ext = filename.split(".").pop()?.toLowerCase();

        if (!ext) return undefined;

        switch (ext) {
          case "ts":
            return { category: "code", language: "typescript" };
          case "tsx":
            return { category: "markup", markupType: "tsx" };
          case "js":
            return { category: "code", language: "javascript" };
          case "jsx":
            return { category: "markup", markupType: "jsx" };
          case "py":
            return { category: "code", language: "python" };
          case "rs":
            return { category: "code", language: "rust" };
          case "go":
            return { category: "code", language: "go" };
          case "java":
            return { category: "code", language: "java" };
          case "cpp":
          case "cc":
          case "cxx":
          case "c":
            return { category: "code", language: "cpp" };
          case "cs":
            return { category: "code", language: "csharp" };
          case "rb":
            return { category: "code", language: "ruby" };
          case "php":
            return { category: "code", language: "php" };
          case "sh":
          case "bash":
            return { category: "code", language: "shell" };
          case "sql":
            return { category: "code", language: "sql" };
          case "md":
          case "markdown":
            return { category: "document", format: "markdown" };
          case "txt":
            return { category: "document", format: "plaintext" };
          case "html":
            return { category: "markup", markupType: "html" };
          case "json":
            return { category: "data", dataFormat: "json" };
          case "csv":
            return { category: "data", dataFormat: "csv" };
          case "yaml":
          case "yml":
            return { category: "data", dataFormat: "yaml" };
          case "toml":
            return { category: "data", dataFormat: "toml" };
          case "xml":
            return { category: "data", dataFormat: "xml" };
          case "svg":
            return { category: "diagram", diagramType: "svg" };
          case "mmd":
            return { category: "diagram", diagramType: "mermaid" };
          default:
            return undefined;
        }
      };

      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: MIME type detection requires checking many format types
      const detectFromMimeType = (
        mimeType: string
      ): ArtifactType | undefined => {
        if (mimeType.startsWith("image/")) {
          return {
            category: "media",
            mediaType: "image",
            mimeType,
            encoding: "base64",
          };
        }

        if (mimeType.startsWith("audio/")) {
          return {
            category: "media",
            mediaType: "audio",
            mimeType,
            encoding: "base64",
          };
        }

        if (mimeType === "application/json" || mimeType === "text/json") {
          return { category: "data", dataFormat: "json" };
        }

        if (mimeType === "application/xml" || mimeType === "text/xml") {
          return { category: "data", dataFormat: "xml" };
        }

        if (mimeType === "text/markdown" || mimeType === "text/x-markdown") {
          return { category: "document", format: "markdown" };
        }

        if (mimeType === "text/plain") {
          return { category: "document", format: "plaintext" };
        }

        if (mimeType === "text/html") {
          return { category: "markup", markupType: "html" };
        }

        return undefined;
      };

      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Content type detection requires checking many format patterns
      const detectFromContent = (content: string): ArtifactType => {
        const trimmed = content.trim();

        // Code blocks
        if (trimmed.startsWith("```")) {
          const match = trimmed.match(CODE_BLOCK_REGEX);
          if (match) {
            const lang = match[1] || "text";
            return { category: "code", language: lang };
          }
        }

        // Mermaid diagrams
        if (trimmed.startsWith("```mermaid") || trimmed.startsWith("mermaid")) {
          return { category: "diagram", diagramType: "mermaid" };
        }

        // SVG
        if (trimmed.startsWith("<svg")) {
          return { category: "diagram", diagramType: "svg" };
        }

        // JSON
        if (
          (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
          (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
          try {
            JSON.parse(trimmed);
            return { category: "data", dataFormat: "json" };
          } catch {
            // Not valid JSON, continue
          }
        }

        // XML/HTML
        if (trimmed.startsWith("<")) {
          if (trimmed.startsWith("<?xml")) {
            return { category: "data", dataFormat: "xml" };
          }
          if (trimmed.startsWith("<html")) {
            return { category: "markup", markupType: "html" };
          }
          return { category: "markup", markupType: "xml" };
        }

        // YAML (basic detection)
        if (trimmed.includes(":") && !trimmed.startsWith("#")) {
          return { category: "data", dataFormat: "yaml" };
        }

        // CSV (basic detection)
        if (trimmed.includes(",") && trimmed.includes("\n")) {
          return { category: "data", dataFormat: "csv" };
        }

        // Detect code by language heuristics
        const language = detectLanguage(content);
        if (language !== "text") {
          return { category: "code", language };
        }

        // Default to plaintext document
        return { category: "document", format: "plaintext" };
      };

      const detectType = (
        content: string,
        hints?: {
          readonly filename?: string;
          readonly mimeType?: string;
        }
      ) =>
        Effect.sync(() => {
          // 1. Try filename extension first (highest priority)
          if (hints?.filename) {
            const typeFromFilename = detectFromExtension(hints.filename);
            if (typeFromFilename) {
              return typeFromFilename;
            }
          }

          // 2. Try MIME type
          if (hints?.mimeType) {
            const typeFromMime = detectFromMimeType(hints.mimeType);
            if (typeFromMime) {
              return typeFromMime;
            }
          }

          // 3. Detect from content patterns
          return detectFromContent(content);
        });

      return {
        detectType,
        detectLanguage: (content: string) =>
          Effect.sync(() => detectLanguage(content)),
      } satisfies TypeDetectionServiceSchema;
    }),
  }
) {}
