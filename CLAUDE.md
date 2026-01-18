# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Trinity Monorepo Overview

Trinity is a **two-project monorepo** implementing a layered architecture for AI agent development and experimentation. Each project has a distinct responsibility and architectural role:

```
Trinity (Root)
├── McLuhan           Agent Infrastructure Layer (AI orchestration, memory, TUI)
└── Hume              Data Foundation Layer (Format parsing, validation, transformation)
```

**Design Principle:** Strict downward dependencies only. McLuhan → Hume (no circular deps).

## Project Status

- **McLuhan** - Mature: 4 core packages fully implemented (effect-supermemory, effect-ai-sdk, effect-cli-tui, effect-actor)
- **Hume** - Active development: 17 packages with three-layer architecture (resources, content capabilities, service providers)
- **Kuhn** - Reserved directory for future expansion (currently empty)

## Quick Project Navigation

When working with Trinity, use this guide to determine which project to modify:

**Use McLuhan when:**
- Implementing AI agent orchestration, state machines, or workflows
- Working with agent memory, long-term persistence, or semantic search
- Building CLI/TUI applications, interactive prompts, or terminal UI
- Adding AI provider integrations or LLM operations
- Working with packages: `effect-supermemory`, `effect-ai-sdk`, `effect-cli-tui`, `effect-actor`

**Use Hume when:**
- Implementing data parsing, validation, or transformation
- Adding support for new file formats (JSON, YAML, CSV, XML, etc.)
- Building prompt management, templating, or configuration systems
- Working with external data sources or services
- Working with packages: format libraries (`effect-json`, `effect-yaml`, etc.), AI integrations (`effect-models`, `effect-prompt`), or utilities (`effect-env`, `effect-regex`)

**Check both projects when:**
- Adding a new AI agent feature that requires memory, UI, and data transformation
- Implementing end-to-end workflows that span multiple layers
- Updating shared patterns or architectural standards

## Inter-Project Dependencies

**Dependency Direction: McLuhan → Hume (downward only)**

- McLuhan packages can import from Hume packages via workspace protocol
- Hume packages **must never** import from McLuhan packages
- This ensures the data foundation (Hume) remains independent and reusable

**Example:**
```json
// ✅ ALLOWED in McLuhan/packages/effect-cli-tui/package.json
{
  "dependencies": {
    "effect-supermemory": "workspace:*",
    "effect-json": "workspace:*"
  }
}

// ❌ FORBIDDEN in Hume/packages/effect-json/package.json
{
  "dependencies": {
    "effect-supermemory": "workspace:*"  // Would break downward-only rule
  }
}
```

## Essential Commands

All projects use **Bun** as the package manager with consistent command patterns.

### Root-Level Operations

```bash
# Install all dependencies across all projects
bun install

# Build/test/lint all projects
cd McLuhan && bun run build
cd Hume && bun run build

# Type checking across all projects
cd McLuhan && bun run typecheck
cd Hume && bun run typecheck

# Full CI/verification for all projects
cd McLuhan && bun run verify          # Runs format, lint, typecheck, build, test
```

### Working with Individual Projects

**McLuhan (Monorepo of 4 packages):**
```bash
cd McLuhan

# Work with specific package
bun run --filter effect-supermemory build
bun run --filter effect-ai-sdk test
bun run --filter effect-actor test:watch

# All packages
bun run build            # Build all
bun run test             # Test all
bun run lint             # Lint all
bun run verify           # Full verification (format, lint, typecheck, build, test)
```

**Hume (Monorepo of 17 packages):**
```bash
cd Hume

# Work with specific package
bun run --filter effect-json build
bun run --filter effect-mdx test:watch

# All packages
bun run build            # Build all
bun run test             # Test all
bun run lint             # Lint all
bun run smoke:consumer   # Consumer smoke tests
bun run check:architecture  # Architecture validation
```

## Git Workflow

Trinity uses a branch-based development approach. When contributing:

**Branch Naming:**
- Feature branches: `feature/description-of-feature`
- Fix branches: `fix/description-of-bug`
- Update/chore branches: `update/description-of-changes`
- Example: `update/ai-sdk-providers-v2` (current development branch)

**Commit Messages:**
Trinity follows conventional commit style. When writing commit messages:
- Use clear, imperative language: "Add feature", "Fix bug", "Update config"
- Reference the changes made and their purpose
- Example: `Implement feature X to enhance user experience and fix bug Y in module Z`

