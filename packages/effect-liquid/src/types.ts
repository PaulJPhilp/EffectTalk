import type { Effect } from "effect";
import type { AstNode } from "./ast.js";
import type {
  LiquidContextError,
  LiquidFilterError,
  LiquidParseError,
  LiquidRenderError,
  LiquidTagError,
} from "./errors.js";

/**
 * Variable context for template rendering.
 * Maps variable names to their values.
 */
export type LiquidContext = Record<string, unknown>;

/**
 * Configuration options for Liquid template processing.
 */
export interface LiquidOptions {
  readonly strict?: boolean;
  readonly customFilters?: Record<string, FilterFunction>;
  readonly customTags?: Record<string, TagFunction>;
}

/**
 * Compiled template representation.
 * Contains the parsed AST and metadata.
 */
export interface LiquidTemplate {
  readonly ast: readonly import("./ast.js").AstNode[];
  readonly source: string;
}

/**
 * Function type for custom filters.
 * Filters transform input values and return new values.
 */
export type FilterFunction = (
  input: unknown,
  ...args: readonly unknown[]
) => Effect.Effect<unknown, LiquidFilterError>;

/**
 * Function type for custom tags.
 * Tags generate output strings based on their arguments and body.
 */
export type TagFunction = (
  args: readonly unknown[],
  body: readonly import("./ast.js").AstNode[],
  context: LiquidContext,
  render: (
    nodes: readonly import("./ast.js").AstNode[],
    ctx: LiquidContext
  ) => Effect.Effect<string, LiquidRenderError>
) => Effect.Effect<string, LiquidTagError>;
