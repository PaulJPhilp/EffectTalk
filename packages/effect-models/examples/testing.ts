/**
 * Testing with effect-models
 *
 * This example demonstrates:
 * - Using test fixtures for development
 * - Creating mock completions
 * - Testing error scenarios
 * - Verifying API integration
 */

import { Effect, Layer } from "effect";
import {
  OpenRouterService,
  createTestApiKey,
  mockChatCompletionFixture,
} from "../src/index.js";

// Create a test layer that returns fixed responses
const createTestOpenRouterService = () =>
  Layer.succeed(OpenRouterService, {
    listModels: () =>
      Effect.succeed([
        {
          id: "test/model-1",
          name: "Test Model 1",
          provider: "test" as const,
          contextLength: 4096,
          pricing: { prompt: "0.01", completion: "0.02" },
        },
        {
          id: "test/model-2",
          name: "Test Model 2",
          provider: "test" as const,
          contextLength: 8192,
        },
      ]),

    complete: (request) =>
      Effect.succeed({
        id: mockChatCompletionFixture.id,
        model: request.model,
        choices: [
          {
            message: {
              role: "assistant",
              content: `Test response for: "${request.messages[0].content}"`,
            },
            finishReason: "stop",
          },
        ],
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      }),

    streamComplete: () => {
      // Would return a Stream in real implementation
      return {} as any;
    },
  });

// Test program
const testProgram = Effect.gen(function* () {
  const service = yield* OpenRouterService;

  // Test 1: List models
  yield* Effect.log("Test 1: List Models");
  const models = yield* service.listModels();
  yield* Effect.log(
    "Found models:",
    models.map((m) => m.id)
  );

  // Test 2: Create completion
  yield* Effect.log("\nTest 2: Chat Completion");
  const response = yield* service.complete({
    model: "test/model-1",
    messages: [
      {
        role: "user",
        content: "What is 2+2?",
      },
    ],
  });

  yield* Effect.log("Model:", response.model);
  yield* Effect.log("Response:", response.choices[0].message.content);
  yield* Effect.log("Tokens used:", response.usage.totalTokens);

  // Test 3: API key generation
  yield* Effect.log("\nTest 3: API Key");
  const testKey = createTestApiKey();
  yield* Effect.log("Generated test key:", testKey);

  return {
    testsRun: 3,
    modelsFound: models.length,
  };
});

// Run with test layer
Effect.runPromise(
  testProgram.pipe(Effect.provide(createTestOpenRouterService()))
);