**Before Pushing:**
```bash
# Ensure code quality
cd McLuhan && bun run verify
cd Hume && bun run test && bun run lint

# Check git status
git status

# Review changes
git diff

# Create commits
git add [files]
git commit -m "Clear description of changes"
```

**Creating Pull Requests:**
- Base PRs on the main branch for review
- Keep commits organized with clear messages
- Ensure all tests pass before requesting review
- Provide context about what the changes address and why

## Architectural Layers

### Layer 2: McLuhan - Agent Infrastructure

**Purpose:** Core AI agent orchestration, memory management, and CLI/TUI components

**Named after Marshall McLuhan** (media and communication theorist) - emphasizing how information is orchestrated and communicated.

**4 Core Packages (Strict Layering):**

1. **effect-supermemory** (Foundational)
   - Type-safe Supermemory API client
   - In-memory and HTTP backends with namespace isolation
   - Services: MemoriesService, SearchService, ConnectionsService, ToolsService
   - Base64 encoding for all memory values
   - No package dependencies

2. **effect-ai-sdk** (Independent Utility)
   - Vercel AI SDK v5 wrapper (functional library pattern, not Effect.Service)
   - 8+ AI provider support: OpenAI, Anthropic, Google, Groq, DeepSeek, Perplexity, xAI, Qwen
   - Operations: text generation, object generation, embeddings, streaming, tool-calling, image generation, audio
   - No package dependencies

3. **effect-cli-tui** (Depends on supermemory)
   - Terminal UI components: EffectCLI, TUIHandler
   - Interactive prompts: prompt(), selectOption(), multiSelect(), confirm(), password()
   - Display utilities: spinners, tables, boxes, panels with Chalk styling
   - Effect.Schema for input validation (NOT Zod)

4. **effect-actor** (Independent)
   - Statechart-based orchestration (xState-inspired)
   - Effect-native state machine patterns
   - No package dependencies

**Architecture Pattern:**
```typescript
// Mandatory Effect.Service pattern with Effect.fn()
export class MyService extends Effect.Service<MyService>()(
  "MyService",
  {
    effect: Effect.fn(function* (config: ConfigType) {
      return {
        method: (arg) => Effect.sync(() => { /* ... */ }),
      } satisfies MyServiceApi
    }),
  }
) {}
```

**Dependency Rules:**
- effect-supermemory → no dependencies (foundation)
- effect-ai-sdk → no dependencies (independent utility)
- effect-cli-tui → can depend on effect-supermemory
- effect-actor → no dependencies (independent)
- ❌ NO circular dependencies allowed
- ❌ NO "Live", "Impl", or "Layer" suffixes for services
- ❌ NO Context.Tag or direct instantiation

**Error Handling:**
All errors use Data.TaggedError with type-safe pattern matching:
```typescript
export class MemoryNotFoundError extends Data.TaggedError("MemoryNotFoundError")<{
  readonly key: string
}> {}

// Catch with type safety
.pipe(Effect.catchTag("MemoryNotFoundError", err => { /* err.key available */ }))
```

**For detailed guidance:** See `McLuhan/CLAUDE.md` (comprehensive patterns and examples)

### Layer 1: Hume - Data Foundation

**Purpose:** Type-safe data access and transformation forming the empirical foundation

**Named after David Hume** (philosopher emphasizing empiricism and evidence) - data is the foundation of knowledge.

**Three-Layer Architecture:**

**Layer 1: Resources (Zero External Dependencies)**
- `effect-json` - Type-safe JSON parsing with multiple backends (toon, jsonlines, superjson)
- `effect-env` - Environment variable validation and management
- `effect-regex` - Composable pattern matching and validation

**Layer 2: Content Capabilities**
- Format parsing: `effect-mdx`, `effect-yaml`, `effect-toml`, `effect-xml`, `effect-xmp`, `effect-csv`
- Template processing: `effect-liquid` (Shopify Liquid template engine)
- AI integration: `effect-models` (OpenRouter, HuggingFace), `effect-prompt` (prompt management)

**Layer 3: Service Providers (Planned)**
- Git, PDF, OpenAPI, HTML, Temporal (not yet implemented)

**Core Principles:**
1. **Empiricism First:** All knowledge comes from data
2. **Skeptical Validation:** Nothing taken on faith, every input validated
3. **Causal Relationships:** Errors explicitly linked to causes

**Quality Standards:**
- 100% test coverage (every line, branch, edge case)
- Comprehensive documentation with examples
- Performance benchmarks and optimization
- API stability with semantic versioning
- Security audits and vulnerability scanning

**For detailed guidance:** See `Hume/CLAUDE.md` (patterns, conventions, testing strategies)

