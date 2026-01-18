import { Data } from "effect";

/**
 * Represents an error that occurs when parsing XMP data.
 */
export class XmpParseError extends Data.TaggedError("XmpParseError")<{
  readonly message: string;
}> {}
