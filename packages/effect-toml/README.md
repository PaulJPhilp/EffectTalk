# effect-toml

Type-safe, composable TOML parser for TypeScript using Effect.

## Installation

```bash
bun add effect-toml
```

## Usage

This package provides a simple API for parsing and stringifying TOML data in an Effect-native way.

### Parsing

To parse a TOML string, use the `parse` function:

```typescript
import { Effect } from "effect";
import * as toml from "effect-toml";

const tomlString = `
title = "TOML Example"
[owner]
name = "Tom Preston-Werner"
`;

const program = toml.parse(tomlString).pipe(
  Effect.flatMap((data) => Effect.log(data))
);

// To run the program, you need to provide the TomlBackendLive layer
const runnable = Effect.provide(program, toml.TomlBackendLayer);

Effect.runPromise(runnable);
// Output: { title: 'TOML Example', owner: { name: 'Tom Preston-Werner' } }
```

### Stringifying

To stringify a JavaScript object into a TOML string, use the `stringify` function:

```typescript
import { Effect } from "effect";
import * as toml from "effect-toml";

const obj = {
  title: "TOML Example",
  owner: {
    name: "Tom Preston-Werner",
  },
};

const program = toml.stringify(obj).pipe(
  Effect.flatMap((text) => Effect.log(text))
);

const runnable = Effect.provide(program, toml.TomlBackendLayer);

Effect.runPromise(runnable);
// Output:
// title = "TOML Example"
//
// [owner]
// name = "Tom Preston-Werner"
```

### Error Handling

The `parse` and `stringify` functions return custom error types (`TomlParseError` and `TomlStringifyError`) that you can catch and handle:

```typescript
import { Effect } from "effect";
import * as toml from "effect-toml";

const program = toml.parse("invalid toml").pipe(
  Effect.catchAll((error) => Effect.log(`Failed to parse TOML: ${error.message}`))
);

const runnable = Effect.provide(program, toml.TomlBackendLayer);

Effect.runPromise(runnable);
```
