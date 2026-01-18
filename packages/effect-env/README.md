# effect-env

**Part of the [Hume monorepo](../README.md)** - Typed, testable, policy-aware env management for Effect apps. — typed, testable, policy-aware env for Effect apps

[![npm version](https://img.shields.io/npm/v/effect-env.svg)](https://www.npmjs.com/package/effect-env)
[![GitHub](https://img.shields.io/github/stars/PaulJPhilp/effect-env?style=social)](https://github.com/PaulJPhilp/effect-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript library for managing environment variables with type safety, schema validation, and security features using Effect.

## Features

- **Type-safe**: Full TypeScript inference from `@effect/schema` definitions
- **Schema-driven**: Validation, transformation, and type inference in one place
- **Server/Client separation**: Prevent secrets from leaking to client bundles (t3-env style)
- **Prefix enforcement**: Automatic validation that client vars use correct prefix
- **Testable**: Built on Effect layers, easy to mock in tests
- **Secure**: Redaction helpers for safe logging, production-safe overrides
- **Effect-native**: Full composability with Effect ecosystem

## Installation

```bash
npm install effect-env
# or
bun add effect-env
```

## Quickstart

### Simple Usage (Single Schema)

```typescript
import { Schema as S } from "effect"
import { createSimpleEnv, EnvService } from "effect-env"

// 1. Define your schema
const env = createSimpleEnv(
  S.Struct({
    NODE_ENV: S.Literal("development", "production", "test"),
    PORT: S.NumberFromString,
    DATABASE_URL: S.String
  }),
  process.env
)

// 2. Use in your program
const program = Effect.gen(function* () {
  const envService = yield* EnvService
  const port = yield* envService.get("PORT") // typed as number
  const dbUrl = yield* envService.get("DATABASE_URL") // typed as string
  return { port, dbUrl }
})

// 3. Run with the env layer
Effect.runPromise(Effect.provide(program, env))
```

### Server/Client Separation (t3-env style)

```typescript
import { Schema as S } from "effect"
import { createEnv, EnvService } from "effect-env"

const env = createEnv({
  // Server-only variables (never exposed to client)
  server: S.Struct({
    DATABASE_URL: S.String,
    API_SECRET: S.String,
    JWT_SECRET: S.String
  }),

  // Client-safe variables (sent to browser)
  // Must start with the clientPrefix!
  client: S.Struct({
    PUBLIC_API_URL: S.String,
    PUBLIC_APP_NAME: S.String
  }),

  clientPrefix: "PUBLIC_",
  runtimeEnv: process.env
})

const program = Effect.gen(function* () {
  const envService = yield* EnvService

  // All typed correctly and safely
  const apiUrl = yield* envService.get("PUBLIC_API_URL")
  const secret = yield* envService.get("API_SECRET")

  return { apiUrl, secret }
})

Effect.runPromise(Effect.provide(program, env))
```

### Schema Transformations

Use Effect Schema's built-in transformations:

```typescript
const env = createSimpleEnv(
  S.Struct({
    PORT: S.NumberFromString,           // String → Number
    DEBUG: S.BooleanFromString,         // "true" | "false" → boolean
    CONFIG: S.parseJson(S.Unknown),     // JSON string → object
    LOG_LEVEL: S.optionalWith(S.String, {
      default: () => "info"             // Defaults
    })
  })
)
```

### Testing with Override

```typescript
it("uses overridden PORT", async () => {
  const program = Effect.gen(function* () {
    const env = yield* EnvService

    // Override just for this effect
    return yield* env.withOverride("PORT", "9000")(
      env.get("PORT")
    )
  })

  const result = await Effect.runPromise(Effect.provide(program, env))
  expect(result).toBe("9000")
})

// Note: withOverride is disabled in production (process.env.NODE_ENV === "production")
```

## Validation

Validate environment at startup for clear error reporting:

```typescript
import { validate } from "effect-env"

const envSchema = S.Struct({
  PORT: S.NumberFromString,
  API_KEY: S.String
})

// In dev/test: prints friendly table and continues
// In production: fails fast with exit code
await Effect.runPromise(validate(envSchema, process.env))
```

Sample validation report:
```
Key          | Status       | Details
-------------|--------------|--------
API_KEY      | missing      | required but not provided
PORT         | invalid      | Expected number, actual "abc"
```

## Redaction

Safely log environment variables without exposing secrets:

```typescript
import { redact } from "effect-env"

const safeEnv = redact(process.env)
// { NODE_ENV: "development", API_KEY: "***", DB_PASSWORD: "***" }

// Custom matchers
const safeEnv = redact(process.env, {
  extra: ["SESSION_ID", /^CUSTOM_/]
})
```

Redacts keys containing (case-insensitive): `key`, `token`, `secret`, `password`, `pwd`, `private`, `bearer`, `api`, `auth`.

## Testing

Test with `createSimpleEnv` or `createEnv` using a test record:

```typescript
import { createSimpleEnv, EnvService } from "effect-env"
import { describe, it, expect } from "vitest"

const testEnv = createSimpleEnv(
  S.Struct({
    PORT: S.NumberFromString,
    DATABASE_URL: S.String
  }),
  {
    PORT: "3000",
    DATABASE_URL: "postgres://localhost"
  }
)

it("reads typed env vars", async () => {
  const program = Effect.gen(function* () {
    const env = yield* EnvService
    return yield* env.get("PORT") // 3000
  })

  const result = await Effect.runPromise(Effect.provide(program, testEnv))
  expect(result).toBe(3000)
})
```

Or with `withOverride` in dev/test:

```typescript
const program = Effect.gen(function* () {
  const env = yield* EnvService
  return yield* env.withOverride("PORT", "8080")(env.get("PORT"))
})

const result = await Effect.runPromise(Effect.provide(program, env))
expect(result).toBe("8080")
```

## API Reference

### `createEnv(config)`

Create a typed environment layer with server/client separation.

```typescript
createEnv({
  server: S.Schema<Server>,              // Server-only variables
  client: S.Schema<Client>,              // Client-safe variables
  clientPrefix: "PUBLIC_",               // Prefix for client vars
  runtimeEnv?: Record<string, string>,   // Default: process.env
  skipValidation?: boolean,              // Default: false
  onValidationError?: (error) => void    // Custom error handler
}): Layer<Env<Server & Client>>
```

### `createSimpleEnv(schema, runtimeEnv?, skipValidation?, onValidationError?)`

Create a simple typed environment layer (no server/client separation).

```typescript
createSimpleEnv(
  schema: S.Schema<T>,                   // Environment schema
  runtimeEnv?: Record<string, string>,   // Default: process.env
  skipValidation?: boolean,              // Default: false
  onValidationError?: (error) => void    // Custom error handler
): Layer<Env<T>>
```

### EnvService Methods

- `get<K>(key: K): Effect<E[K], EnvError>` - Get typed value
- `require<K>(key: K): Effect<NonNullable<E[K]>, MissingVarError>` - Require non-null
- `all(): Effect<E>` - Get all values
- `withOverride<K>(key: K, value: string)(fa: Effect<A>): Effect<A>` - Override for testing (disabled in production)

### Utilities

- `validate(schema: S.Schema<E>, source: Record<string, string | undefined>, opts?): Effect<void, ValidationError>` - Startup validation
- `redact(record: Record<string, string | undefined>, opts?): Record<string, string | undefined>` - Safe logging

### Legacy APIs (deprecated)

- `fromProcess`, `fromDotenv`, `fromRecord` - Use `createSimpleEnv` instead
- `makeEnvSchema` - Wrapper no longer needed with direct Schema usage

## Notes

- **Security**: Never log raw env vars. Use `redact()` for safe logging.
- **Type Inference**: All types flow through the schema; no additional type annotations needed.
- **Defaults**: Use `S.optionalWith(S.String, { default: () => "value" })` for defaults.
- **Errors**: Clear messages include key names and value snippets for debugging.
- **Production**: Validation fails fast; `withOverride` is disabled.
- **Server/Client**: Client variables MUST start with the configured prefix (default `"PUBLIC_"`).

## Contributing

PRs welcome! Run `npm test` and `npm run typecheck` before submitting.

## License

MIT
