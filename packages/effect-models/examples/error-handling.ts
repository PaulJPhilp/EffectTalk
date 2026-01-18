/**
 * Error handling patterns with effect-models
 *
 * This example demonstrates:
 * - Handling authentication errors
 * - Handling rate limit errors with retry logic
 * - Handling API request errors
 * - Error recovery strategies
 */

import { Effect, Schedule } from "effect";
import {
  OpenRouterService,
  AuthenticationError,
  RateLimitError,
  ApiRequestError,
} from "../src/index.js";

const program = Effect.gen(function* () {
  const service = yield* OpenRouterService;

  const request = {
    model: "anthropic/claude-3-haiku",
    messages: [
      {
        role: "user" as const,
        content: "Hello!",
      },
    ],
  };

  // Pattern 1: Specific error handling
  const withErrorHandling = yield* service.complete(request).pipe(
    Effect.catchTag("AuthenticationError", (err) =>
      Effect.gen(function* () {
        yield* Effect.logError("Authentication failed:", err.message);
        return {
          error: "auth_failed",
          message: "Please check your API credentials",
        };
      })
    ),
    Effect.catchTag("RateLimitError", (err) =>
      Effect.gen(function* () {
        const retryAfter = err.retryAfter || 60;
        yield* Effect.logError(
          `Rate limited. Retry after ${retryAfter} seconds`
        );
        return {
          error: "rate_limited",
          retryAfter,
        };
      })
    ),
    Effect.catchTag("ApiRequestError", (err) =>
      Effect.gen(function* () {
        yield* Effect.logError("API error:", err.message);
        return {
          error: "api_error",
          message: err.message,
        };
      })
    ),
    Effect.either
  );

  yield* Effect.log("Result with error handling:", withErrorHandling);

  // Pattern 2: Automatic retry with exponential backoff
  const withRetry = yield* service.complete(request).pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(
        Schedule.union(Schedule.recurs(3)) // Max 3 retries
      )
    ),
    Effect.either
  );

  yield* Effect.log("Result with retry:", withRetry);

  // Pattern 3: Fallback to alternative model on failure
  const withFallback = yield* service
    .complete({
      ...request,
      model: "unavailable/model",
    })
    .pipe(
      Effect.orElse(() =>
        service.complete({
          ...request,
          model: "anthropic/claude-3-haiku", // Fallback
        })
      ),
      Effect.tap((res) =>
        Effect.log(
          "Response (with fallback):",
          res.choices[0]?.message?.content
        )
      )
    );
});

Effect.runPromise(
  program.pipe(Effect.provide(OpenRouterService.Default))
).catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
