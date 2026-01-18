/**
 * effect-regex - Composable pattern matching and validation for Effect
 *
 * @packageDocumentation
 */

// Core Types & Builders
export * from "@/effect-regex/core/ast.js";
export { RegexBuilder } from "@/effect-regex/core/builder.js";

// Pattern Emission & Dialects
export { emit as emitPattern } from "@/effect-regex/core/emitter.js";
export type { Dialect } from "@/effect-regex/core/emitter.js";

// Services (Dependency Injection)
export {
  RegexBuilderService,
  ValidationService,
  type RegexBuilderService as IRegexBuilderService,
  type ValidationService as IValidationService,
} from "@/effect-regex/services/index.js";

// Standard Patterns
export * from "@/effect-regex/std/index.js";

// Errors
export * from "@/effect-regex/errors/index.js";
