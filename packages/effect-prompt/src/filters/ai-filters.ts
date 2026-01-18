import { Effect } from "effect";
import { LiquidFilterError } from "effect-liquid";

/**
 * Helper function to convert value to string
 */
function toString(input: unknown): string {
  if (typeof input === "string") return input;
  if (input === null || input === undefined) return "";
  return String(input);
}

/**
 * Count approximate tokens in text (simple whitespace-based)
 * For production, integrate with tiktoken or similar
 */
export function tokenCount(
  input: unknown
): Effect.Effect<number, LiquidFilterError> {
  return Effect.sync(() => {
    const text = toString(input);
    // Simple approximation: ~1.3 tokens per word
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    return Math.ceil(words * 1.3);
  });
}

/**
 * Sanitize text for AI consumption
 * Removes control characters, normalizes whitespace
 */
export function sanitize(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.sync(() => {
    const text = toString(input);
    return (
      text
        // Remove control characters except newline/tab
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
        // Normalize unicode
        .normalize("NFKC")
        // Collapse multiple spaces
        .replace(/  +/g, " ")
        // Trim
        .trim()
    );
  });
}

/**
 * Truncate text to token budget
 */
export function truncateToTokens(
  input: unknown,
  maxTokens: unknown = 1000,
  ellipsis: unknown = "..."
): Effect.Effect<string, LiquidFilterError> {
  return Effect.gen(function* () {
    const text = toString(input);
    const max = typeof maxTokens === "number" ? maxTokens : 1000;
    const ell = toString(ellipsis);

    // Estimate current tokens
    const currentTokens = yield* tokenCount(text);

    if (currentTokens <= max) {
      return text;
    }

    // Binary search for truncation point
    const words = text.split(/\s+/);
    let left = 0;
    let right = words.length;
    let best = 0;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const candidate = words.slice(0, mid).join(" ");
      const candidateTokens = yield* tokenCount(candidate + ell);

      if (candidateTokens <= max) {
        best = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return words.slice(0, best).join(" ") + ell;
  });
}

/**
 * Convert markdown to plain text for token counting
 */
export function stripMarkdown(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.sync(() => {
    const text = toString(input);
    return (
      text
        // Remove headers
        .replace(/^#{1,6}\s+/gm, "")
        // Remove links but keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        // Remove images
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
        // Remove bold/italic
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, "")
        .replace(/`([^`]+)`/g, "$1")
    );
  });
}

/**
 * Escape special characters for JSON strings
 */
export function jsonEscape(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.sync(() => {
    const text = toString(input);
    // biome-ignore lint/suspicious/noExplicitAny: JSON.stringify requires any
    return JSON.stringify(text).slice(1, -1) as any;
  });
}

/**
 * Convert array to numbered list
 */
export function toNumberedList(
  input: unknown,
  startNumber: unknown = 1
): Effect.Effect<string, LiquidFilterError> {
  return Effect.sync(() => {
    if (!Array.isArray(input)) {
      return toString(input);
    }
    const start = typeof startNumber === "number" ? startNumber : 1;
    return input
      .map((item, idx) => `${start + idx}. ${toString(item)}`)
      .join("\n");
  });
}

/**
 * Convert array to bulleted list
 */
export function toBulletedList(
  input: unknown,
  bullet: unknown = "-"
): Effect.Effect<string, LiquidFilterError> {
  return Effect.sync(() => {
    if (!Array.isArray(input)) {
      return toString(input);
    }
    const bulletChar = toString(bullet);
    return input.map((item) => `${bulletChar} ${toString(item)}`).join("\n");
  });
}
