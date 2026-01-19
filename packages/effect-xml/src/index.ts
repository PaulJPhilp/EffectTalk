/**
 * effect-xml - Type-safe XML parsing and transformation for Effect
 *
 * @packageDocumentation
 */

// Convenience Functions
export { parseString, parseStringDefault } from "./api.js";
// Backends (for advanced usage)
export { XmlBackend } from "./backends/XmlBackend.js";

// Errors
export { XmlParseError } from "./errors.js";
// Types
export type { XmlDocument } from "./types.js";
