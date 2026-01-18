# effect-csv

Type-safe, schema-driven CSV parsing and stringification for Effect.

Part of the [Hume monorepo](https://github.com/PaulJPhilp/hume) - Layer 1: Resources.

## Features

- **Type-Safe Parsing**: Use Effect.Schema for compile-time and runtime validation
- **Multiple Delimiters**: CSV, TSV, or custom separators
- **Streaming Support**: Process large files row-by-row with Effect.Stream
- **Pluggable Backends**: Primary PapaParse backend with extensible architecture
- **Comprehensive Error Handling**: Clear, actionable error messages with context
- **Effect-Native Design**: Full Effect.Effect return types throughout

## Installation

```bash
bun add effect-csv
```

## Quick Start

```typescript
import { Effect, Schema } from "effect"
import { parse, stringify } from "effect-csv"

// Define your data schema
const UserSchema = Schema.Array(
  Schema.Struct({
    id: Schema.NumberFromString,
    name: Schema.String,
    email: Schema.String,
  })
)

// Parse CSV
const csvString = `id,name,email
1,Alice,alice@example.com
2,Bob,bob@example.com`

const users = await Effect.runPromise(
  parse(UserSchema, csvString)
)

// users = [
//   { id: 1, name: "Alice", email: "alice@example.com" },
//   { id: 2, name: "Bob", email: "bob@example.com" }
// ]

// Stringify back to CSV
const csv = await Effect.runPromise(stringify(UserSchema, users))
```

## Core API

### `parse(schema, input, options?, backend?)`

Parse CSV data with schema validation.

```typescript
const users = await Effect.runPromise(
  parse(UserSchema, csvString, { delimiter: "," })
)
```

**Options:**
- `delimiter` - CSV delimiter (default: auto-detect)
- `header` - Map first row to object keys (default: true)
- `skipEmptyLines` - Skip empty rows (default: true)
- `trimFields` - Trim whitespace from fields (default: false)
- `dynamicTyping` - Auto-convert to numbers/booleans (default: false)

### `stringify(schema, data, options?, backend?)`

Stringify data to CSV with validation.

```typescript
const csv = await Effect.runPromise(
  stringify(UserSchema, users, { delimiter: "," })
)
```

**Options:**
- `delimiter` - CSV delimiter (default: ",")
- `header` - Include header row (default: true)
- `quote` - Quote strategy: boolean or quote character
- `escape` - Escape character (default: `"`)
- `lineEnding` - "\n" or "\r\n" (default: "\n")

### `parseTsv(schema, input, options?, backend?)`

Convenience function for Tab-Separated Values.

```typescript
const data = await Effect.runPromise(
  parseTsv(UserSchema, tsvString)
)
```

### `stringifyTsv(schema, data, options?, backend?)`

Stringify to Tab-Separated Values.

```typescript
const tsv = await Effect.runPromise(
  stringifyTsv(UserSchema, data)
)
```

## Streaming API

For large files that don't fit in memory, use the streaming API:

```typescript
import { parseStream, stringifyStream } from "effect-csv/Stream"
import { Stream } from "effect"
import { createReadStream } from "fs"

// Parse stream row-by-row
const userStream = parseStream(
  UserItemSchema,
  Stream.fromReadableStream(() => createReadStream("users.csv")),
  { delimiter: "," }
)

// Process in batches
await Effect.runPromise(
  userStream.pipe(
    Stream.grouped(1000),
    Stream.mapEffect((batch) => processBatch(batch)),
    Stream.runDrain
  )
)
```

## Error Handling

All errors are discriminated using `Data.TaggedError` for explicit error handling:

```typescript
import { Either } from "effect"
import { ParseError, ValidationError } from "effect-csv"

const result = await Effect.runPromise(
  Effect.either(parse(UserSchema, csvString))
)

if (Either.isLeft(result)) {
  const error = result.left

  if (error instanceof ParseError) {
    console.error(`Parse failed at row ${error.row}: ${error.message}`)
  } else if (error instanceof ValidationError) {
    console.error(`Validation failed at ${error.fieldPath}: ${error.message}`)
  }
}
```

### Error Types

- **ParseError** - CSV parsing failed (syntax, structure)
- **ValidationError** - Data doesn't match schema
- **StringifyError** - Cannot convert data to CSV
- **CsvStructureError** - Inconsistent column counts
- **DelimiterError** - Delimiter detection/processing failed

## Delimiters

### Comma-Separated (CSV)

```typescript
const data = await Effect.runPromise(
  parse(schema, csvString, { delimiter: "," })
)
```

### Tab-Separated (TSV)

```typescript
const data = await Effect.runPromise(
  parseTsv(schema, tsvString)
)
// Or with explicit delimiter:
const data = await Effect.runPromise(
  parse(schema, tsvString, { delimiter: "\t" })
)
```

### Custom Delimiter

```typescript
const data = await Effect.runPromise(
  parse(schema, csvString, { delimiter: ";" })
)
```

## Schema Validation

Schemas are validated at both parse and stringify time:

```typescript
const UserSchema = Schema.Array(
  Schema.Struct({
    id: Schema.NumberFromString, // String to number coercion
    name: Schema.String,
    email: Schema.pipe(
      Schema.String,
      Schema.filter(
        (s) => s.includes("@"),
        { message: () => "Invalid email format" }
      )
    ),
  })
)

// Parse enforces schema during decode
const users = await Effect.runPromise(
  parse(UserSchema, csvString)
)

// Stringify enforces schema during encode
const csv = await Effect.runPromise(
  stringify(UserSchema, users)
)
```

## Quoted Fields

Fields are automatically quoted when they contain:
- The delimiter character
- Newlines
- Quote characters

```typescript
const data = [
  { id: 1, name: "Alice, Jr.", email: "alice@example.com" },
]

const csv = await Effect.runPromise(
  stringify(UserSchema, data)
)

// Output includes: "Alice, Jr." (automatically quoted)
```

## Custom Backends

The library supports pluggable backends. Create your own:

```typescript
import type { CsvBackend } from "effect-csv"

const myBackend: CsvBackend = {
  parse: (input, options) => {
    // Custom parse implementation
  },
  stringify: (data, options) => {
    // Custom stringify implementation
  },
  parseStream: (input, options) => {
    // Custom stream parse
  },
  stringifyStream: (data, options) => {
    // Custom stream stringify
  },
}

// Use your backend
const data = await Effect.runPromise(
  parse(schema, csvString, {}, myBackend)
)
```

## Testing

The library includes helpers for testing:

```typescript
import { describe, it, expect } from "vitest"
import { parse, stringify } from "effect-csv"

describe("CSV parsing", () => {
  it("should parse valid CSV", async () => {
    const csv = `id,name\n1,Alice`
    const result = await Effect.runPromise(parse(UserSchema, csv))

    expect(result).toEqual([{ id: 1, name: "Alice" }])
  })

  it("should handle round-trip", async () => {
    const original = [{ id: 1, name: "Alice" }]

    const csv = await Effect.runPromise(
      stringify(UserSchema, original)
    )

    const parsed = await Effect.runPromise(
      parse(UserSchema, csv)
    )

    expect(parsed).toEqual(original)
  })
})
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Test
bun run test

# Watch mode
bun run test:watch

# Type checking
bun run typecheck

# Linting
bun run lint
```

## Philosophy

effect-csv embodies the [Hume monorepo](https://github.com/PaulJPhilp/hume) principles:

1. **Empiricism First** - All data is validated, never assumed
2. **Skeptical Validation** - Every parse is checked, every schema is enforced
3. **Causal Relationships** - Clear error chains from cause to effect

## License

MIT

## See Also

- [effect-json](https://github.com/PaulJPhilp/hume/tree/main/packages/effect-json) - JSON parsing with schema validation
- [effect-env](https://github.com/PaulJPhilp/hume/tree/main/packages/effect-env) - Environment configuration
- [Hume Monorepo](https://github.com/PaulJPhilp/hume) - Complete data validation layer
