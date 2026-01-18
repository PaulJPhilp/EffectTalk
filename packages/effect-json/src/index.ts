/**
 * effect-json - Type-safe, schema-driven JSON serialization for Effect
 *
 * @packageDocumentation
 */

// Services (Dependency Injection) and Convenience Functions
export {
  JsonService,
  parseJson as parse,
  parseJsonc,
  parseSuperjson,
  stringifyJson as stringify,
  stringifyJsonc,
  stringifySuperjson,
  type JsonFormat,
  type JsonServiceInterface,
} from "./services/json/index.js";

export {
  JsonLinesService,
  type JsonLinesServiceInterface,
} from "./services/jsonlines/index.js";

// JSON Lines API (convenience functions)
export {
  parseBatch as parseJsonLines,
  parseStream as streamParseJsonLines,
  stringifyStream as streamStringifyJsonLines,
  stringifyBatch as stringifyJsonLines,
  type JsonLinesStringifyOptions,
} from "./services/jsonlines/index.js";

// Errors
export {
  JsonLinesParseError,
  ParseError,
  StringifyError,
  ValidationError,
} from "./errors.js";

// Schema utilities
export { validateAgainstSchema, validateForStringify } from "./schema.js";
export {
  formatParseError,
  extractFieldPath,
  extractExpected,
  extractActual,
  getErrorMessage,
  extractErrorDetails,
  type ParseErrorDetails,
} from "./schema-utils.js";

// Testing utilities
export { mockBackend as testMockBackend } from "./testing.js";

// Backends (for advanced usage)
export {
  jsonBackend,
  jsoncBackend,
  superjsonBackend,
  toonBackend,
  type Backend,
} from "./services/json/implementations/index.js";
