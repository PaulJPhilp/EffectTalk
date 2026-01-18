/**
 * effect-regex - Composable pattern matching and validation for Effect
 *
 * @packageDocumentation
 */

// Core Types & Builders
export * from "./core/ast.js";
export { RegexBuilder } from "./core/builder.js";

// Pattern Emission & Dialects
export { emit as emitPattern } from "./core/emitter.js";
export type { Dialect } from "./core/emitter.js";

// Services (Dependency Injection)
export {
  RegexBuilderService,
  ValidationService,
  type RegexBuilderService as IRegexBuilderService,
  type ValidationService as IValidationService,
} from "./services/index.js";

// Standard Patterns
export * from "./std/index.js";

// Errors
export * from "./errors/index.js";
