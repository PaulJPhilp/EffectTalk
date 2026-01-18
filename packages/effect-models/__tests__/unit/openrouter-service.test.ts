/**
 * Unit tests for OpenRouterService
 */

import { Effect, Layer, Either } from "effect";
import { describe, it, expect } from "vitest";
import { OpenRouterService } from "../../src/services/open-router-service.js";
import { OpenRouterClient } from "../../src/clients/openrouter-client.js";
import { OpenRouterConfig } from "../../src/config/openrouter-config.js";
import { TelemetryService, MetricsService } from "effect-telemetry";
import { ContextService } from "effect-telemetry";
import { ApiRequestError } from "../../src/errors.js";
import { EnvService } from "effect-env";
import {
  mockModelsResponse,
  mockChatCompletionResponse,
} from "../fixtures/openrouter-responses.js";

describe("OpenRouterService", () => {
  /**
   * Create a test EnvService layer with default values
   */
  const createTestEnvLayer = () =>
    Layer.succeed(EnvService, {
      require: (key: string) => {
        if (key === "OPENROUTER_API_KEY") {
          return Effect.succeed("sk-test-key-123");
        }
        return Effect.fail(new Error(`Missing env var: ${key}`));
      },
      get: () => Effect.succeed(undefined),
    });

  /**
   * Create a test OpenRouterClient layer with mock responses
   */
  const createTestClientLayer = () =>
    Layer.succeed(OpenRouterClient, {
      fetchModels: () => Effect.succeed([...mockModelsResponse]),
      createChatCompletion: (req) =>
        Effect.gen(function* () {
          return {
            id: mockChatCompletionResponse.id,
            model: req.model,
            choices: mockChatCompletionResponse.choices.map((c) => ({
              message: c.message,
              finishReason: c.finish_reason,
            })),
            usage: mockChatCompletionResponse.usage
              ? {
                  promptTokens: mockChatCompletionResponse.usage.prompt_tokens,
                  completionTokens:
                    mockChatCompletionResponse.usage.completion_tokens,
                  totalTokens: mockChatCompletionResponse.usage.total_tokens,
                }
              : undefined,
          };
        }),
      streamChatCompletion: () => {
        // Placeholder for streaming tests
        return Effect.fail(
          new ApiRequestError({
            message: "Streaming not implemented in test layer",
            endpoint: "",
          })
        ) as any;
      },
    });

  /**
   * Create test telemetry layers (no-op implementations for testing)
   */
  const createTestTelemetryLayers = () => [
    Layer.succeed(TelemetryService.Default as any, {
      initialize: () => Effect.void,
      shutdown: () => Effect.void,
      getTracer: () => Effect.sync(() => ({}) as any),
      getMeter: () => Effect.sync(() => ({}) as any),
      withSpan:
        <A, E, R>(
          _name: string,
          _attrs?: Record<string, string | number | boolean>
        ) =>
        (effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
          effect,
    }),
    Layer.succeed(MetricsService.Default as any, {
      recordLLMTokens: () => Effect.void,
      recordLatency: () => Effect.void,
      recordError: () => Effect.void,
    }),
    Layer.succeed(ContextService, {
      getRequestId: () => Effect.succeed("test-request-id"),
      setRequestId: () => Effect.void,
      generateRequestId: () => Effect.succeed("generated-id"),
      withRequestId:
        <A, E, R>(_id?: string) =>
        (effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
          effect,
    }),
  ];

  /**
   * Create all test layers needed for OpenRouterService
   */
  const createAllTestLayers = () => {
    const envLayer = createTestEnvLayer();
    const clientLayer = createTestClientLayer();
    const telemetryLayers = createTestTelemetryLayers();

    // Build the complete layer stack
    // EnvService → OpenRouterConfig → OpenRouterClient → OpenRouterService
    const configLayer = Layer.provide(OpenRouterConfig.Default, envLayer);
    const allLayers: Layer.Layer<any, any, any>[] = [
      configLayer,
      clientLayer,
      ...telemetryLayers,
      OpenRouterService.Default,
    ];
    return Layer.mergeAll(...allLayers);
  };

  /**
   * Merge custom client layer with telemetry layers
   */
  const mergeWithTelemetry = (
    clientLayer: Layer.Layer<OpenRouterClient, never, never>
  ) => {
    const envLayer = createTestEnvLayer();
    const telemetryLayers = createTestTelemetryLayers();

    // Build the complete layer stack
    // EnvService → OpenRouterConfig → Custom OpenRouterClient → OpenRouterService
    const configLayer = Layer.provide(OpenRouterConfig.Default, envLayer);
    const allLayers: Layer.Layer<any, any, any>[] = [
      configLayer,
      clientLayer,
      ...telemetryLayers,
      OpenRouterService.Default,
    ];
    return Layer.mergeAll(...allLayers);
  };

  describe("listModels", () => {
    it("should list all available models", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;
        const models = yield* service.listModels();

        expect(models).toHaveLength(3);
        expect(models[0]).toMatchObject({
          id: "openai/gpt-4",
          name: "GPT-4 (OpenAI)",
          provider: "openrouter",
          contextLength: 8192,
        });
        expect(models[0]!.pricing).toMatchObject({
          prompt: 0.03,
          completion: 0.06,
        });
      }).pipe(Effect.provide(createAllTestLayers()));

      await Effect.runPromise(program);
    });

    it("should transform API model format to domain format", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;
        const models = yield* service.listModels();

        // Check camelCase transformation (context_length -> contextLength)
        const model = models[0]!;
        expect(model).toHaveProperty("contextLength");
        expect(model).not.toHaveProperty("context_length");
      }).pipe(Effect.provide(createAllTestLayers()));

      await Effect.runPromise(program);
    });

    it("should handle missing pricing information", async () => {
      const testLayer = Layer.succeed(OpenRouterClient, {
        fetchModels: () =>
          Effect.succeed([
            {
              id: "test-model",
              name: "Test Model",
              // No pricing
            },
          ]),
        createChatCompletion: () => Effect.never(),
        streamChatCompletion: () => Effect.never(),
      });

      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;
        const models = yield* service.listModels();

        expect(models[0]!.pricing).toBeUndefined();
      }).pipe(Effect.provide(mergeWithTelemetry(testLayer)));

      await Effect.runPromise(program);
    });

    it("should propagate client errors", async () => {
      const testLayer = Layer.succeed(OpenRouterClient, {
        fetchModels: () =>
          Effect.fail(
            new ApiRequestError({
              message: "API Error",
              endpoint: "https://test.com/models",
            })
          ),
        createChatCompletion: () => Effect.never(),
        streamChatCompletion: () => Effect.never(),
      });

      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;
        const result = yield* service.listModels().pipe(Effect.either());

        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(ApiRequestError);
          expect(result.left.message).toBe("API Error");
        }
      }).pipe(Effect.provide(mergeWithTelemetry(testLayer)));

      await Effect.runPromise(program);
    });
  });

  describe("complete", () => {
    it("should create a chat completion successfully", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;
        const response = yield* service.complete({
          model: "openai/gpt-4",
          messages: [
            {
              role: "user",
              content: "Hello!",
            },
          ],
        });

        expect(response.id).toBeDefined();
        expect(response.model).toBe("openai/gpt-4");
        expect(response.choices).toHaveLength(1);
        expect(response.choices[0]!.message.role).toBe("assistant");
      }).pipe(Effect.provide(createAllTestLayers()));

      await Effect.runPromise(program);
    });

    it("should handle response with usage information", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;
        const response = yield* service.complete({
          model: "openai/gpt-4",
          messages: [
            {
              role: "user",
              content: "Count tokens",
            },
          ],
        });

        expect(response.usage).toBeDefined();
        expect(response.usage!.promptTokens).toBe(10);
        expect(response.usage!.completionTokens).toBe(21);
        expect(response.usage!.totalTokens).toBe(31);
      }).pipe(Effect.provide(createAllTestLayers()));

      await Effect.runPromise(program);
    });

    it("should handle multiple messages in request", async () => {
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
          temperature: 0.7,
          maxTokens: 100,
        });

        expect(response).toBeDefined();
        expect(response.choices[0]).toBeDefined();
      }).pipe(Effect.provide(createAllTestLayers()));

      await Effect.runPromise(program);
    });

    it("should propagate client errors from completion", async () => {
      const testLayer = Layer.succeed(OpenRouterClient, {
        fetchModels: () => Effect.never(),
        createChatCompletion: () =>
          Effect.fail(
            new ApiRequestError({
              message: "Model not found",
              statusCode: 404,
              endpoint: "https://test.com/chat/completions",
            })
          ),
        streamChatCompletion: () => Effect.never(),
      });

      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;
        const result = yield* service
          .complete({
            model: "invalid-model",
            messages: [{ role: "user", content: "test" }],
          })
          .pipe(Effect.either());

        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(ApiRequestError);
          expect((result.left as ApiRequestError).statusCode).toBe(404);
        }
      }).pipe(Effect.provide(mergeWithTelemetry(testLayer)));

      await Effect.runPromise(program);
    });
  });

  describe("streamComplete", () => {
    it("should have streamComplete method available", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;

        expect(service).toHaveProperty("streamComplete");
        expect(typeof service.streamComplete).toBe("function");
      }).pipe(Effect.provide(createAllTestLayers()));

      await Effect.runPromise(program);
    });
  });
});
