import { mergeConfig } from "vitest/config";
import { sharedVitestConfig } from "../../vitest.config.shared.js";

export default mergeConfig(sharedVitestConfig, {
  test: {
    // Tests in __tests__ directories
    include: ["__tests__/**/*.test.ts"],
  },
});
