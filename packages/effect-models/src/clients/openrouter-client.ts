/**
 * OpenRouter HTTP Client
 *
 * Low-level HTTP client for OpenRouter API with:
 * - Automatic authentication
 * - Error handling and conversion to domain errors
 * - Retry logic with exponential backoff
 * - Request/response schema validation
 */

import { Effect, Schedule, Stream, Schema, Option } from "effect";
import { OpenRouterConfig } from "../config/openrouter-config.js";
import {
  ApiRequestError,
  AuthenticationError,
  RateLimitError,
  InvalidResponseError,
} from "../errors.js";
import {
  ChatCompletionRequestSchema,
  ChatCompletionResponseSchema,
  ModelSchema,
  StreamChunkSchema,
  type ChatCompletionRequestApi,
  type ChatCompletionResponseApi,
  type ModelApi,
  type StreamChunk,
} from "../schemas/openrouter.js";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "../types.js";

/**
 * OpenRouter HTTP Client
 *
 * Handles low-level HTTP communication with OpenRouter API.
 */
export class OpenRouterClient extends Effect.Service<OpenRouterClient>()(
  "OpenRouterClient",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      const config = yield* OpenRouterConfig;

      const apiKey = yield* config.getApiKey();
      const baseUrl = yield* config.getBaseUrl();
      const maxRetries = yield* config.getMaxRetries();

      /**
       * Retry schedule for transient failures
       */
      const retrySchedule = Schedule.recurs(maxRetries);

      /**
       * Convert HTTP error responses to domain errors
       */
      const handleHttpError = (
        status: number,
        body?: unknown
      ):
        | ApiRequestError
        | AuthenticationError
        | RateLimitError
        | InvalidResponseError => {
        switch (status) {
          case 401:
          case 403:
            return new AuthenticationError({
              message: "Invalid API key or unauthorized",
            });
          case 429:
            return new RateLimitError({
              message: "Rate limit exceeded",
            });
          case 400:
          case 422:
            return new InvalidResponseError({
              message: `Invalid request: ${status}`,
              response: body,
            });
          default:
            return new ApiRequestError({
              message: `HTTP ${status}`,
              statusCode: status,
              endpoint: baseUrl,
            });
        }
      };

      /**
       * Execute HTTP GET request
       */
      const get = <T>(
        endpoint: string,
        schema: Schema.Schema<T>
      ): Effect.Effect<
        T,
        | ApiRequestError
        | AuthenticationError
        | RateLimitError
        | InvalidResponseError
      > =>
        Effect.gen(function* () {
          const url = `${baseUrl}${endpoint}`;

          const rawResponse = yield* Effect.promise(() =>
            fetch(url, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "User-Agent": "effect-models/0.6.1",
              },
            })
          ).pipe(
            Effect.mapError(
              (error) =>
                new ApiRequestError({
                  message: `Network error: ${String(error)}`,
                  endpoint: url,
                })
            )
          );

          const response = yield* Effect.promise(() => rawResponse.json()).pipe(
            Effect.mapError(
              (error) =>
                new InvalidResponseError({
                  message: `Failed to parse response: ${String(error)}`,
                  response: undefined,
                  ...("message" in (error as any)
                    ? { cause: error as Error }
                    : {}),
                })
            )
          );

          if (
            typeof response === "object" &&
            response !== null &&
            "error" in response
          ) {
            return yield* Effect.fail(handleHttpError(500, response));
          }

          const validated = yield* Schema.decodeUnknown(schema)(response).pipe(
            Effect.mapError(
              (error) =>
                new InvalidResponseError({
                  message: `Schema validation failed: ${String(error)}`,
                  response,
                  ...("message" in (error as any)
                    ? { cause: error as Error }
                    : {}),
                })
            )
          );

          return validated;
        }).pipe(Effect.retry(retrySchedule));

      /**
       * Execute HTTP POST request
       */
      const post = <T>(
        endpoint: string,
        body: unknown,
        schema: Schema.Schema<T>
      ): Effect.Effect<
        T,
        | ApiRequestError
        | AuthenticationError
        | RateLimitError
        | InvalidResponseError
      > =>
        Effect.gen(function* () {
          const url = `${baseUrl}${endpoint}`;

          const rawResponse = yield* Effect.promise(() =>
            fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "User-Agent": "effect-models/0.6.1",
              },
              body: JSON.stringify(body),
            })
          ).pipe(
            Effect.mapError(
              (error) =>
                new ApiRequestError({
                  message: `Network error: ${String(error)}`,
                  endpoint: url,
                })
            )
          );

          if (!rawResponse.ok) {
            const errorText = yield* Effect.promise(() =>
              rawResponse.text()
            ).pipe(
              Effect.catchAll(() =>
                Effect.succeed(`HTTP ${rawResponse.status}`)
              )
            );

            const errorBody = yield* Effect.try(() =>
              JSON.parse(errorText)
            ).pipe(Effect.orElse(() => Effect.succeed(errorText)));

            return yield* Effect.fail(
              handleHttpError(rawResponse.status, errorBody)
            );
          }

          const response = yield* Effect.promise(() => rawResponse.json()).pipe(
            Effect.mapError(
              (error) =>
                new InvalidResponseError({
                  message: `Failed to parse response: ${String(error)}`,
                  response: undefined,
                  ...("message" in (error as any)
                    ? { cause: error as Error }
                    : {}),
                })
            )
          );

          const validated = yield* Schema.decodeUnknown(schema)(response).pipe(
            Effect.mapError(
              (error) =>
                new InvalidResponseError({
                  message: `Schema validation failed: ${String(error)}`,
                  response,
                  ...("message" in (error as any)
                    ? { cause: error as Error }
                    : {}),
                })
            )
          );

          return validated;
        }).pipe(Effect.retry(retrySchedule));

      return {
        /**
         * Fetch the list of available models
         */
        fetchModels: () =>
          get("/models", Schema.Array(ModelSchema)).pipe(
            Effect.withSpan("OpenRouterClient.fetchModels")
          ),

        /**
         * Create a chat completion request
         */
        createChatCompletion: (request: ChatCompletionRequest) =>
          Effect.gen(function* () {
            // Transform domain request to API format
            const apiRequest: ChatCompletionRequestApi = {
              model: request.model,
              messages: request.messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              temperature: request.temperature,
              max_tokens: request.maxTokens,
              stream: request.stream ?? false,
            };

            // Validate request schema
            const validatedRequest = yield* Schema.decodeUnknown(
              ChatCompletionRequestSchema
            )(apiRequest).pipe(
              Effect.mapError(
                (error) =>
                  new InvalidResponseError({
                    message: `Invalid request: ${String(error)}`,
                    response: apiRequest,
                    ...("message" in (error as any)
                      ? { cause: error as Error }
                      : {}),
                  })
              )
            );

            // Make HTTP request
            const apiResponse = yield* post(
              "/chat/completions",
              validatedRequest,
              ChatCompletionResponseSchema
            );

            // Transform API response to domain format
            const response: ChatCompletionResponse = {
              id: apiResponse.id,
              model: apiResponse.model,
              choices: apiResponse.choices.map((choice) => ({
                message: {
                  role: choice.message.role,
                  content: choice.message.content,
                },
                finishReason: choice.finish_reason,
              })),
              ...(apiResponse.usage && {
                usage: {
                  promptTokens: apiResponse.usage.prompt_tokens,
                  completionTokens: apiResponse.usage.completion_tokens,
                  totalTokens: apiResponse.usage.total_tokens,
                },
              }),
            };

            return response;
          }).pipe(
            Effect.withSpan("OpenRouterClient.createChatCompletion", {
              attributes: { model: request.model },
            })
          ),

        /**
         * Stream a chat completion request
         *
         * Returns a Stream of chunks that arrive in real-time from the API.
         * The stream terminates when the [DONE] sentinel is received.
         */
        streamChatCompletion: (
          request: ChatCompletionRequest
        ): Stream.Stream<
          StreamChunk,
          | ApiRequestError
          | AuthenticationError
          | RateLimitError
          | InvalidResponseError
        > =>
          Stream.unwrap(
            Effect.gen(function* () {
              const url = `${baseUrl}/chat/completions`;

              // Create streaming request (set stream: true)
              const apiRequest: ChatCompletionRequestApi = {
                model: request.model,
                messages: request.messages.map((m) => ({
                  role: m.role,
                  content: m.content,
                })),
                temperature: request.temperature,
                max_tokens: request.maxTokens,
                stream: true, // Critical: enable streaming
              };

              // Validate request
              const validatedRequest = yield* Schema.decodeUnknown(
                ChatCompletionRequestSchema
              )(apiRequest).pipe(
                Effect.mapError(
                  (error) =>
                    new InvalidResponseError({
                      message: `Invalid streaming request: ${String(error)}`,
                      response: apiRequest,
                      ...("message" in (error as any)
                        ? { cause: error as Error }
                        : {}),
                    })
                )
              );

              // Make fetch request
              const response = yield* Effect.promise(() =>
                fetch(url, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "User-Agent": "effect-models/0.6.1",
                  },
                  body: JSON.stringify(validatedRequest),
                })
              ).pipe(
                Effect.mapError(
                  (error) =>
                    new ApiRequestError({
                      message: `Network error: ${String(error)}`,
                      endpoint: url,
                    })
                )
              );

              // Check response status
              if (!response.ok) {
                const errorText = yield* Effect.promise(() =>
                  response.text()
                ).pipe(
                  Effect.catchAll(() =>
                    Effect.succeed(`HTTP ${response.status}`)
                  )
                );

                const errorBody = yield* Effect.try(() =>
                  JSON.parse(errorText)
                ).pipe(Effect.orElse(() => Effect.succeed(errorText)));

                return yield* Effect.fail(
                  handleHttpError(response.status, errorBody)
                );
              }

              // Get ReadableStream from response
              if (!response.body) {
                return yield* Effect.fail(
                  new InvalidResponseError({
                    message: "No response body for streaming",
                    response: undefined,
                  })
                );
              }

              // Convert ReadableStream to Effect Stream
              return Stream.fromReadableStream(
                () => response.body!,
                (error) =>
                  new ApiRequestError({
                    message: `Stream read error: ${String(error)}`,
                    endpoint: url,
                  })
              ).pipe(
                // Decode bytes to text
                Stream.decodeText("utf-8"),

                // Split by lines
                Stream.splitLines,

                // Parse SSE format
                Stream.filterMap((line) => {
                  // Skip empty lines
                  if (!line.trim()) {
                    return Option.none();
                  }

                  // Parse data: prefix
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6).trim();

                    // Check for [DONE] sentinel
                    if (data === "[DONE]") {
                      return Option.none();
                    }

                    // Parse JSON with logging for malformed chunks
                    const parsed = Effect.try(() => JSON.parse(data)).pipe(
                      Effect.mapError((error) => {
                        // Log malformed chunks for debugging without failing the stream
                        const errorMsg =
                          error instanceof Error
                            ? error.message
                            : String(error);
                        console.warn(
                          `[OpenRouter SSE] Malformed chunk skipped: ${errorMsg.substring(0, 100)}... | data: ${data.substring(0, 100)}...`
                        );
                        return error;
                      }),
                      Effect.orElse(() => Effect.succeed(undefined))
                    );

                    // Use Effect.runSync to execute synchronously in stream context
                    const result = Effect.runSync(parsed);
                    return result !== undefined
                      ? Option.some(result)
                      : Option.none();
                  }

                  return Option.none();
                }),

                // Validate each chunk with schema
                Stream.mapEffect((chunk) =>
                  Schema.decodeUnknown(StreamChunkSchema)(chunk).pipe(
                    Effect.mapError(
                      (error) =>
                        new InvalidResponseError({
                          message: `Stream chunk validation failed: ${String(error)}`,
                          response: chunk,
                          ...("message" in (error as any)
                            ? { cause: error as Error }
                            : {}),
                        })
                    )
                  )
                ),

                // Add tracing
                Stream.tap((chunk) =>
                  Effect.logTrace("Streaming chunk", {
                    id: chunk.id,
                    hasContent: chunk.choices[0]?.delta.content !== undefined,
                  })
                )
              );
            })
          ).pipe(
            Stream.withSpan("OpenRouterClient.streamChatCompletion", {
              attributes: { model: request.model },
            })
          ),
      };
    }),
  }
) {}
