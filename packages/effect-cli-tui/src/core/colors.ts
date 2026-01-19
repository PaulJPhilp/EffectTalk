import { ThemeService } from "@services/theme/service.js";
import chalk from "chalk";
import { Effect } from "effect";
import { DEFAULT_DISPLAY_TYPE } from "@/constants.js";
import type { ChalkBgColor, ChalkColor } from "@/types.js";
import { getDisplayColor } from "./icons.js";

// Chalk 5.x is ESM-only and exports directly as default
// No need for CJS interop - chalk works correctly in both Node and test environments
const safeChalk = chalk;

import { display } from "./display.js";
import {
  COLOR_HIGHLIGHT,
  getDisplayColor,
  getDisplayIcon,
  SYMBOL_BULLET,
} from "./icons.js";

/**
 * Apply chalk styling based on color options
 *
 * Validates color names against supported chalk colors before applying them.
 * Valid colors: "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white", "gray"
 * Valid background colors: "bgBlack", "bgRed", "bgGreen", "bgYellow", "bgBlue", "bgMagenta", "bgCyan", "bgWhite"
 */
export function applyChalkStyle(
  text: string,
  options?: {
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
    inverse?: boolean;
    strikethrough?: boolean;
    color?: ChalkColor;
    bgColor?: ChalkBgColor;
  }
): string {
  if (!options) {
    return text;
  }

  let styled = text;

  // Apply color with validation
  if (options.color) {
    if (typeof safeChalk[options.color] === "function") {
      styled = safeChalk[options.color](styled);
    } else {
      console.warn(
        `[applyChalkStyle] Invalid color: ${options.color}. Supported colors: black, red, green, yellow, blue, magenta, cyan, white, gray`
      );
    }
  }

  // Apply background color with validation
  if (options.bgColor) {
    if (typeof safeChalk[options.bgColor] === "function") {
      styled = safeChalk[options.bgColor](styled);
    } else {
      console.warn(
        `[applyChalkStyle] Invalid background color: ${options.bgColor}. Supported colors: bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite`
      );
    }
  }

  // Apply text styles
  if (options.bold) {
    styled = safeChalk.bold(styled);
  }
  if (options.dim) {
    styled = safeChalk.dim(styled);
  }
  if (options.italic) {
    styled = safeChalk.italic(styled);
  }
  if (options.underline) {
    styled = safeChalk.underline(styled);
  }
  if (options.inverse) {
    styled = safeChalk.inverse(styled);
  }
  if (options.strikethrough) {
    styled = safeChalk.strikethrough(styled);
  }

  return styled;
}

/**
 * Display a highlighted message (cyan bold)
 *
 * Uses theme highlight color if available.
 */
export function displayHighlight(message: string): Effect.Effect<void> {
  const styledMessage = applyChalkStyle(message, {
    bold: true,
    color: COLOR_HIGHLIGHT,
  });
  return display(`\nℹ ${styledMessage}`, { type: DEFAULT_DISPLAY_TYPE });
}

/**
 * Display a muted message (dim gray)
 */
export function displayMuted(message: string): Effect.Effect<void> {
  const styledMessage = applyChalkStyle(message, { dim: true });
  return display(styledMessage, { type: DEFAULT_DISPLAY_TYPE });
}

/**
 * Display a warning message (yellow bold with ⚠ prefix)
 *
 * Uses theme warning color and icon if available.
 */
export function displayWarning(message: string): Effect.Effect<void> {
  const warningColor = getDisplayColor("warning");
  const styledMessage = applyChalkStyle(message, {
    color: warningColor as ChalkColor,
    bold: true,
  });
  return display(styledMessage, { prefix: getDisplayIcon("warning") });
}

/**
 * Display an info message (blue)
 *
 * Uses theme info color if available.
 */
export function displayInfo(message: string): Effect.Effect<void> {
  const infoColor = getDisplayColor("info");
  const styledMessage = applyChalkStyle(message, {
    color: infoColor as ChalkColor,
  });
  return display(styledMessage, { type: DEFAULT_DISPLAY_TYPE });
}

/**
 * Display a bullet list item
 *
 * Uses theme highlight color if available and no custom color provided.
 */
export function displayListItem(
  item: string,
  bullet?: string,
  options?: {
    color?: ChalkColor;
  }
): Effect.Effect<void, never, ThemeService> {
  return Effect.gen(function* () {
    const bulletChar = bullet || SYMBOL_BULLET;

    // Use custom color if provided, otherwise try theme highlight color
    let bulletColor: ChalkColor = options?.color || COLOR_HIGHLIGHT;
    if (!options?.color) {
      const themeOption = yield* Effect.serviceOption(ThemeService);
      if (themeOption._tag === "Some") {
        const theme = themeOption.value.getTheme();
        if (theme?.colors?.highlight) {
          bulletColor = theme.colors.highlight as ChalkColor;
        }
      }
    }

    const styledBullet = applyChalkStyle(bulletChar, {
      color: bulletColor,
    });
    yield* display(`\n${styledBullet} ${item}`, { type: DEFAULT_DISPLAY_TYPE });
  });
}

// applyChalkStyle is already exported above