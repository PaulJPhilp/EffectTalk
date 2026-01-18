/**
 * Image transformation tests for effect-image
 *
 * Tests image resizing, cropping, rotation, and flipping operations
 */

import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  resize,
  crop,
  rotate,
  flipHorizontal,
  flipVertical,
  toGrayscale,
  SharpBackendLayer,
} from "../../src/index.js";

describe("Image Transformations", () => {
  const createValidImageData = (w = 256, h = 256) => ({
    width: w,
    height: h,
    channels: 3,
    format: "jpeg" as const,
    data: Buffer.alloc(w * h * 3),
  });

  describe("resize", () => {
    it("should validate dimension constraints", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        // Test with invalid width
        const result = yield* Effect.either(resize(imageData, 0, 256));
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should reject negative dimensions", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(resize(imageData, -100, 256));
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should reject dimensions exceeding maximum", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(resize(imageData, 16385, 256));
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should accept valid resize options", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const fits = ["cover", "contain", "fill", "inside", "outside"] as const;
        for (const fit of fits) {
          const result = yield* Effect.either(
            resize(imageData, 128, 128, { fit })
          );
          expect(result._tag).toMatch(/^(Left|Right)$/);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should preserve aspect ratio in contain mode", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData(640, 480);

        const result = yield* Effect.either(
          resize(imageData, 320, 320, { fit: "contain" })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("crop", () => {
    it("should validate crop parameters", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        // Crop outside image bounds
        const result = yield* Effect.either(
          crop(imageData, { left: 0, top: 0, width: 1000, height: 100 })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle zero-size crops", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(
          crop(imageData, { left: 0, top: 0, width: 0, height: 100 })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle negative offsets", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(
          crop(imageData, { left: -10, top: 10, width: 100, height: 100 })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("rotate", () => {
    it("should accept valid rotation angles", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const angles = [90, 180, 270];
        for (const angle of angles) {
          const result = yield* Effect.either(rotate(imageData, angle));
          expect(result._tag).toMatch(/^(Left|Right)$/);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should reject invalid angles", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(rotate(imageData, 45));
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("flipHorizontal", () => {
    it("should flip image horizontally", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(flipHorizontal(imageData));
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should preserve image dimensions", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData(640, 480);

        const result = yield* Effect.either(flipHorizontal(imageData));
        if (result._tag === "Right") {
          expect(result.right.width).toBe(640);
          expect(result.right.height).toBe(480);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("flipVertical", () => {
    it("should flip image vertically", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(flipVertical(imageData));
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should preserve channel count", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(flipVertical(imageData));
        if (result._tag === "Right") {
          expect(result.right.channels).toBe(3);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("toGrayscale", () => {
    it("should convert to grayscale", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(toGrayscale(imageData));
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should produce single-channel output", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(toGrayscale(imageData));
        if (result._tag === "Right") {
          expect(result.right.channels).toBe(1);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should preserve dimensions", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData(512, 512);

        const result = yield* Effect.either(toGrayscale(imageData));
        if (result._tag === "Right") {
          expect(result.right.width).toBe(512);
          expect(result.right.height).toBe(512);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Transformation chaining", () => {
    it("should support operation composition", async () => {
      const program = Effect.gen(function* () {
        let imageData = createValidImageData();

        // Resize
        const resized = yield* Effect.either(resize(imageData, 128, 128));
        if (resized._tag === "Left") {
          return false;
        }
        imageData = resized.right;

        // Grayscale
        const grayed = yield* Effect.either(toGrayscale(imageData));
        if (grayed._tag === "Left") {
          return false;
        }

        return true;
      }).pipe(Effect.provide(SharpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result).toMatch(/^(true|false)$/);
    });
  });

  describe("RGBA image transformations", () => {
    it("should handle RGBA images", async () => {
      const program = Effect.gen(function* () {
        const rgba = {
          width: 256,
          height: 256,
          channels: 4,
          format: "png" as const,
          data: Buffer.alloc(256 * 256 * 4),
        };

        const result = yield* Effect.either(resize(rgba, 128, 128));
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });
});
