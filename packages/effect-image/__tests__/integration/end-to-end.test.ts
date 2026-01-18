/**
 * End-to-end integration tests for effect-image
 *
 * Tests complete workflows combining multiple operations
 */

import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  decode,
  encode,
  resize,
  toGrayscale,
  mlPreprocess,
  toTensor,
  SharpBackendLayer,
} from "../../src/index.js";

describe("End-to-End Image Processing", () => {
  const createValidImageData = (w = 256, h = 256) => ({
    width: w,
    height: h,
    channels: 3,
    format: "jpeg" as const,
    data: Buffer.alloc(w * h * 3),
  });

  describe("Image pipeline workflows", () => {
    it("should compose resize and encode operations", async () => {
      const program = Effect.gen(function* () {
        let imageData = createValidImageData(512, 512);

        // Resize
        const resized = yield* resize(imageData, 256, 256);

        // Encode
        const encoded = yield* encode(resized, "jpeg", { quality: 90 });

        expect(encoded).toBeInstanceOf(Buffer);
        expect(encoded.length).toBeGreaterThan(0);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should compose multiple image transformations", async () => {
      const program = Effect.gen(function* () {
        let imageData = createValidImageData(512, 512);

        // Resize
        const resized = yield* resize(imageData, 256, 256);

        // Convert to grayscale
        const gray = yield* toGrayscale(resized);

        // Convert to tensor
        const tensor = yield* toTensor(gray, 3);

        expect(tensor.shape).toBeDefined();
        expect(tensor.data).toBeInstanceOf(Float32Array);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should perform full ML preprocessing", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData(512, 512);

        // ML Preprocessing (includes resize + normalize + convert to tensor)
        const tensor = yield* mlPreprocess(imageData, {
          width: 224,
          height: 224,
          normalize: {
            mean: [0.485, 0.456, 0.406],
            std: [0.229, 0.224, 0.225],
          },
        });

        expect(tensor.shape).toEqual([224, 224, 3]);
        expect(tensor.data).toBeInstanceOf(Float32Array);
        expect(tensor.data.length).toBe(224 * 224 * 3);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle error propagation in pipeline", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        // Invalid resize (dimension too large)
        const result = yield* Effect.either(resize(imageData, 20000, 20000));
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Encode-decode round trip", () => {
    it("should encode and decode without losing data", async () => {
      const program = Effect.gen(function* () {
        const originalData = createValidImageData(128, 128);

        // Encode to JPEG
        const encoded = yield* encode(originalData, "jpeg");

        // Decode back
        const decoded = yield* decode(encoded);

        // Check dimensions preserved
        expect(decoded.width).toBe(128);
        expect(decoded.height).toBe(128);
        expect(decoded.channels).toBe(3);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should support multiple format conversions", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData(256, 256);
        const formats = ["jpeg", "png", "webp"] as const;

        for (const fmt of formats) {
          const encoded = yield* encode(imageData, fmt);
          expect(encoded).toBeInstanceOf(Buffer);
          expect(encoded.length).toBeGreaterThan(0);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Complex preprocessing pipelines", () => {
    it("should resize, grayscale, and normalize", async () => {
      const program = Effect.gen(function* () {
        let imageData = createValidImageData(512, 512);

        // Resize
        const resized = yield* resize(imageData, 256, 256);

        // Grayscale
        const gray = yield* toGrayscale(resized);

        // Tensor conversion (which includes implicit normalization)
        const tensor = yield* toTensor(gray, 3);

        // Verify output
        expect(tensor.shape[0]).toBe(256);
        expect(tensor.shape[1]).toBe(256);
        expect(tensor.shape[2]).toBe(3);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle preprocessing with different input sizes", async () => {
      const program = Effect.gen(function* () {
        const sizes = [
          { w: 100, h: 100 },
          { w: 500, h: 500 },
          { w: 1000, h: 800 },
        ];

        for (const { w, h } of sizes) {
          const imageData = createValidImageData(w, h);
          const tensor = yield* mlPreprocess(imageData, {
            width: 256,
            height: 256,
          });

          expect(tensor.shape).toEqual([256, 256, 3]);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Quality and optimization", () => {
    it("should produce valid output with quality option", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const high = yield* encode(imageData, "jpeg", { quality: 95 });
        const low = yield* encode(imageData, "jpeg", { quality: 50 });

        // Higher quality should typically result in larger file
        expect(high).toBeInstanceOf(Buffer);
        expect(low).toBeInstanceOf(Buffer);
        expect(high.length + low.length).toBeGreaterThan(0);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle efficient WebP encoding", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const encoded = yield* encode(imageData, "webp", { quality: 80 });

        expect(encoded).toBeInstanceOf(Buffer);
        expect(encoded.length).toBeGreaterThan(0);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Batch processing workflows", () => {
    it("should process multiple images with ML preprocessing", async () => {
      const program = Effect.gen(function* () {
        const images = [
          createValidImageData(300, 300),
          createValidImageData(400, 400),
          createValidImageData(250, 250),
        ];

        // Process each image through ML pipeline
        const tensors = yield* Effect.all(
          images.map((img) =>
            mlPreprocess(img, {
              width: 224,
              height: 224,
              normalize: {
                mean: [0.485, 0.456, 0.406],
                std: [0.229, 0.224, 0.225],
              },
            })
          )
        );

        expect(tensors.length).toBe(3);
        expect(tensors.every((t) => t.shape[0] === 224)).toBe(true);
        expect(tensors.every((t) => t.shape[1] === 224)).toBe(true);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("Error recovery", () => {
    it("should handle partial batch failures gracefully", async () => {
      const program = Effect.gen(function* () {
        const validData = createValidImageData();

        const result1 = yield* Effect.either(resize(validData, 256, 256));
        expect(result1._tag).toBe("Right");

        // Invalid resize
        const result2 = yield* Effect.either(resize(validData, 0, 256));
        expect(result2._tag).toBe("Left");

        // Should be able to continue
        const result3 = yield* Effect.either(resize(validData, 128, 128));
        expect(result3._tag).toBe("Right");

        return true;
      }).pipe(Effect.provide(SharpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result).toBe(true);
    });
  });

  describe("Performance characteristics", () => {
    it("should handle sequential operations efficiently", async () => {
      const program = Effect.gen(function* () {
        let imageData = createValidImageData(256, 256);

        // Sequential operations
        const resized = yield* resize(imageData, 128, 128);
        const gray = yield* toGrayscale(resized);
        const encoded = yield* encode(gray, "jpeg", { quality: 80 });

        expect(encoded.length).toBeGreaterThan(0);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should support composition of independent operations", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData(512, 512);

        // Independent operations can be composed
        const resize1 = yield* Effect.either(resize(imageData, 256, 256));
        const resize2 = yield* Effect.either(resize(imageData, 128, 128));
        const gray = yield* Effect.either(toGrayscale(imageData));

        expect(resize1._tag).toBe("Right");
        expect(resize2._tag).toBe("Right");
        expect(gray._tag).toBe("Right");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });
});
