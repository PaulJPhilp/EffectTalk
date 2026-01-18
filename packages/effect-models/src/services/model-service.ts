/**
 * ModelService - Unified service for interacting with LLM models
 *
 * Provides a unified interface for multiple model providers.
 */

import { Effect } from "effect";
import {
  ApiRequestError,
  type AuthenticationError,
  InvalidModelConfigError,
  type InvalidResponseError,
  ModelNotFoundError,
  type RateLimitError,
} from "../errors.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Model,
  ModelConfig,
} from "../types.js";

export type ModelServiceSchema = {
  readonly listModels: (
    provider?: string
  ) => Effect.Effect<readonly Model[], ApiRequestError | AuthenticationError>;
  readonly getModel: (
    modelId: string
  ) => Effect.Effect<Model, ModelNotFoundError | ApiRequestError>;
  readonly complete: (
    request: ChatCompletionRequest
  ) => Effect.Effect<
    ChatCompletionResponse,
    | ApiRequestError
    | AuthenticationError
    | RateLimitError
    | InvalidResponseError
    | InvalidModelConfigError
  >;
  readonly validateConfig: (
    config: ModelConfig
  ) => Effect.Effect<boolean, InvalidModelConfigError>;
};

export class ModelService extends Effect.Service<ModelServiceSchema>()(
  "ModelService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        listModels: (provider?: string) =>
          Effect.gen(function* () {
            // Implementation will be added when code is migrated
            yield* Effect.log(
              `Listing models for provider: ${provider ?? "all"}`
            );
            return [] as readonly Model[];
          }),

        getModel: (modelId: string) =>
          Effect.gen(function* () {
            // Implementation will be added when code is migrated
            yield* Effect.log(`Getting model: ${modelId}`);
            return Effect.fail(
              new ModelNotFoundError({
                message: `Model ${modelId} not found`,
                modelId,
              })
            );
          }),

        complete: (request: ChatCompletionRequest) =>
          Effect.gen(function* () {
            // Implementation will be added when code is migrated
            yield* Effect.log(`Completing chat for model: ${request.model}`);
            return Effect.fail(
              new ApiRequestError({
                message: "Not implemented",
                endpoint: "/chat/completions",
              })
            );
          }),

        validateConfig: (config: ModelConfig) => {
          // Implementation will be added when code is migrated
          if (!(config.provider && config.modelId)) {
            return Effect.fail(
              new InvalidModelConfigError({
                message: "Provider and modelId are required",
              })
            );
          }
          return Effect.succeed(true);
        },
      };
    }),
  }
) {}
