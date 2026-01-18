import TOML from "@ltd/j-toml";
import { Effect } from "effect";
import { TomlParseError, TomlStringifyError } from "../errors.js";

export class TomlBackend extends Effect.Service<TomlBackend>()("TomlBackend", {
  succeed: {
    parse: (text: string): Effect.Effect<unknown, TomlParseError> =>
      Effect.try({
        try: () => TOML.parse(text, { joiner: "\n" }),
        catch: (error) =>
          new TomlParseError({
            message: error instanceof Error ? error.message : "Unknown error",
          }),
      }),
    stringify: (value: unknown): Effect.Effect<string, TomlStringifyError> =>
      Effect.try({
        try: () => {
          const result = TOML.stringify(value as any);
          // TOML.stringify returns an array of lines, join with newlines
          return Array.isArray(result) ? result.join("\n") : String(result);
        },
        catch: (error) =>
          new TomlStringifyError({
            message: error instanceof Error ? error.message : "Unknown error",
          }),
      }),
  },
}) {}

export const TomlBackendLayer = TomlBackend.Default;