## Universal Patterns & Conventions

### TypeScript Configuration

**Strict Mode (All Projects):**
- `strict: true`
- `exactOptionalPropertyTypes: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- Target: ES2022, Module: ESNext

### Effect.Service Pattern (Universal)

All services follow this mandatory structure:

```typescript
import { Effect } from "effect"

export interface MyServiceApi {
  readonly method: (arg: string) => Effect.Effect<Result, MyError>
}

export class MyService extends Effect.Service<MyService>()(
  "MyService",
  {
    effect: Effect.fn(function* (config: ConfigType) {
      return {
        method: (arg: string) =>
          Effect.sync(() => { /* implementation */ })
      } satisfies MyServiceApi
    }),
  }
) {}
```

**Key Rules:**
- ✅ Use `Effect.Service<T>()` with Effect.fn()
- ✅ Define API contract as `interface` in `api.ts`
- ✅ Use `satisfies MyServiceApi` for type safety
- ✅ Return service interface with methods
- ✅ Empty class body `{}`
- ❌ Never use `Context.Tag`
- ❌ Never use "Live", "Impl", "Layer" suffixes
- ❌ Never instantiate with `new`

### Error Handling (Discriminated Unions)

```typescript
import { Data } from "effect"

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string
  readonly field: string
  readonly value: unknown
  readonly cause?: Error
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resourceType: string
  readonly resourceId: string
}> {}
```

**Rules:**
- ✅ All fields must be `readonly`
- ✅ Always use `Data.TaggedError("ErrorName")`
- ✅ Include `cause?: Error` for error chaining
- ✅ Create specific error types per domain
- ✅ Use `Effect.catchTag()` for type-safe handling

### Import Organization

```typescript
// 1. Effect core
import { Effect, Schema, Layer, Data, Ref } from "effect"

// 2. Effect platform
import { FileSystem } from "@effect/platform"
import { NodeFileSystem } from "@effect/platform-node"

// 3. Third-party libraries
import matter from "gray-matter"

// 4. Workspace packages
import { jsonBackend } from "effect-json"

// 5. Relative imports - Types
import type { UserConfig } from "./types.js"

// 6. Relative imports - Implementation
import { MyService } from "./service.js"
```

**Critical Rules:**
- ✅ Always include `.js` extension in relative imports
- ✅ Use named imports from effect (no `import * as Effect`)
- ✅ Use `import type` for type-only imports
- ✅ Group by source with blank lines

### File Naming & Structure

**Naming Convention (Biome Ultracite Enforced):**
- Files: `kebab-case.ts` (all lowercase, hyphens)
- Classes: Named exports only (no defaults)
- Tests: `*.test.ts` in `__tests__/` directories

**Package Structure Template:**
```
packages/[package-name]/
├── src/
│   ├── index.ts           # Public API exports
│   ├── errors.ts          # Error definitions
│   ├── types.ts           # Type definitions
│   ├── service.ts         # Service implementation
│   └── api.ts             # Service interface
├── __tests__/
│   ├── unit/
│   └── integration/
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Testing Pattern

**No Mocking - Use Real Implementations:**

```typescript
import { Effect, Layer } from "effect"
import { describe, expect, it } from "vitest"
import { MyService } from "../service.js"

describe("MyService", () => {
  const TestMyService = Layer.succeed(MyService, {
    method: (input: string) =>
      Effect.succeed({ result: "test" })
  })

  it("should work", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MyService
      return yield* service.method("test")
    }).pipe(Effect.provide(TestMyService))

    const result = await Effect.runPromise(program)
    expect(result.result).toBe("test")
  })
})
```

## Code Quality Standards

**Biome Configuration:**
- Preset: `ultracite/core` (opinionated zero-config)
- All projects inherit from root `biome.jsonc`
- Enforces modern TypeScript, error handling, performance best practices

**Linting & Formatting:**
```bash
cd [Project]
bun run lint              # Check with Biome
bun run format:fix        # Auto-fix issues
```

**Type Checking:**
- Strict TypeScript validation
- `bun run typecheck` catches all errors before build
- Zero `any` without explicit `biome-ignore` comments

**Forbidden Patterns:**
- ❌ Double casts: `as unknown as Type` (type-safety bypass)
- ❌ Service name suffixes: "Live", "Impl", "Layer"
- ❌ `Context.Tag` (use Effect.Service instead)
- ❌ Default exports (use named exports)
- ❌ Zod for validation (use Effect.Schema)
- ❌ Direct `process.env` access (use effect-env)

## Workspace Dependencies

