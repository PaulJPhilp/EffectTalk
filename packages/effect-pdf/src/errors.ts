import { Data } from "effect";

export class PdfError extends Data.TaggedError("PdfError")<{
  readonly reason: string;
  readonly cause?: unknown;
}> {}
