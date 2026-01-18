import { Effect, Stream } from "effect";
import type { ParseError, StringifyError } from "../errors.js";

/**
 * Options for CSV parsing
 */
export type ParseOptions = {
  readonly delimiter?: string; // Default: auto-detect
  readonly header?: boolean; // Default: true
  readonly skipEmptyLines?: boolean; // Default: true
  readonly trimFields?: boolean; // Default: false
  readonly dynamicTyping?: boolean; // Auto-convert numbers/bools
  readonly quote?: string; // Quote character (default: ")
  readonly escape?: string; // Escape character (default: ")
  readonly comment?: string; // Comment character (skip lines)
};

/**
 * Options for CSV stringification
 */
export type StringifyOptions = {
  readonly delimiter?: string; // Default: ","
  readonly header?: boolean; // Include header row
  readonly quote?: string | boolean; // Quote all fields or auto
  readonly escape?: string; // Escape character
  readonly lineEnding?: "\n" | "\r\n"; // Line ending (default: \n)
};

/**
 * CSV Backend Interface
 *
 * All backends must implement these methods
 */
export interface CsvBackend {
  /**
   * Parse CSV string/Buffer to array of records
   */
  readonly parse: (
    input: string | Buffer,
    options?: ParseOptions
  ) => Effect.Effect<ReadonlyArray<unknown>, ParseError>;

  /**
   * Stringify array of records to CSV string
   */
  readonly stringify: (
    data: ReadonlyArray<unknown>,
    options?: StringifyOptions
  ) => Effect.Effect<string, StringifyError>;

  /**
   * Parse CSV as a stream (row by row)
   */
  readonly parseStream: (
    input: Stream.Stream<string, ParseError>,
    options?: ParseOptions
  ) => Stream.Stream<unknown, ParseError>;

  /**
   * Stringify data as a CSV stream
   */
  readonly stringifyStream: (
    data: Stream.Stream<unknown, never>,
    options?: StringifyOptions
  ) => Stream.Stream<string, StringifyError>;
}
