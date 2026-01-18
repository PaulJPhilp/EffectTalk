import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { parse, parseDefault } from "../../src/api.js";
import { XmpBackendLayer } from "../../src/backends/xmp-backend.js";

describe("XMP API", () => {
  // TODO: Add a proper test with a real fixture file containing XMP data.
  it("should fail to parse an empty buffer", async () => {
    const program = parse(Buffer.from("")).pipe(
      Effect.provide(XmpBackendLayer)
    );
    const result = await Effect.runPromiseExit(program);
    expect(result._tag).toBe("Failure");
  });
});
