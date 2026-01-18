import { Effect } from "effect";
import { LiquidFilterError } from "effect-liquid";
import type { ConversationMessage } from "../types.js";
import * as AIFilters from "./ai-filters.js";

/**
 * Helper function to convert value to string
 */
function toString(input: unknown): string {
  if (typeof input === "string") return input;
  if (input === null || input === undefined) return "";
  return String(input);
}

/**
 * Format conversation messages for AI consumption
 * Output format: OpenAI-style chat format or Anthropic format
 */
export function formatConversation(
  input: unknown,
  format: unknown = "openai"
): Effect.Effect<string, LiquidFilterError> {
  return Effect.try({
    try: () => {
      if (!Array.isArray(input)) {
        throw new Error("formatConversation requires an array of messages");
      }

      const messages = input as ConversationMessage[];
      const formatType = toString(format);

      switch (formatType) {
        case "openai":
          return JSON.stringify(
            messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
              ...(msg.name && { name: msg.name }),
            })),
            null,
            2
          );

        case "anthropic":
          return messages
            .map((msg) => {
              const prefix = msg.role === "user" ? "Human:" : "Assistant:";
              return `${prefix} ${msg.content}`;
            })
            .join("\n\n");

        case "plain":
          return messages
            .map((msg) => `[${msg.role.toUpperCase()}]: ${msg.content}`)
            .join("\n\n");

        default:
          throw new Error(`Unknown format: ${formatType}`);
      }
    },
    catch: (error) =>
      new LiquidFilterError({
        message: `Conversation formatting failed: ${error instanceof Error ? error.message : String(error)}`,
        filterName: "formatConversation",
        cause: error,
      }),
  });
}

/**
 * Extract messages by role
 */
export function filterByRole(
  input: unknown,
  role: unknown
): Effect.Effect<readonly ConversationMessage[], LiquidFilterError> {
  return Effect.sync(() => {
    if (!Array.isArray(input)) {
      return [];
    }
    const targetRole = toString(role);
    return (input as ConversationMessage[]).filter(
      (msg) => msg.role === targetRole
    );
  });
}

/**
 * Count conversation tokens
 */
export function conversationTokens(
  input: unknown
): Effect.Effect<number, LiquidFilterError> {
  return Effect.gen(function* () {
    if (!Array.isArray(input)) {
      return 0;
    }
    const messages = input as ConversationMessage[];
    let total = 0;

    for (const msg of messages) {
      const words = msg.content.split(/\s+/).filter((w) => w.length > 0).length;
      // ~1.3 tokens per word + 4 tokens for role overhead
      total += Math.ceil(words * 1.3) + 4;
    }

    return total;
  });
}
