/**
 * HuggingFaceService - Service for HuggingFace Inference API
 *
 * Provides access to models hosted on HuggingFace.
 */

import { Effect } from "effect";
import {
  ApiRequestError,
  type AuthenticationError,
  type InvalidResponseError,
  type RateLimitError,
} from "../errors.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  Model,
} from "../types.js";

export type HuggingFaceServiceSchema = {
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
};

export class HuggingFaceService extends Effect.Service<HuggingFaceServiceSchema>()(
  "HuggingFaceService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        listModels: () =>
          Effect.gen(function* () {
            // Implementation will be added when code is migrated
            yield* Effect.log("Listing HuggingFace models");
            return [] as readonly Model[];
          }),

        complete: (request: ChatCompletionRequest) =>
          Effect.gen(function* () {
            // Implementation will be added when code is migrated
            yield* Effect.log(
              `HuggingFace completion for model: ${request.model}`
            );
            return Effect.fail(
              new ApiRequestError({
                message: "Not implemented",
                endpoint: "https://api-inference.huggingface.co/models",
              })
            );
          }),
      };
    }),
  }
) {}
