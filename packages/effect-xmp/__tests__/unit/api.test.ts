import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import * as xmp from "../../src/api";
import { XmpBackendLayer } from "../../src/backends/XmpBackend";

describe("XMP API", () => {
  // TODO: Add a proper test with a real fixture file containing XMP data.
  it("should fail to parse an empty buffer", async () => {
    const program = xmp
      .parse(Buffer.from(""))
      .pipe(Effect.provide(XmpBackendLayer));
    const result = await Effect.runPromiseExit(program);
    expect(result._tag).toBe("Failure");
  });
});
