/**
 * Testing with effect-prompt
 *
 * This example demonstrates:
 * - Using mock storage layers for testing
 * - Testing prompt rendering
 * - Validation in tests
 * - Composing test fixtures
 */

import { Effect } from "effect";
import {
	PromptService,
	PromptStorageService,
	ValidationService,
	createMockStorageLayer,
	createMockValidationLayer,
} from "../src/index.js";

// Test program that uses services
const testProgram = Effect.gen(function* () {
	const storageService = yield* PromptStorageService;
	const promptService = yield* PromptService;
	const validationService = yield* ValidationService;

	// Save a test prompt
	const testPrompt = {
		id: "test-greeting",
		name: "Greeting Prompt",
		description: "Simple greeting prompt",
		template: "Hello, {{name}}! How can I help you today?",
		variables: {
			name: { type: "string", required: true },
		},
		version: "1.0.0",
		tags: ["greeting"],
	};

	// Test 1: Storage
	yield* Effect.log("Test 1: Prompt Storage");
	yield* storageService.save(testPrompt);
	const retrieved = yield* storageService.get("test-greeting");
	yield* Effect.log("Retrieved prompt:", retrieved?.id);

	// Test 2: Rendering
	yield* Effect.log("\nTest 2: Prompt Rendering");
	const rendered = yield* promptService.renderPrompt("test-greeting", {
		name: "Alice",
	});
	yield* Effect.log("Rendered:", rendered.content);

	// Test 3: Validation
	yield* Effect.log("\nTest 3: Variable Validation");
	const validationResult = yield* validationService.validate(testPrompt, {
		name: "Bob",
	});
	yield* Effect.log("Valid:", validationResult.valid);

	// Test 4: Invalid variables
	yield* Effect.log("\nTest 4: Invalid Variables");
	const invalidResult = yield* validationService
		.validate(testPrompt, { wrongKey: "value" })
		.pipe(Effect.either);

	if (invalidResult._tag === "Left") {
		yield* Effect.log("Caught validation error as expected");
	}

	// Test 5: List prompts
	yield* Effect.log("\nTest 5: List Prompts");
	const allPrompts = yield* storageService.list();
	yield* Effect.log("Total prompts:", allPrompts.length);
});

// Create test layers
const mockStorage = createMockStorageLayer(new Map());
const mockValidation = createMockValidationLayer();

// Run with mock layers
Effect.runPromise(
	testProgram.pipe(Effect.provide(mockStorage), Effect.provide(mockValidation)),
);
