import { Effect, type Schema } from "effect";
import type {
  ParseError,
  StringifyError,
  ValidationError,
} from "../../errors.js";
import { validateAgainstSchema, validateForStringify } from "../../schema.js";
import {
  type Backend,
  jsonBackend,
  jsoncBackend,
  type StringifyOptions,
  superjsonBackend,
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
    default:
      // This should never happen with current JsonFormat type
      // but provides runtime safety if new formats are added
      throw new Error(`Unsupported JSON format: ${format}`);
  }
};

export const parse = <A, I>(
  format: JsonFormat,
  schema: Schema.Schema<A, I>,
  input: string | Buffer,
): Effect.Effect<A, ParseError | ValidationError> =>
  Effect.gen(function* () {
    const raw = yield* getBackend(format).parse(input);
    const validated = yield* validateAgainstSchema(schema, raw as I);
    return validated;
  });

export const stringify = <A, I>(
  format: JsonFormat,
  schema: Schema.Schema<A, I>,
  value: A,
  options?: StringifyOptions,
): Effect.Effect<string, StringifyError | ValidationError> =>
  Effect.gen(function* () {
    yield* validateForStringify(schema, value);
    const result = yield* getBackend(format).stringify(value, options);
    return result;
  });

// Convenience functions for specific formats
export const parseJson = <A, I>(
  schema: Schema.Schema<A, I>,
  input: string | Buffer,
): Effect.Effect<A, ParseError | ValidationError> =>
  parse("json", schema, input);

export const stringifyJson = <A, I>(
  schema: Schema.Schema<A, I>,
  value: A,
  options?: StringifyOptions,
): Effect.Effect<string, StringifyError | ValidationError> =>
  stringify("json", schema, value, options);

export const parseJsonc = <A, I>(
  schema: Schema.Schema<A, I>,
  input: string | Buffer,
): Effect.Effect<A, ParseError | ValidationError> =>
  parse("jsonc", schema, input);

export const stringifyJsonc = <A, I>(
  schema: Schema.Schema<A, I>,
  value: A,
  options?: StringifyOptions,
): Effect.Effect<string, StringifyError | ValidationError> =>
  stringify("jsonc", schema, value, options);

export const parseSuperjson = <A, I>(
  schema: Schema.Schema<A, I>,
  input: string | Buffer,
): Effect.Effect<A, ParseError | ValidationError> =>
  parse("superjson", schema, input);

export const stringifySuperjson = <A, I>(
  schema: Schema.Schema<A, I>,
  value: A,
  options?: StringifyOptions,
): Effect.Effect<string, StringifyError | ValidationError> =>
  stringify("superjson", schema, value, options);
