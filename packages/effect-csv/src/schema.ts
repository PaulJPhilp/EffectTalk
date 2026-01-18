import { Effect, Schema } from "effect";
import {
  formatParseError,
  extractFieldPath,
  extractExpected,
} from "effect-schema-utils";
import { ValidationError } from "./errors.js";

/**
 * Validate data against schema (for parsing)
 */
export const validateAgainstSchema = <A, I, R>(
  schema: Schema.Schema<A, unknown, R>,
  data: unknown
): Effect.Effect<A, ValidationError, R> =>
  Schema.decodeUnknown(schema)(data).pipe(
    Effect.mapError(
      (parseError) =>
        new ValidationError({
          message: `Schema validation failed: ${formatParseError(parseError)}`,
          fieldPath: extractFieldPath(parseError),
          expected: extractExpected(parseError),
          actual: data,
          cause: parseError as unknown as Error | undefined,
        })
    )
  );

/**
 * Validate data for stringification (encode validation)
 */
export const validateForStringify = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  data: A
): Effect.Effect<A, ValidationError, R> =>
  Schema.encode(schema)(data).pipe(
    Effect.map(() => data),
    Effect.mapError(
      (parseError) =>
        new ValidationError({
          message: `Encode validation failed: ${formatParseError(parseError)}`,
          fieldPath: extractFieldPath(parseError),
          expected: extractExpected(parseError),
          actual: data,
          cause: parseError as unknown as Error | undefined,
        })
    )
  );
