import { Effect } from "effect";
import type { JsonServiceInterface } from "./api.js";
import { getBackend } from "./helpers.js";
import type { StringifyOptions } from "./implementations/index.js";
import type { JsonFormat } from "./types.js";

export class JsonService extends Effect.Service<JsonService>()("JsonService", {
  accessors: true,
  dependencies: [],
  effect: Effect.gen(function* () {
    return {
      parse: (format: JsonFormat, input: string | Buffer) =>
        getBackend(format).parse(input),
      stringify: (
        format: JsonFormat,
        value: unknown,
        options?: StringifyOptions
      ) => getBackend(format).stringify(value, options),
    } satisfies JsonServiceInterface;
  }),
}) {}
