import { Effect } from "effect";
import ExifReader from "exifreader";
import { XmpParseError } from "../errors.js";

export interface XmpBackendSchema {
  readonly parse: (buffer: Buffer) => Effect.Effect<unknown, XmpParseError>;
}

export class XmpBackend extends Effect.Service<XmpBackend>()("XmpBackend", {
  succeed: {
    parse: (buffer: Buffer) =>
      Effect.try({
        try: () =>
          ExifReader.load(
            buffer as unknown as any,
            { xmp: true, expanded: true } as any
          ),
        catch: (error) =>
          new XmpParseError({
            message: error instanceof Error ? error.message : "Unknown error",
          }),
      }),
  },
}) {}

export const XmpBackendLayer = XmpBackend.Default;
