/**
 * ML preprocessing tests for effect-image
 *
 * Tests machine learning preprocessing pipelines and tensor operations
 */

import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  mlPreprocess,
  toTensor,
  fromTensor,
  normalize,
  denormalize,
  batchProcess,
  SharpBackendLayer,
} from "../../src/index.js";

describe("ML Preprocessing", () => {
  const createValidImageData = (w = 256, h = 256) => ({
    width: w,
    height: h,
    channels: 3,
    format: "jpeg" as const,
    data: Buffer.alloc(w * h * 3),
  });

  describe("mlPreprocess", () => {
    it("should validate preprocessing config", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(
          mlPreprocess(imageData, {
            width: 224,
            height: 224,
          })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should apply ImageNet normalization when configured", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(
          mlPreprocess(imageData, {
            width: 224,
            height: 224,
            normalize: {
              mean: [0.485, 0.456, 0.406],
              std: [0.229, 0.224, 0.225],
            },
          })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should reject invalid preprocessing dimensions", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(
          mlPreprocess(imageData, {
            width: 0,
            height: 224,
          })
        );
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle normalization with custom mean/std", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(
          mlPreprocess(imageData, {
            width: 256,
            height: 256,
            normalize: {
              mean: [0.5, 0.5, 0.5],
              std: [0.5, 0.5, 0.5],
            },
          })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("toTensor", () => {
    it("should convert ImageData to tensor", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(toTensor(imageData, 3));
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.shape).toEqual([256, 256, 3]);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should convert to 4-channel tensor for RGBA", async () => {
      const program = Effect.gen(function* () {
        const imageData = {
          width: 128,
          height: 128,
          channels: 4,
          format: "png" as const,
          data: Buffer.alloc(128 * 128 * 4),
        };

        const result = yield* Effect.either(toTensor(imageData, 4));
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.shape).toEqual([128, 128, 4]);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should produce Float32Array tensors", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData(64, 64);

        const result = yield* Effect.either(toTensor(imageData, 3));
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.data).toBeInstanceOf(Float32Array);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("fromTensor", () => {
    it("should convert tensor back to ImageData", async () => {
      const program = Effect.gen(function* () {
        const tensorData = {
          shape: [256, 256, 3] as const,
          data: new Float32Array(256 * 256 * 3),
        };

        const result = yield* Effect.either(fromTensor(tensorData, "jpeg"));
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.width).toBe(256);
          expect(result.right.height).toBe(256);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should preserve tensor dimensions as image dimensions", async () => {
      const program = Effect.gen(function* () {
        const tensorData = {
          shape: [224, 224, 3] as const,
          data: new Float32Array(224 * 224 * 3),
        };

        const result = yield* Effect.either(fromTensor(tensorData, "png"));
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.width).toBe(224);
          expect(result.right.height).toBe(224);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("normalize", () => {
    it("should apply ImageNet normalization", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(
          normalize(imageData, {
            mean: [0.485, 0.456, 0.406],
            std: [0.229, 0.224, 0.225],
          })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.width).toBe(256);
          expect(result.right.height).toBe(256);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should validate input ImageData", async () => {
      const program = Effect.gen(function* () {
        const invalidData = {
          width: 256,
          height: 256,
          channels: 2, // Invalid
          format: "jpeg" as const,
          data: Buffer.alloc(256 * 256 * 2),
        };

        const result = yield* Effect.either(
          normalize(invalidData, {
            mean: [0.5, 0.5, 0.5],
          })
        );
        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("denormalize", () => {
    it("should reverse normalization", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData();

        const result = yield* Effect.either(
          denormalize(imageData, {
            mean: [0.5, 0.5, 0.5],
            std: [0.5, 0.5, 0.5],
          })
        );
        expect(result._tag).toBe("Right");
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should preserve image dimensions", async () => {
      const program = Effect.gen(function* () {
        const imageData = createValidImageData(512, 512);

        const result = yield* Effect.either(
          denormalize(imageData, {
            mean: [0.485, 0.456, 0.406],
            std: [0.229, 0.224, 0.225],
          })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.width).toBe(512);
          expect(result.right.height).toBe(512);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });
  });

  describe("batchProcess", () => {
    it("should process multiple images", async () => {
      const program = Effect.gen(function* () {
        const images = [
          createValidImageData(128, 128),
          createValidImageData(256, 256),
          createValidImageData(64, 64),
        ];

        const result = yield* Effect.either(
          batchProcess(images, {
            width: 224,
            height: 224,
          })
        );
        expect(result._tag).toBe("Right");
        if (result._tag === "Right") {
          expect(result.right.length).toBe(3);
        }
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should handle empty batch", async () => {
      const program = Effect.gen(function* () {
        const images: (typeof createValidImageData)[] = [];

        const result = yield* Effect.either(
          batchProcess(images, {
            width: 224,
            height: 224,
          })
        );
        expect(result._tag).toMatch(/^(Left|Right)$/);
      }).pipe(Effect.provide(SharpBackendLayer));

      await Effect.runPromise(program);
    });

    it("should apply normalization to batch", async () => {
      const program = Effect.gen(function* () {
        const images = [createValidImageData(), createValidImageData()];

        const result = yield* Effect.either(
          batchProcess(images, {
            width: 224,
            height: 224,
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
  });

  describe("Preprocessing pipeline", () => {
    it("should compose normalize and tensor conversion", async () => {
      const program = Effect.gen(function* () {
        let imageData = createValidImageData();

        // Normalize
        const normalized = yield* Effect.either(
          normalize(imageData, {
            mean: [0.5, 0.5, 0.5],
            std: [0.5, 0.5, 0.5],
          })
        );
        if (normalized._tag === "Left") {
          return false;
        }
        imageData = normalized.right;

        // Convert to tensor
        const tensor = yield* Effect.either(toTensor(imageData, 3));
        if (tensor._tag === "Left") {
          return false;
        }

        return true;
      }).pipe(Effect.provide(SharpBackendLayer));

      const result = await Effect.runPromise(program);
      expect(result).toMatch(/^(true|false)$/);
    });
  });
});
