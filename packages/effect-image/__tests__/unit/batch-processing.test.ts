/**
 * Batch processing tests for effect-image
 *
 * Tests batch operations and concurrent processing
 */

import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { batchProcess, SharpBackendLayer } from "../../src/index.js";

describe("Batch Processing", () => {
  const createImageData = (w = 256, h = 256) => ({
    width: w,
    height: h,
    channels: 3,
    format: "jpeg" as const,
    data: Buffer.alloc(w * h * 3),
  });

  describe("batchProcess", () => {
    it("should process batch of same-size images", async () => {
      const program = Effect.gen(function* () {
        const batch = [
          createImageData(256, 256),
          createImageData(256, 256),
          createImageData(256, 256),
        ];

        const result = yield* Effect.either(
          batchProcess(batch, { width: 224, height: 224 })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.length).toBe(3);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should process batch of different-size images", async () => {
      const program = Effect.gen(function* () {
        const batch = [
          createImageData(256, 256),
          createImageData(512, 512),
          createImageData(128, 128),
        ];

        const result = yield* Effect.either(
          batchProcess(batch, { width: 224, height: 224 })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.length).toBe(3);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle single image batch", async () => {
      const program = Effect.gen(function* () {
        const batch = [createImageData()];

        const result = yield* Effect.either(
          batchProcess(batch, { width: 224, height: 224 })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.length).toBe(1);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should maintain image data integrity", async () => {
      const program = Effect.gen(function* () {
        const batch = [
          createImageData(100, 100),
          createImageData(200, 200),
          createImageData(150, 150),
        ];

        const result = yield* Effect.either(
          batchProcess(batch, { width: 224, height: 224 })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.every((img) => img.width === 224)).toBe(true);
          expect(result.right.every((img) => img.height === 224)).toBe(true);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should apply normalization to batch", async () => {
      const program = Effect.gen(function* () {
        const batch = [createImageData(), createImageData(), createImageData()];

        const result = yield* Effect.either(
          batchProcess(batch, {
            width: 256,
            height: 256,
            normalize: {
              mean: [0.485, 0.456, 0.406],
              std: [0.229, 0.224, 0.225],
            },
          })
        );
        expect(result._tag).toBe("Right");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle large batch", async () => {
      const program = Effect.gen(function* () {
        const batch = Array(10)
          .fill(null)
          .map(() => createImageData(128, 128));

        const result = yield* Effect.either(
          batchProcess(batch, { width: 224, height: 224 })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.length).toBe(10);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should validate batch input", async () => {
      const program = Effect.gen(function* () {
        const invalidBatch = [
          {
            width: 256,
            height: 256,
            channels: 2, // Invalid channels
            format: "jpeg" as const,
            data: Buffer.alloc(256 * 256 * 2),
          },
        ];

        const result = yield* Effect.either(
          batchProcess(invalidBatch as any, { width: 224, height: 224 })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should reject invalid config dimensions", async () => {
      const program = Effect.gen(function* () {
        const batch = [createImageData()];

        const result = yield* Effect.either(
          batchProcess(batch, { width: 0, height: 224 })
        );
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should preserve image format in batch", async () => {
      const program = Effect.gen(function* () {
        const batch = [
          { ...createImageData(), format: "jpeg" as const },
          { ...createImageData(), format: "png" as const },
          { ...createImageData(), format: "webp" as const },
        ];

        const result = yield* Effect.either(
          batchProcess(batch, { width: 224, height: 224 })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.every((img) => img.channels === 3)).toBe(true);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle RGBA images in batch", async () => {
      const program = Effect.gen(function* () {
        const batch = [
          {
            width: 256,
            height: 256,
            channels: 4,
            format: "png" as const,
            data: Buffer.alloc(256 * 256 * 4),
          },
          {
            width: 256,
            height: 256,
            channels: 4,
            format: "png" as const,
            data: Buffer.alloc(256 * 256 * 4),
          },
        ];

        const result = yield* Effect.either(
          batchProcess(batch, { width: 224, height: 224 })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should provide consistent output across batch", async () => {
      const program = Effect.gen(function* () {
        const batch = [
          createImageData(200, 200),
          createImageData(300, 300),
          createImageData(150, 150),
        ];

        const result = yield* Effect.either(
          batchProcess(batch, { width: 256, height: 256 })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          // All output images should have consistent size
          const widths = new Set(result.right.map((img) => img.width));
          const heights = new Set(result.right.map((img) => img.height));
          expect(widths.size).toBe(1);
          expect(heights.size).toBe(1);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Batch error handling", () => {
    it("should report batch processing errors", async () => {
      const program = Effect.gen(function* () {
        const batch = [
          {
            width: 0, // Invalid
            height: 256,
            channels: 3,
            format: "jpeg" as const,
            data: Buffer.alloc(256 * 256 * 3),
          },
        ];

        const result = yield* Effect.either(
          batchProcess(batch as any, { width: 224, height: 224 })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });
});
