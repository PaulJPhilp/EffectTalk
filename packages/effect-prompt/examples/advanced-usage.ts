/**
 * Advanced effect-prompt patterns - composition and reuse
 *
 * This example demonstrates:
 * - Prompt composition and inheritance
 * - Managing prompt versions
 * - Conversation management
 * - Advanced templating with filters
 */

import { Effect } from "effect";
import {
	PromptService,
	PromptStorageService,
	ConversationFilters,
} from "../src/index.js";

const program = Effect.gen(function* () {
	const storageService = yield* PromptStorageService;
	const promptService = yield* PromptService;

	// Create a base system prompt that other prompts can extend
	const baseSystemPrompt = {
		id: "base-system",
		name: "Base System Prompt",
		description: "Base system prompt for all assistants",
		template: `You are {{characterType}}.
Current context: {{context}}
Follow these guidelines:
1. Be respectful
2. Be accurate
3. Be helpful`,
		variables: {
			characterType: { type: "string", required: true },
			context: { type: "string", required: true },
		},
		version: "1.0.0",
		tags: ["system", "base"],
	};

	yield* storageService.save(baseSystemPrompt);

	// Create a specialized prompt that extends the base
	const technicalPrompt = {
		id: "tech-support",
		name: "Technical Support Prompt",
		description: "Prompt for technical support assistant",
		template: `{{baseSystemPrompt}}

Additional guidance for technical support:
- Use technical jargon when appropriate
- Provide code examples when relevant
- Troubleshoot systematically`,
		variables: {
			baseSystemPrompt: { type: "string", required: true },
			characterType: { type: "string", required: true },
			context: { type: "string", required: true },
		},
		version: "1.0.0",
		tags: ["system", "technical"],
	};

	// Render base prompt first
	const baseRendered = yield* promptService.renderPrompt("base-system", {
		characterType: "Technical Support Assistant",
		context: "Enterprise Software Support",
	});

	// Then use it in technical prompt
	const techRendered = yield* promptService.renderPrompt("tech-support", {
		baseSystemPrompt: baseRendered.content,
		characterType: "Technical Support Assistant",
		context: "Enterprise Software Support",
	});

	yield* Effect.log("Technical Support Prompt:");
	yield* Effect.log(techRendered.content);

	// Manage conversation history
	const conversation = {
		id: "conv-123",
		promptId: "tech-support",
		messages: [
			{
				role: "user" as const,
				content: "My TypeScript project won't compile",
			},
			{
				role: "assistant" as const,
				content:
					"Let me help you troubleshoot. Can you share the error message?",
			},
			{
				role: "user" as const,
				content: "Error: Property 'x' is missing in type 'A'",
			},
		],
		metadata: {
			startedAt: new Date(),
			tags: ["troubleshooting", "typescript"],
		},
	};

	yield* Effect.log("\nConversation history:");
	for (const msg of conversation.messages) {
		yield* Effect.log(`${msg.role}: ${msg.content}`);
	}

	// Version management
	const updatedPrompt = {
		...baseSystemPrompt,
		version: "1.1.0", // Semantic versioning
		template: `${baseSystemPrompt.template}

NEW in v1.1.0: Added examples of common issues`,
	};

	yield* storageService.save(updatedPrompt);
	yield* Effect.log("\nPrompt updated to version:", updatedPrompt.version);
});

Effect.runPromise(program).catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
