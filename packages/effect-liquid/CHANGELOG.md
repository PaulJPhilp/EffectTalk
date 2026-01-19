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

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to
Semantic Versioning.

## [0.6.1] - 2025-12-17

### Added

- **Initial Release**: Full Shopify Liquid templating implementation
  - Complete parser with lexer for Liquid syntax
  - AST representation for all Liquid constructs
  - Template renderer with context management
  - Built-in filters: string, array, math, date, and default filters
  - Built-in tags: if/else/elsif, for, assign, capture, comment, unless
  - Service layer following Effect.Service pattern
  - Type-safe API with Effect error handling
  - Support for custom filters and tags
  - Comprehensive test suite

### Features

- **Parser**: Handles variables, filters, tags, whitespace control, numeric literals
- **Renderer**: Recursive AST traversal with context resolution
- **Filters**: 30+ built-in filters covering string, array, math, and date operations
- **Tags**: Core control flow and variable manipulation tags
- **Context Management**: Dot notation access, array indexing, type coercion
- **Error Handling**: Tagged errors with position information and error chaining
