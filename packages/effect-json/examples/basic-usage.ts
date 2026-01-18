/**
 * Basic JSON parsing and stringification with effect-json
 *
 * This example demonstrates the most common use cases:
 * - Parsing JSON with schema validation
 * - Stringifying typed data back to JSON
 * - Error handling for invalid data
 */

import { Schema, Effect } from "effect";
import { parse, stringify } from "../src/index.js";

// Define a schema for user data
const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
  age: Schema.optional(Schema.Number),
});

type User = Schema.Schema.Type<typeof UserSchema>;

const program = Effect.gen(function* () {
  // Parse JSON string to typed object
  const jsonString =
    '{"id": 1, "name": "Alice", "email": "alice@example.com", "age": 30}';

  const user = yield* parse(UserSchema, jsonString);
  yield* Effect.log("Parsed user:", user);

  // Stringify object back to JSON
  const stringified = yield* stringify(UserSchema, user);
  yield* Effect.log("Stringified:", stringified);

  // Invalid data will fail with detailed error
  const invalidJson = '{"id": "not-a-number", "name": "Bob"}';
  const invalid = yield* parse(UserSchema, invalidJson).pipe(
    Effect.catchTag("ParseError", (err) =>
      Effect.logError(`Parse failed at line ${err.line}, column ${err.column}`)
    ),
    Effect.orElse(() => Effect.succeed(null))
  );

  return { user, invalid };
});

// Run the program
Effect.runPromise(program);
