# effect-liquid

**Part of the [Hume monorepo](../README.md)** - Type-safe, composable Liquid templating engine for TypeScript using Effect.

[![Status: Production](https://img.shields.io/badge/Status-Production-green.svg)](https://github.com/PaulJPhilp/trinity-hume)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Effect 3.x](https://img.shields.io/badge/Effect-3.x-blueviolet.svg)](https://effect.website)

## Installation

```bash
bun add effect-liquid
```

## Usage

This package provides a simple API for parsing and rendering Liquid templates in an Effect-native way.

### Basic Rendering

To render a Liquid template, use the `render` function:

```typescript
import { Effect } from "effect";
import * as liquid from "effect-liquid";

const template = "Hello, {{ name }}!";
const context = { name: "World" };

const program = liquid.render(template, context).pipe(
  Effect.flatMap((result) => Effect.log(result))
);

// To run the program, you need to provide the LiquidServiceLayer
const runnable = Effect.provide(program, liquid.LiquidServiceLayer);

Effect.runPromise(runnable);
// Output: Hello, World!
```

### Parsing Templates

To parse a template into an AST:

```typescript
import { Effect } from "effect";
import * as liquid from "effect-liquid";

const template = "{{ name | upcase }}";

const program = liquid.parse(template).pipe(
  Effect.flatMap((ast) => Effect.log(JSON.stringify(ast, null, 2)))
);

const runnable = Effect.provide(program, liquid.LiquidServiceLayer);

Effect.runPromise(runnable);
```

### Compiling Templates

To compile a template for reuse:

```typescript
import { Effect } from "effect";
import * as liquid from "effect-liquid";

const template = "Hello, {{ name }}!";

const program = Effect.gen(function* () {
  const compiled = yield* liquid.compile(template);
  
  // Render multiple times with different contexts
  const result1 = yield* liquid.renderCompiled(compiled, { name: "Alice" });
  const result2 = yield* liquid.renderCompiled(compiled, { name: "Bob" });
  
  return { result1, result2 };
}).pipe(Effect.provide(liquid.LiquidServiceLayer));

const { result1, result2 } = await Effect.runPromise(program);
// result1: "Hello, Alice!"
// result2: "Hello, Bob!"
```

### Using Filters

Liquid filters transform values:

```typescript
import { Effect } from "effect";
import * as liquid from "effect-liquid";

const template = "{{ name | upcase | strip }}";
const context = { name: "  hello world  " };

const program = liquid.render(template, context).pipe(
  Effect.flatMap((result) => Effect.log(result))
);

const runnable = Effect.provide(program, liquid.LiquidServiceLayer);

Effect.runPromise(runnable);
// Output: HELLO WORLD
```

### Using Tags

Liquid tags provide control flow:

```typescript
import { Effect } from "effect";
import * as liquid from "effect-liquid";

const template = `
{% if show %}
  Hello, {{ name }}!
{% else %}
  Goodbye!
{% endif %}
`;

const context = { show: true, name: "World" };

const program = liquid.render(template, context).pipe(
  Effect.flatMap((result) => Effect.log(result))
);

const runnable = Effect.provide(program, liquid.LiquidServiceLayer);

Effect.runPromise(runnable);
// Output: Hello, World!
```

### Custom Filters

Register custom filters using the service:

```typescript
import { Effect } from "effect";
import * as liquid from "effect-liquid";

const program = Effect.gen(function* () {
  const service = yield* liquid.LiquidService;
  
  // Register a custom filter
  yield* service.registerFilter("double", (input) => {
    const num = typeof input === "number" ? input : 0;
    return Effect.succeed(num * 2);
  });
  
  // Use the custom filter
  return yield* service.render("{{ count | double }}", { count: 5 });
}).pipe(Effect.provide(liquid.LiquidServiceLayer));

const result = await Effect.runPromise(program);
// result: "10"
```

### Custom Tags

Register custom tags using the service:

```typescript
import { Effect } from "effect";
import * as liquid from "effect-liquid";

const program = Effect.gen(function* () {
  const service = yield* liquid.LiquidService;
  
  // Register a custom tag
  yield* service.registerTag("greet", (args, body, context, render) => {
    const name = typeof args[0] === "string" ? args[0] : "World";
    return Effect.succeed(`Hello, ${name}!`);
  });
  
  // Use the custom tag
  return yield* service.render("{% greet 'Alice' %}", {});
}).pipe(Effect.provide(liquid.LiquidServiceLayer));

const result = await Effect.runPromise(program);
// result: "Hello, Alice!"
```

### Error Handling

The `render` and `parse` functions return custom error types that you can catch and handle:

```typescript
import { Effect } from "effect";
import * as liquid from "effect-liquid";

const program = liquid.render("{{ invalid", {}).pipe(
  Effect.catchAll((error) => {
    if (error._tag === "LiquidParseError") {
      return Effect.log(`Parse error: ${error.message}`);
    }
    if (error._tag === "LiquidRenderError") {
      return Effect.log(`Render error: ${error.message}`);
    }
    return Effect.log(`Unknown error: ${error}`);
  })
);

const runnable = Effect.provide(program, liquid.LiquidServiceLayer);

Effect.runPromise(runnable);
```

## Supported Features

### Filters

- **String**: `upcase`, `downcase`, `capitalize`, `strip`, `strip_html`, `strip_newlines`, `newline_to_br`, `escape`, `escape_once`, `url_encode`, `url_decode`, `truncate`, `truncatewords`, `prepend`, `append`, `replace`, `replace_first`, `remove`, `remove_first`, `slice`
- **Array**: `first`, `last`, `join`, `size`, `sort`, `reverse`, `uniq`, `map`, `where`
- **Math**: `plus`, `minus`, `times`, `divided_by`, `modulo`, `round`, `ceil`, `floor`
- **Date**: `date`
- **Default**: `default`

### Tags

- **Control Flow**: `if` / `elsif` / `else` / `endif`, `unless` / `endunless`, `case` / `when` / `endcase`
- **Loops**: `for` / `endfor`
- **Variables**: `assign`, `capture` / `endcapture`
- **Comments**: `comment` / `endcomment`
- **Template Composition**: `include`, `render` (partial support)

## API Reference

### Functions

- `parse(template: string)` - Parse a template into an AST
- `render(template: string, context: LiquidContext)` - Parse and render a template
- `compile(template: string)` - Compile a template for reuse

### Error Types

- `LiquidParseError` - Syntax errors during parsing
- `LiquidRenderError` - Runtime errors during template rendering
- `LiquidFilterError` - Errors in filter execution
- `LiquidTagError` - Errors in tag execution
- `LiquidContextError` - Errors accessing template context

## License

MIT

