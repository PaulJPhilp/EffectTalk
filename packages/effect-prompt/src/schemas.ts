import { Schema } from "effect";

/**
 * Schema for prompt metadata
 */
export const PromptMetadataSchema = Schema.Struct({
  version: Schema.String,
  created: Schema.Date,
  updated: Schema.Date,
  tags: Schema.Array(Schema.String),
  author: Schema.optional(Schema.String),
  extends: Schema.optional(Schema.String),
  maxTokens: Schema.optional(Schema.Number),
});

/**
 * Schema for prompt template
 */
export const PromptTemplateSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  content: Schema.String,
  metadata: PromptMetadataSchema,
});

/**
 * Schema for conversation message
 */
export const ConversationMessageSchema = Schema.Struct({
  role: Schema.Literal("system", "user", "assistant", "function"),
  content: Schema.String,
  name: Schema.optional(Schema.String),
});

/**
 * Schema for conversation
 */
export const ConversationSchema = Schema.Struct({
  id: Schema.String,
  messages: Schema.Array(ConversationMessageSchema),
  metadata: Schema.Struct({
    created: Schema.Date,
    updated: Schema.Date,
    totalTokens: Schema.optional(Schema.Number),
    model: Schema.optional(Schema.String),
  }),
});

/**
 * Common variable schemas for prompts
 */
export const CommonVariableSchemas = {
  // Simple text variable
  text: Schema.String,

  // Number with optional range
  number: (min?: number, max?: number) => {
    let schema = Schema.Number;
    if (typeof min === "number") {
      schema = schema.pipe(Schema.greaterThanOrEqualTo(min));
    }
    if (typeof max === "number") {
      schema = schema.pipe(Schema.lessThanOrEqualTo(max));
    }
    return schema;
  },

  // Array of strings
  stringArray: Schema.Array(Schema.String),

  // JSON object
  json: Schema.Struct({}) as unknown as Schema.Schema<Record<string, unknown>>,

  // URL
  url: Schema.String.pipe(Schema.pattern(/^https?:\/\/.+/)),

  // Email
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
};
