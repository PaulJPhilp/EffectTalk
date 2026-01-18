/**
 * Error handling patterns with effect-json
 *
 * This example demonstrates:
 * - Catching and handling parse errors with line/column info
 * - Handling validation errors
 * - Error recovery strategies
 * - Detailed error inspection
 */

import { Schema, Effect } from "effect";
import { parse, ParseError, ValidationError } from "../src/index.js";

const ConfigSchema = Schema.Struct({
  host: Schema.String,
  port: Schema.Number.pipe(Schema.minSuccess(1), Schema.maxSuccess(65535)),
  ssl: Schema.Boolean,
  timeout: Schema.optional(Schema.Number),
});

const testCases = [
  // Valid
  '{"host": "localhost", "port": 8080, "ssl": true}',

  // Syntax error
  '{"host": "localhost", "port": 8080, "ssl": true,}', // trailing comma

  // Missing required field
  '{"port": 8080, "ssl": true}',

  // Invalid type
  '{"host": "localhost", "port": "invalid", "ssl": true}',

  // Out of range
  '{"host": "localhost", "port": 99999, "ssl": true}',
];

const program = Effect.gen(function* () {
  for (const testCase of testCases) {
    yield* Effect.log("Testing:", testCase);

    const result = yield* parse(ConfigSchema, testCase).pipe(Effect.either);

    if (result._tag === "Right") {
      yield* Effect.log("✓ Success:", result.right);
    } else {
      const error = result.left;

      // Handle ParseError (syntax)
      if (error._tag === "ParseError") {
        yield* Effect.log(
          `✗ ParseError at line ${error.line}, column ${error.column}:`,
          error.message
        );
        yield* Effect.log("Snippet:", error.snippet);
      }
      // Handle ValidationError (schema violation)
      else if (error._tag === "ValidationError") {
        yield* Effect.log("✗ ValidationError:");
        for (const issue of error.issues) {
          yield* Effect.log(`  - ${issue.message}`);
        }
      }
      // Unexpected error
      else {
        yield* Effect.log("✗ Unexpected error:", error);
      }
    }

    yield* Effect.log("---");
  }
});

Effect.runPromise(program);
