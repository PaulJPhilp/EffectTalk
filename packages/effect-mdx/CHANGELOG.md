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

- Updated dependencies [[`6b108e2`](https://github.com/PaulJPhilp/EffectTalk/commit/6b108e26e2fc49a0bff06dd4d756f2755a92ced9), [`6412d74`](https://github.com/PaulJPhilp/EffectTalk/commit/6412d7433d0efb905f75f9e2cc319bf3a2ae4239), [`5b1785a`](https://github.com/PaulJPhilp/EffectTalk/commit/5b1785acda26b7e88f45da4859d2c7c0602b11c4)]:
  - effect-json@0.6.1
  - effect-yaml@0.6.1

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to
Semantic Versioning.

## [Unreleased]

### Added

- **Gray-matter Compatibility**: Complete API compatibility with gray-matter library
  - Added `empty`, `isEmpty`, and `stringify` properties to parsed results
  - Implemented top-level `stringify()` method for converting data back to frontmatter
  - Added `excerptSeparator` option support for custom excerpt delimiters
  - Added `engines` option support for custom parsing/stringifying engines
- **Enhanced Frontmatter Support**:
  - Full support for YAML, JSON, and custom frontmatter formats
  - Custom excerpt separators (e.g., `<!-- more -->`)
  - Extensible engine system for additional formats (TOML, CoffeeScript, etc.)
- **Improved Type Safety**:
  - Extended `ParsedMdxAttributes` with all gray-matter compatible properties
  - Better type definitions for frontmatter options
- **Round-trip Operations**:
  - Parse-modify-stringify workflows now fully supported
  - Instance-level `stringify()` methods on parsed results

### Changed

- **API Extensions**: Enhanced service interfaces to support gray-matter compatibility
- **Option Mapping**: Improved option handling for camelCase/snake_case compatibility

## [0.2.2] - 2025-10-XX

- Bug fixes and minor improvements
- Internal refactoring for better maintainability

## [0.1.0] - 2025-08-08

- Initial public release
- Strict typing and Effect combinators
- Frontend and backend usage documented in README
- Exports map, ESM entry, and types prepared for npm
