# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2] - 2026-01-19

### 🚀 Features

- **Documentation**: Added comprehensive AGENTS.md guide for AI agent development
- **Architecture**: Added detailed ARCHITECTURE.md with Mermaid diagrams
- **Standards**: Updated CLAUDE.md with current project state and import standards

### 🛠️ Improvements

- **Path Standardization**: Convert @/ imports to package-relative paths across all packages
  - effect-regex: Fixed @/ imports in src/index.ts and src/mcp/server.ts
  - effect-yaml: Fixed @/ imports in src/index.ts
  - effect-supermemory: Fixed @/ imports in src/index.ts
  - All packages now use `./` and `../` paths for internal imports
- **Build Reliability**: Package-relative paths ensure consistent builds across environments
- **Package Isolation**: Clear import boundaries prevent monorepo dependencies

### 📝 Documentation

- **AGENTS.md**: Complete guide to building AI agents with EffectTalk
  - Agent architecture and patterns
  - State machine orchestration with effect-actor
  - LLM integration with effect-ai-sdk
  - Memory management with effect-supermemory
  - CLI/TUI interfaces with effect-cli-tui
  - Testing, deployment, and security patterns
- **ARCHITECTURE.md**: Comprehensive architectural overview
  - Mermaid diagrams showing system structure
  - Layer architecture documentation
  - Data flow patterns and sequence diagrams
  - Implementation patterns and standards
  - Monitoring and observability patterns
- **CLAUDE.md**: Updated with current project state
  - Package-relative import standards
  - Updated package count (28 packages)
  - Documentation section with AGENTS.md reference
- **README.md**: Updated with import path standardization section

### 🧹 Cleanup

- **Removed Outdated Documents**: Cleaned up temporary build and phase completion documents
  - BUILD_FAILURES_SUMMARY.txt
  - BUILD_TEST_INDEX.md
  - BUILD_TEST_REPORT.md
  - FOLDER_RENAME_COMPLETION.md
  - PHASE_2_SUMMARY.md
  - PHASE_3_COMPLETION.md
  - PHASE_3_VALIDATION_STATUS.md
  - build-test-results.json

### 🐛 Bug Fixes

- **Markdown Linting**: Fixed MD040/fenced-code-language errors
  - Added language identifiers to all fenced code blocks
  - Fixed ASCII art diagrams in README.md and AGENTS.md
  - Updated URL formats to use angle brackets
- **Import Paths**: Resolved @/ import issues in multiple packages
  - effect-regex: 9 @/ imports converted to package-relative
  - effect-yaml: 3 @/ imports converted to package-relative
  - effect-supermemory: 26 @/ imports converted to package-relative

### 📦 Package Updates

All 28 packages updated to version 0.5.2:

#### Layer 2: McLuhan (Agent Infrastructure)

- `effect-supermemory` - Memory & search with package-relative imports
- `effect-ai-sdk` - Multi-provider LLM integration
- `effect-cli-tui` - Terminal UI with package-relative imports
- `effect-actor` - State machine orchestration
- `effect-cockpit` - Agent dashboard

#### Layer 1: Hume (Data Foundation)

- `effect-json` - Type-safe JSON parsing
- `effect-env` - Environment variable validation
- `effect-regex` - Pattern matching with package-relative imports
- `effect-schema-utils` - Schema utilities
- `effect-yaml` - YAML processing with package-relative imports
- `effect-xml` - XML processing
- `effect-csv` - CSV parsing
- `effect-mdx` - MDX processing
- `effect-html` - HTML parsing
- `effect-pdf` - PDF processing
- `effect-liquid` - Template engine
- `effect-toml` - TOML processing
- `effect-xmp` - Metadata extraction
- `effect-image` - Image processing
- `effect-prompt` - Prompt management
- `effect-models` - LLM integration
- `effect-repository` - Git operations
- `effect-artifact` - Artifact management
- `effect-attachment` - File attachments
- `effect-storage` - File system operations
- `effect-telemetry` - Observability

### 🔄 Migration Notes

**For Package Consumers:**

- No breaking changes - all APIs remain the same
- Improved build reliability with consistent import paths
- Better package isolation and dependency management

**For Package Developers:**

- Use package-relative imports: `./service.js`, `../types/index.js`
- Avoid monorepo @/ paths: `@/package-name/service.js`
- All internal imports now use `.js` extension (ESM requirement)

### ✨ Quality Improvements

- **Test Coverage**: Maintained 85%+ coverage across all packages
- **Type Safety**: Strict TypeScript with exactOptionalPropertyTypes
- **Code Quality**: Biome linting with Ultracite preset
- **Documentation**: Comprehensive guides and architectural documentation

---

## [0.5.1] - Previous Release

### 🛠️ Improvements

- Monorepo consistency and quality remediation
- Modernized all Effect.Service patterns to use Effect.fn()
- Standardized API interfaces to use interface keyword
- Fixed TypeScript configuration inheritance
- Updated documentation with accurate package count

---

**Key Principle:** Architectural isolation + functional composition + consistent imports = reliable, composable AI applications.
