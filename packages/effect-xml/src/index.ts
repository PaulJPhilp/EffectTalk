/**
 * effect-xml - Type-safe XML parsing and transformation for Effect
 *
 * @packageDocumentation
 */

// Types
export type { XmlDocument } from "@/effect-xml/types.js";

// Convenience Functions
export { parseString, parseStringDefault } from "@/effect-xml/api.js";

// Errors
export { XmlParseError } from "@/effect-xml/errors.js";

// Backends (for advanced usage)
export { XmlBackend } from "@/effect-xml/backends/XmlBackend.js";
