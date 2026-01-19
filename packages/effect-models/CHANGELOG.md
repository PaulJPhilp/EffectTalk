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

- Updated dependencies [[`6412d74`](https://github.com/PaulJPhilp/EffectTalk/commit/6412d7433d0efb905f75f9e2cc319bf3a2ae4239)]:
  - effect-telemetry@0.6.1

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to
Semantic Versioning.

## [0.6.1] - 2024-12-17

### Added

- **Initial Release**: Migrated effect-models to Hume monorepo
- **Service Implementations**:
  - `ModelService` - Unified service for interacting with LLM models
  - `OpenRouterService` - Service for OpenRouter API
  - `HuggingFaceService` - Service for HuggingFace Inference API
  - `ArtificialAnalysisService` - Service for Artificial Analysis API
- **Error Handling**:
  - `InvalidModelConfigError` - Invalid model configuration
  - `ApiRequestError` - API request failures
  - `RateLimitError` - Rate limit exceeded
  - `AuthenticationError` - Authentication failures
  - `ModelNotFoundError` - Model not found
  - `InvalidResponseError` - Invalid response format
- **Type Definitions**:
  - `ModelProvider` - Supported model providers
  - `ModelConfig` - Base model configuration
  - `Model` - Model metadata
  - `ChatMessage` - Chat message structure
  - `ChatCompletionRequest` - Chat completion request
  - `ChatCompletionResponse` - Chat completion response
- **Directory Structure**:
  - `src/services/` - Model service implementations
  - `src/transformers/` - Model transformers (placeholder)
  - `src/utils.ts` - Utility functions (placeholder)
  - `src/config/` - Configuration utilities (placeholder)
- **Testing**: Unit test structure with placeholder test

### Technical Details

- All services use `Effect.Service` pattern with `accessors: true`
- All errors use `Data.TaggedError` pattern with readonly fields
- All types use `type` aliases (following Hume conventions)
- All files follow kebab-case naming convention
- Full TypeScript support with strict type checking
- Effect-native error handling with cause chaining

[0.6.1]: https://github.com/PaulJPhilp/hume/releases/tag/effect-models-v0.6.1
