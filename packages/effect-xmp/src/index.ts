/**
 * effect-xmp - Type-safe XMP metadata parsing for Effect
 *
 * @packageDocumentation
 */

// Convenience Functions
export { parse, parseDefault } from "./api.js";

// Errors
export { XmpParseError } from "./errors.js";

// Backends (for advanced usage)
export { XmpBackend } from "./backends/XmpBackend.js";
