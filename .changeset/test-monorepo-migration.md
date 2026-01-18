---
"effect-json": patch
"effect-env": patch
"effect-supermemory": patch
"effect-cli-tui": patch
---

Test changeset for EffectTalk monorepo migration validation. This changeset validates that the CI/CD automation and Changesets integration are working correctly after the successful monorepo consolidation of McLuhan (Agent Infrastructure) and Hume (Data Foundation) into a unified EffectTalk workspace.

This test release will:
- Verify GitHub Actions CI/CD pipeline triggers on PR
- Validate Changesets PR creation workflow
- Confirm npm publishing automation
- Test workspace dependency resolution in published packages
