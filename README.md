# EffectTalk

**EffectTalk** is a unified Effect-native monorepo that combines agent infrastructure and data foundation capabilities into a cohesive toolkit for building AI-powered applications.

## Overview

EffectTalk merges two complementary projects into a single monorepo:

- **Layer 2: Agent Infrastructure** (McLuhan packages)
  - AI agent orchestration, state machines, and workflows
  - Memory management and semantic search
  - CLI/TUI components and interactive prompts
  - AI provider integrations and LLM operations

- **Layer 1: Data Foundation** (Hume packages)
  - Type-safe data parsing and validation
  - Format transformations (JSON, YAML, XML, CSV, MDX, etc.)
  - Template processing and prompt management
  - External service integrations

## Quick Start

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Type checking
bun run typecheck

# Run all tests
bun run test

# Watch mode for tests
bun run test:watch

# Lint and format
bun run lint
bun run format:fix

# Full verification (format → lint → typecheck → build → test)
bun run verify
```

## Project Structure

```
EffectTalk/
├── packages/              # 27 unified packages
│   ├── effect-actor/      # State machine orchestration
│   ├── effect-ai-sdk/     # Vercel AI SDK wrapper
│   ├── effect-cli-tui/    # Terminal UI and CLI
│   ├── effect-cockpit/    # Agent dashboard
│   ├── effect-supermemory/ # Long-term memory client
│   └── ... (22 more Hume packages)
├── scripts/               # Validation and automation utilities
│   ├── architecture-check.ts
│   ├── validate-test-structure.ts
│   ├── check-coverage-threshold.ts
│   ├── aggregate-coverage.ts
│   └── consumer-smoke-test.ts
├── package.json          # Workspace root configuration
├── tsconfig.json         # Unified TypeScript configuration
├── biome.jsonc           # Unified code quality rules (Ultracite preset)
├── vitest.config.shared.ts # Shared test configuration
└── CLAUDE.md             # Development guidance
```

## Architecture

### Layered Dependency Structure

```
Applications / AI Agents
        ↓
    Layer 2: Agent Infrastructure (McLuhan)
    - effect-actor (orchestration)
    - effect-ai-sdk (AI operations)
    - effect-cli-tui (terminal UI)
    - effect-cockpit (dashboard)
    - effect-supermemory (memory)
        ↓
    Layer 1: Data Foundation (Hume)
    - Resources: effect-env, effect-json, effect-regex, effect-schema-utils
    - Content: effect-yaml, effect-xml, effect-csv, effect-mdx, effect-html,
               effect-pdf, effect-liquid, effect-prompt, effect-models, etc.
    - Services: effect-repository, effect-telemetry, effect-artifact, etc.
        ↓
    Effect.js + TypeScript Runtime
```

**Key Principle:** Strict downward dependencies only. Layer 2 can depend on Layer 1, but never the reverse.

## Development Guidelines

### Building a Specific Package

```bash
# Build a single package
bun run --filter effect-supermemory build

# Test a single package
bun run --filter effect-json test

# Watch tests for a package
bun run --filter effect-cli-tui test:watch

# Lint a single package
bun run --filter effect-ai-sdk lint
```

### Code Quality Standards

- **TypeScript:** Strict mode with `noUncheckedIndexedAccess: true` and `exactOptionalPropertyTypes: true`
- **Linting/Formatting:** Biome with Ultracite preset for zero-config code quality
- **Testing:** Vitest with 85% coverage threshold (configurable per package)
- **Error Handling:** Type-safe `Data.TaggedError` for discriminated unions
- **Validation:** Effect.Schema (not Zod) for all input validation

### Essential Patterns

**Effect.Service Pattern (Mandatory):**
```typescript
export class MyService extends Effect.Service<MyService>()(
  "MyService",
  {
    effect: Effect.fn(function* (config: ConfigType) {
      return {
        method: (arg) => Effect.sync(() => { /* ... */ }),
      } satisfies MyServiceApi;
    }),
  }
) {}
```

**Error Handling:**
```typescript
export class MyError extends Data.TaggedError("MyError")<{
  readonly field: string;
  readonly cause?: Error;
}> {}
```

**Workspace Dependencies:**
```json
{
  "dependencies": {
    "effect-supermemory": "workspace:*"
  }
}
```

## Packages by Layer

### Layer 2: Agent Infrastructure

| Package | Purpose | Dependencies |
|---------|---------|--------------|
| `effect-supermemory` | Supermemory API client for long-term memory | effect-env, effect-json |
| `effect-cli-tui` | Terminal UI, prompts, and CLI utilities | effect-supermemory, effect-env, effect-json |
| `effect-ai-sdk` | Vercel AI SDK wrapper (8+ providers) | None |
| `effect-actor` | Statechart-based state machine orchestration | None |
| `effect-cockpit` | Agent dashboard and monitoring | Other Layer 2 packages |

### Layer 1: Data Foundation

**Resources (Zero External Dependencies):**
- `effect-env` — Environment variable management and validation
- `effect-json` — Type-safe JSON parsing with multiple backends
- `effect-regex` — Composable pattern matching and validation
- `effect-schema-utils` — Effect.Schema utilities and helpers

**Content Capabilities:**
- `effect-mdx` — MDX parsing and processing
- `effect-yaml` — YAML parsing and serialization
- `effect-xml` — XML parsing and transformation
- `effect-xmp` — XMP metadata extraction
- `effect-toml` — TOML configuration parsing
- `effect-csv` — CSV parsing and generation
- `effect-html` — HTML parsing and manipulation
- `effect-pdf` — PDF extraction and generation
- `effect-liquid` — Shopify Liquid template engine
- `effect-prompt` — Prompt management and templating
- `effect-models` — LLM integration (OpenRouter, HuggingFace)
- `effect-image` — Image processing and metadata

**Service Providers:**
- `effect-repository` — Git repository operations
- `effect-artifact` — Artifact extraction and management
- `effect-attachment` — File attachment handling
- `effect-storage` — File system operations
- `effect-telemetry` — Observability and metrics
- `effect-models-website` — Website integration for models

## Validation Scripts

```bash
# Check architecture rules (layer dependencies, service patterns)
bun run check:architecture

