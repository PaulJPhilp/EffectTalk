import { Schema } from "effect";

/**
 * OpenRouter API Schemas
 *
 * Runtime validation schemas for OpenRouter API requests and responses.
 * These schemas ensure type safety and validate API compatibility.
 */

/**
 * Message schema for OpenRouter API
 */
export const MessageSchema = Schema.Struct({
  role: Schema.Literal("system", "user", "assistant"),
  content: Schema.String,
});

export type Message = Schema.Schema.Type<typeof MessageSchema>;

/**
 * Chat completion request schema for OpenRouter API
 *
 * Note: OpenRouter API uses snake_case for some fields (max_tokens, finish_reason, etc.)
 */
export const ChatCompletionRequestSchema = Schema.Struct({
  model: Schema.String,
  messages: Schema.Array(MessageSchema),
  temperature: Schema.optional(Schema.Number),
  max_tokens: Schema.optional(Schema.Number),
  stream: Schema.optional(Schema.Boolean),
});

export type ChatCompletionRequestApi = Schema.Schema.Type<
  typeof ChatCompletionRequestSchema
>;

/**
 * Chat completion choice schema
 */
export const ChatCompletionChoiceSchema = Schema.Struct({
  message: MessageSchema,
  finish_reason: Schema.String,
  index: Schema.optional(Schema.Number),
});

/**
 * Usage schema for token counting
 */
export const UsageSchema = Schema.Struct({
  prompt_tokens: Schema.Number,
  completion_tokens: Schema.Number,
  total_tokens: Schema.Number,
});

/**
 * Chat completion response schema from OpenRouter API
 */
export const ChatCompletionResponseSchema = Schema.Struct({
  id: Schema.String,
  model: Schema.String,
  choices: Schema.Array(ChatCompletionChoiceSchema),
  usage: Schema.optional(UsageSchema),
  created: Schema.optional(Schema.Number),
});

export type ChatCompletionResponseApi = Schema.Schema.Type<
  typeof ChatCompletionResponseSchema
>;

/**
 * Model schema for OpenRouter models list
 */
export const ModelSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  context_length: Schema.optional(Schema.Number),
  pricing: Schema.optional(
    Schema.Struct({
      prompt: Schema.Number,
      completion: Schema.Number,
    })
  ),
  architecture: Schema.optional(
    Schema.Struct({
      modality: Schema.optional(Schema.String),
      tokenizer: Schema.optional(Schema.String),
      instruct_type: Schema.optional(Schema.String),
    })
  ),
});

export type ModelApi = Schema.Schema.Type<typeof ModelSchema>;

/**
 * Stream chunk schema for streaming responses
 * Represents a delta chunk from OpenRouter streaming API
 */
export const StreamChunkSchema = Schema.Struct({
  id: Schema.String,
  model: Schema.String,
  choices: Schema.Array(
    Schema.Struct({
      index: Schema.Number,
      delta: Schema.Struct({
        content: Schema.optional(Schema.String),
        role: Schema.optional(Schema.String),
      }),
      finish_reason: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
    })
  ),
  created: Schema.optional(Schema.Number),
});

export type StreamChunk = Schema.Schema.Type<typeof StreamChunkSchema>;

/**
 * Error response schema for OpenRouter API errors
 */
export const ErrorResponseSchema = Schema.Struct({
  error: Schema.Struct({
    message: Schema.String,
    type: Schema.optional(Schema.String),
    param: Schema.optional(Schema.String),
    code: Schema.optional(Schema.String),
  }),
});

export type ErrorResponse = Schema.Schema.Type<typeof ErrorResponseSchema>;
