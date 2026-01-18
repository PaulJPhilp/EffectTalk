/**
 * Basic effect-models usage - chat completions
 *
 * This example demonstrates:
 * - Listing available models
 * - Creating a simple chat completion request
 * - Handling responses
 * - Error handling
 */

import { Effect } from "effect";
import { OpenRouterService } from "../src/index.js";

const program = Effect.gen(function* () {
  // Get the service
  const service = yield* OpenRouterService;

  // List available models
  yield* Effect.log("Listing available models...");
  const models = yield* service.listModels().pipe(
    Effect.tap((models) =>
      Effect.log(`Found ${models.length} available models`)
    ),
    Effect.tap((models) =>
      Effect.log(
        "First 5 models:",
        models.slice(0, 5).map((m) => m.id)
      )
    )
  );

  // Create a simple chat completion request
  const request = {
    model: models[0]?.id || "anthropic/claude-3-haiku",
    messages: [
      {
        role: "user" as const,
        content: "What is the capital of France?",
      },
    ],
    temperature: 0.7,
  };

  yield* Effect.log("Sending chat completion request...");
  yield* Effect.log("Model:", request.model);
  yield* Effect.log("User message:", request.messages[0].content);

  // Send request and get response
  const response = yield* service
    .complete(request)
    .pipe(
      Effect.tap((res) =>
        Effect.log(
          "Response received:",
          res.choices[0]?.message?.content || "(no content)"
        )
      )
    );

  return {
    modelCount: models.length,
    responseContent: response.choices[0]?.message?.content,
  };
});

// Run with default service
Effect.runPromise(
  program.pipe(Effect.provide(OpenRouterService.Default))
).catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
