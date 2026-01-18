import { Data } from "effect";

/**
 * Common error options including a human-readable message and an optional cause
 * for chaining underlying exceptions.
 */
export type ErrorOptions = {
  readonly message: string;
  readonly cause?: unknown;
};

/** Error representing invalid model configuration. */
export class InvalidModelConfigError extends Data.TaggedError(
  "InvalidModelConfigError"
)<ErrorOptions> {}

/** Error representing API request failures. */
export class ApiRequestError extends Data.TaggedError("ApiRequestError")<{
  readonly message: string;
  readonly statusCode?: number;
  readonly endpoint: string;
  readonly cause?: unknown;
}> {}

/** Error representing rate limit exceeded. */
export class RateLimitError extends Data.TaggedError("RateLimitError")<{
  readonly message: string;
  readonly retryAfter?: number;
  readonly cause?: unknown;
}> {}

/** Error representing authentication failures. */
export class AuthenticationError extends Data.TaggedError(
  "AuthenticationError"
)<ErrorOptions> {}

/** Error representing model not found. */
export class ModelNotFoundError extends Data.TaggedError("ModelNotFoundError")<{
  readonly message: string;
  readonly modelId: string;
  readonly cause?: unknown;
}> {}

/** Error representing invalid response format. */
export class InvalidResponseError extends Data.TaggedError(
  "InvalidResponseError"
)<{
  readonly message: string;
  readonly response: unknown;
  readonly cause?: unknown;
}> {}
