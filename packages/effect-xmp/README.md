# effect-xmp

A package for parsing XMP metadata from files using Effect.

## Installation

```bash
bun add effect-xmp
```

## Usage

This package provides a simple API for parsing XMP data from a file buffer in an Effect-native way.

### Parsing

To parse XMP data, use the `parse` function with a file buffer:

```typescript
import { Effect } from "effect";
import * as xmp from "effect-xmp";
import { readFileSync } from "node:fs";

const buffer = readFileSync("path/to/your/file.jpg");

const program = xmp.parse(buffer).pipe(
  Effect.flatMap((data) => Effect.log(data))
);

// To run the program, you need to provide the XmpBackendLive layer
const runnable = Effect.provide(program, xmp.XmpBackendLive);

Effect.runPromise(runnable);
```

### Error Handling

The `parse` function returns a custom error type `XmpParseError` that you can catch and handle:

```typescript
import { Effect } from "effect";
import * as xmp from "effect-xmp";
import { readFileSync } from "node:fs";

const buffer = readFileSync("path/to/your/invalid-file.jpg");

const program = xmp.parse(buffer).pipe(
  Effect.catchAll((error) => Effect.log(`Failed to parse XMP data: ${error.message}`))
);

const runnable = Effect.provide(program, xmp.XmpBackendLive);

Effect.runPromise(runnable);
```
