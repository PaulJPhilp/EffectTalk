// Export errors
export {
	InheritanceError,
	PromptNotFoundError,
	PromptRenderError,
	StorageError,
	TokenLimitExceededError,
	VariableValidationError,
	VersionConflictError,
} from "./errors.js";

// Export types
export type {
	Conversation,
	ConversationMessage,
	ConversationMetadata,
	PromptMetadata,
	PromptTemplate,
	QueryOptions,
	RenderedPrompt,
	ValidatedPrompt,
	ValidationError,
	ValidationResult,
	VersionComparison,
} from "./types.js";

// Export schemas
export {
	CommonVariableSchemas,
	ConversationMessageSchema,
	ConversationSchema,
	PromptMetadataSchema,
	PromptTemplateSchema,
} from "./schemas.js";

// Export services
export {
	PromptService,
	PromptServiceLayer,
	PromptStorageService,
	PromptStorageServiceLayer,
	ValidationService,
	ValidationServiceLayer,
	type PromptServiceSchema,
	type PromptStorageServiceSchema,
	type ValidationServiceSchema,
} from "./services/index.js";

// Export config
export {
	PromptConfig,
	PromptConfigLayer,
	type PromptConfigSchema,
} from "./config/index.js";

// Export filters and tags for extensibility
export * as AIFilters from "./filters/ai-filters.js";
export * as ConversationFilters from "./filters/conversation-filters.js";
export { extendsTag, includeTag } from "./tags/index.js";

// Export testing utilities
export {
	createMockStorageLayer,
	createMockValidationLayer,
	createMockPromptLayer,
} from "./testing.js";

// Convenience functions (similar to effect-json pattern)
import { Effect } from "effect";
import {
	PromptService,
	PromptServiceLayer,
} from "./services/prompt-service.js";
import type { Conversation } from "./types.js";

/**
 * Render a prompt by ID with variables
 */
export const renderPrompt = (
	promptId: string,
	variables: Record<string, unknown>,
) =>
	Effect.provide(
		Effect.gen(function* () {
			const service = yield* PromptService;
			return yield* service.renderPrompt(promptId, variables);
		}),
		PromptServiceLayer,
	);

/**
 * Validate variables for a prompt
 */
export const validateVariables = (
	promptId: string,
	variables: Record<string, unknown>,
) =>
	Effect.provide(
		Effect.gen(function* () {
			const service = yield* PromptService;
			return yield* service.validateVariables(promptId, variables);
		}),
		PromptServiceLayer,
	);

/**
 * Render a conversation to a formatted string
 */
export const renderConversation = (
	conversation: Conversation,
	format?: "openai" | "anthropic" | "plain",
) =>
	Effect.provide(
		Effect.gen(function* () {
			const service = yield* PromptService;
			return yield* service.renderConversation(conversation, format);
		}),
		PromptServiceLayer,
	);
