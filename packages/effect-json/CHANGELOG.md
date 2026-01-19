# effect-json

## 0.6.1

### Patch Changes

- [`6b108e2`](https://github.com/PaulJPhilp/EffectTalk/commit/6b108e26e2fc49a0bff06dd4d756f2755a92ced9) Thanks [@PaulJPhilp](https://github.com/PaulJPhilp)! - Example changeset: This is a template for how changesets should be formatted.

  Remove this file after your first real changeset is created via `bun run changeset:add`.

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

- Updated dependencies [[`6412d74`](https://github.com/PaulJPhilp/EffectTalk/commit/6412d7433d0efb905f75f9e2cc319bf3a2ae4239)]:
  - effect-schema-utils@0.6.1
