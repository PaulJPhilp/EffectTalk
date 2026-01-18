/**
 * Testing with effect-json
 *
 * This example demonstrates:
 * - Using test fixtures
 * - Testing effect programs that use JSON parsing
 * - Validating JSON in tests
 * - Creating test data with schemas
 */

import { Schema, Effect, Layer } from "effect";
import { parse, stringify } from "../src/index.js";

const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
});

type User = Schema.Schema.Type<typeof UserSchema>;

// Test fixture: valid user
const validUserJson =
  '{"id": 1, "name": "Test User", "email": "test@example.com"}';

// Test fixture: invalid JSON
const invalidUserJson = '{"id": "not-a-number"}';

// Example function that uses JSON parsing
const getUserById = (userId: number, json: string) =>
  Effect.gen(function* () {
    const user = yield* parse(UserSchema, json);
    if (user.id === userId) {
      return user;
    }
    return yield* Effect.fail(new Error(`User ${userId} not found`));
  });

const program = Effect.gen(function* () {
  // Test 1: Parse valid data
  yield* Effect.log("Test 1: Parsing valid user data");
  const user = yield* parse(UserSchema, validUserJson);
  yield* Effect.log("Result:", user);

  // Test 2: Verify round-trip (parse -> stringify -> parse)
  yield* Effect.log("\nTest 2: Round-trip test");
  const stringified = yield* stringify(UserSchema, user);
  const reparsed = yield* parse(UserSchema, stringified);
  const isEqual = JSON.stringify(user) === JSON.stringify(reparsed);
  yield* Effect.log("Round-trip successful:", isEqual);

  // Test 3: Error handling
  yield* Effect.log("\nTest 3: Error handling");
  const error = yield* parse(UserSchema, invalidUserJson).pipe(Effect.either);
  if (error._tag === "Left") {
    yield* Effect.log("Caught expected error:", error.left._tag);
  }

  // Test 4: Integration test
  yield* Effect.log("\nTest 4: Integration test");
  const foundUser = yield* getUserById(1, validUserJson);
  yield* Effect.log("Found user:", foundUser);

  const notFound = yield* getUserById(999, validUserJson).pipe(Effect.either);
  if (notFound._tag === "Left") {
    yield* Effect.log("Caught expected error for missing user");
  }
});

Effect.runPromise(program);
