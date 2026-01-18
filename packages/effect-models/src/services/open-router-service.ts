/**
 * OpenRouterService - Service for OpenRouter API
 *
 * Provides high-level business logic for interacting with OpenRouter API.
 * Handles:
 * - Listing available models
 * - Creating chat completions
 * - Request/response transformation
 * - Tracing and observability
 * - Automatic metrics collection via effect-telemetry
 */

import { Effect, Stream } from "effect";
import { OpenRouterClient } from "../clients/openrouter-client.js";
import {
  ApiRequestError,
  AuthenticationError,
  InvalidResponseError,
  RateLimitError,
} from "../errors.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Model,
} from "../types.js";
import type { StreamChunk } from "../schemas/openrouter.js";
import { TelemetryService, MetricsService } from "effect-telemetry";
import { instrumentLLMComplete } from "effect-telemetry/instrumentation";

export type OpenRouterServiceSchema = {
  readonly listModels: () => Effect.Effect<
    readonly Model[],
    ApiRequestError | AuthenticationError
  >;
  readonly complete: (
    request: ChatCompletionRequest
  ) => Effect.Effect<
    ChatCompletionResponse,
    | ApiRequestError
    | AuthenticationError
    | RateLimitError
    | InvalidResponseError
  >;
  readonly streamComplete: (
    request: ChatCompletionRequest
  ) => Stream.Stream<
    StreamChunk,
    | ApiRequestError
    | AuthenticationError
    | RateLimitError
    | InvalidResponseError
  >;
};

/**
 * OpenRouter Service
 *
 * High-level service for OpenRouter API interactions.
 * Orchestrates lower-level client operations and handles business logic.
 */
export class OpenRouterService extends Effect.Service<OpenRouterServiceSchema>()(
  "OpenRouterService",
  {
    accessors: true,
    dependencies: [
      OpenRouterClient.Default,
      TelemetryService.Default,
      MetricsService.Default,
    ],
    effect: Effect.gen(function* () {
      const client = yield* OpenRouterClient;
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic service resolution
      const telemetry = (yield* TelemetryService) as any;
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic service resolution
      const metrics = (yield* MetricsService) as any;

      return {
        /**
         * List all available models from OpenRouter
         *
         * @returns Array of available models with metadata
         */
        listModels: () =>
          Effect.gen(function* () {
            const rawModels = yield* client.fetchModels();

            // Transform API models to domain Model type
            const models: Model[] = rawModels.map((rawModel: any) => ({
              id: rawModel.id,
              name: rawModel.name,
              provider: "openrouter" as const,
              contextLength: rawModel.context_length,
              pricing: rawModel.pricing
                ? {
                    prompt: rawModel.pricing.prompt,
                    completion: rawModel.pricing.completion,
                  }
                : undefined,
            }));

            return models as readonly Model[];
          }).pipe(
            Effect.withSpan("OpenRouterService.listModels"),
            Effect.tap((models) =>
              Effect.logDebug("Listed models", { count: models.length })
            )
          ),

        /**
         * Create a chat completion
         *
         * @param request - The chat completion request
         * @returns The completion response with automatic tracing and metrics
         *
         * Automatically instruments the call with:
         * - OpenTelemetry span creation
         * - Token usage tracking
         * - Latency measurement
         * - Error rate monitoring
         */
        complete: (request: ChatCompletionRequest) =>
          Effect.gen(function* () {
            yield* Effect.logDebug("Creating chat completion", {
              model: request.model,
              messageCount: request.messages.length,
            });

            // Wrap with automatic instrumentation
            const response = yield* client.createChatCompletion(request).pipe(
              instrumentLLMComplete({
                provider: "openrouter",
                model: request.model,
              })
            );

            yield* Effect.logDebug("Chat completion created", {
              model: response.model,
              choiceCount: response.choices.length,
              usage: response.usage,
            });

            return response;
          }).pipe(
            Effect.withSpan("OpenRouterService.complete", {
              attributes: { model: request.model },
            })
          ),

        /**
         * Stream a chat completion
         *
         * @param request - The chat completion request (stream will be automatically set to true)
         * @returns A Stream of completion chunks
         */
        streamComplete: (request: ChatCompletionRequest) =>
          client.streamChatCompletion(request).pipe(
            Stream.withSpan("OpenRouterService.streamComplete", {
              attributes: { model: request.model },
            })
          ),
      };
    }),
  }
) {}
