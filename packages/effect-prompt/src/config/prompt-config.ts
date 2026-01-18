import { Effect, Layer } from "effect";

export interface PromptConfigSchema {
	readonly getPromptsDir: () => Effect.Effect<string, never>;
	readonly getDefaultMaxTokens: () => Effect.Effect<number, never>;
	readonly getEnableCaching: () => Effect.Effect<boolean, never>;
	readonly getCacheTTL: () => Effect.Effect<number, never>;
}

export class PromptConfig extends Effect.Service<PromptConfigSchema>()(
	"PromptConfig",
	{
		accessors: true,
		dependencies: [],
		effect: Effect.gen(function* () {
			// Configuration with sensible defaults
			// Can be extended to read from environment variables or config files
			const promptsDir = "./prompts";
			const defaultMaxTokens = 4000;
			const enableCaching = true;
			const cacheTTL = 3600;

			return {
				getPromptsDir: () => Effect.succeed(promptsDir),
				getDefaultMaxTokens: () => Effect.succeed(defaultMaxTokens),
				getEnableCaching: () => Effect.succeed(enableCaching),
				getCacheTTL: () => Effect.succeed(cacheTTL),
			} satisfies PromptConfigSchema;
		}),
	},
) {}

export const PromptConfigLayer = Layer.succeed(PromptConfig, {
	getPromptsDir: () => Effect.succeed("./prompts"),
	getDefaultMaxTokens: () => Effect.succeed(4000),
	getEnableCaching: () => Effect.succeed(true),
	getCacheTTL: () => Effect.succeed(3600),
});