# Validate test structure (unit/, integration/, fixtures/)
bun run check:test-structure

# Check dependency violations
bun run check:dependencies

# Aggregate and check coverage across all packages
bun run test:coverage:aggregate
bun run test:coverage:check

# Consumer smoke tests (compatibility verification)
bun run smoke:consumer

# Full verification pipeline
bun run verify
```

## Configuration Files

### `package.json`
Workspace root with monorepo-wide scripts and dependencies. All packages defined as workspaces under `packages/*`.

### `tsconfig.json`
Unified TypeScript configuration with:
- Strict mode enabled
- NodeNext module resolution for npm compatibility
- Path aliases: `@/*` → `packages/*`
- Declaration maps and source maps enabled

### `biome.jsonc`
Code quality configuration using Ultracite preset:
- Enforces modern TypeScript patterns
- Barrel file exceptions for `index.ts`
- Disabled linting for Markdown files

### `vitest.config.shared.ts`
Shared Vitest configuration:
- 85% coverage thresholds for all metrics
- Global test utilities
- Test file patterns: `__tests__/**/*.test.ts` and `test/**/*.test.ts`

## Migration from Separate Repos

EffectTalk was created by merging two independent repositories (McLuhan and Hume) into a unified monorepo. Benefits include:

✅ **Unified version control** — Single git history for atomic commits
✅ **Simplified development** — One `bun install`, one dependency graph
✅ **Workspace integration** — Live development without publishing
✅ **Consistent tooling** — Shared configurations and standards
✅ **Better architecture validation** — Layer dependencies enforced across all packages
✅ **Simplified CI/CD** — Single pipeline for all packages

## Next Steps

After this initial merge, the following work items are planned:

### Phase 2: CI/CD Modernization
- [ ] Migrate GitHub Actions to single unified pipeline
- [ ] Set up changesets for coordinated versioning
- [ ] Configure automated npm publishing

### Phase 3: Documentation
- [ ] Consolidate CLAUDE.md files into unified architecture guide
- [ ] Create migration guide for consumers
- [ ] Update package READMEs with new repo URLs

### Phase 4: Quality Gates
- [ ] Run full `bun run verify` pipeline
- [ ] Achieve consistent test coverage across all packages
- [ ] Archive old repositories with deprecation notices

### Phase 5: Beta Release
- [ ] Publish beta versions from unified monorepo
- [ ] Test in external projects
- [ ] Gather feedback on monorepo structure

## TypeScript Configuration Notes

The unified `tsconfig.json` adopts the strictest settings from both projects:

- `noUncheckedIndexedAccess: true` — Safer array/object access
- `exactOptionalPropertyTypes: true` — Correct optional property handling
- `NodeNext` module resolution — Better npm compatibility
- Declaration maps and source maps — Improved debugging

Some packages may require gradual migration if they have incompatible code. Use package-level `tsconfig.json` overrides during migration if needed.

## Testing & Coverage

- **Framework:** Vitest with v8 coverage provider
- **Coverage Target:** 85% for all metrics (lines, functions, branches, statements)
- **Organization:** Tests in `__tests__/` (unit/, integration/) and `test/` directories
- **Patterns:** Real implementations (no mocking), Effect dependency injection for services
- **Anti-Mocking Policy:** Tests use real services or skip gracefully if dependencies unavailable

## Contributing

When working with EffectTalk:

1. Make changes in appropriate package(s)
2. Run `bun run test --filter [package]` to verify tests
3. Run `bun run typecheck` for type safety
4. Run `bun run lint && bun run format:fix` for code quality
5. Run `bun run verify` for full verification before committing
6. Use conventional commit style: `feat:`, `fix:`, `chore:`, etc.

## Key Resources

- **Effect.js Documentation:** https://effect.website
- **Biome:** https://biomejs.dev
- **Ultracite Preset:** https://github.com/Phylogenic/ultracite
- **Bun:** https://bun.sh

## Architecture Decision Records

See individual package CLAUDE.md files and `/packages/[package]/docs/` for:
- Detailed service patterns
- Error handling strategies
- Test structure guidelines
- API design principles

## License

MIT

---

**Last Updated:** January 2026
**Status:** ✅ Unified Monorepo (Phase 1 Complete)
**Next:** GitHub Actions & Changesets Integration
