import { Effect } from "effect";
import { XmpBackend, XmpBackendLayer } from "./backends/xmp-backend.js";
import type { XmpParseError } from "./errors.js";

/**
 * Parses XMP data from a file buffer.
 *
 * @param buffer The file buffer to parse.
 * @returns An `Effect` that resolves to the parsed XMP data or fails with an `XmpParseError`.
 */
export const parse = (
  buffer: Buffer
): Effect.Effect<unknown, XmpParseError, XmpBackend> =>
  XmpBackend.pipe(Effect.flatMap((backend) => backend.parse(buffer)));

export const parseDefault = (
  buffer: Buffer
): Effect.Effect<unknown, XmpParseError> =>
  parse(buffer).pipe(Effect.provide(XmpBackendLayer));
