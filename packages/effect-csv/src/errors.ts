import { Data } from "effect";

/**
 * ParseError - Thrown when CSV parsing fails
 *
 * Includes row/column information for debugging
 */
export class ParseError extends Data.TaggedError("ParseError")<{
  readonly message: string;
  readonly row: number; // 1-indexed row number
  readonly column?: number | undefined; // Column number (if applicable)
  readonly snippet: string; // Problematic row content
  readonly cause?: Error | undefined;
}> {}

/**
 * ValidationError - Thrown when schema validation fails
 *
 * Includes field path and expected vs actual information
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly fieldPath: string; // e.g., "users.0.email"
  readonly expected: unknown;
  readonly actual: unknown;
  readonly cause?: Error | undefined;
}> {}

/**
 * StringifyError - Thrown when CSV stringification fails
 */
export class StringifyError extends Data.TaggedError("StringifyError")<{
  readonly message: string;
  readonly reason: "schema_mismatch" | "type_error" | "unknown";
  readonly cause?: Error | undefined;
}> {}

/**
 * CsvStructureError - CSV-specific structural issues
 *
 * e.g., inconsistent column counts, missing headers
 */
export class CsvStructureError extends Data.TaggedError("CsvStructureError")<{
  readonly message: string;
  readonly row: number;
  readonly expectedColumns: number;
  readonly actualColumns: number;
}> {}

/**
 * DelimiterError - Unable to detect or process delimiter
 */
export class DelimiterError extends Data.TaggedError("DelimiterError")<{
  readonly message: string;
  readonly providedDelimiter?: string | undefined;
  readonly cause?: Error | undefined;
}> {}
