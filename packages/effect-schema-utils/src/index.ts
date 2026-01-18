/**
 * effect-schema-utils - Schema validation utilities for Effect
 *
 * Provides reusable functions for formatting and extracting information from
 * Effect.Schema ParseResult.ParseError objects. These utilities enable consistent
 * error handling across packages that validate data against schemas.
 *
 * @packageDocumentation
 * @module effect-schema-utils
 */

export {
  formatParseError,
  extractFieldPath,
  extractExpected,
  extractActual,
  getErrorMessage,
  extractErrorDetails,
  type ParseErrorDetails,
} from "./schema-utils.js";
