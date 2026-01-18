/**
 * effect-xml - Type-safe XML parsing and transformation for Effect
 *
 * @packageDocumentation
 */

// Types
export type { XmlDocument } from "./types.js";

// Convenience Functions
export { parseString, parseStringDefault } from "./api.js";

// Errors
export { XmlParseError } from "./errors.js";

// Backends (for advanced usage)
export { XmlBackend } from "./backends/XmlBackend.js";
