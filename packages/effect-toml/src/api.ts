import { Effect } from "effect";
import { TomlBackend, TomlBackendLayer } from "./backends/TomlBackend.js";
import { TomlParseError, TomlStringifyError } from "./errors.js";

/**
 * Parses a TOML string into a JavaScript object.
 *
 * @param text The TOML string to parse.
 * @returns An `Effect` that resolves to the parsed object or fails with a `TomlParseError`.
 */
export const parse = (text: string): Effect.Effect<unknown, TomlParseError> =>
  Effect.provide(
    Effect.gen(function* () {
      const backend = yield* TomlBackend;
      return yield* backend.parse(text);
    }),
    TomlBackendLayer
  );

/**
 * Stringifies a JavaScript object into a TOML string.
 *
 * @param value The object to stringify.
 * @returns An `Effect` that resolves to the TOML string or fails with a `TomlStringifyError`.
 */
export const stringify = (
  value: unknown
): Effect.Effect<string, TomlStringifyError> =>
  Effect.provide(
    Effect.gen(function* () {
      const backend = yield* TomlBackend;
      return yield* backend.stringify(value);
    }),
    TomlBackendLayer
  );
