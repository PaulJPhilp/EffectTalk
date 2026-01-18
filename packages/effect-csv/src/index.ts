/**
 * effect-csv - Type-safe CSV parsing and serialization for Effect
 *
 * @packageDocumentation
 */

// Convenience Functions
export { parse, stringify, parseTsv, stringifyTsv } from "./api.js";

// Errors
export {
  ParseError,
  ValidationError,
  StringifyError,
  CsvStructureError,
  DelimiterError,
} from "./errors.js";

// Schema Utilities (for advanced usage)
export { validateAgainstSchema, validateForStringify } from "./schema.js";

// Backends (for advanced usage)
export type {
  CsvBackend,
  ParseOptions,
  StringifyOptions,
} from "./backends/types.js";
export { papaParse } from "./backends/papaparse.js";
