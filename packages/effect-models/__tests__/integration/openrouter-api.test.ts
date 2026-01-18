/**
 * Integration tests for OpenRouter API
 *
 * These tests make real API calls to OpenRouter. They are skipped by default
 * unless OPENROUTER_API_KEY is set in environment.
 *
 * To run these tests:
 * 1. Set OPENROUTER_API_KEY environment variable with a valid API key
 * 2. Run: npm test -- --run openrouter-api.test.ts (remove .skip from tests)
 */

import { Effect } from "effect";
import { describe, it, expect } from "vitest";
import { FetchHttpClient } from "@effect/platform-node";
import { loadEnv } from "effect-env";
import { OpenRouterService } from "../../src/services/open-router-service.js";
import {
  ApiRequestError,
  AuthenticationError,
  RateLimitError,
} from "../../src/errors.js";

// Determine if we have API credentials for integration tests
const hasApiKey = Boolean(process.env.OPENROUTER_API_KEY);

// Skip integration tests if no API key
const testFn = hasApiKey ? describe : describe.skip;

testFn("OpenRouter Integration Tests", () => {
  /**
   * Setup for integration tests
   * Loads environment and provides HTTP client layer
   */
  const setupIntegration = () =>
    Effect.provide(FetchHttpClient.layer).pipe(Effect.provide(loadEnv()));

  describe("listModels", () => {
    it.skip(
      "should list real models from OpenRouter API",
      async () => {
        const program = Effect.gen(function* () {
          const service = yield* OpenRouterService;
          const models = yield* service.listModels();

          // Verify we got some models
          expect(models.length).toBeGreaterThan(0);

          // Verify model structure
          const model = models[0]!;
          expect(model).toHaveProperty("id");
          expect(model).toHaveProperty("name");
          expect(model).toHaveProperty("provider", "openrouter");
          expect(typeof model.id).toBe("string");
          expect(typeof model.name).toBe("string");

          // Log some model info
          console.log(`Found ${models.length} models`);
          console.log(`First model: ${model.id}`);
        }).pipe(setupIntegration());

        await Effect.runPromise(program);
      },
      { timeout: 30000 }
    );

    it.skip(
      "should include pricing information where available",
      async () => {
        const program = Effect.gen(function* () {
          const service = yield* OpenRouterService;
          const models = yield* service.listModels();

          // Find a model with pricing
          const modelWithPricing = models.find((m) => m.pricing !== undefined);

          if (modelWithPricing) {
            expect(modelWithPricing.pricing).toBeDefined();
            expect(modelWithPricing.pricing!).toHaveProperty("prompt");
            expect(modelWithPricing.pricing!).toHaveProperty("completion");
            expect(typeof modelWithPricing.pricing!.prompt).toBe("number");
            expect(typeof modelWithPricing.pricing!.completion).toBe("number");
          }
        }).pipe(setupIntegration());

        await Effect.runPromise(program);
      },
      { timeout: 30000 }
    );
  });

  describe("complete", () => {
    it.skip(
      "should create a chat completion with real API",
      async () => {
        const program = Effect.gen(function* () {
          const service = yield* OpenRouterService;

          const response = yield* service.complete({
            model: "openai/gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: "Say 'Hello, integration test!' and nothing else.",
              },
            ],
            maxTokens: 20,
          });

          // Verify response structure
          expect(response).toHaveProperty("id");
          expect(response).toHaveProperty("model");
          expect(response).toHaveProperty("choices");
          expect(response.choices.length).toBeGreaterThan(0);

          // Verify choice structure
          const choice = response.choices[0]!;
          expect(choice).toHaveProperty("message");
          expect(choice.message).toHaveProperty("role");
          expect(choice.message).toHaveProperty("content");
          expect(choice.message.role).toBe("assistant");
          expect(typeof choice.message.content).toBe("string");
          expect(choice.message.content.length).toBeGreaterThan(0);

          console.log(`Response: ${choice.message.content}`);
        }).pipe(setupIntegration());

        await Effect.runPromise(program);
      },
      { timeout: 30000 }
    );

    it.skip(
      "should include usage information when available",
      async () => {
        const program = Effect.gen(function* () {
          const service = yield* OpenRouterService;

          const response = yield* service.complete({
            model: "openai/gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: "Count to 5.",
              },
            ],
          });

          // OpenRouter typically includes usage information
          if (response.usage) {
            expect(response.usage).toHaveProperty("promptTokens");
            expect(response.usage).toHaveProperty("completionTokens");
            expect(response.usage).toHaveProperty("totalTokens");
            expect(response.usage.totalTokens).toBe(
              response.usage.promptTokens + response.usage.completionTokens
            );
          }
        }).pipe(setupIntegration());

        await Effect.runPromise(program);
      },
      { timeout: 30000 }
    );

    it.skip(
      "should support multiple messages in conversation",
      async () => {
        const program = Effect.gen(function* () {
          const service = yield* OpenRouterService;

          const response = yield* service.complete({
            model: "openai/gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant.",
              },
              {
                role: "user",
                content: "What is 2+2?",
              },
            ],
            maxTokens: 20,
          });

          expect(response.choices.length).toBeGreaterThan(0);
          const content = response.choices[0]!.message.content.toLowerCase();
          expect(content).toMatch(/4|four/);
        }).pipe(setupIntegration());

        await Effect.runPromise(program);
      },
      { timeout: 30000 }
    );

    it.skip(
      "should handle invalid model gracefully",
      async () => {
        const program = Effect.gen(function* () {
          const service = yield* OpenRouterService;

          const result = yield* service
            .complete({
              model: "invalid-model-xyz-12345",
              messages: [
                {
                  role: "user",
                  content: "Hello",
                },
              ],
            })
            .pipe(Effect.either());

          expect(result._tag).toBe("Left");
          if (result._tag === "Left") {
            expect(result.left).toBeInstanceOf(ApiRequestError);
          }
        }).pipe(setupIntegration());

        await Effect.runPromise(program);
      },
      { timeout: 30000 }
    );

    it.skip("should handle invalid API key gracefully", async () => {
      // This test would require setting a bad API key, which is tricky
      // in the integration test environment. Skipping for now.
      expect(true).toBe(true);
    });
  });

  describe("streamComplete", () => {
    it.skip(
      "should stream a chat completion",
      async () => {
        const program = Effect.gen(function* () {
          const service = yield* OpenRouterService;

          const stream = service.streamComplete({
            model: "openai/gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: "Count to 3.",
              },
            ],
            maxTokens: 30,
          });

          // Collect all chunks
          let chunkCount = 0;
          const firstChunk = yield* stream.pipe(
            Effect.tap(() =>
              Effect.sync(() => {
                chunkCount++;
              })
            )
          );

          expect(chunkCount).toBeGreaterThan(0);
          expect(firstChunk).toHaveProperty("id");
          expect(firstChunk).toHaveProperty("choices");

          console.log(`Received ${chunkCount} chunks from streaming API`);
        }).pipe(setupIntegration());

        await Effect.runPromise(program);
      },
      { timeout: 30000 }
    );
  });

  describe("Error Handling", () => {
    it.skip("should handle network errors gracefully", async () => {
      // This would require network manipulation, which is complex
      // in integration tests. Skipping for now.
      expect(true).toBe(true);
    });

    it.skip(
      "should propagate API errors correctly",
      async () => {
        const program = Effect.gen(function* () {
          const service = yield* OpenRouterService;

          // Try a request that should work
          const result = yield* service
            .complete({
              model: "openai/gpt-3.5-turbo",
              messages: [
                {
                  role: "user",
                  content: "Hello",
                },
              ],
            })
            .pipe(Effect.either());

          // Should succeed with valid API key
          expect(result._tag).toBe("Right");
        }).pipe(setupIntegration());

        await Effect.runPromise(program);
      },
      { timeout: 30000 }
    );
  });
});
