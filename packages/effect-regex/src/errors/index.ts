/**
 * Error Module Exports
 *
 * Centralized export point for all error types.
 */

export type { Dialect, RegexLibraryError } from "./types.js";
export {
  DialectIncompatibilityError,
  EmitError,
  OptimizationError,
  RegexCompilationError,
  TestExecutionError,
  ValidationError,
} from "./types.js";
