/**
 * Artifact category for high-level classification
 */
export type ArtifactCategory =
  | "code"
  | "document"
  | "diagram"
  | "data"
  | "media"
  | "markup"
  | "configuration";

/**
 * Specific artifact types with rendering hints
 * Uses discriminated union pattern for type safety
 */
export type ArtifactType =
  | {
      readonly category: "code";
      readonly language: string;
      readonly framework?: string | undefined;
    }
  | {
      readonly category: "document";
      readonly format: "markdown" | "plaintext" | "html";
    }
  | {
      readonly category: "diagram";
      readonly diagramType: "mermaid" | "plantuml" | "svg" | "dot";
    }
  | {
      readonly category: "data";
      readonly dataFormat: "json" | "csv" | "yaml" | "toml" | "xml";
    }
  | {
      readonly category: "media";
      readonly mediaType: "image" | "audio";
      readonly mimeType: string;
      readonly encoding: "base64";
    }
  | {
      readonly category: "media";
      readonly mediaType: "image" | "audio";
      readonly mimeType: string;
      readonly encoding: "base64";
    }
  | {
      readonly category: "markup";
      readonly markupType: "html" | "xml" | "jsx" | "tsx";
    }
  | { readonly category: "configuration"; readonly configType: string };

/**
 * Rendering hints for UI display
 */
export interface RenderingHints {
  readonly syntaxHighlighting?: boolean | undefined;
  readonly lineNumbers?: boolean | undefined;
  readonly theme?: "light" | "dark" | "auto" | undefined;
  readonly collapsible?: boolean | undefined;
  readonly maxHeight?: number | undefined;
  readonly readOnly?: boolean | undefined;
  readonly diffView?: boolean | undefined;
  readonly executionEnabled?: boolean | undefined;
}

/**
 * Model information for AI-generated artifacts
 */
export interface ModelInfo {
  readonly provider: string;
  readonly model: string;
  readonly timestamp: Date;
}

/**
 * Base artifact metadata
 */
export interface ArtifactMetadata {
  readonly version: string;
  readonly created: Date;
  readonly updated: Date;
  readonly author?: string | undefined;
  readonly title: string;
  readonly description?: string | undefined;
  readonly tags: readonly string[];
  readonly parentVersion?: string | undefined;
  readonly generatedBy?: "ai" | "human" | "mixed" | undefined;
  readonly modelInfo?: ModelInfo | undefined;
}

/**
 * Complete artifact with content and metadata
 */
export interface Artifact {
  readonly id: string;
  readonly type: ArtifactType;
  readonly content: string;
  readonly metadata: ArtifactMetadata;
  readonly renderingHints?: RenderingHints | undefined;
}

/**
 * Version comparison result
 */
export interface ArtifactVersionDiff {
  readonly oldVersion: Artifact;
  readonly newVersion: Artifact;
  readonly changes: {
    readonly contentChanged: boolean;
    readonly metadataChanged: boolean;
    readonly typeChanged: boolean;
    readonly diff: string;
  };
}

/**
 * Query options for listing artifacts
 */
export interface ArtifactQueryOptions {
  readonly category?: ArtifactCategory | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly authorPattern?: string | undefined;
  readonly generatedBy?: "ai" | "human" | "mixed" | undefined;
  readonly afterDate?: Date | undefined;
  readonly beforeDate?: Date | undefined;
}
