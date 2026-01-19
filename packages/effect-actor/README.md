# effect-actor

Effect-native state machine orchestration framework for building robust, type-safe actors with statechart semantics.

[![npm version](https://img.shields.io/npm/v/effect-actor)](https://www.npmjs.com/package/effect-actor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎭 **Statechart Model** - XState-inspired state machines with Effect-native runtime
- 🔄 **Composable Effects** - Build complex workflows with Effect's `yield*` syntax
- 🛡️ **Type-Safe** - Full TypeScript support with discriminated unions
- ⚡ **Zero Dependencies** - No external dependencies beyond Effect
- 🎯 **State Management** - Hierarchical states, transitions, and guards
- 📡 **Event Handling** - Elegant event-driven architecture
- 🔌 **Extensible** - Custom providers and middleware support

## Installation

```bash
npm install effect-actor
# or
bun add effect-actor
```

## Quick Start

```typescript
import { Effect } from "effect";
import { createActor } from "effect-actor";

const machine = {
  initial: "idle",
  states: {
    idle: {
      on: { START: "running" },
    },
    running: {
      on: { STOP: "idle", ERROR: "failed" },
    },
    failed: {
      type: "final",
    },
  },
};

const program = Effect.gen(function* () {
  const actor = yield* createActor(machine);
  
  yield* actor.send({ type: "START" });
  const state = yield* actor.getSnapshot();
  
  console.log(state.value); // "running"
});

Effect.runPromise(program);
```

## Core Concepts

### State Machines

Define state machines with transitions and events:

```typescript
const trafficLight = {
  initial: "red",
  states: {
    red: { on: { TIMER: "green" } },
    green: { on: { TIMER: "yellow" } },
    yellow: { on: { TIMER: "red" } },
  },
};
```

### Actions and Transitions

```typescript
const machine = {
  initial: "idle",
  states: {
    idle: {
      on: {
        START: {
          target: "running",
          actions: ["logStart"],
        },
      },
    },
    running: {
      on: { STOP: "idle" },
    },
  },
};
```

### Guards

Conditional transitions based on context:

```typescript
const machine = {
  initial: "idle",
  states: {
    idle: {
      on: {
        CHECK: [
          { guard: "isValid", target: "valid" },
          { target: "invalid" },
        ],
      },
    },
    valid: { type: "final" },
    invalid: { type: "final" },
  },
};
```

## Development

```bash
# Run tests in watch mode
bun run test:watch

# Run tests once
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests with UI
bun run test:ui

# Lint code
bun run lint

# Format code
bun run format
```

## Architecture

Built with Effect.js for composable, type-safe orchestration:
- **State Machine Execution** - Hierarchical state management
- **Event Dispatching** - Type-safe event handling
- **Effect Integration** - All operations are Effect-native
- **Error Handling** - Discriminated error types via `Data.TaggedError`

## Contributing

Contributions welcome! Please:

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Write tests for new functionality
3. Run `bun run lint && bun run format`
4. Commit with conventional commits
5. Push and open a PR

## License

MIT © 2025 Paul Philp

## Related Packages

- **[effect-cli-tui](../effect-cli-tui)** - Interactive terminal UIs
- **[effect-supermemory](../effect-supermemory)** - Long-term memory service
- **[Effect](https://effect.website)** - Functional programming runtime
