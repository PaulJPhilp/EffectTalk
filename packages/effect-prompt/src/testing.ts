/**
 * Testing utilities for effect-prompt
 *
 * Provides mock layers and helpers for testing code that uses PromptService
 *
 * @example
 * ```typescript
 * import { createMockStorageLayer, createMockValidationLayer } from "effect-prompt/testing"
 * import { PromptService } from "effect-prompt"
 *
 * const testLayer = Layer.compose(
 *   createMockStorageLayer(new Map([["greeting", mockTemplate]])),
 *   createMockValidationLayer()
 * )
 *
 * const program = Effect.gen(function* () {
 *   const service = yield* PromptService
 *   return yield* service.renderPrompt("greeting", { name: "Alice" })
 * })
 *
 * const result = await Effect.runPromise(Effect.provide(program, testLayer))
 * ```
 *
 * @module testing
 */

import { Effect, Layer, Schema } from "effect";
import type { PromptStorageServiceSchema } from "./services/storage-service.js";
import type { ValidationServiceSchema } from "./services/validation-service.js";
import type { PromptTemplate, ValidationResult } from "./types.js";
import { PromptStorageService } from "./services/storage-service.js";
import { ValidationService } from "./services/validation-service.js";
import { PromptNotFoundError, VariableValidationError } from "./errors.js";

/**
 * Create a mock storage layer for testing
 *
 * Useful for testing PromptService without a real storage backend
 *
 * @param templates - Map of prompt ID to template
 * @returns A Layer providing PromptStorageService
 */
export const createMockStorageLayer = (
	templates: Map<string, PromptTemplate>,
): Layer.Layer<PromptStorageService> =>
	Layer.succeed(PromptStorageService, {
		load: (id) =>
			templates.has(id)
				? Effect.succeed(templates.get(id)!)
				: Effect.fail(
						new PromptNotFoundError({
							message: `Prompt not found: ${id}`,
							promptId: id,
						}),
					),
		save: () => Effect.void,
		list: () => Effect.succeed([...templates.values()]),
		delete: () => Effect.void,
	} satisfies PromptStorageServiceSchema);

/**
 * Create a mock validation layer for testing
 *
 * By default, accepts all variables. Pass a custom validator for stricter validation.
 *
 * @param validator - Optional custom validator function taking variables and schema (default: accepts all)
 * @returns A Layer providing ValidationService
 */
export const createMockValidationLayer = (
	validator?: (
		variables: unknown,
		schema: Schema.Schema<unknown>,
	) => readonly VariableValidationError[],
): Layer.Layer<ValidationService> =>
	Layer.succeed(ValidationService, {
		validate: (variables, schema) => {
			const errors = validator?.(variables, schema) ?? [];
			const result: ValidationResult = {
				valid: errors.length === 0,
				errors,
				warnings: [],
			};
			return Effect.succeed(result);
		},
	} satisfies ValidationServiceSchema);

/**
 * Create a complete test layer with both storage and validation
 *
 * Combines mock storage and validation for full testing support
 *
 * @param templates - Map of prompt ID to template
 * @param validator - Optional custom validator function
 * @returns A Layer providing both PromptStorageService and ValidationService
 */
export const createMockPromptLayer = (
	templates: Map<string, PromptTemplate>,
	validator?: (
		variables: unknown,
		schema: Schema.Schema<unknown>,
	) => readonly VariableValidationError[],
): Layer.Layer<PromptStorageService | ValidationService> =>
	Layer.merge(
		createMockStorageLayer(templates),
		createMockValidationLayer(validator),
	);
