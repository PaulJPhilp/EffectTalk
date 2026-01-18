import { Data } from "effect";

/**
 * Represents an error that occurs when parsing a Liquid template.
 */
export class LiquidParseError extends Data.TaggedError("LiquidParseError")<{
  readonly message: string;
  readonly position?: number;
  readonly line?: number;
  readonly column?: number;
  readonly cause?: unknown;
}> {}

/**
 * Represents an error that occurs when rendering a Liquid template.
 */
export class LiquidRenderError extends Data.TaggedError("LiquidRenderError")<{
  readonly message: string;
  readonly position?: number;
  readonly cause?: unknown;
}> {}

/**
 * Represents an error that occurs when executing a Liquid filter.
 */
export class LiquidFilterError extends Data.TaggedError("LiquidFilterError")<{
  readonly message: string;
  readonly filterName: string;
  readonly cause?: unknown;
}> {}

/**
 * Represents an error that occurs when executing a Liquid tag.
 */
export class LiquidTagError extends Data.TaggedError("LiquidTagError")<{
  readonly message: string;
  readonly tagName: string;
  readonly cause?: unknown;
}> {}

/**
 * Represents an error that occurs when accessing template context.
 */
export class LiquidContextError extends Data.TaggedError("LiquidContextError")<{
  readonly message: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}
