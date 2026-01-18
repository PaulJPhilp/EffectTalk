import { Effect, Stream } from "effect";
import type { JsonLinesServiceInterface } from "./api.js";
import {
  parseBatch,
  parseStream,
  stringifyBatch,
  stringifyStream,
} from "./implementations/index.js";
import type { JsonLinesStringifyOptions } from "./types.js";

export class JsonLinesService extends Effect.Service<JsonLinesService>()(
  "JsonLinesService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        parseBatch: (input: string | Buffer) => parseBatch(input),
        stringifyBatch: (
          values: unknown[],
          options?: JsonLinesStringifyOptions
        ) => stringifyBatch(values, options),
        parseStream: (input: Stream.Stream<string>) => parseStream(input),
        stringifyStream: (
          input: Stream.Stream<unknown>,
          options?: JsonLinesStringifyOptions
        ) => stringifyStream(input, options),
      } satisfies JsonLinesServiceInterface;
    }),
  }
) {}
