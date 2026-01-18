# effect-schema-utils

**Part of the [Hume monorepo](../README.md)** - Schema validation utilities for Effect.

[![Status: Production](https://img.shields.io/badge/Status-Production-green.svg)](https://github.com/PaulJPhilp/trinity-hume)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Effect 3.x](https://img.shields.io/badge/Effect-3.x-blueviolet.svg)](https://effect.website)

## Overview

Schema validation utilities for working with `Effect.Schema`. Provides functions to format and extract information from `ParseResult.ParseError` objects, enabling consistent error handling across packages that validate data against schemas.

## Installation

```bash
bun add effect-schema-utils
```

## Usage

### Format Parse Errors

```typescript
import { formatParseError } from "effect-schema-utils"
import { Schema, Effect } from "effect"

const schema = Schema.Struct({ age: Schema.Number })
const result = await Effect.runPromise(
  Effect.either(Schema.decodeUnknown(schema)({ age: "not-a-number" }))
)

if (result._tag === "Left") {
  const message = formatParseError(result.left)
  console.log(message) // "Expected a number, received a string"
}
```

### Extract Error Details

```typescript
import { extractErrorDetails } from "effect-schema-utils"
import { Schema, Effect } from "effect"

const schema = Schema.Struct({
  user: Schema.Struct({
    email: Schema.String,
  }),
})

const result = await Effect.runPromise(
  Effect.either(Schema.decodeUnknown(schema)({
    user: { email: 123 }
  }))
)

if (result._tag === "Left") {
  const details = extractErrorDetails(result.left)
  console.log(details)
  // {
  //   message: "Expected a string, received a number",
  //   path: "user.email",
  //   expected: "a string",
  //   actual: 123
  // }
}
```

### Extract Specific Error Information

```typescript
import {
  extractFieldPath,
  extractExpected,
  extractActual,
  getErrorMessage,
} from "effect-schema-utils"
import { Schema, Effect } from "effect"

const schema = Schema.Struct({
  items: Schema.Array(Schema.Number),
})

const result = await Effect.runPromise(
  Effect.either(Schema.decodeUnknown(schema)({
    items: [1, 2, "invalid", 4]
  }))
)

if (result._tag === "Left") {
  const error = result.left
  console.log(extractFieldPath(error))   // "items.2"
  console.log(extractExpected(error))    // Schema metadata
  console.log(extractActual(error))      // "invalid"
  console.log(getErrorMessage(error))    // User-friendly message
}
```

## API Reference

### Functions

- `formatParseError(error)` - Format a ParseError into a human-readable string using Effect's TreeFormatter
- `extractFieldPath(error)` - Extract the dotted path to the field that failed validation
- `extractExpected(error)` - Extract what the schema expected to receive
- `extractActual(error)` - Extract the actual value that was provided
- `getErrorMessage(error)` - Extract a simple error message string
- `extractErrorDetails(error)` - Extract all common error details at once

### Types

- `ParseErrorDetails` - Structured object with message, path, expected, and actual

## When to Use

Use `effect-schema-utils` whenever you:
- Need to format `Effect.Schema` validation errors for users
- Want to extract specific information from parse errors
- Are building packages that validate data against schemas
- Need consistent error handling across your codebase

## License

MIT
