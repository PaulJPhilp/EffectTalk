/**
 * Schema validation utilities for Effect.Schema error handling
 *
 * Provides reusable functions for formatting and extracting information from
 * ParseResult.ParseError objects. These utilities enable consistent error
 * handling across packages that validate data against schemas.
 *
 * @packageDocumentation
 */

import { ParseResult } from "effect";

/**
 * Format a ParseResult.ParseError into a human-readable string
 *
 * Uses Effect's TreeFormatter for consistent, detailed error messages.
 * This is the canonical way to format schema validation errors.
 *
 * @example
 * ```typescript
 * const schema = Schema.Struct({ age: Schema.Number })
 * const result = await Effect.runPromise(
 *   Effect.either(Schema.decodeUnknown(schema)({ age: "not-a-number" }))
 * )
 * if (result._tag === "Left") {
 *   const message = formatParseError(result.left)
 *   console.log(message) // "Expected a number, received a string"
 * }
 * ```
 *
 * @param error - The ParseError to format
 * @returns A human-readable error message
 */
export const formatParseError = (error: ParseResult.ParseError): string =>
  ParseResult.TreeFormatter.formatErrorSync(error);

/**
 * Extract the field path from a ParseError
 *
 * Returns the dotted path to the field that failed validation.
 * Useful for pinpointing which field in a complex object caused the error.
 *
 * @example
 * ```typescript
 * // For nested validation failures, returns something like:
 * "user.profile.email"  // nested field
 * "users.0.name"        // array element
 * "unknown"             // if path cannot be determined
 * ```
 *
 * @param error - The ParseError to extract path from
 * @returns The field path as a string, or "unknown" if path cannot be determined
 */
export const extractFieldPath = (error: ParseResult.ParseError): string => {
  // biome-ignore lint/suspicious/noExplicitAny: ParseError internals vary
  const path = (error as any)?.path;
  if (Array.isArray(path)) {
    return path.join(".");
  }
  return "unknown";
};

/**
 * Extract the expected type/value from a ParseError
 *
 * Returns information about what the schema expected to receive.
 * The return value can be a type name, schema object, or other validation constraint.
 *
 * @example
 * ```typescript
 * // Schema.Number validation failure might return: "a number"
 * // Schema.String validation failure might return: "a string"
 * // Schema with custom message might return the full schema object
 * ```
 *
 * @param error - The ParseError to extract expected information from
 * @returns The expected value or type, or "unknown" if not determinable
 */
export const extractExpected = (error: ParseResult.ParseError): unknown => {
  // biome-ignore lint/suspicious/noExplicitAny: ParseError internals vary
  return (error as any)?.expected ?? "unknown";
};

/**
 * Extract the actual value from a ParseError
 *
 * Returns the value that was provided and failed validation.
 * Useful for debugging by seeing exactly what input caused the error.
 *
 * @param error - The ParseError to extract actual value from
 * @returns The actual value that caused validation to fail
 */
export const extractActual = (error: ParseResult.ParseError): unknown => {
  // biome-ignore lint/suspicious/noExplicitAny: ParseError internals vary
  return (error as any)?.actual;
};

/**
 * Create a simple error message from ParseError
 *
 * Attempts to extract a direct error message first, then falls back
 * to formatting the entire error using formatParseError.
 *
 * Useful when you only want a brief error message, not the full tree.
 *
 * @param error - The ParseError to extract message from
 * @returns A simple error message string
 */
export const getErrorMessage = (error: ParseResult.ParseError): string => {
  try {
    // biome-ignore lint/suspicious/noExplicitAny: ParseError internals vary
    const message = (error as any)?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    return formatParseError(error);
  } catch {
    // If formatting fails, return a generic message
    return "Validation failed";
  }
};

/**
 * Extract multiple error details at once
 *
 * Convenience function that extracts all common error details in a single call.
 * Returns a structured object with message, path, expected, and actual.
 *
 * @example
 * ```typescript
 * const schema = Schema.Struct({
 *   user: Schema.Struct({
 *     email: Schema.String,
 *   }),
 * })
 * const result = await Effect.runPromise(
 *   Effect.either(Schema.decodeUnknown(schema)({
 *     user: { email: 123 }
 *   }))
 * )
 * if (result._tag === "Left") {
 *   const details = extractErrorDetails(result.left)
 *   console.log(details)
 *   // {
 *   //   message: "Expected a string, received a number",
 *   //   path: "user.email",
 *   //   expected: "a string",
 *   //   actual: 123
 *   // }
 * }
 * ```
 */
export interface ParseErrorDetails {
  readonly message: string;
  readonly path: string;
  readonly expected: unknown;
  readonly actual: unknown;
}

/**
 * @internal
 */
export const extractErrorDetails = (
  error: ParseResult.ParseError
): ParseErrorDetails => ({
  message: getErrorMessage(error),
  path: extractFieldPath(error),
  expected: extractExpected(error),
  actual: extractActual(error),
});
