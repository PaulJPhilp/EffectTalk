import { Effect } from "effect";
import { YamlBackend, YamlBackendLayer } from "@/effect-yaml/backends/YamlBackend.js";
import { YamlParseError, YamlStringifyError } from "@/effect-yaml/errors.js";

/**
 * Parses a YAML string into a JavaScript object.
 *
 * @param text The YAML string to parse.
 * @returns An `Effect` that resolves to the parsed object or fails with a `YamlParseError`.
 */
export const parse = (
  text: string
): Effect.Effect<unknown, YamlParseError, YamlBackend> =>
  YamlBackend.pipe(Effect.flatMap((backend) => backend.parse(text)));

export const parseDefault = (
  text: string
): Effect.Effect<unknown, YamlParseError> =>
  parse(text).pipe(Effect.provide(YamlBackendLayer));

/**
 * Stringifies a JavaScript object into a YAML string.
 *
 * @param value The object to stringify.
 * @returns An `Effect` that resolves to the YAML string or fails with a `YamlStringifyError`.
 */
export const stringify = (
  value: unknown
): Effect.Effect<string, YamlStringifyError, YamlBackend> =>
  YamlBackend.pipe(Effect.flatMap((backend) => backend.stringify(value)));

export const stringifyDefault = (
  value: unknown
): Effect.Effect<string, YamlStringifyError> =>
  stringify(value).pipe(Effect.provide(YamlBackendLayer));
