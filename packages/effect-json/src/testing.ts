/**
 * Testing utilities for effect-json
 *
 * Provides mock backends and test helpers
 */

import { Effect } from "effect";
import { ParseError, StringifyError } from "./errors.js";
import type { Backend } from "./services/json/implementations/types.js";

/**
 * Mock backend for testing
 *
 * Uses simple JSON.parse/stringify without SuperJSON
 */
export const mockBackend: Backend = {
  parse: (input: unknown) =>
    Effect.try({
      try: () => JSON.parse(String(input)) as unknown,
      catch: (error) =>
        new ParseError({
          message: error instanceof Error ? error.message : String(error),
          line: 0,
          column: 0,
          snippet: String(input),
          ...(error instanceof Error ? { cause: error } : {}),
        }),
    }),

  stringify: (value: unknown, options?: { readonly indent?: number }) =>
    Effect.try({
      try: () => JSON.stringify(value, null, options?.indent ?? 0),
      catch: (error) =>
        new StringifyError({
          message: error instanceof Error ? error.message : String(error),
          reason: "unknown",
          ...(error instanceof Error ? { cause: error } : {}),
        }),
    }),
};
