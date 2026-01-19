# Changelog

## 0.6.1

### Patch Changes

- [`6412d74`](https://github.com/PaulJPhilp/EffectTalk/commit/6412d7433d0efb905f75f9e2cc319bf3a2ae4239) Thanks [@PaulJPhilp](https://github.com/PaulJPhilp)! - Monorepo consistency and quality remediation patch release

  - Removed all merge artifacts (15+ files)
  - Modernized all Effect.Service patterns to use Effect.fn()
  - Standardized API interfaces to use interface keyword
  - Fixed TypeScript configuration inheritance
  - Updated documentation with accurate package count
  - Architecture validation: 0 violations

  All packages are compatible and ready for use.

- [`5b1785a`](https://github.com/PaulJPhilp/EffectTalk/commit/5b1785acda26b7e88f45da4859d2c7c0602b11c4) Thanks [@PaulJPhilp](https://github.com/PaulJPhilp)! - Test changeset for EffectTalk monorepo migration validation. This changeset validates that the CI/CD automation and Changesets integration are working correctly after the successful monorepo consolidation of McLuhan (Agent Infrastructure) and Hume (Data Foundation) into a unified EffectTalk workspace.

  This test release will:

  - Verify GitHub Actions CI/CD pipeline triggers on PR
  - Validate Changesets PR creation workflow
  - Confirm npm publishing automation
  - Test workspace dependency resolution in published packages

- Updated dependencies [[`6b108e2`](https://github.com/PaulJPhilp/EffectTalk/commit/6b108e26e2fc49a0bff06dd4d756f2755a92ced9), [`6412d74`](https://github.com/PaulJPhilp/EffectTalk/commit/6412d7433d0efb905f75f9e2cc319bf3a2ae4239), [`5b1785a`](https://github.com/PaulJPhilp/EffectTalk/commit/5b1785acda26b7e88f45da4859d2c7c0602b11c4)]:
  - effect-json@0.6.1
  - effect-schema-utils@0.6.1

## v0.4.1 (2025-11-17)

Maintenance release: Code quality improvements, test documentation, and architectural cleanup.

- **Refactor**: Extract `createEnvInternal()` as single source of truth for validation logic
  - Eliminates ~27 lines of duplicated validation patterns
  - Reduces maintenance burden by ~30%
  - Makes future Phase 2 API unification easier
- **Tests**: Add comprehensive architectural documentation to all test suites
  - Document component purposes and integration points
  - Add 3 new tests for internal implementation verification (77 → 80 tests)
  - Explain deprecation paths for legacy APIs
  - Serve as living architecture reference
- **Docs**: File-level documentation in source files
  - Explain design decisions for future maintainers
  - Document Phase 1 refactoring rationale
  - Mark internal functions clearly
- **Verified**: Zero breaking changes, all APIs work identically
  - All 80 tests passing
  - TypeScript compilation clean
  - Build successful
- **Design Decision**: Evaluated alternative `createT3Env` naming approach
  - Confirmed current `createEnv` + `createSimpleEnv` is optimal
  - Maintains independent brand positioning
  - Clear API hierarchy and user expectations

No public API changes. This is a quality/maintenance release improving code health for long-term sustainability.

## v0.4.0 (2025-11-17)

Major refactor to Schema-only architecture with full t3-env-style features:

- **Breaking**: Complete API redesign - removed Config-based services layer
  - Old API (`fromProcess`, `fromDotenv`, `fromRecord`) marked @deprecated
  - New primary APIs: `createEnv()` for server/client separation, `createSimpleEnv()` for simple use cases
- **Breaking**: Removed `getNumber()`, `getBoolean()`, `getJson()` as deprecated (use Schema transformations instead)
  - `S.NumberFromString`, `S.BooleanFromString`, `S.parseJson()` are the recommended approach
- **Breaking**: Removed `makeEnvSchema()` wrapper - use Schema directly
- **Feature**: New `createEnv()` API with server/client variable separation
  - Type-safe `Env<Server & Client>` with proper generic inference
  - Automatic prefix enforcement (validate client vars use correct prefix)
  - Prevents accidental exposure of server secrets
- **Feature**: New `createSimpleEnv()` API for single-schema use cases
  - Simplified setup for apps without server/client boundary
- **Feature**: Improved error messages in validation
  - Clear error output using `S.formatError()` from Effect Schema
  - Includes contextual information for debugging
- **Fix**: Type erasure eliminated - no more `Env<any>`
  - Full type inference from schema definitions
  - Proper distinction between `Server` and `Client` types
- **Fix**: Cleaned up internal services architecture
  - Removed over-engineered Config-based validation system
  - Refactored `PrefixEnforcementService` for Schema compatibility
  - Simplified codebase (~1500 LOC → ~800 LOC)
- **Tests**: Completely refactored test suite
  - Updated all tests for new API
  - Added 11 comprehensive integration tests for `createEnv()` and `createSimpleEnv()`
  - All 77 tests passing with full coverage of new features
- **Docs**: Complete README overhaul
  - New quickstart examples for both simple and server/client patterns
  - Clear API reference for new functions
  - Added "Features" section highlighting t3-env compatibility
  - Deprecation notices for old APIs
- **Migration**: For upgrading from v0.3.x, see README "Legacy APIs (deprecated)" section

## v0.3.0 (2025-11-13)

- **Feature**: Improve env service tests around optional fields and default
  values (e.g. `LOG_LEVEL` with default `"info"`).
- **Chore**: Add `.gitignore` for Node/TypeScript projects to avoid committing
  `node_modules`, build artifacts, and editor files.
- **Chore**: Bump package version to `0.3.0`.

## v0.2.0 (2025-10-28)

Major improvements to type safety, build system, error reporting, and test coverage:

- **Breaking**: Convert to ESM module system for modern compatibility
- **Breaking**: Move vitest to devDependencies (was incorrectly in dependencies)
- **Breaking**: `get()` and `require()` now have distinct semantics - `require()` fails with `MissingVarError` for undefined/null values, while `get()` returns them as-is
- **Feature**: Improved validation error reporting with detailed missing/invalid field extraction from Effect Schema parse errors
- **Feature**: Comprehensive test coverage for `get()` vs `require()` behavior with optional fields
- **Fix**: Remove all `any` types from service interface for full type safety
- **Fix**: Correct `get()` and `require()` implementations (were previously identical)
- **Fix**: Update dotenv to latest version (^16.4.7)
- **Fix**: Correct repository URL and author metadata in package.json
- **Tests**: Added 26 new tests (48 → 61 total tests, 100% passing)
  - 13 new validation error extraction tests
  - 13 new get/require behavior tests with optional fields
- **Chore**: Remove unrelated archive folder
- **Docs**: Fix all import examples to use correct package name
- **Docs**: Update contributing instructions with correct npm scripts
- **Security**: Update vitest to v4.0.4 to address critical security vulnerabilities

## v0.1.1 (2024-10-20)

- Fix: Clean dist before build to exclude stale files
- Fix: Update package name from scoped to "effect-env"
- Docs: Add badges and update install commands
- Chore: Restrict published files to dist/, README.md, CHANGELOG.md

## v0.1.0 (2024-10-20)

Initial release of effect-env.

- **Schema-driven env management**: Type-safe environment variables with @effect/schema.
- **Multiple layers**: fromProcess, fromDotenv, fromRecord for different sources.
- **Validation**: Startup validation with pretty error reports; fails fast in production.
- **Redaction**: Secure logging helper for env vars, with default and custom secret matchers.
- **Convenience getters**: getNumber, getBoolean, getJson for raw string parsing.
- **Testing support**: withOverride for dev/test key overrides.
- **Effect integration**: Full Effect service pattern with Context/Layer.
