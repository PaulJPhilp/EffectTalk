import { Effect, Schema, Stream } from "effect";
import type {
  CsvBackend,
  ParseOptions,
  StringifyOptions,
} from "./backends/types.js";
import { papaParse } from "./backends/papaparse.js";
import { validateAgainstSchema } from "./schema.js";
import type { ParseError, ValidationError, StringifyError } from "./errors.js";

/**
 * Parse CSV stream row-by-row with schema validation
 *
 * Useful for large files that don't fit in memory
 *
 * @example
 * ```typescript
 * const userStream = parseStream(
 *   UserSchema,
 *   Stream.fromReadableStream(() => fs.createReadStream('users.csv')),
 *   { delimiter: ',' }
 * )
 *
 * // Process 1000 rows at a time
 * const processed = userStream.pipe(
 *   Stream.grouped(1000),
 *   Stream.mapEffect((batch) => processUsers(batch))
 * )
 * ```
 */
export const parseStream = <A, I, R>(
  itemSchema: Schema.Schema<A, I, R>,
  inputStream: Stream.Stream<string, ParseError>,
  options?: ParseOptions,
  backend: CsvBackend = papaParse
): Stream.Stream<A, ParseError | ValidationError, never> =>
  backend.parseStream(inputStream, options).pipe(
    // biome-ignore lint/suspicious/noExplicitAny: schema typing is generic
    Stream.mapEffect((row) => validateAgainstSchema(itemSchema as any, row))
  ) as Stream.Stream<A, ParseError | ValidationError, never>;

/**
 * Stringify data stream to CSV
 *
 * @example
 * ```typescript
 * const csvStream = stringifyStream(
 *   UserSchema,
 *   userDataStream,
 *   { delimiter: ',', header: true }
 * )
 *
 * // Write to file
 * await Effect.runPromise(
 *   Stream.run(csvStream, Sink.toFile('output.csv'))
 * )
 * ```
 */
export const stringifyStream = <A, I, R>(
  itemSchema: Schema.Schema<A, I, R>,
  dataStream: Stream.Stream<A, never, R>,
  options?: StringifyOptions,
  backend: CsvBackend = papaParse
): Stream.Stream<string, StringifyError, never> =>
  // biome-ignore lint/suspicious/noExplicitAny: needs any for papaparse compatibility
  backend.stringifyStream(dataStream as any, options) as Stream.Stream<
    string,
    StringifyError,
    never
  >;
