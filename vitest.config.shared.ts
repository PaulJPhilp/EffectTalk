import { defineConfig } from "vitest/config"

/**
 * Shared Vitest configuration for EffectTalk packages
 *
 * Enforces consistent test setup and 85% coverage thresholds across all packages.
 * Individual packages extend this config to ensure uniform quality standards.
 *
 * Usage in package vitest.config.ts:
 * ```
 * import { mergeConfig } from "vitest/config"
 * import { sharedVitestConfig } from "../../vitest.config.shared.js"
 *
 * export default mergeConfig(sharedVitestConfig, {
 *   // Package-specific overrides if needed
 * })
 * ```
 *
 * Coverage Thresholds:
 * - Lines: 85%
 * - Functions: 85%
 * - Branches: 85%
 * - Statements: 85%
 *
 * Excluded from coverage:
 * - TypeScript declaration files (*.d.ts)
 * - Re-export only files (src/index.ts)
 * - Test files and fixtures
 * - Build outputs (dist/)
 */
export const sharedVitestConfig = defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts", "test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      all: true,
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/index.ts", // Re-exports only
        "**/__tests__/**",
        "**/dist/**",
        "**/node_modules/**",
      ],
      lines: 85,
      functions: 85,
      branches: 85,
      statements: 85,
    },
  },
})
