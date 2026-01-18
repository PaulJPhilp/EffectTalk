/**
 * Basic effect-prompt usage - rendering and managing prompts
 *
 * This example demonstrates:
 * - Creating and storing prompt templates
 * - Rendering prompts with variables
 * - Variable validation
 * - Error handling
 */

import { Effect } from "effect";
import { PromptService, PromptStorageService } from "../src/index.js";

const program = Effect.gen(function* () {
	const storageService = yield* PromptStorageService;
	const promptService = yield* PromptService;

	// Create and save a prompt template
	const chatPromptTemplate = {
		id: "chat-completion",
		name: "Chat Completion",
		description: "A simple chat completion prompt",
		template: `You are a helpful assistant.

User: {{userMessage}}
Assistant:`,
		variables: {
			userMessage: { type: "string", required: true },
		},
		version: "1.0.0",
		tags: ["chat", "assistant"],
	};

	yield* Effect.log("Saving prompt template:", chatPromptTemplate.id);
	yield* storageService.save(chatPromptTemplate);

	// Render the prompt with variables
	const variables = {
		userMessage: "What is the capital of France?",
	};

	yield* Effect.log("Rendering prompt with variables:", variables);
	const rendered = yield* promptService.renderPrompt(
		chatPromptTemplate.id,
		variables,
	);

	yield* Effect.log("Rendered prompt:", rendered.content);
	yield* Effect.log("Token count:", rendered.metadata?.tokenCount);

	// Create and save another prompt
	const systemPromptTemplate = {
		id: "system-prompt",
		name: "System Prompt",
		description: "A system prompt with configuration",
		template: `You are a {{roleDescription}} assistant.
Your tone is {{tone}}.
You specialize in {{specialty}}.`,
		variables: {
			roleDescription: { type: "string", required: true },
			tone: { type: "string", required: true },
			specialty: { type: "string", required: true },
		},
		version: "1.0.0",
		tags: ["system", "configuration"],
	};

	yield* storageService.save(systemPromptTemplate);

	// Render with variables
	const systemRendered = yield* promptService.renderPrompt(
		systemPromptTemplate.id,
		{
			roleDescription: "helpful",
			tone: "friendly",
			specialty: "TypeScript and Effect",
		},
	);

	yield* Effect.log("\nSystem prompt rendered:");
	yield* Effect.log(systemRendered.content);
});

// Run the program (would normally provide storage and other layers)
Effect.runPromise(program).catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
