import { Data } from "effect";

export class HtmlError extends Data.TaggedError("HtmlError")<{
  readonly reason: string;
  readonly cause?: unknown;
}> {}
