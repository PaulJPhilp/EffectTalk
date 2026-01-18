import { mergeConfig } from "vitest/config";
import { sharedVitestConfig } from "../../vitest.config.shared.js";

export default mergeConfig(sharedVitestConfig, {
  test: {
    // Tests are nested in src/ directory
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
