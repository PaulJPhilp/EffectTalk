# EffectTalk

> **Unified Effect-native monorepo for building AI-powered applications with type-safe, functionally-driven infrastructure**

[![Version](https://img.shields.io/badge/version-0.5.0--beta-blue)](https://github.com/PaulJPhilp/EffectTalk/releases/tag/effecttalk-v0.5.0-beta)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue)](https://www.typescriptlang.org/)
[![Effect.js](https://img.shields.io/badge/Effect.js-3.19+-purple)](https://effect.website)
[![Bun](https://img.shields.io/badge/Bun-1.1+-orange)](https://bun.sh)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Overview

**EffectTalk** is a comprehensive monorepo that combines AI agent infrastructure and data foundation capabilities into a cohesive, type-safe toolkit for building sophisticated AI-powered applications.

Built on [Effect.js](https://effect.website), EffectTalk provides functional programming patterns, powerful error handling, and dependency injection out of the box—without requiring in-depth knowledge of category theory or advanced FP concepts.

### Core Layers

```text
┌─────────────────────────────────────────────────────────┐
│  Your AI Applications & Agents                          │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────▼──────────────┐
        │   Layer 2: McLuhan        │
        │ Agent Infrastructure      │
        ├──────────────────────────┤
        │ • AI Orchestration       │
        │ • Memory & Search        │
        │ • CLI/TUI Components     │
        │ • LLM Integrations       │
        └────────────┬─────────────┘
                     │
        ┌────────────▼──────────────┐
        │   Layer 1: Hume          │
        │ Data Foundation          │
        ├──────────────────────────┤
        │ • Format Parsing         │
        │ • Type-Safe Validation   │
        │ • Content Processing     │
        │ • External Integrations  │
        └────────────┬─────────────┘
                     │
        ┌────────────▼──────────────┐
        │   Effect.js Runtime      │
        │   TypeScript/Node.js      │
        └──────────────────────────┘
```

**Key Principle:** Strict downward dependencies only. Layer 2 can depend on Layer 1, but never the reverse. This maintains architectural integrity and enables independent, reusable components.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Common Commands](#common-commands)
- [Usage Examples](#-usage-examples)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Testing & Quality](#-testing--quality)
- [Development Workflow](#-development-workflow)
- [Detailed Package Guide](#-detailed-package-guide)
  - [Agent Infrastructure](#agent-infrastructure)
  - [Data Foundation](#data-foundation)
- [External Integrations](#-external-integrations)
- [Security Considerations](#-security-considerations)
- [Performance Tips](#-performance-tips)
- [Troubleshooting](#-troubleshooting)
- [Additional Resources](#-additional-resources)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## ✨ Key Features

### 🏗️ **Functional Architecture**

- Effect.js-based services for composable, type-safe effects
- Automatic dependency injection via Effect.Service pattern
- Powerful error handling with discriminated unions (Data.TaggedError)
- Type-safe effect composition and async orchestration

### 🤖 **AI Agent Infrastructure**

- **effect-supermemory** — Long-term memory with semantic search
- **effect-ai-sdk** — 8+ LLM provider integration (OpenAI, Anthropic, Google, Groq, DeepSeek, etc.)
- **effect-actor** — Statechart-based state machines for workflow orchestration
- **effect-cli-tui** — Rich terminal UI with interactive prompts and components
- **effect-cockpit** — Agent dashboard for monitoring and control

### 📦 **Data Foundation (17 Packages)**

- **Parsing:** JSON, YAML, XML, CSV, MDX, HTML, PDF, TOML, XMP
- **Templates:** Shopify Liquid engine with semantic template processing
- **Validation:** Effect.Schema-based type-safe validation (no Zod)
- **Integration:** LLM models (OpenRouter, HuggingFace), Git repositories, prompt management

### 🛡️ **Type Safety**

- Strict TypeScript with `exactOptionalPropertyTypes: true`
- Zero implicit `any` — all types explicit
- Compile-time guarantees for error handling
- Full discriminated union support for runtime type safety

### 🎨 **Code Quality**

- Biome linting with Ultracite preset (zero-config, opinionated)
- 85%+ test coverage across all packages
- Automated formatting and error detection
- Architecture validation (dependency rule enforcement)

---

## 🚀 Quick Start

### Prerequisites

- **Bun 1.1.33+** (<https://bun.sh>)
- **Node.js 18.18+** (for development)
- **Git** (for cloning)

### Installation

```bash
# Clone the repository
git clone https://github.com/PaulJPhilp/EffectTalk.git
cd EffectTalk

# Install dependencies using Bun
bun install

# Verify setup
bun run typecheck
```

### Common Commands

```bash
# Development
bun run build              # Build all packages
bun run typecheck         # Type checking with strict mode
bun run test              # Run all tests
bun run test:watch        # Watch mode for development
bun run lint              # Biome linting
bun run format:fix        # Auto-fix formatting issues

# Full verification pipeline (runs before commits)
bun run verify            # format → lint → typecheck → build → test

# Individual package operations
bun run --filter effect-supermemory build
bun run --filter effect-json test
bun run --filter effect-cli-tui test:watch
```

---

## 📚 Usage Examples

### Using Effect-AI-SDK (LLM Operations)

```typescript
import * as Effect from "effect/Effect";
import { generateText, streamText } from "effect-ai-sdk";

// Generate text with Claude
const generateAnswer = Effect.gen(function* () {
  const result = yield* generateText({
    model: "claude-3.5-sonnet",
    system: "You are a helpful assistant.",
    prompt: "Explain quantum computing in simple terms",
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  return result.text;
});

// Stream text response
const streamingAnswer = Effect.gen(function* () {
  yield* streamText({
    model: "gpt-4",
    prompt: "Write a poem about functional programming",
    apiKey: process.env.OPENAI_API_KEY,
    onText: (chunk) => console.log(chunk),
  });
});

// Execute with error handling
Effect.runPromise(generateAnswer)
  .then((answer) => console.log(answer))
  .catch((error) => console.error("Generation failed:", error));
```

### Using Effect-Supermemory (Long-Term Memory)

```typescript
import * as Effect from "effect/Effect";
import { SupermemoryClient } from "effect-supermemory";

// Initialize memory client
const memoryProgram = Effect.gen(function* () {
  const memory = yield* SupermemoryClient;

  // Store a memory
  yield* memory.put("user:alice:preferences", {
    theme: "dark",
    language: "en",
  });

  // Retrieve memory
  const preferences = yield* memory.get("user:alice:preferences");

  // Search semantically
  const results = yield* memory.search("user preferences and settings", {
    limit: 5,
  });

  return { preferences, results };
});

// Create layer with API configuration
const layer = SupermemoryClient.Default({
  namespace: "my-app",
  baseUrl: "https://api.supermemory.dev",
  apiKey: process.env.SUPERMEMORY_API_KEY,
});

// Run with dependency injection
Effect.runPromise(memoryProgram.pipe(Effect.provide(layer))).catch((error) =>
  console.error("Memory operation failed:", error),
);
```

### Using Effect-CLI-TUI (Interactive Prompts)

```typescript
import * as Effect from "effect/Effect";
import {
  prompt,
  selectOption,
  multiSelect,
  confirm,
  spinner,
} from "effect-cli-tui";

const interactiveProgram = Effect.gen(function* () {
  // Text input
  const name = yield* prompt("What's your name?");

  // Single select
  const theme = yield* selectOption("Choose a theme:", [
    "light",
    "dark",
    "auto",
  ]);

  // Multiple select
  const features = yield* multiSelect("Select features:", [
    "memory",
    "api",
    "ui",
    "telemetry",
  ]);

  // Confirmation
  const confirmed = yield* confirm(
    `Continue with ${features.length} features?`,
  );

  // Spinner for async operations
  yield* spinner("Processing setup...", Effect.sleep(2000));

  return { name, theme, features, confirmed };
});

// Run and get user input
Effect.runPromise(interactiveProgram)
  .then((config) => console.log("Config:", config))
  .catch((error) => console.error("Setup failed:", error));
```

### Using Effect-JSON (Type-Safe Parsing)

```typescript
import * as Effect from "effect/Effect";
import { Schema } from "effect";
import { parseJson } from "effect-json";

// Define type-safe schema
const UserSchema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
  email: Schema.String.pipe(Schema.minLength(5)),
});

const parseUserJson = Effect.gen(function* () {
  const jsonString =
    '{"name": "Alice", "age": 30, "email": "alice@example.com"}';

  // Parse with validation
  const user = yield* parseJson(jsonString, UserSchema);

  return user;
});

// Run and get parsed user object with type safety
Effect.runPromise(parseUserJson)
  .then((user) => console.log("User:", user))
  .catch((error) => console.error("Parse error:", error));
```

### Using Effect-YAML (Configuration Files)

```typescript
import * as Effect from "effect/Effect";
import { parseYaml, stringifyYaml } from "effect-yaml";

const configProgram = Effect.gen(function* () {
  const yamlString = `
    server:
      port: 3000
      host: localhost
    database:
      url: postgres://localhost/myapp
  `;

  // Parse YAML
  const config = yield* parseYaml(yamlString);

  // Stringify back to YAML
  const updated = { ...config, debug: true };
  const yamlOutput = yield* stringifyYaml(updated);

  return yamlOutput;
});

Effect.runPromise(configProgram)
  .then((yaml) => console.log(yaml))
  .catch((error) => console.error("YAML error:", error));
```

---

## 📁 Project Structure

```text
EffectTalk/
├── packages/                    # 28 workspace packages
│   ├── McLuhan/ (Agent Infrastructure - 5 packages)
│   │   ├── effect-supermemory/ # Long-term memory API client
│   │   ├── effect-ai-sdk/      # Vercel AI SDK wrapper with 8+ providers
│   │   ├── effect-cli-tui/     # Terminal UI and interactive prompts
│   │   ├── effect-actor/       # Statechart-based orchestration
│   │   └── effect-cockpit/     # Agent dashboard
│   │
│   └── Hume/ (Data Foundation - 23 packages)
│       ├── Resources/ (zero external dependencies)
│       │   ├── effect-env/     # Environment variable validation
│       │   ├── effect-json/    # Type-safe JSON parsing
│       │   ├── effect-regex/   # Pattern matching and validation
│       │   └── effect-schema-utils/ # Schema utilities
│       │
│       ├── Content/ (format parsing and processing)
│       │   ├── effect-yaml/    # YAML parsing
│       │   ├── effect-xml/     # XML parsing
│       │   ├── effect-csv/     # CSV parsing
│       │   ├── effect-mdx/     # MDX processing
│       │   ├── effect-html/    # HTML manipulation
│       │   ├── effect-pdf/     # PDF extraction
│       │   ├── effect-liquid/  # Liquid templates
│       │   ├── effect-prompt/  # Prompt management
│       │   ├── effect-models/  # LLM integration
│       │   └── ... (4 more)
│       │
│       └── Services/ (external integrations)
│           ├── effect-repository/ # Git operations
│           ├── effect-artifact/   # Artifact extraction
│           ├── effect-storage/    # File operations
│           ├── effect-telemetry/  # Observability
│           └── ... (more)
│
├── scripts/                     # Validation and automation
│   ├── architecture-check.ts   # Enforce layer dependencies
│   ├── check-coverage-threshold.ts
│   ├── aggregate-coverage.ts
│   └── consumer-smoke-test.ts
│
├── package.json               # Workspace root
├── tsconfig.json              # Unified TypeScript config
├── biome.jsonc                # Code quality rules (Ultracite)
├── vitest.config.shared.ts    # Test configuration
├── CLAUDE.md                  # Development guidance
└── README.md                  # This file
```

---

## 🏛️ Architecture

### Design Principles

1. **Strict Layering** — Downward dependencies only (Layer 2 → Layer 1, never upward)
2. **Functional Effects** — All async operations use Effect.js for composability
3. **Type Safety** — Strict TypeScript with compile-time guarantees
4. **Error Transparency** — Discriminated unions for type-safe error handling
5. **No Mocking** — Tests use real implementations for accuracy
6. **Workspace Integration** — Live development without publishing

### Layer 2: McLuhan (Agent Infrastructure)

| Package              | Purpose                               | Key Exports                                             |
| -------------------- | ------------------------------------- | ------------------------------------------------------- |
| `effect-supermemory` | Long-term memory with semantic search | `SupermemoryClient`, `SearchService`, `MemoriesService` |
| `effect-ai-sdk`      | Multi-provider LLM integration        | `generateText()`, `streamText()`, `generateObject()`    |
| `effect-cli-tui`     | Terminal UI and interactive prompts   | `prompt()`, `selectOption()`, `spinner()`, `Table`      |
| `effect-actor`       | State machine orchestration           | `createActor()`, `interpret()`                          |
| `effect-cockpit`     | Agent monitoring and control          | Dashboard components and APIs                           |

**Dependencies:** effect-supermemory, effect-ai-sdk, effect-env, effect-json, effect-cli-tui

### Layer 1: Hume (Data Foundation)

#### Resources (No External Dependencies)

- **effect-env** — Environment variable parsing and validation
- **effect-json** — JSON parsing with multiple backends (toon, jsonlines, superjson)
- **effect-regex** — Composable regex patterns and validation
- **effect-schema-utils** — Schema utilities and refinements

#### Content Capabilities (Format Processing)

- **Structured:** effect-yaml, effect-xml, effect-csv, effect-toml
- **Documents:** effect-mdx, effect-html, effect-pdf
- **AI:** effect-prompt (templates), effect-models (LLM integration), effect-liquid (Shopify templates)
- **Media:** effect-image (image processing), effect-xmp (metadata)

#### Services (External Integrations)

- **effect-repository** — Git operations and repository management
- **effect-artifact** — Artifact extraction and versioning
- **effect-attachment** — File attachment handling
- **effect-storage** — File system operations
- **effect-telemetry** — Observability and metrics collection

### Dependency Graph

```typescript
Your App
  ↓
effect-cockpit → effect-actor, effect-cli-tui
  ↓
effect-cli-tui → effect-supermemory, effect-env, effect-json
  ↓
effect-supermemory → effect-json, effect-env
  ↓
effect-ai-sdk (independent)
  ↓
effect-* (Hume Layer 1) → None (internal Hume deps only)
```

---

## 🧪 Testing & Quality

### Test Coverage

All packages maintain **85%+ coverage** across:

- **Lines** — Code execution coverage
- **Functions** — Function coverage
- **Branches** — Conditional branch coverage
- **Statements** — Individual statement coverage

### Running Tests

```bash
# All packages
bun run test

# Specific package
bun run --filter effect-json test

# Watch mode
bun run test:watch

# Coverage report
bun run test:coverage
bun run test:coverage:aggregate
bun run test:coverage:check
```

### Testing Patterns

EffectTalk uses **real implementations** without mocking:

```typescript
import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import { MyService } from "../service.js";

describe("MyService", () => {
  const testLayer = MyService.Default(/* config */);

  it("performs operation", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MyService;
      return yield* service.operation();
    }).pipe(Effect.provide(testLayer));

    const result = await Effect.runPromise(program);
    expect(result).toBe(expectedValue);
  });
});
```

---

## 🔧 Development Workflow

### Setting Up a New Feature

```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Make changes in affected package(s)
# 3. Test the package
bun run --filter my-package test

# 4. Type check
bun run typecheck

# 5. Format and lint
bun run format:fix
bun run lint

# 6. Full verification before commit
bun run verify

# 7. Commit with conventional style
git commit -m "feat: Add new feature to my-package"
```

### Conventional Commits

```bash
feat:      # New feature
fix:       # Bug fix
chore:     # Build, dependencies, docs
refactor:  # Code restructuring
perf:      # Performance improvements
test:      # Test additions/fixes
style:     # Formatting only
docs:      # Documentation
```

Example:

```typescript
feat: Add semantic search to effect-supermemory

- Implement vector search with reranking
- Add RRF (Reciprocal Rank Fusion) algorithm
- Update SearchService with new queryOptions

Closes #123
```

### Code Quality Standards

**Import Path Standardization:**

- **Package-relative paths only** — Use `./` and `../` for internal imports
- **No monorepo @/ paths** — Avoid `@/package-name` absolute paths
- **Consistent patterns** — All packages follow the same import structure
- **Build reliability** — Package-relative paths ensure consistent builds

```typescript
// ✅ Correct - Package-relative imports
import { MyService } from "./service.js";
import { Types } from "../types/index.js";
import { Utils } from "./utils/helpers.js";

// ❌ Wrong - Monorepo absolute paths
import { MyService } from "@/my-package/service.js";
import { Types } from "@/my-package/types/index.js";
```

**TypeScript Strictness:**

- `strict: true` — All strict checking enabled
- `exactOptionalPropertyTypes: true` — Correct optional handling
- `noUncheckedIndexedAccess: true` — Safe array/object access
- `noImplicitOverride: true` — Explicit override keywords

**Biome (Ultracite Preset):**

- Zero-config opinionated linting
- Automatic formatting fixes
- Performance and security checks
- Accessibility validation

**Error Handling:**

```typescript
// ✅ Correct - Type-safe discriminated errors
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string;
  readonly value: unknown;
  readonly cause?: Error;
}> {}

// ❌ Wrong - Generic Error
throw new Error("Invalid field");
```

**Service Pattern:**

```typescript
// ✅ Correct - Effect.Service with Effect.fn()
export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.fn(function* (config: Config) {
    return {
      method: (arg) =>
        Effect.sync(() => {
          /* ... */
        }),
    } satisfies MyServiceApi;
  }),
}) {}

// ❌ Wrong - Direct instantiation or Context.Tag
const service = new MyService(config); // FORBIDDEN
```

---

## 📖 Detailed Package Guide

### Effect-Supermemory

Long-term memory with semantic search. Store, retrieve, and search memories with vector embeddings.

**Key Classes:**

- `SupermemoryClient` — HTTP client for Supermemory API
- `SearchService` — Semantic search with reranking
- `MemoriesService` — CRUD operations for memories

**Example:**

```typescript
const memoryOps = Effect.gen(function* () {
  const memories = yield* MemoriesService;

  // Store
  yield* memories.put("key", { data: "value" });

  // Retrieve
  const item = yield* memories.get("key");

  // Search
  const results = yield* memories.search("query");
});
```

### Effect-AI-SDK

Multi-provider LLM integration. Generate text, objects, embeddings from 8+ providers.

**Supported Providers:**

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Groq
- DeepSeek
- Perplexity
- xAI
- Qwen

**Example:**

```typescript
const result =
  yield *
  generateText({
    model: "claude-3-sonnet",
    prompt: "Explain quantum computing",
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
```

### Effect-JSON

Type-safe JSON parsing with multiple backend options.

**Features:**

- Schema-based validation
- Multiple parsing backends (toon, jsonlines, superjson)
- Error recovery with fallbacks
- Streaming JSON parsing

**Example:**

```typescript
const UserSchema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});

const user = yield * parseJson(jsonString, UserSchema);
```

### Effect-CLI-TUI

Terminal UI components and interactive prompts for CLI applications.

**Components:**

- `prompt()` — Text input
- `selectOption()` — Single selection
- `multiSelect()` — Multiple selections
- `confirm()` — Yes/no confirmation
- `spinner()` — Loading indicator
- `Table` — Formatted data display
- `Panel` — Box with border
- `Box` — Simple container

---

## 🌐 External Integrations

### Effect-Models (LLM Integration)

Access OpenRouter and HuggingFace models through unified interface.

### Effect-Prompt (Prompt Management)

Template-based prompt management with variable substitution and validation.

### Effect-Repository (Git Operations)

Clone, commit, push repositories programmatically.

### Effect-Liquid (Template Engine)

Shopify Liquid template engine for dynamic content generation.

---

## 🔒 Security Considerations

1. **API Keys** — Use environment variables, never hardcode
2. **Input Validation** — All user input validated with Effect.Schema
3. **Error Messages** — Sensitive info not exposed in error messages
4. **Dependencies** — Regular audit with `bun audit`
5. **Type Safety** — Compile-time guarantees prevent many vulnerabilities

---

## ⚡ Performance Tips

1. **Effect.Stream** — Use for large datasets to avoid loading into memory
2. **Batch Operations** — Batch multiple operations into single HTTP request
3. **Caching** — Implement caching layer for frequently accessed data
4. **Lazy Evaluation** — Effects compose lazily; execution is explicit
5. **Parallel Effects** — Use `Effect.all()` for concurrent operations

---

## 🐛 Troubleshooting

### Build Fails with TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist
bun install
bun run build
```

### Tests Not Running

```bash
# Check Vitest configuration
bun run test -- --reporter=verbose

# Run specific test file
bun run test -- packages/effect-json/__tests__/unit.test.ts
```

### Dependency Resolution Issues

```bash
# Verify workspace links
bun run test:smoke

# Check dependency graph
bun pm ls

# Rebuild lock file
rm bun.lock
bun install
```

### Type Errors in IDE

```bash
# Regenerate type definitions
bun run build

# Force IDE reload (VS Code)
# - Restart TypeScript server (Cmd+Shift+P → "TypeScript: Restart TS Server")
# - Reload window (Cmd+Shift+P → "Developer: Reload Window")
```

---

## 📚 Additional Resources

### Official Documentation

- **Effect.js** — <https://effect.website>
- **Biome** — <https://biomejs.dev>
- **Bun** — <https://bun.sh>
- **TypeScript** — <https://www.typescriptlang.org>

### Architectural Guides

- **Root CLAUDE.md** — Overall architecture and patterns
- **Package CLAUDE.md files** — Package-specific guidance
- **ADR (Architecture Decision Records)** — Design decisions and rationale

### Community

- **Effect Discord** — <https://discord.gg/effect-ts>
- **GitHub Issues** — <https://github.com/PaulJPhilp/EffectTalk/issues>
- **Discussions** — <https://github.com/PaulJPhilp/EffectTalk/discussions>

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork and branch** — Create a feature branch from `main`
2. **Make changes** — Focus on a single concern per commit
3. **Test thoroughly** — Maintain 85%+ coverage
4. **Follow patterns** — Use existing conventions
5. **Write clear commits** — Use conventional commit format
6. **Submit PR** — Include description of changes and motivation

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📋 Roadmap

### Current (v0.5.0-beta)

- ✅ Unified monorepo with 28 packages
- ✅ Complete type safety with strict TypeScript
- ✅ Multi-provider LLM integration
- ✅ Long-term memory with semantic search
- ✅ Terminal UI and CLI components
- ✅ 17 data format parsers and processors
- ✅ Package-relative import path standardization across all packages

### Next (v0.6.0)

- [ ] Persistent memory store (PostgreSQL backend)
- [ ] Advanced workflow orchestration
- [ ] Real-time streaming operations
- [ ] Enhanced monitoring and observability
- [ ] Browser compatibility (Wasm support)

### Future (v1.0.0)

- [ ] Visual workflow builder
- [ ] Agent marketplace
- [ ] Enhanced caching layers
- [ ] Production hardening
- [ ] Performance optimizations

---

## 📄 License

EffectTalk is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Effect.js** team for the powerful effect system
- **Biome** team for opinionated code quality
- **Bun** team for fast Node.js tooling
- All contributors and community members

---

**Status:** ✅ v0.5.0-beta (Active Development)
**Last Updated:** January 2026
**Repository:** <https://github.com/PaulJPhilp/EffectTalk>

---

Built with ❤️ for the functional programming community.
