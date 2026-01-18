import { COLOR_ERROR, COLOR_SUCCESS, COLOR_WARNING } from "@core/icons.js";
import type { DisplayType } from "@services/display/types.js";
import { Brand, Match } from "effect";
import {
  BOX_STYLES,
  DEFAULT_DISPLAY_TYPE,
  MAX_TITLE_LENGTH,
  MIN_TITLE_LENGTH,
} from "@/constants.js";
import type { BorderStyle, BoxBorderChars, ChalkColor } from "@/types.js";

// Branded Title type with validation
export type Title = string & Brand.Brand<"Title">;

export const Title = Brand.refined<Title>(
  (title) =>
    title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH,
  (title) => {
    if (title.length < MIN_TITLE_LENGTH) {
      return Brand.error(
        `Title must be at least ${MIN_TITLE_LENGTH} characters, got ${title.length}`
      );
    }
    return Brand.error(
      `Title must be less than ${MAX_TITLE_LENGTH} characters, got ${title.length}`
    );
  }
);
export interface BoxStyle {
  borderStyle?: BorderStyle;
  type?: DisplayType;
  title?: string;
  padding?: number;
  margin?: number;
  dimBorder?: boolean;
}

export interface BoxStyling {
  borderStyle: BorderStyle;
  style: BoxBorderChars;
  type: DisplayType;
  title?: Title;
  padding: number;
  typeColor: ChalkColor;
}

/**
 * Initialize box styling from options
 */
export function initializeBoxStyling(options?: BoxStyle): BoxStyling {
  const borderStyle = options?.borderStyle || "rounded";
  const style = BOX_STYLES[borderStyle];
  const type = options?.type || DEFAULT_DISPLAY_TYPE;
  const title = options?.title ? Title(options.title) : undefined;
  const padding = options?.padding || 0;
  const typeColor = getTypeColor(type) as ChalkColor;

  const result: BoxStyling = {
    borderStyle,
    style,
    type,
    padding,
    typeColor,
  };

  if (title) {
    result.title = title;
  }

  return result;
}

function getTypeColor(type?: "info" | "success" | "error" | "warning"): string {
  return Match.value(type).pipe(
    Match.when("success", () => COLOR_SUCCESS),
    Match.when("error", () => COLOR_ERROR),
    Match.when("warning", () => COLOR_WARNING),
    Match.when("info", () => "cyan"),
    Match.orElse(() => "cyan")
  );
}