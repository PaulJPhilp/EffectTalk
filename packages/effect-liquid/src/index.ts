/**
 * effect-liquid - Type-safe Liquid template engine for Effect
 *
 * @packageDocumentation
 */

import { Effect } from "effect";
import type { LiquidContext } from "./types.js";
import { LiquidParseError, LiquidRenderError } from "./errors.js";
import { LiquidService, LiquidServiceLayer } from "./service.js";

// Services (Dependency Injection)
export * from "./service.js";

// Types and Schemas
export * from "./types.js";
export * from "./ast.js";

// Errors
export * from "./errors.js";

// Convenience Functions
/**
 * Parses a Liquid template string into an AST.
 *
 * @param template The Liquid template string to parse
 * @returns An Effect that resolves to the parsed AST or fails with a LiquidParseError
 */
export const parse = (template: string) =>
  Effect.provide(
    Effect.gen(function* () {
      const service = yield* LiquidService;
      return yield* service.parse(template);
    }),
    LiquidServiceLayer
  );

/**
 * Renders a Liquid template with the given context.
 *
 * @param template The Liquid template string to render
 * @param context The variable context for rendering
 * @returns An Effect that resolves to the rendered string or fails with a LiquidParseError or LiquidRenderError
 */
export const render = (template: string, context: LiquidContext) =>
  Effect.provide(
    Effect.gen(function* () {
      const service = yield* LiquidService;
      return yield* service.render(template, context);
    }),
    LiquidServiceLayer
  );

/**
 * Compiles a Liquid template for reuse.
 *
 * @param template The Liquid template string to compile
 * @returns An Effect that resolves to a compiled template or fails with a LiquidParseError
 */
export const compile = (template: string) =>
  Effect.provide(
    Effect.gen(function* () {
      const service = yield* LiquidService;
      return yield* service.compile(template);
    }),
    LiquidServiceLayer
  );

/**
 * Renders a compiled Liquid template with the given context.
 *
 * @param compiled The compiled template
 * @param context The variable context for rendering
 * @returns An Effect that resolves to the rendered string or fails with a LiquidRenderError
 */
export const renderCompiled = (
  compiled: import("./types.js").LiquidTemplate,
  context: LiquidContext
) =>
  Effect.provide(
    Effect.gen(function* () {
      const service = yield* LiquidService;
      return yield* service.renderCompiled(compiled, context);
    }),
    LiquidServiceLayer
  );
