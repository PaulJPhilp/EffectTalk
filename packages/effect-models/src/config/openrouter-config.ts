import { Effect } from "effect";
import { EnvService } from "effect-env";

/**
 * OpenRouter configuration
 */
export interface OpenRouterConfigType {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly maxRetries: number;
}

/**
 * OpenRouterConfig Service
 *
 * Loads and manages OpenRouter API configuration from environment variables.
 *
 * Required environment variables:
 * - OPENROUTER_API_KEY: Your OpenRouter API key
 *
 * Optional environment variables:
 * - OPENROUTER_BASE_URL: Base URL for OpenRouter API (defaults to https://openrouter.ai/api/v1)
 * - OPENROUTER_TIMEOUT_MS: HTTP request timeout in milliseconds (defaults to 30000)
 * - OPENROUTER_MAX_RETRIES: Number of retries for failed requests (defaults to 3)
 */
/**
 * OpenRouter Configuration Service
 */
export class OpenRouterConfig extends Effect.Service<OpenRouterConfig>()(
  "OpenRouterConfig",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      // @ts-expect-error EnvService type issue
      const env = yield* EnvService;

      // Required: API key
      const apiKey = yield* env
        .require("OPENROUTER_API_KEY")
        .pipe(
          Effect.mapError(
            () =>
              new Error("OPENROUTER_API_KEY environment variable is required")
          )
        );

      // Optional: Base URL
      const baseUrl = yield* env
        .get("OPENROUTER_BASE_URL")
        .pipe(
          Effect.catchAll(() => Effect.succeed("https://openrouter.ai/api/v1"))
        );

      // Optional: Timeout (in milliseconds)
      const timeoutMs = yield* env.get("OPENROUTER_TIMEOUT_MS").pipe(
        Effect.flatMap((val) =>
          Effect.try({
            try: () => Number.parseInt(val as string, 10),
            catch: () => 30000,
          })
        ),
        Effect.catchAll(() => Effect.succeed(30000))
      );

      // Optional: Max retries
      const maxRetries = yield* env.get("OPENROUTER_MAX_RETRIES").pipe(
        Effect.flatMap((val) =>
          Effect.try({
            try: () => Number.parseInt(val as string, 10),
            catch: () => 3,
          })
        ),
        Effect.catchAll(() => Effect.succeed(3))
      );

      return {
        getApiKey: () => Effect.succeed(apiKey),
        getBaseUrl: () => Effect.succeed(baseUrl),
        getTimeoutMs: () => Effect.succeed(timeoutMs),
        getMaxRetries: () => Effect.succeed(maxRetries),
      };
    }),
  }
) {}
