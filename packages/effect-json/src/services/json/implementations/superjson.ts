/**
 * SuperJSON Backend - Type-preserving JSON serialization
 *
 * Preserves Date, Set, Map, BigInt, RegExp, undefined, NaN, Infinity
 * Requires 'superjson' as an optional peer dependency
 */

import { Effect } from "effect";
import { ParseError, StringifyError } from "../../../errors.js";
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is an intentional utility function name
import { toString } from "../../../utils/index.js";
import type { Backend } from "./types.js";

/**
 * Lazily import superjson to avoid hard dependency
 */
const loadSuperjson = () =>
  Effect.tryPromise({
    try: async () => {
      const superjson = await import("superjson");
      return (
        superjson.default ||
        (superjson as {
          parse: (json: string) => unknown;
          stringify: (value: unknown) => string;
        })
      );
    },
    catch: (error) => {
      let message: string;
      if (
        error instanceof Error &&
        error.message.includes("Cannot find module")
      ) {
        message =
          "superjson is not installed. Install with: bun add superjson\n" +
          "Alternatively, use Json.parse() with the JSON backend as a fallback.";
      } else if (error instanceof Error) {
        message = error.message;
      } else {
        message = String(error);
      }

      return new ParseError({
        message,
        line: 0,
        column: 0,
        snippet: "",
        ...(error instanceof Error ? { cause: error } : {}),
      });
    },
  });

/**
 * SuperJSON Backend implementation
 *
 * Preserves type information for:
 * - Date, Set, Map, BigInt, RegExp
 * - undefined, NaN, Infinity, -Infinity
 * - Enables perfect round-trip serialization
 */
export const superjsonBackend: Backend = {
  parse: (input) =>
    Effect.gen(function* () {
      const superjson = yield* loadSuperjson();
      const inputStr = toString(input);

      return yield* Effect.try({
        try: () => {
          // Try to parse as SuperJSON first
          const parsed = superjson.parse(inputStr);
          // If parse returns undefined or null, fallback to plain JSON
          if (parsed === undefined || parsed === null) {
            const plainParsed = JSON.parse(inputStr);
            return plainParsed === null ? parsed : plainParsed;
          }
          return parsed;
        },
        catch: (error) => {
          return new ParseError({
            message: `SuperJSON parse error: ${error instanceof Error ? error.message : String(error)}`,
            line: 0,
            column: 0,
            snippet: inputStr,
            ...(error instanceof Error ? { cause: error } : {}),
          });
        },
      });
    }),

  stringify: (value, options) =>
    Effect.gen(function* () {
      const superjson = yield* loadSuperjson();

      return yield* Effect.try({
        try: () => {
          const serialized = superjson.stringify(value);
          // Pretty-print if indent specified
          if (options?.indent) {
            const parsed = JSON.parse(serialized);
            return JSON.stringify(parsed, null, options.indent);
          }
          return serialized;
        },
        catch: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const reason = errorMessage.toLowerCase().includes("circular")
            ? ("cycle" as const)
            : ("unknown" as const);

          return new StringifyError({
            message: `SuperJSON stringify error: ${errorMessage}`,
            reason,
            ...(error instanceof Error ? { cause: error } : {}),
          });
        },
      });
    }).pipe(
      Effect.mapError((error) =>
        error instanceof StringifyError
          ? error
          : new StringifyError({
            message: error instanceof Error ? error.message : String(error),
            reason: "unknown",
            ...(error instanceof Error ? { cause: error } : {}),
          }),
      ),
    ),
};
