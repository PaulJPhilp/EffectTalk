import type { Effect } from "effect";
import type { Schema } from "effect";

/**
 * Prompt template with metadata
 */
export interface PromptTemplate {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly content: string;
  readonly variableSchema?: Schema.Schema<unknown>;
  readonly metadata: PromptMetadata;
}

/**
 * Prompt metadata for versioning and organization
 */
export interface PromptMetadata {
  readonly version: string;
  readonly created: Date;
  readonly updated: Date;
  readonly tags: readonly string[];
  readonly author?: string;
  readonly extends?: string;
  readonly maxTokens?: number;
}

/**
 * Validated prompt with context
 */
export interface ValidatedPrompt {
  readonly template: PromptTemplate;
  readonly variables: Record<string, unknown>;
  readonly validationResult: ValidationResult;
}

/**
 * Variable validation result
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly string[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  readonly message: string;
  readonly variableName: string;
  readonly expected: string;
  readonly received: unknown;
  readonly schemaErrors: readonly unknown[];
}

/**
 * Conversation message for AI prompts
 */
export interface ConversationMessage {
  readonly role: "system" | "user" | "assistant" | "function";
  readonly content: string;
  readonly name?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Conversation context
 */
export interface Conversation {
  readonly id: string;
  readonly messages: readonly ConversationMessage[];
  readonly metadata: ConversationMetadata;
}

/**
 * Conversation metadata
 */
export interface ConversationMetadata {
  readonly created: Date;
  readonly updated: Date;
  readonly totalTokens?: number;
  readonly model?: string;
}

/**
 * Rendered prompt result
 */
export interface RenderedPrompt {
  readonly content: string;
  readonly metadata: {
    readonly templateId: string;
    readonly version: string;
    readonly renderedAt: Date;
    readonly tokenCount?: number;
    readonly variables: Record<string, unknown>;
  };
}

/**
 * Prompt version comparison
 */
export interface VersionComparison {
  readonly oldVersion: PromptTemplate;
  readonly newVersion: PromptTemplate;
  readonly diff: {
    readonly contentChanged: boolean;
    readonly schemaChanged: boolean;
    readonly metadataChanged: boolean;
    readonly changes: readonly string[];
  };
}

/**
 * Storage query options
 */
export interface QueryOptions {
  readonly tags?: readonly string[];
  readonly namePattern?: string;
  readonly includeArchived?: boolean;
}
