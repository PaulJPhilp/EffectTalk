/**
 * Advanced effect-json usage patterns
 *
 * This example covers:
 * - Working with complex nested schemas
 * - Custom error handling and recovery
 * - Schema composition and reuse
 * - Type inference from schemas
 */

import { Schema, Effect } from "effect";
import { parse, stringify } from "../src/index.js";

// Create reusable schemas
const AddressSchema = Schema.Struct({
  street: Schema.String,
  city: Schema.String,
  zipCode: Schema.String,
  country: Schema.optional(Schema.String),
});

const ContactSchema = Schema.Struct({
  email: Schema.String,
  phone: Schema.optional(Schema.String),
  address: AddressSchema,
});

const PersonSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  contact: ContactSchema,
  tags: Schema.Array(Schema.String),
  metadata: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.String,
    })
  ),
});

type Person = Schema.Schema.Type<typeof PersonSchema>;

const program = Effect.gen(function* () {
  const personJson = `
{
  "id": 1,
  "name": "Alice Johnson",
  "contact": {
    "email": "alice@example.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "Portland",
      "zipCode": "97201",
      "country": "USA"
    }
  },
  "tags": ["developer", "typescript", "effect"],
  "metadata": {
    "department": "Engineering",
    "level": "Senior"
  }
}
  `;

  // Parse with nested schemas
  const person = yield* parse(PersonSchema, personJson);
  yield* Effect.log("Parsed person:", JSON.stringify(person, null, 2));

  // Stringify back to JSON with formatting
  const formatted = yield* stringify(PersonSchema, person);
  yield* Effect.log("Formatted JSON:", formatted);

  // Error recovery: provide defaults for invalid data
  const invalidJson = '{"id": 999, "name": "Bob"}'; // Missing required fields
  const withDefaults = yield* parse(PersonSchema, invalidJson).pipe(
    Effect.orElse(() =>
      Effect.succeed({
        id: 0,
        name: "Unknown",
        contact: {
          email: "unknown@example.com",
          address: {
            street: "Unknown",
            city: "Unknown",
            zipCode: "00000",
          },
        },
        tags: [],
      } as Person)
    )
  );

  yield* Effect.log("With defaults:", withDefaults);
});

Effect.runPromise(program);
