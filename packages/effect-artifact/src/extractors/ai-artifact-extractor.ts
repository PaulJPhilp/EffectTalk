/**
 * AI Artifact Extractor - Extract artifacts from LLM responses
 * Parses ChatCompletionResponse and extracts structured artifacts
 */

import { Effect } from "effect";
import type { Artifact, ArtifactMetadata, ArtifactType } from "../types.js";

/**
 * Generic ChatCompletionResponse type for testing without depending on effect-models
 */
export type ChatCompletionResponse = {
  readonly id: string;
  readonly model: string;
  readonly choices?:
    | readonly {
        readonly message?:
          | {
              readonly role: string;
              readonly content?: string;
            }
          | undefined;
        readonly finishReason?: string | undefined;
      }[]
    | undefined;
};

// ============================================================================
// Helper Functions to Reduce Complexity
// ============================================================================

// Helper function to create artifact metadata
const createArtifactMetadata = (
  title: string,
  tags: readonly string[],
  now: Date,
  modelInfo?: { readonly provider: string; readonly model: string } | undefined
): ArtifactMetadata => ({
  version: "1.0.0",
  created: now,
  updated: now,
  title,
  tags,
  generatedBy: "ai",
  modelInfo: modelInfo ? { ...modelInfo, timestamp: now } : undefined,
});

// Helper function to create artifact
const createArtifact = (
  type: ArtifactType,
  content: string,
  metadata: ArtifactMetadata
): Artifact => ({
  id: crypto.randomUUID(),
  type,
  content,
  metadata,
});

// Extract code blocks from content
const extractCodeBlocks = (
  content: string,
  now: Date,
  modelInfo?: { readonly provider: string; readonly model: string } | undefined
): Artifact[] => {
  const artifacts: Artifact[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Regex.exec() requires assignment
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] ?? "text";
    const code = match[2]?.trim();

    if (code) {
      artifacts.push(
        createArtifact(
          { category: "code", language } as ArtifactType,
          code,
          createArtifactMetadata(
            `${language} code block`,
            ["ai-generated", language],
            now,
            modelInfo
          )
        )
      );
    }
  }

  return artifacts;
};

// Extract Mermaid diagrams from content
const extractMermaidDiagrams = (
  content: string,
  now: Date,
  modelInfo?: { readonly provider: string; readonly model: string } | undefined
): Artifact[] => {
  const artifacts: Artifact[] = [];
  const mermaidRegex = /```mermaid\n([\s\S]+?)```/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Regex.exec() requires assignment
  while ((match = mermaidRegex.exec(content)) !== null) {
    const diagramContent = match[1]?.trim();

    if (diagramContent) {
      artifacts.push(
        createArtifact(
          { category: "diagram", diagramType: "mermaid" } as ArtifactType,
          diagramContent,
          createArtifactMetadata(
            "Mermaid diagram",
            ["ai-generated", "mermaid"],
            now,
            modelInfo
          )
        )
      );
    }
  }

  return artifacts;
};

// Extract JSON code blocks from content
const extractJsonBlocks = (
  content: string,
  now: Date,
  modelInfo?: { readonly provider: string; readonly model: string } | undefined
): Artifact[] => {
  const artifacts: Artifact[] = [];
  const jsonRegex = /```json\n([\s\S]+?)```/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Regex.exec() requires assignment
  while ((match = jsonRegex.exec(content)) !== null) {
    const jsonContent = match[1]?.trim();

    if (jsonContent) {
      artifacts.push(
        createArtifact(
          { category: "data", dataFormat: "json" } as ArtifactType,
          jsonContent,
          createArtifactMetadata(
            "JSON data",
            ["ai-generated", "json"],
            now,
            modelInfo
          )
        )
      );
    }
  }

  return artifacts;
};

// Extract SVG diagrams from content
const extractSvgDiagrams = (
  content: string,
  now: Date,
  modelInfo?: { readonly provider: string; readonly model: string } | undefined
): Artifact[] => {
  const artifacts: Artifact[] = [];
  const svgRegex = /(<svg[\s\S]+?<\/svg>)/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Regex.exec() requires assignment
  while ((match = svgRegex.exec(content)) !== null) {
    const svgContent = match[1]?.trim();

    if (svgContent) {
      artifacts.push(
        createArtifact(
          { category: "diagram", diagramType: "svg" } as ArtifactType,
          svgContent,
          createArtifactMetadata(
            "SVG diagram",
            ["ai-generated", "svg"],
            now,
            modelInfo
          )
        )
      );
    }
  }

  return artifacts;
};

// Extract inline JSON objects from content
const extractInlineJson = (
  content: string,
  now: Date,
  existingArtifacts: Artifact[],
  modelInfo?: { readonly provider: string; readonly model: string } | undefined
): Artifact[] => {
  const artifacts: Artifact[] = [];
  const blockJsonRegex = /(?<!`)({[\s\S]*?}\s*(?:,\s*{[\s\S]*?})*)/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Regex.exec() requires assignment
  while ((match = blockJsonRegex.exec(content)) !== null) {
    const possibleJson = match[1]?.trim();

    if (
      possibleJson &&
      !possibleJson.includes("```") &&
      possibleJson.startsWith("{ ") &&
      possibleJson.endsWith("}")
    ) {
      try {
        JSON.parse(possibleJson);

        const isDuplicate = existingArtifacts.some(
          (a) => a.type.category === "data" && a.content === possibleJson
        );

        if (!isDuplicate) {
          artifacts.push(
            createArtifact(
              { category: "data", dataFormat: "json" } as ArtifactType,
              possibleJson,
              createArtifactMetadata(
                "JSON data",
                ["ai-generated", "json"],
                now,
                modelInfo
              )
            )
          );
        }
      } catch {
        // Not valid JSON, skip
      }
    }
  }

  return artifacts;
};

// ============================================================================
// Extraction Functions
// ============================================================================

/**
 * Extract artifacts from ChatCompletionResponse
 * Detects code blocks, Mermaid diagrams, JSON, SVG, etc.
 */
export const extractArtifactsFromResponse = (
  response: ChatCompletionResponse,
  modelInfo?: { readonly provider: string; readonly model: string } | undefined
): Effect.Effect<readonly Artifact[]> =>
  Effect.sync(() => {
    // Get message content
    const messageContent =
      response.choices && response.choices.length > 0
        ? response.choices[0]?.message?.content
        : undefined;

    if (!messageContent || typeof messageContent !== "string") {
      return [] as readonly Artifact[];
    }

    const now = new Date();
    const artifacts: Artifact[] = [];

    // Extract different artifact types
    artifacts.push(...extractCodeBlocks(messageContent, now, modelInfo));
    artifacts.push(...extractMermaidDiagrams(messageContent, now, modelInfo));
    artifacts.push(...extractJsonBlocks(messageContent, now, modelInfo));
    artifacts.push(...extractSvgDiagrams(messageContent, now, modelInfo));
    artifacts.push(
      ...extractInlineJson(messageContent, now, artifacts, modelInfo)
    );

    return artifacts as readonly Artifact[];
  });

/**
 * Extract artifacts from a string (for testing and direct use)
 */
export const extractArtifactsFromString = (
  content: string,
  modelInfo?: { readonly provider: string; readonly model: string } | undefined
): Effect.Effect<readonly Artifact[]> => {
  // Create a mock response
  const mockResponse: ChatCompletionResponse = {
    id: crypto.randomUUID(),
    model: modelInfo?.model ?? "unknown",
    choices: [
      {
        message: { role: "assistant", content },
        finishReason: "stop",
      },
    ],
  };

  return extractArtifactsFromResponse(mockResponse, modelInfo);
};
