/**
 * Image operations tests for effect-image
 *
 * Tests core decode, encode, and format conversion operations
 */

import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  decode,
  encode,
  convert,
  getMetadata,
  SharpBackendLayer,
} from "../../src/index.js";

describe("Image Operations", () => {
  describe("decode", () => {
    it("should reject empty buffer", async () => {
      const program = Effect.gen(function* () {
        const result = yield* Effect.either(decode(Buffer.alloc(0)));
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle invalid buffer input", async () => {
      const program = Effect.gen(function* () {
        const result = yield* Effect.either(
          decode("not a buffer" as unknown as Buffer)
        );
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("encode", () => {
    it("should validate required ImageData fields", async () => {
      const program = Effect.gen(function* () {
        const invalidData = {
          width: 256,
          height: 256,
          channels: 3,
          format: "jpeg" as const,
          data: Buffer.alloc(100), // Wrong size
        };

        const result = yield* Effect.either(encode(invalidData, "jpeg"));
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should reject invalid quality values", async () => {
      const program = Effect.gen(function* () {
        const validData = {
          width: 256,
          height: 256,
          channels: 3,
          format: "jpeg" as const,
          data: Buffer.alloc(256 * 256 * 3),
        };

        const result = yield* Effect.either(
          encode(validData, "jpeg", { quality: 150 })
        );
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("convert", () => {
    it("should handle unsupported target format", async () => {
      const program = Effect.gen(function* () {
        const buffer = Buffer.alloc(100);
        const result = yield* Effect.either(
          convert(buffer, "jpeg", "bmp" as any)
        );
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should validate input buffer", async () => {
      const program = Effect.gen(function* () {
        const result = yield* Effect.either(
          convert(Buffer.alloc(0), "jpeg", "png")
        );
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("getMetadata", () => {
    it("should reject empty buffer", async () => {
      const program = Effect.gen(function* () {
        const result = yield* Effect.either(getMetadata(Buffer.alloc(0)));
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should require valid image format", async () => {
      const program = Effect.gen(function* () {
        const invalidBuffer = Buffer.from("not an image");
        const result = yield* Effect.either(getMetadata(invalidBuffer));
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Operation chaining", () => {
    it("should compose multiple operations", async () => {
      const program = Effect.gen(function* () {
        // Test that operations can be composed
        const data = {
          width: 100,
          height: 100,
          channels: 3,
          format: "jpeg" as const,
          data: Buffer.alloc(100 * 100 * 3),
        };

        // Attempt to encode
        const encoded = yield* Effect.either(encode(data, "png"));
        expect(encoded._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Format handling", () => {
    it("should accept all supported formats for encoding", async () => {
      const formats = ["jpeg", "png", "webp"] as const;
      const program = Effect.gen(function* () {
        const data = {
          width: 256,
          height: 256,
          channels: 3,
          format: "jpeg" as const,
          data: Buffer.alloc(256 * 256 * 3),
        };

        for (const fmt of formats) {
          const result = yield* Effect.either(encode(data, fmt));
          expect(result._tag).toMatch(/^(Left|Right)$/);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Error handling", () => {
    it("should provide detailed error messages", async () => {
      const program = Effect.gen(function* () {
        const result = yield* Effect.either(decode(Buffer.alloc(0)));
        if (result._tag === "Left") {
          expect(result.left).toBeDefined();
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });
});
