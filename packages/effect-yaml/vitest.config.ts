import { mergeConfig } from "vitest/config";
import { sharedVitestConfig } from "../../vitest.config.shared.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default mergeConfig(sharedVitestConfig, {
  resolve: {
    alias: {
      "@/effect-yaml": join(__dirname, "./src"),
    },
  },
});
