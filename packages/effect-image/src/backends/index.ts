/**
 * Image Processing Backends
 *
 * Exports available backend implementations for image processing.
 *
 * @module backends
 */

export type { ImageBackend } from "./types.js";
export {
  SharpBackend,
  SharpBackendLayer,
} from "./sharp.js";
