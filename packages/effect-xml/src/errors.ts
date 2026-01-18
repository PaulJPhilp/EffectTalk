import { Data } from "effect";

export class XmlParseError extends Data.TaggedError("XmlParseError")<{
  readonly message: string;
}> {}
