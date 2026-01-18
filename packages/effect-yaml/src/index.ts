/**
 * effect-yaml - Type-safe YAML parsing and serialization for Effect
 *
 * @packageDocumentation
 */

// Convenience Functions
export { parse, parseDefault, stringify, stringifyDefault } from "./api.js";

// Errors
export { YamlParseError, YamlStringifyError } from "./errors.js";

// Backends (for advanced usage)
export { YamlBackend } from "./backends/YamlBackend.js";