Projects use **Bun workspaces** with **workspace protocol**:

```json
{
  "dependencies": {
    "effect-supermemory": "workspace:*"
  }
}
```

**Rules:**
- Use `workspace:*` for dependencies on other monorepo packages
- Enables development-time local resolution and npm publishing independence
- Check `bun.lock` to understand dependency graph

### How Workspace Resolution Works

**During development:**
```typescript
// In effect-cli-tui package.json
{
  "dependencies": {
    "effect-supermemory": "workspace:*"
  }
}

// During development, this imports directly from effect-supermemory/src/
import { MemoriesService } from "effect-supermemory"
```

**For npm publishing:**
- When packages are published to npm, `workspace:*` is replaced with the actual published version
- Each package maintains independent versioning and can be published separately
- This allows monorepo development while maintaining npm publishing independence

**Checking dependencies:**
```bash
# View dependency tree
bun pm ls

# See what's in bun.lock (Bun's lockfile)
cat bun.lock | grep -A 5 "effect-supermemory"
```

## Project-Specific CLAUDE.md Files

For detailed guidance on each project:

- **`McLuhan/CLAUDE.md`** - Comprehensive architecture patterns, 4-package layering, service implementation templates, error handling patterns, testing strategies
- **`Hume/CLAUDE.md`** - Data foundation patterns, 3-layer architecture, format library patterns, empirical validation philosophy, comprehensive testing

These files contain copy-paste templates, detailed examples, and canonical patterns for each project.

## Development Workflow

### Common Development Tasks

**Run a single test file:**
```bash
cd McLuhan
bun run --filter effect-supermemory test -- memory-service.test.ts

cd Hume
bun run --filter effect-json test -- json-parser.test.ts
```

**Watch tests while developing:**
```bash
cd McLuhan
bun run test:watch

cd Hume
bun run test:watch
```

**Type-check without building:**
```bash
cd [Project]
bun run typecheck
```

**Fix formatting issues automatically:**
```bash
cd [Project]
bun run format:fix
```

### Adding a New Service to McLuhan

```bash
cd McLuhan
# Create new package or service in existing package
bun run --filter effect-[name] build
bun run --filter effect-[name] test
bun run verify           # Full verification
```

### Adding a New Package to Hume

```bash
cd Hume
# Create new package following structure
bun run --filter effect-[name] build
bun run test             # Test all
bun run check:architecture  # Verify layer rules
```

## Debugging Effect Programs

### Understanding Effect.fn() vs Effect.gen()

**Effect.fn() - For service parameterization:**
```typescript
// Use Effect.fn for services that need config/initialization
effect: Effect.fn(function* (config: Config) {
  // Runs once at layer construction time
  // config is available in closure
  return {
    method: (arg) => Effect.sync(() => { /* use config */ })
  }
})
```

**Effect.gen() - For async composition:**
```typescript
// Use Effect.gen for async operations and coordination
const myEffect = Effect.gen(function* () {
  const service = yield* MyService      // Acquire dependency
  const result = yield* service.method() // Execute operation
  return result
})
```

### Common Effect Debugging Patterns

**Logging during effect execution:**
```typescript
const program = Effect.gen(function* () {
  const service = yield* MyService
  yield* Effect.logInfo(`Starting operation`)
  const result = yield* service.method()
  yield* Effect.logDebug(`Result: ${JSON.stringify(result)}`)
  return result
})
```

**Catching and inspecting errors:**
```typescript
const program = Effect.gen(function* () {
  return yield* someEffect.pipe(
    Effect.catchTag("MyError", (err) => {
      // err is typed and all fields available
      yield* Effect.logError(`Caught error: ${err.message}`)
      return fallbackValue
    })
  )
})
```

**Running effects in tests:**
```typescript
// Basic execution
const result = await Effect.runPromise(myEffect)

// With error handling
const result = await Effect.runPromise(Effect.either(myEffect))
if (Either.isLeft(result)) {
  // Handle error in result.left
}

// With timeout (prevents hanging tests)
const result = await Effect.runPromise(
  myEffect.pipe(Effect.timeoutTo("5 seconds", () => fallback))
)
```

## Common Mistakes to Avoid

1. **Circular Dependencies** - McLuhan → Hume only. Never upward.
2. **Mutable State** - Use `Ref` or `FiberRef`, never bare `let`
3. **Service Instantiation** - Use dependency injection with layers, never `new MyService()`
4. **Error Patterns** - Use `Data.TaggedError`, not generic Error
5. **Validation Library** - Use Effect.Schema, never Zod
6. **Import Extensions** - Always use `.js` extension for relative imports
7. **Type Safety** - No double casts, no implicit `any`
8. **Forgetting to yield in Effect.gen()** - Forgetting `yield*` loses the effect context
9. **Missing Effect.provide()** - Services need layers provided to execute
10. **Mixing promises and effects** - Don't use `.then()` on effects; use `Effect.map()` instead

