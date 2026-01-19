# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📖 Table of Contents

- [EffectTalk Monorepo Overview](#effecttalk-monorepo-overview)
- [Essential Commands](#essential-commands)
- [Project Structure](#project-structure)
- [Architecture & Patterns](#architecture--patterns)
- [Layer 2: McLuhan (Agent Infrastructure)](#layer-2-mcluhan-agent-infrastructure)
- [Layer 1: Hume (Data Foundation)](#layer-1-hume-data-foundation)
- [TypeScript Configuration](#typescript-configuration)
- [Code Quality Standards](#code-quality-standards)
- [Dependency Management](#dependency-management)
- [File Organization](#file-organization)
- [Git Workflow](#git-workflow)
- [Effect.js Debugging Patterns](#effectjs-debugging-patterns)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)
- [Technology Stack](#technology-stack)
- [Key Package References](#key-package-references)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [External Resources](#external-resources)
- [Summary](#summary)

---

## EffectTalk Monorepo Overview

**EffectTalk** is a unified, Effect-native monorepo for building AI-powered applications. It combines agent infrastructure and data foundation into 28 coordinated packages with strict architectural boundaries.

```
EffectTalk (Root)
├── Layer 2: McLuhan (5 packages)      Agent Infrastructure
│   ├── effect-supermemory             Long-term memory & semantic search
│   ├── effect-ai-sdk                  Multi-provider LLM integration
│   ├── effect-cli-tui                 Terminal UI & interactive prompts
│   ├── effect-actor                   State machine orchestration
│   └── effect-cockpit                 Agent dashboard & monitoring
│
├── Layer 1: Hume (23 packages)        Data Foundation
│   ├── Resources                      JSON, YAML, Regex, Env, Schema utilities
│   ├── Content                        Format parsing (XML, CSV, MDX, HTML, PDF, etc.)
│   ├── Services                       External integrations (Git, Artifacts, Telemetry)
│   └── AI Integration                 Models, Prompts, Templates
│
└── Shared                             Root config, scripts, validation
```

**Design Principle:** Strict downward dependencies only. Layer 2 (McLuhan) → Layer 1 (Hume). No reverse dependencies.

## Essential Commands

All packages use **Bun** as the package manager. Commands run from the **root directory**.

### Build, Test, Lint (All Packages)

```bash
# Install dependencies
bun install

# Build all 28 packages
bun run build

# Type checking with strict mode
bun run typecheck

# Run all tests
bun run test

# Watch mode (test files as you edit)
bun run test:watch

# Coverage reporting
bun run test:coverage
bun run test:coverage:aggregate
bun run test:coverage:check

# Code quality (Biome with Ultracite preset)
bun run lint                  # Check code quality
bun run format                # Check formatting
bun run format:fix            # Auto-fix formatting issues

# Full verification pipeline (runs before commits)
bun run verify                # format → lint → typecheck → build → test
```

### Working with Individual Packages

```bash
# Build specific package
bun run --filter effect-json build
bun run --filter effect-supermemory build

# Test specific package
bun run --filter effect-json test

# Watch tests for specific package
bun run --filter effect-ai-sdk test:watch

# Type check specific package
bun run --filter effect-prompt typecheck

# Lint/format specific package
bun run --filter effect-regex lint
bun run --filter effect-regex format:fix
```

### Architecture & Validation

```bash
# Verify layer dependencies (McLuhan → Hume only)
bun run check:architecture

# Consumer smoke tests (compatibility verification)
bun run smoke:consumer
```

### Running Specific Tests

```bash
# Single test file in a package
bun run --filter effect-json test -- parser.test.ts

# Tests matching pattern
bun run --filter effect-yaml test -- --include "*.test.ts"

# Single test by name (with -t flag)
bun run --filter effect-regex test -- -t "pattern matching"
```

## Project Structure

```
packages/
├── effect-supermemory/        # Long-term memory client for Supermemory API
├── effect-ai-sdk/             # Vercel AI SDK v5 wrapper (8+ LLM providers)
├── effect-cli-tui/            # Terminal UI, prompts, interactive components
├── effect-actor/              # Statechart-based state machine orchestration
├── effect-cockpit/            # Agent dashboard & monitoring
│
├── effect-json/               # Type-safe JSON parsing (canonical reference)
├── effect-env/                # Environment variable validation
├── effect-regex/              # Pattern matching & regex utilities
├── effect-schema-utils/       # Effect.Schema helpers & utilities
├── effect-yaml/               # YAML parsing & serialization
├── effect-xml/                # XML parsing & transformation
├── effect-csv/                # CSV parsing & generation
├── effect-mdx/                # MDX processing
├── effect-html/               # HTML parsing & manipulation
├── effect-pdf/                # PDF extraction & generation
├── effect-liquid/             # Shopify Liquid template engine
├── effect-toml/               # TOML configuration parsing
├── effect-xmp/                # XMP metadata extraction
├── effect-image/              # Image processing & metadata
├── effect-prompt/             # Prompt management & templating
├── effect-models/             # LLM integration (OpenRouter, HuggingFace)
├── effect-repository/         # Git operations & repository management
├── effect-artifact/           # Artifact extraction & versioning
├── effect-attachment/         # File attachment handling
├── effect-storage/            # File system operations
├── effect-telemetry/          # Observability & metrics collection
├── effect-models-website/     # Website integration for models
└── effect-schema-utils/       # Schema utilities
│
scripts/                        # Build scripts & validation utilities
├── architecture-check.ts      # Verify layer dependencies
├── check-coverage-threshold.ts
├── aggregate-coverage.ts
└── consumer-smoke-test.ts

Configuration (Root)
├── package.json               # Workspace definition & monorepo scripts
├── tsconfig.json              # Unified TypeScript strict mode
├── biome.jsonc                # Code quality with Ultracite preset
├── vitest.config.shared.ts    # Test configuration (85%+ coverage)
├── bun.lock                   # Bun dependency lock file
└── CLAUDE.md                  # This file
```

## Architecture & Patterns

### Core Design Principles

1. **Strict Layering** — Layer 2 (McLuhan) depends on Layer 1 (Hume). Never reverse.
2. **Functional Effects** — All async operations use Effect.js for composability and error handling
3. **Type Safety** — Strict TypeScript with `exactOptionalPropertyTypes: true`
4. **No Mocking** — Tests use real implementations for accuracy
5. **Discriminated Errors** — All errors extend `Data.TaggedError` for type-safe pattern matching
6. **Dependency Injection** — Services use `Effect.Service` pattern with layers

### Universal Service Pattern

All services (across both layers) follow this mandatory pattern:

```typescript
import { Effect } from "effect";
import { Data } from "effect";

// 1. Define domain errors
export class MyError extends Data.TaggedError("MyError")<{
  readonly message: string;
  readonly cause?: Error;
}> {}

// 2. Define service API interface
export interface MyServiceApi {
  readonly operation: (arg: string) => Effect.Effect<Result, MyError, never>;
}

// 3. Implement as Effect.Service with Effect.fn() parameterization
export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.fn(function* (config: ConfigType) {
    // Service initialization code runs once at layer construction
    return {
      operation: (arg: string) =>
        Effect.sync(() => {
          // Implementation here
          return { result: "value" };
        }),
    } satisfies MyServiceApi;
  }),
}) {}

// 4. Create layers with configuration
export const MyServiceDefault = MyService.Default({
  /* configuration */
});

// 5. Use in programs
const program = Effect.gen(function* () {
  const service = yield* MyService;
  return yield* service.operation("input");
}).pipe(Effect.provide(MyServiceDefault));
```

**Key Rules:**

- ✅ Use `Effect.Service<T>()` with `Effect.fn()` for config-driven initialization
- ✅ Define API contract as `interface` (not `type`)
- ✅ Use `satisfies MyServiceApi` to ensure type safety
- ✅ All service class bodies are empty `{}`
- ❌ Never use `Context.Tag` directly
- ❌ Never use "Live", "Impl", "Layer" suffixes
- ❌ Never instantiate services with `new`

### Error Handling Pattern

```typescript
import { Data } from "effect";

// ✅ Correct - specific, discriminated errors
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resourceType: string;
  readonly resourceId: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string;
  readonly value: unknown;
  readonly cause?: Error;
}> {}

// Type-safe catching
someEffect.pipe(
  Effect.catchTag("NotFoundError", (err) => {
    // err.resourceType and err.resourceId available
    return fallback;
  }),
  Effect.catchTag("ValidationError", (err) => {
    // err.field, err.value available
    return fallback;
  }),
);
```

**Error Rules:**

- ✅ All fields must be `readonly`
- ✅ Always use `Data.TaggedError("ErrorName")`
- ✅ Include `cause?: Error` for error chaining
- ✅ One error type per domain concern
- ✅ Use `Effect.catchTag()` for type-safe pattern matching

### Import Organization & Path Standards

```typescript
// 1. Effect core
import { Effect, Schema, Layer, Data, Ref, Either } from "effect";

// 2. Effect platform (if needed)
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";

// 3. Third-party libraries
import { someLib } from "external-package";

// 4. Workspace packages (package-relative paths only)
import { MyService } from "./service.js";
import { Types } from "../types/index.js";
import { Utils } from "./utils/helpers.js";

// 5. Type-only imports (use import type)
import type { Config } from "./config.js";
```

**Critical Rules:**

- ✅ **Package-relative paths only** - Use `./` and `../` for internal imports
- ✅ **No monorepo @/ paths** - Avoid `@/package-name` absolute paths
- ✅ Always use `.js` extension in relative imports (ESM requirement)
- ✅ Use named imports from effect (never `import * as Effect`)
- ✅ Use `import type` for type-only imports
- ✅ Group imports by source with blank lines between groups

**Why Package-Relative Paths:**

- **Build Reliability**: Consistent builds across environments
- **No Monorepo Dependencies**: Packages are self-contained
- **Clean Architecture**: Clear import boundaries
- **Easy Maintenance**: No complex path resolution

### Testing Pattern (No Mocking)

```typescript
import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { MyService } from "../service.js";

describe("MyService", () => {
  // Create test layer with real service (no mocks)
  const testLayer = MyService.Default({
    /* test config */
  });

  it("performs operation correctly", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MyService;
      return yield* service.operation("test-input");
    }).pipe(Effect.provide(testLayer));

    const result = await Effect.runPromise(program);
    expect(result).toEqual({
      /* expected */
    });
  });

  it("handles errors correctly", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MyService;
      return yield* service.failingOperation();
    }).pipe(Effect.either, Effect.provide(testLayer));

    const result = await Effect.runPromise(program);
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left._tag).toBe("MyError");
    }
  });
});
```

**Testing Rules:**

- ✅ Use real service implementations (no mocks or stubs)
- ✅ Create test layers with `ServiceImpl.Default(testConfig)`
- ✅ Use `Effect.gen()` for async test logic
- ✅ Use `yield*` to acquire dependencies and execute effects
- ✅ Use `Effect.runPromise()` to execute effects in tests
- ✅ Use `Effect.either()` to capture errors for assertions

## Layer 2: McLuhan (Agent Infrastructure)

**5 core packages with strict dependencies:**

### effect-supermemory (Foundation)

- Long-term memory API client for Supermemory service
- Services: MemoriesService, SearchService, ConnectionsService, ToolsService
- Base64 encoding for all memory values
- **Dependencies:** None (foundational)

### effect-ai-sdk (Independent Utility)

- Vercel AI SDK v5 wrapper (functional library, not Effect.Service)
- 8+ providers: OpenAI, Anthropic, Google, Groq, DeepSeek, Perplexity, xAI, Qwen
- Operations: text generation, streaming, object generation, embeddings, tool-calling
- **Dependencies:** None (independent)

### effect-cli-tui (Interactive UI)

- Terminal UI components: EffectCLI, TUIHandler
- Interactive prompts: prompt(), selectOption(), multiSelect(), confirm(), password()
- Display utilities: spinners, tables, boxes, panels
- Uses Effect.Schema for validation (NOT Zod)
- **Dependencies:** effect-supermemory, effect-env

### effect-actor (Orchestration)

- Statechart-based state machines (xState-inspired but Effect-native)
- Effect-native patterns for state management
- **Dependencies:** None (independent)

### effect-cockpit (Dashboard)

- Agent monitoring and control dashboard
- Integration with other Layer 2 packages
- **Dependencies:** Other Layer 2 packages

**Dependency Rules (STRICT):**

- effect-supermemory → no dependencies
- effect-ai-sdk → no dependencies
- effect-cli-tui → can depend on effect-supermemory, effect-env
- effect-actor → no dependencies
- effect-cockpit → can depend on Layer 2 packages
- ❌ NO Layer 1 imports in effect-cockpit or any Layer 2 package (except through explicit patterns)

## Layer 1: Hume (Data Foundation)

**23 packages organized by capability:**

### Resources (Zero External Dependencies)

These are foundational and can only depend on Effect.js:

- `effect-json` — Type-safe JSON parsing with multiple backends
- `effect-env` — Environment variable validation and management
- `effect-regex` — Composable pattern matching and validation
- `effect-schema-utils` — Effect.Schema helpers and utilities

### Content (Format Processing)

Parse, validate, and transform structured data:

- Structured formats: `effect-yaml`, `effect-xml`, `effect-csv`, `effect-toml`
- Documents: `effect-mdx`, `effect-html`, `effect-pdf`
- Media: `effect-image`, `effect-xmp`
- Templates: `effect-liquid` (Shopify Liquid engine)

### AI & Integration

Work with language models and prompts:

- `effect-prompt` — Prompt management and templating
- `effect-models` — LLM integration (OpenRouter, HuggingFace)

### Services (External Integration)

Interact with external systems:

- `effect-repository` — Git operations and repository management
- `effect-artifact` — Artifact extraction and versioning
- `effect-attachment` — File attachment handling
- `effect-storage` — File system operations
- `effect-telemetry` — Observability and metrics collection
- `effect-models-website` — Website integration for models

**Dependency Rules (STRICT):**

- Layer 1 packages can only depend on other Layer 1 packages
- ❌ FORBIDDEN: Any Layer 1 package importing from Layer 2 (McLuhan)
- Resources layer has zero external dependencies (except Effect.js)

## TypeScript Configuration

**Strict Mode (enforced across all packages):**

```json
{
  "strict": true,
  "exactOptionalPropertyTypes": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "target": "ES2022",
  "module": "ESNext"
}
```

All packages inherit from root `tsconfig.json`. Override carefully and only when necessary.

## Code Quality Standards

### Biome Configuration

- **Preset:** `ultracite/core` (zero-config, opinionated)
- **Enforces:** Modern TypeScript, error handling, performance, accessibility
- All packages inherit from root `biome.jsonc`

### Linting & Formatting

```bash
# Check code quality across all packages
bun run lint

# Auto-fix formatting and common issues
bun run format:fix
```

### Forbidden Patterns

| Pattern                                   | Why                     | Use Instead                  |
| ----------------------------------------- | ----------------------- | ---------------------------- |
| `as unknown as Type`                      | Breaks type safety      | Fix underlying type mismatch |
| `Context.Tag`                             | Outdated pattern        | Use `Effect.Service`         |
| Service suffixes: "Live", "Impl", "Layer" | Anti-pattern            | Use bare class name          |
| Default exports                           | Prevents tree-shaking   | Use named exports            |
| Zod for validation                        | Wrong tool for Effect   | Use `Effect.Schema`          |
| `process.env` access                      | Unvalidated environment | Use `effect-env` package     |
| Mocking in tests                          | Inaccurate tests        | Use real implementations     |
| Double casts                              | Type safety bypass      | Refactor to proper types     |

## Dependency Management

### Workspace Protocol

All inter-package dependencies use Bun's workspace protocol:

```json
{
  "dependencies": {
    "effect-json": "workspace:*",
    "effect-schema-utils": "workspace:*"
  }
}
```

**How it works:**

- **During development:** Resolves directly from source (`src/` directory)
- **At publish time:** Replaced with actual version number on npm
- **Benefit:** Live development without needing to publish packages

**Checking dependencies:**

```bash
# View dependency tree
bun pm ls

# Check specific package
bun pm ls effect-json

# Verify workspace resolution working
bun run test  # If workspace resolution broken, tests fail immediately
```

## File Organization

### Package Structure Template

```
packages/effect-name/
├── src/
│   ├── index.ts           # Public API re-exports
│   ├── api.ts             # Service interface definition
│   ├── service.ts         # Effect.Service implementation
│   ├── errors.ts          # Data.TaggedError definitions
│   ├── types.ts           # Type definitions and schemas
│   └── impl/              # (Optional) Internal implementations
│
├── __tests__/
│   ├── unit/
│   │   └── service.test.ts
│   ├── integration/       # (If applicable)
│   └── fixtures/          # Test data files
│
├── dist/                  # Build output (generated)
├── package.json
├── tsconfig.json
├── vitest.config.ts       # (If not using shared config)
└── README.md
```

### Naming Conventions

- **Files:** `kebab-case.ts` (lowercase with hyphens)
- **Classes:** PascalCase, named exports only (no default exports)
- **Interfaces:** PascalCase ending with `Api` or `Ops` (e.g., `MemoriesServiceApi`)
- **Error classes:** PascalCase ending with `Error` (e.g., `NotFoundError`)
- **Test files:** `*.test.ts` in `__tests__/` subdirectories

## Git Workflow

### Branch Naming

- `feature/description-of-feature` — New features
- `fix/description-of-bug` — Bug fixes
- `chore/description-of-changes` — Build, docs, deps
- `refactor/description` — Code reorganization

### Commit Messages (Conventional Commits)

```
feat: Add semantic search to effect-supermemory

- Implement vector search with RRF algorithm
- Add SearchService with query options
- Update MemoriesService with search integration

Closes #123
```

**Format:** `<type>: <short description>`

- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Build, dependencies, documentation
- `refactor:` — Code restructuring without logic change
- `perf:` — Performance improvement
- `test:` — Test additions/fixes
- `style:` — Formatting only
- `docs:` — Documentation

### Pre-Commit Verification

```bash
# Before pushing, run full verification
bun run verify

# Check what you're committing
git diff
git status

# Verify tests pass
bun run test

# Verify types
bun run typecheck
```

## Effect.js Debugging Patterns

### Effect.fn() vs Effect.gen()

**Use `Effect.fn()` for:**

- Service parameterization (initialization code)
- Config-driven setup
- Runs once at layer construction time

```typescript
effect: Effect.fn(function* (config: Config) {
  // This runs once when layer is created
  const client = new HttpClient(config.baseUrl);

  return {
    operation: (arg) => Effect.sync(() => client.call(arg)),
  };
});
```

**Use `Effect.gen()` for:**

- Async composition (effects depend on other effects)
- Sequential operations
- Runs every time effect is executed

```typescript
const program = Effect.gen(function* () {
  const service = yield* MyService; // Acquire service
  const result = yield* service.method(); // Execute effect
  return result;
});
```

### Common Debugging Patterns

**Logging during execution:**

```typescript
const program = Effect.gen(function* () {
  yield* Effect.logInfo(`Starting operation`);
  const result = yield* someEffect;
  yield* Effect.logDebug(`Result: ${JSON.stringify(result)}`);
  return result;
});
```

**Type-safe error catching:**

```typescript
const program = someEffect.pipe(
  Effect.catchTag("MyError", (err) => {
    // err is typed with all fields available
    return fallback;
  }),
  Effect.catchTag("OtherError", (err) => {
    // Different error, different handling
    return otherFallback;
  }),
);
```

**Adding timeouts to prevent hanging:**

```typescript
const program = someEffect.pipe(
  Effect.timeoutFail("5 seconds", () => new TimeoutError()),
);
```

**Handling effects that might fail:**

```typescript
const program = Effect.gen(function* () {
  const result = yield* Effect.either(mightFailEffect);
  if (Either.isLeft(result)) {
    // Handle error
    return result.left;
  }
  return result.right;
});
```

## Common Mistakes to Avoid

| Mistake                                 | Problem                                | Solution                                              |
| --------------------------------------- | -------------------------------------- | ----------------------------------------------------- |
| Service imports without `.js` extension | ESM module resolution fails            | Use `.js` extension in relative imports               |
| Using `@/package-name` imports          | Breaks package isolation               | Use package-relative paths (`./` and `../`)           |
| `new MyService(config)`                 | Service not properly initialized       | Use `MyService.Default(config)`                       |
| Forgetting `yield*` in Effect.gen       | Effect context lost                    | Always use `yield*` for effects                       |
| Missing `Effect.provide()`              | Service layer not available at runtime | Always provide layers: `.pipe(Effect.provide(layer))` |
| Layer 1 package imports Layer 2         | Breaks architecture                    | Only Layer 2 can import Layer 1                       |
| Using `Context.Tag` directly            | Outdated pattern                       | Use `Effect.Service`                                  |
| Mixing promises and effects             | Loses type safety                      | Use `Effect.map()`, not `.then()` on effects          |
| Generic `Error` in effects              | Lost type information                  | Use `Data.TaggedError` for specific error types       |
| Using Zod for validation                | Wrong validation tool                  | Use `Effect.Schema`                                   |
| Accessing `process.env` directly        | Unvalidated environment                | Use `effect-env` package                              |

## Technology Stack

| Technology       | Version | Purpose                            |
| ---------------- | ------- | ---------------------------------- |
| Bun              | 1.1.33+ | Package manager, runtime, bundler  |
| TypeScript       | 5.9+    | Type system (strict mode)          |
| Node.js          | 18.18+  | Development runtime                |
| Effect.js        | 3.19+   | Functional effects & DI            |
| @effect/schema   | Latest  | Type-safe validation               |
| @effect/platform | Latest  | Platform abstractions              |
| Biome            | 2.3.7+  | Linting & formatting (Ultracite)   |
| Vitest           | 4.0+    | Testing framework                  |
| Vercel AI SDK    | 5.0+    | LLM integration (in effect-ai-sdk) |

## Key Package References

**Layer 2 - McLuhan (Agent Infrastructure)**

- `effect-supermemory` — See `packages/effect-supermemory/CLAUDE.md` for memory patterns
- `effect-ai-sdk` — Multi-provider LLM wrapper (functional library pattern)
- `effect-cli-tui` — Interactive CLI and TUI components
- `effect-actor` — State machine orchestration
- `effect-cockpit` — Agent dashboard

**Layer 1 - Hume (Data Foundation)**

- `effect-json` — Canonical reference implementation; see `packages/effect-json/CLAUDE.md`
- `effect-env` — Environment variable management
- `effect-regex` — Pattern matching utilities
- `effect-schema-utils` — Schema refinements and helpers
- `effect-prompt` — Prompt management and templating
- `effect-models` — LLM model integration
- `effect-repository` — Git operations
- `effect-liquid` — Liquid template engine
- `effect-telemetry` — Observability and metrics

**See individual package `CLAUDE.md` files for detailed patterns and examples.**

## Troubleshooting

### Build Fails with Module Resolution Errors

```bash
# Clear and reinstall
rm -rf node_modules bun.lock
bun install

# Verify workspace resolution
bun pm ls

# Check if specific package builds
bun run --filter effect-json build
```

### TypeScript Errors in IDE

```bash
# Regenerate type definitions
bun run build

# Force type checking
bun run typecheck

# VS Code: Restart TypeScript server (Cmd+Shift+P → "TypeScript: Restart TS Server")
```

### Tests Not Running or Hanging

```bash
# Run single test file with verbose output
bun run --filter effect-json test -- unit.test.ts --reporter=verbose

# Add timeout to prevent hanging
const result = await Effect.runPromise(
  myEffect.pipe(Effect.timeoutFail("5 seconds", () => new Error()))
)
```

### Service Dependencies Not Available

```typescript
// ❌ Wrong - service not provided
const result = await Effect.runPromise(program);

// ✅ Correct - provide all service layers
const result = await Effect.runPromise(
  program.pipe(
    Effect.provide(MyService.Default(config)),
    Effect.provide(OtherService.Default(config)),
  ),
);
```

### Architecture Validation Failed

```bash
# Check dependency rules (Layer 2 → Layer 1 only)
bun run check:architecture

# See which package violated rules
bun run lint

# Review package.json in the flagged package
```

## Documentation

### Core Documentation

- **README.md** - Main project overview and quick start guide
- **AGENTS.md** - Comprehensive AI agent infrastructure guide
- **CONTRIBUTING.md** - Contribution guidelines and development workflow
- **CLAUDE.md** - This file - Development patterns and architectural guidance

### Agent Development

- **AGENTS.md** - Complete guide to building AI agents with EffectTalk
  - Agent architecture and patterns
  - State machine orchestration with effect-actor
  - LLM integration with effect-ai-sdk
  - Memory management with effect-supermemory
  - CLI/TUI interfaces with effect-cli-tui
  - Testing, deployment, and security patterns

### Package-Specific Documentation

- Each package has its own `CLAUDE.md` with specific patterns and examples
- See `packages/[package-name]/CLAUDE.md` for detailed implementation guidance

## External Resources

- **Effect.js Documentation:** https://effect.website
- **Biome Documentation:** https://biomejs.dev
- **Ultracite Preset:** https://github.com/Phylogenic/ultracite
- **Bun Documentation:** https://bun.sh
- **TypeScript Handbook:** https://www.typescriptlang.org/docs

## Summary

EffectTalk is a unified, architecturally-sound monorepo:

**Structure:**

- **Layer 2 (McLuhan):** 5 packages for agent infrastructure (memory, LLMs, CLI, orchestration)
- **Layer 1 (Hume):** 23 packages for data foundation (parsing, validation, transformation)
- **Strict downward dependencies:** Layer 2 → Layer 1 only
- **Package-relative imports:** All internal imports use `./` and `../` paths

**Universal Standards:**

- All services use `Effect.Service` with `Effect.fn()` parameterization
- All errors use `Data.TaggedError` for type-safe pattern matching
- Strict TypeScript with `exactOptionalPropertyTypes: true`
- Biome with Ultracite preset for code quality
- No mocking in tests; use real implementations
- Vitest for testing with 85%+ coverage target
- Package-relative import paths for build reliability

**Key Principle:** Architectural isolation + functional composition + consistent imports = reliable, composable AI applications.
