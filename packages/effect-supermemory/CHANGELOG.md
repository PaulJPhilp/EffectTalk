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
  - effect-env@0.6.1

## 0.2.0

### Minor Changes

- c2ae7b9: Initial release of `effect-supermemory`. This release includes the following features:

  - A client for the Supermemory API, built with `effect-ts`.
  - `MemoryClient`, `HttpClient`, and `SupermemoryClient` services.
  - Batch and streaming operations.
  - Type-safe configuration and error handling.

- Realign with official Supermemory SDK v3.10.0 API

  ### New Services

  - **MemoriesService**: Full memory CRUD operations (add, get, update, delete, list, search)
  - **SearchService**: Document and memory search with `execute` method
  - **ConnectionsService**: OAuth connection management (8 methods)
  - **SettingsService**: Organization settings management (get, update)

  ### Breaking Changes

  - Removed deprecated services: `InMemoryClient`, `SupermemoryClient`, `MemoryStreamClient`, `SearchClient`
  - API endpoints updated to `/v1` prefix
  - `IngestService` now uses `/v1/memories` endpoint (deprecated in favor of MemoriesService)

  ### Improvements

  - Strict Effect.Service naming conventions enforced
  - All services use `ServiceName.Default` layer pattern
  - Comprehensive unit tests (366 passing)
  - Integration test infrastructure with environment-based configuration
  - Updated CLAUDE.md with Effect.Service pattern documentation

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-02

### Added

- **MemoryClient Service**: Core in-memory memory operations with Effect-native API

  - `put(key, value)`: Store memory values
  - `get(key)`: Retrieve memory values (returns `undefined` for non-existent keys)
  - `delete(key)`: Delete memory values (idempotent, returns `true`)
  - `exists(key)`: Check if a key exists
  - `clear()`: Clear all values in namespace

- **HttpClient Service**: Effect-native HTTP client for external API requests

  - Configurable base URL and default headers
  - Request/response handling with proper error translation
  - Support for streaming responses via `requestStream()`
  - NDJSON content type handling for streaming endpoints

- **SupermemoryClient Service**: HTTP-backed implementation of MemoryClient interface

  - Integration with Supermemory API
  - Base64 encoding/decoding of values
  - Configurable retry policy for transient errors
  - Semantic error handling (404 → `undefined`/`true`/`false`, 401/403 → `MemoryValidationError`)
  - Batch operations: `putMany()`, `getMany()`, `deleteMany()` with partial failure handling

- **MemoryStreamClient Service**: Streaming operations for large datasets

  - `listAllKeys()`: Stream all keys in namespace
  - `streamSearch()`: Stream search results
  - Proper cancellation and error handling

- **SearchClient Service**: Search and reranking operations

  - Semantic search with query parameters
  - Filter support via fluent FilterBuilder API
  - Max age filtering (`maxAgeHours`)
  - Relevance score-based results

- **Error Handling**: Comprehensive discriminated error types

  - `MemoryNotFoundError`: Key not found (semantic, not always an error)
  - `MemoryValidationError`: Validation/authorization failures
  - `MemoryBatchPartialFailure`: Partial failures in batch operations
  - `SearchQueryError`: Search query validation errors
  - `StreamReadError`: Streaming operation errors

- **Type Generation**: Automated TypeScript type generation from OpenAPI specifications

  - Support for Supermemory API v4
  - Codegen script for maintaining type sync

- **Compatibility Testing**: Automated compatibility checking with official Supermemory SDK
  - API surface comparison
  - Schema validation
  - Operation equivalence testing

### Architecture

- Effect.Service pattern with `Effect.fn()` parameterization for namespace isolation
- Layer-based dependency injection
- Strict TypeScript configuration with `exactOptionalPropertyTypes`
- ESM-first module system with `.js` extensions in imports

### Documentation

- Comprehensive README with usage examples
- Architecture Decision Records (ADR-001: Error Taxonomy & Layer Design)
- API documentation and examples
- Compatibility testing documentation

### Testing

- Unit tests for all services
- Integration tests with mock server
- Compatibility tests against official SDK
- Vitest test runner with Effect integration

[0.1.0]: https://github.com/your-org/effect-supermemory/releases/tag/v0.1.0
