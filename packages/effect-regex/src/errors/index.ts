/**
 * Error Module Exports
 *
 * Centralized export point for all error types.
 */

export type { Dialect, RegexLibraryError } from "@/effect-regex/errors/types.js";
export {
  DialectIncompatibilityError,
  EmitError,
  OptimizationError,
  RegexCompilationError,
  TestExecutionError,
  ValidationError,
} from "@/effect-regex/errors/types.js";