## IDE & Tool Configuration

### Cursor/Copilot AI Assistance

The Hume project includes a `.cursorrules` file that provides configuration for Cursor and Copilot AI assistants:

```
Hume/.cursorrules - Specific to Hume's Data Foundation patterns and conventions
```

This file includes:
- Service implementation templates
- Error handling patterns
- Testing patterns specific to Hume packages
- Common pitfalls and fixes
- Import organization rules
- Auto-import preferences

The root Trinity project should eventually have similar guidance files for McLuhan as it matures.

## Key Files & References

**Root Configuration:**
- `.vscode/` - Shared IDE settings
- All projects inherit Biome and TypeScript configuration

**McLuhan:**
- `packages/effect-supermemory/` - Memory layer
- `packages/effect-ai-sdk/` - AI operations (functional library)
- `packages/effect-cli-tui/` - Terminal UI and prompts
- `packages/effect-actor/` - State machine orchestration
- `CLAUDE.md` - Comprehensive patterns guide

**Hume:**
- `packages/effect-json/` - JSON parsing (canonical reference)
- `packages/effect-env/` - Configuration
- `packages/effect-mdx/`, `effect-yaml/`, etc. - Format libraries
- `packages/effect-models/` - LLM integration
- `packages/effect-prompt/` - Prompt management
- `CLAUDE.md` - Data foundation patterns
- `Agents.md` - Complete canonical patterns

## Technology Stack Summary

**Runtime & Build:**
- Bun 1.1.33+ (package manager, runtime, bundler)
- TypeScript 5.9.3 (strict mode)
- Node.js 18.18+

**Core Framework:**
- Effect.js 3.19.9+ (functional effect system, dependency injection)
- @effect/schema (type-safe validation)
- @effect/platform (platform abstractions)

**Tooling:**
- Biome 2.3.7 (linting, formatting with Ultracite preset)
- Vitest 4.0.15+ (testing framework)

**Key Dependencies:**
- Vercel AI SDK v5 (AI provider integration in McLuhan)
- Supermemory API (long-term memory in McLuhan)
- Liquid.js (template engine in Hume)

## Troubleshooting

### Build/Compile Issues

**Error: "Cannot find module 'effect-supermemory'"**
```bash
# Workspace packages not resolving? Run install
bun install

# Clear cache and reinstall
rm -rf bun.lock node_modules
bun install
```

**Type errors from other packages?**
```bash
# Type checking each project separately
cd McLuhan && bun run typecheck
cd Hume && bun run typecheck

# Full typecheck
bun run typecheck  # From root (if available)
```

### Runtime Issues

**Service layer not finding dependencies?**
```typescript
// ❌ Wrong - service not provided
const result = await Effect.runPromise(myEffect)

// ✅ Correct - provide the service layer
const program = myEffect.pipe(Effect.provide(MyService.Default))
const result = await Effect.runPromise(program)
```

**Workspace packages importing wrong version?**
```bash
# Verify workspace resolution
bun pm ls

# Check specific package
bun pm ls effect-supermemory
```

### Testing Issues

**Tests hanging (no timeout)**
```typescript
// Add timeout to prevent hanging tests
const result = await Effect.runPromise(
  myEffect.pipe(Effect.timeoutFail("5 seconds", () => new TestTimeoutError()))
)
```

**Service tests failing with missing dependencies?**
- Ensure all services are provided via layers in test setup
- Check that test layers match actual service interfaces

## External Documentation

- **Effect.ts:** https://effect.website
- **Biome:** https://biomejs.dev
- **Ultracite:** https://github.com/Phylogenic/ultracite
- **Bun:** https://bun.sh
- **Vercel AI SDK:** https://ai.vercel.com

## Summary

Trinity is a well-architected two-layer monorepo:

- **McLuhan** - Agent orchestration, memory, and TUI
- **Hume** - Type-safe data foundation with strict layering

All projects share:
- Strict TypeScript (no `any`, exact null checks)
- Effect.js functional patterns (services, effects, error handling)
- Biome code quality enforcement
- Bun workspace dependency management
- No mocking in tests (real implementations only)

**Key Design Principle:** Strict downward dependencies enable independent package development while preventing circular coupling.
