/**
 * effect-yaml - Type-safe YAML parsing and serialization for Effect
 *
 * @packageDocumentation
 */

// Convenience Functions
export { parse, parseDefault, stringify, stringifyDefault } from "@/effect-yaml/api.js";

// Errors
export { YamlParseError, YamlStringifyError } from "@/effect-yaml/errors.js";

// Backends (for advanced usage)
export { YamlBackend } from "@/effect-yaml/backends/YamlBackend.js";
