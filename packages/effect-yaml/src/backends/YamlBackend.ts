import { Effect } from "effect";
import YAML from "yaml";
import { YamlParseError, YamlStringifyError } from "../errors.js";

export class YamlBackend extends Effect.Service<YamlBackend>()("YamlBackend", {
  succeed: {
    parse: (text: string): Effect.Effect<unknown, YamlParseError> =>
      Effect.try({
        try: () => YAML.parse(text),
        catch: (error) =>
          new YamlParseError({
            message: error instanceof Error ? error.message : "Unknown error",
          }),
      }),
    stringify: (value: unknown): Effect.Effect<string, YamlStringifyError> =>
      Effect.try({
        try: () => YAML.stringify(value),
        catch: (error) =>
          new YamlStringifyError({
            message: error instanceof Error ? error.message : "Unknown error",
          }),
      }),
  },
}) {}

export const YamlBackendLayer = YamlBackend.Default;
