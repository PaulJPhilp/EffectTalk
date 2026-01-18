import { Effect, type Schema } from "effect";
import { validateAgainstSchema, validateForStringify } from "../../schema.js";
import {
  jsonBackend,
  jsoncBackend,
  superjsonBackend,
  type Backend,
  type StringifyOptions,
} from "./implementations/index.js";
import type { JsonFormat } from "./types.js";

export const getBackend = (format: JsonFormat): Backend => {
  switch (format) {
    case "json":
      return jsonBackend;
    case "jsonc":
      return jsoncBackend;
    case "superjson":
      return superjsonBackend;
  }
};

export const parse = <A, I>(
  format: JsonFormat,
  schema: Schema.Schema<A, I>,
  input: string | Buffer
): Effect.Effect<A, any> =>
  Effect.gen(function* () {
    const raw = yield* getBackend(format).parse(input);
    const validated = yield* validateAgainstSchema(schema, raw as I);
    return validated;
  });

export const stringify = <A, I>(
  format: JsonFormat,
  schema: Schema.Schema<A, I>,
  value: A,
  options?: StringifyOptions
): Effect.Effect<string, any> =>
  Effect.gen(function* () {
    yield* validateForStringify(schema, value);
    const result = yield* getBackend(format).stringify(value, options);
    return result;
  });

// Convenience functions for specific formats
export const parseJson = <A, I>(
  schema: Schema.Schema<A, I>,
  input: string | Buffer
): Effect.Effect<A, any> => parse("json", schema, input);

export const stringifyJson = <A, I>(
  schema: Schema.Schema<A, I>,
  value: A,
  options?: StringifyOptions
): Effect.Effect<string, any> => stringify("json", schema, value, options);

export const parseJsonc = <A, I>(
  schema: Schema.Schema<A, I>,
  input: string | Buffer
): Effect.Effect<A, any> => parse("jsonc", schema, input);

export const stringifyJsonc = <A, I>(
  schema: Schema.Schema<A, I>,
  value: A,
  options?: StringifyOptions
): Effect.Effect<string, any> => stringify("jsonc", schema, value, options);

export const parseSuperjson = <A, I>(
  schema: Schema.Schema<A, I>,
  input: string | Buffer
): Effect.Effect<A, any> => parse("superjson", schema, input);

export const stringifySuperjson = <A, I>(
  schema: Schema.Schema<A, I>,
  value: A,
  options?: StringifyOptions
): Effect.Effect<string, any> => stringify("superjson", schema, value, options);
