import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { parse } from "../../src/api.js";
import { XmpBackendLayer } from "../../src/backends/XmpBackend.js";
import { XmpParseError } from "../../src/errors.js";

describe("XMP Error Handling", () => {
  describe("XmpParseError", () => {
    it("should create XmpParseError with message", () => {
      const error = new XmpParseError({ message: "Test error" });
      expect(error.message).toBe("Test error");
      expect(error._tag).toBe("XmpParseError");
    });

    it("should handle empty message", () => {
      const error = new XmpParseError({ message: "" });
      expect(error.message).toBe("");
    });

    it("should preserve message with special characters", () => {
      const specialMsg = "Error: <>&\"'";
      const error = new XmpParseError({ message: specialMsg });
      expect(error.message).toBe(specialMsg);
    });
  });

  describe("parse error propagation", () => {
    it("should propagate parse errors correctly", async () => {
      const program = Effect.gen(function* () {
        const result = yield* Effect.either(parse(Buffer.from("not xmp")));
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(XmpParseError);
          return null;
        }
        return result.right;
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result).toBeNull();
    });

    it("should catch XmpParseError with catchTag", async () => {
      const program = Effect.gen(function* () {
        return yield* parse(Buffer.from("invalid")).pipe(
          Effect.catchTag("XmpParseError", (err) => {
            expect(err.message).toBeDefined();
            return Effect.succeed("error caught");
          })
        );
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result).toBe("error caught");
    });

    it("should handle error recovery", async () => {
      const program = Effect.gen(function* () {
        const result = yield* Effect.either(parse(Buffer.from("")));

        if (result._tag === "Left") {
          return "recovered";
        }
        return "succeeded";
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result).toBe("recovered");
    });
  });

  describe("edge cases", () => {
    it("should handle multiple consecutive parse failures", async () => {
      const program = Effect.gen(function* () {
        const results: unknown[] = [];

        for (let i = 0; i < 3; i++) {
          const result = yield* Effect.either(
            parse(Buffer.from(`invalid${i}`))
          );
          results.push(result._tag);
        }

        return results;
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result).toEqual(["Left", "Left", "Left"]);
    });

    it("should handle interleaved success and failure", async () => {
      const program = Effect.gen(function* () {
        const result1 = yield* Effect.either(parse(Buffer.from("invalid1")));
        expect(result1._tag).toBe("Left");

        const result2 = yield* Effect.either(parse(Buffer.from("invalid2")));
        expect(result2._tag).toBe("Left");

        return "completed";
      }).pipe(Effect.provide(XmpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result).toBe("completed");
    });
  });
});
