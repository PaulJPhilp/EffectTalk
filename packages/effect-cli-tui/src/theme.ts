// This file is the entry point for the theme system.
/** biome-ignore-all assist/source/organizeImports: <> */
export { createTheme, mergeTheme } from "./services/theme/helpers.js";
export {
  darkTheme,
  defaultTheme,
  emojiTheme,
  minimalTheme,
  themes,
} from "./services/theme/presets.js";
export {
  ThemeService,
  getCurrentTheme,
  setTheme,
  withTheme,
} from "./services/theme/service.js";
export type { PartialTheme, Theme } from "./services/theme/types.js";
