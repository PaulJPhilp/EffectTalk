import { Schema } from "effect";

const UserSchema = Schema.Array(
  Schema.Struct({
    id: Schema.NumberFromString,
    name: Schema.String,
    email: Schema.String,
    active: Schema.BooleanFromString,
  })
);

export default {
  valid_users: {
    schema: UserSchema,
    raw: `id,name,email,active
1,Alice,alice@example.com,true
2,Bob,bob@example.com,false`,
    data: [
      { id: 1, name: "Alice", email: "alice@example.com", active: true },
      { id: 2, name: "Bob", email: "bob@example.com", active: false },
    ],
    __metadata: {
      description: "Valid users with all fields",
      should_parse: true,
      should_validate: true,
      round_trip: true,
    },
  },

  quoted_fields: {
    schema: UserSchema,
    raw: `id,name,email,active
1,"Alice, Jr.","alice@example.com",true`,
    data: [
      {
        id: 1,
        name: "Alice, Jr.",
        email: "alice@example.com",
        active: true,
      },
    ],
    __metadata: {
      description: "CSV with quoted fields containing commas",
      should_parse: true,
      should_validate: true,
      round_trip: true,
    },
  },

  with_empty_lines: {
    schema: UserSchema,
    raw: `id,name,email,active
1,Alice,alice@example.com,true

2,Bob,bob@example.com,false`,
    data: [
      { id: 1, name: "Alice", email: "alice@example.com", active: true },
      { id: 2, name: "Bob", email: "bob@example.com", active: false },
    ],
    __metadata: {
      description: "CSV with empty lines (should be skipped by default)",
      should_parse: true,
      should_validate: true,
      round_trip: true,
    },
  },

  single_user: {
    schema: UserSchema,
    raw: `id,name,email,active
42,Charlie,charlie@example.com,true`,
    data: [
      { id: 42, name: "Charlie", email: "charlie@example.com", active: true },
    ],
    __metadata: {
      description: "Single user record",
      should_parse: true,
      should_validate: true,
      round_trip: true,
    },
  },
} as const;
