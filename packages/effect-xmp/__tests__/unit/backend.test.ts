import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { XmpBackend, XmpBackendLayer } from "../../src/backends/XmpBackend.js";
import { XmpParseError } from "../../src/errors.js";

describe("XmpBackend", () => {
  describe("parse", () => {
    it("should fail to parse empty buffer", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* XmpBackend;
        return yield* backend.parse(Buffer.from(""));
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromiseExit(program);
      expect(result._tag).toBe("Failure");
    });

    it("should fail to parse invalid binary data", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* XmpBackend;
        return yield* backend.parse(Buffer.from("not valid image data"));
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromiseExit(program);
      expect(result._tag).toBe("Failure");
    });

    it("should fail to parse buffer with only random bytes", async () => {
      // Create a buffer with random bytes that don't represent valid image data
      const randomBuffer = Buffer.from([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
        0x0d, 0x0e, 0x0f, 0x10,
      ]);
      const program = Effect.gen(function* () {
        const backend = yield* XmpBackend;
        return yield* backend.parse(randomBuffer);
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromiseExit(program);
      expect(result._tag).toBe("Failure");
    });

    it("should handle null buffer gracefully", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* XmpBackend;
        // biome-ignore lint/suspicious/noExplicitAny: Testing error handling
        return yield* backend.parse(null as any);
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromiseExit(program);
      expect(result._tag).toBe("Failure");
    });

    it("should reject very large buffer", async () => {
      // Create a 100MB buffer (may be rejected by parser)
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024);
      const program = Effect.gen(function* () {
        const backend = yield* XmpBackend;
        return yield* backend.parse(largeBuffer);
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromiseExit(program);
      expect(result._tag).toBe("Failure");
    });
  });

  describe("error handling", () => {
    it("should return XmpParseError on failure", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* XmpBackend;
        return yield* Effect.either(backend.parse(Buffer.from("")));
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(XmpParseError);
        expect(result.left.message).toBeDefined();
      }
    });

    it("should include error message in XmpParseError", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* XmpBackend;
        return yield* Effect.either(backend.parse(Buffer.from("invalid")));
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        const error = result.left as XmpParseError;
        expect(error.message).toBeTruthy();
        expect(typeof error.message).toBe("string");
      }
    });
  });
});
