# effect-yaml

**Part of the [Hume monorepo](../README.md)** - Type-safe, composable YAML parser for TypeScript using Effect.

[![Status: Production](https://img.shields.io/badge/Status-Production-green.svg)](https://github.com/PaulJPhilp/trinity-hume)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Effect 3.x](https://img.shields.io/badge/Effect-3.x-blueviolet.svg)](https://effect.website)

## Installation

```bash
bun add effect-yaml
```

## Usage

This package provides a simple API for parsing and stringifying YAML data in an Effect-native way.

### Parsing

To parse a YAML string, use the `parse` function:

```typescript
import { Effect } from "effect";
import * as yaml from "effect-yaml";

const yamlString = `
title: YAML Example
owner:
  name: Tom Preston-Werner
`;

const program = yaml.parse(yamlString).pipe(
  Effect.flatMap((data) => Effect.log(data))
);

// To run the program, you need to provide the YamlBackendLayer layer
const runnable = Effect.provide(program, yaml.YamlBackendLayer);

Effect.runPromise(runnable);
// Output: { title: 'YAML Example', owner: { name: 'Tom Preston-Werner' } }
```

### Stringifying

To stringify a JavaScript object into a YAML string, use the `stringify` function:

```typescript
import { Effect } from "effect";
import * as yaml from "effect-yaml";

const obj = {
  title: "YAML Example",
  owner: {
    name: "Tom Preston-Werner",
  },
};

const program = yaml.stringify(obj).pipe(
  Effect.flatMap((text) => Effect.log(text))
);

const runnable = Effect.provide(program, yaml.YamlBackendLayer);

Effect.runPromise(runnable);
// Output:
// title: YAML Example
// owner:
//   name: Tom Preston-Werner
```

### Error Handling

The `parse` and `stringify` functions return custom error types (`YamlParseError` and `YamlStringifyError`) that you can catch and handle:

```typescript
import { Effect } from "effect";
import * as yaml from "effect-yaml";

const program = yaml.parse("invalid yaml: [").pipe(
  Effect.catchAll((error) => Effect.log(`Failed to parse YAML: ${error.message}`))
);

const runnable = Effect.provide(program, yaml.YamlBackendLayer);

Effect.runPromise(runnable);
```
