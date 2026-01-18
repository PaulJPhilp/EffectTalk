import { Effect, Schema } from "effect";
import type {
  CsvBackend,
  ParseOptions,
  StringifyOptions,
} from "./backends/types.js";
import { papaParse } from "./backends/papaparse.js";
import { validateAgainstSchema, validateForStringify } from "./schema.js";
import type { ParseError, ValidationError, StringifyError } from "./errors.js";

/**
 * Parse CSV with schema validation
 *
 * @example
 * ```typescript
 * const UserSchema = Schema.Array(
 *   Schema.Struct({
 *     id: Schema.NumberFromString,
 *     name: Schema.String,
 *     email: Schema.String
 *   })
 * )
 *
 * const users = await Effect.runPromise(
 *   parse(UserSchema, csvString, { delimiter: ',' })
 * )
 * ```
 */
export const parse = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  input: string | Buffer,
  options?: ParseOptions,
  backend: CsvBackend = papaParse
): Effect.Effect<A, ParseError | ValidationError, R> =>
  backend.parse(input, options).pipe(
    // biome-ignore lint/suspicious/noExplicitAny: schema typing is generic
    Effect.flatMap((rawData) => validateAgainstSchema(schema as any, rawData))
  ) as Effect.Effect<A, ParseError | ValidationError, R>;

/**
 * Stringify data to CSV with schema validation
 *
 * @example
 * ```typescript
 * const csv = await Effect.runPromise(
 *   stringify(UserSchema, users, { delimiter: ',' })
 * )
 * ```
 */
export const stringify = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  data: A,
  options?: StringifyOptions,
  backend: CsvBackend = papaParse
): Effect.Effect<string, ValidationError | StringifyError, R> =>
  validateForStringify(schema, data).pipe(
    // biome-ignore lint/suspicious/noExplicitAny: needs any for papaparse
    Effect.flatMap(() => backend.stringify(data as any, options))
  ) as Effect.Effect<string, ValidationError | StringifyError, R>;

/**
 * Parse Tab-Separated Values (TSV)
 */
export const parseTsv = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  input: string | Buffer,
  options?: Omit<ParseOptions, "delimiter">,
  backend: CsvBackend = papaParse
): Effect.Effect<A, ParseError | ValidationError, R> =>
  parse(schema, input, { ...options, delimiter: "\t" }, backend);

/**
 * Stringify to Tab-Separated Values (TSV)
 */
export const stringifyTsv = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  data: A,
  options?: Omit<StringifyOptions, "delimiter">,
  backend: CsvBackend = papaParse
): Effect.Effect<string, ValidationError | StringifyError, R> =>
  stringify(schema, data, { ...options, delimiter: "\t" }, backend);
