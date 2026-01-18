import { mergeConfig } from "vitest/config"
import { sharedVitestConfig } from "../../vitest.config.shared.js"

export default mergeConfig(sharedVitestConfig, {
  test: {
    globals: true,
    environment: "node",
  },
})
