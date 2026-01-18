/**
 * ArtificialAnalysisService - Service for Artificial Analysis API
 *
 * Provides access to specialized analysis models.
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

export type ArtificialAnalysisServiceSchema = {
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

export class ArtificialAnalysisService extends Effect.Service<ArtificialAnalysisServiceSchema>()(
  "ArtificialAnalysisService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        listModels: () =>
          Effect.gen(function* () {
            // Implementation will be added when code is migrated
            yield* Effect.log("Listing Artificial Analysis models");
            return [] as readonly Model[];
          }),

        complete: (request: ChatCompletionRequest) =>
          Effect.gen(function* () {
            // Implementation will be added when code is migrated
            yield* Effect.log(
              `Artificial Analysis completion for model: ${request.model}`
            );
            return Effect.fail(
              new ApiRequestError({
                message: "Not implemented",
                endpoint:
                  "https://api.artificialanalysis.ai/v1/chat/completions",
              })
            );
          }),
      };
    }),
  }
) {}
