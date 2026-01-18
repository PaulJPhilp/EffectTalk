/**
 * Tensor utility function tests for effect-image
 *
 * Tests tensor conversion, normalization, and reshaping operations.
 */

import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  imageTensorFromData,
  tensorToImageData,
  normalizeTensor,
  denormalizeTensor,
  reshapeCHWtoHWC,
  reshapeHWCtoCHW,
} from "../../src/index.js";

describe("Tensor Utilities", () => {
  describe("imageTensorFromData", () => {
    it("should convert ImageData to tensor", () => {
      const imageData = {
        width: 4,
        height: 4,
        channels: 3,
        format: "jpeg" as const,
        data: Buffer.from(new Array(4 * 4 * 3).fill(128)),
      };

      const tensor = imageTensorFromData(imageData);

      expect(tensor.shape).toEqual([4, 4, 3]);
      expect(tensor.data).toBeInstanceOf(Float32Array);
      expect(tensor.data.length).toBe(4 * 4 * 3);
    });

    it("should normalize pixel values to 0-1 range", () => {
      const imageData = {
        width: 2,
        height: 2,
        channels: 3,
        format: "jpeg" as const,
        data: Buffer.from([255, 0, 128, 64, 255, 0, 128, 64]),
      };

      const tensor = imageTensorFromData(imageData, 3);

      // 255/255 = 1.0, 0/255 = 0, 128/255 ≈ 0.502, 64/255 ≈ 0.251
      expect(tensor.data[0]).toBeCloseTo(1.0);
      expect(tensor.data[1]).toBe(0.0);
      expect(tensor.data[2]).toBeCloseTo(128 / 255, 2);
    });

    it("should handle RGBA images with channels parameter", () => {
      const imageData = {
        width: 2,
        height: 2,
        channels: 4,
        format: "png" as const,
        data: Buffer.from(new Array(2 * 2 * 4).fill(100)),
      };

      const tensor = imageTensorFromData(imageData, 4);

      expect(tensor.shape).toEqual([2, 2, 4]);
      expect(tensor.data.length).toBe(2 * 2 * 4);
    });

    it("should preserve aspect ratio in tensor shape", () => {
      const imageData = {
        width: 640,
        height: 480,
        channels: 3,
        format: "jpeg" as const,
        data: Buffer.from(new Array(640 * 480 * 3).fill(128)),
      };

      const tensor = imageTensorFromData(imageData, 3);

      expect(tensor.shape[0]).toBe(480); // Height
      expect(tensor.shape[1]).toBe(640); // Width
      expect(tensor.shape[2]).toBe(3); // Channels
    });
  });

  describe("tensorToImageData", () => {
    it("should convert tensor back to ImageData", async () => {
      const tensor = {
        shape: [4, 4, 3] as const,
        data: new Float32Array(4 * 4 * 3).fill(0.5),
      };

      const result = await Effect.runPromise(
        tensorToImageData(tensor, 4, 4, "jpeg")
      );

      expect(result.width).toBe(4);
      expect(result.height).toBe(4);
      expect(result.channels).toBe(4);
      expect(result.format).toBe("jpeg");
      expect(result.data.length).toBe(4 * 4 * 4);
    });

    it("should denormalize values back to 0-255 range", async () => {
      const tensor = {
        shape: [2, 2, 3] as const,
        data: new Float32Array([
          1.0, 0.5, 0.25, 0.0, 0.5, 0.25, 1.0, 0.5, 0.25, 0.0, 0.5, 0.25,
        ]),
      };

      const result = await Effect.runPromise(
        tensorToImageData(tensor, 2, 2, "png")
      );

      // First pixel: R=1.0->255, G=0.5->128 (rounded), B=0.25->64 (rounded)
      expect(result.data[0]).toBe(255);
      expect(result.data[1]).toBeCloseTo(128, 0);
      expect(result.data[2]).toBeCloseTo(64, 0);
      // Alpha is always 255
      expect(result.data[3]).toBe(255);
    });

    it("should handle RGBA format", async () => {
      const tensor = {
        shape: [2, 2, 4] as const,
        data: new Float32Array(2 * 2 * 4).fill(0.7),
      };

      const result = await Effect.runPromise(
        tensorToImageData(tensor, 2, 2, "png")
      );

      expect(result.channels).toBe(4);
    });

    it("should preserve tensor dimensions in ImageData", async () => {
      const tensor = {
        shape: [224, 224, 3] as const,
        data: new Float32Array(224 * 224 * 3).fill(0.5),
      };

      const result = await Effect.runPromise(
        tensorToImageData(tensor, 224, 224, "jpeg")
      );

      expect(result.height).toBe(224);
      expect(result.width).toBe(224);
      expect(result.channels).toBe(4);
    });
  });

  describe("normalizeTensor", () => {
    it("should normalize tensor with mean and std", () => {
      const tensor = {
        shape: [1, 1, 3] as const,
        data: new Float32Array([0.5, 0.6, 0.7]),
      };
      const options = { mean: [0.5, 0.5, 0.5], std: [1.0, 1.0, 1.0] };

      const result = normalizeTensor(tensor, options);

      expect(result.data[0]).toBeCloseTo(0.0, 5); // (0.5 - 0.5) / 1.0
      expect(result.data[1]).toBeCloseTo(0.1, 5); // (0.6 - 0.5) / 1.0
      expect(result.data[2]).toBeCloseTo(0.2, 5); // (0.7 - 0.5) / 1.0
    });

    it("should handle non-unit standard deviation", () => {
      const tensor = {
        shape: [1, 1, 3] as const,
        data: new Float32Array([0.5, 1.0, 1.5]),
      };
      const options = { mean: [0.5, 0.5, 0.5], std: [0.1, 0.2, 0.25] };

      const result = normalizeTensor(tensor, options);

      expect(result.data[0]).toBeCloseTo(0.0, 1);
      expect(result.data[1]).toBeCloseTo(2.5, 1);
      expect(result.data[2]).toBeCloseTo(4.0, 1);
    });

    it("should normalize ImageNet standard normalization", () => {
      const tensor = {
        shape: [1, 1, 3] as const,
        data: new Float32Array([0.485, 0.456, 0.406]),
      };
      const options = {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
      };

      const result = normalizeTensor(tensor, options);

      expect(result.data[0]).toBeCloseTo(0.0, 2);
      expect(result.data[1]).toBeCloseTo(0.0, 2);
      expect(result.data[2]).toBeCloseTo(0.0, 2);
    });

    it("should preserve array type", () => {
      const tensor = {
        shape: [1, 3, 1] as const,
        data: new Float32Array([0.1, 0.2, 0.3]),
      };
      const options = { mean: [0, 0, 0], std: [1, 1, 1] };

      const result = normalizeTensor(tensor, options);

      expect(result.data).toBeInstanceOf(Float32Array);
    });
  });

  describe("denormalizeTensor", () => {
    it("should reverse normalization with mean and std", () => {
      const tensor = {
        shape: [1, 1, 3] as const,
        data: new Float32Array([0.0, 0.1, 0.2]),
      };
      const options = { mean: [0.5, 0.5, 0.5], std: [1.0, 1.0, 1.0] };

      const result = denormalizeTensor(tensor, options);

      expect(result.data[0]).toBeCloseTo(0.5, 2);
      expect(result.data[1]).toBeCloseTo(0.6, 2);
      expect(result.data[2]).toBeCloseTo(0.7, 2);
    });

    it("should handle non-unit standard deviation", () => {
      const tensor = {
        shape: [1, 1, 3] as const,
        data: new Float32Array([0.0, 2.5, 4.0]),
      };
      const options = { mean: [0.5, 0.5, 0.5], std: [0.1, 0.2, 0.25] };

      const result = denormalizeTensor(tensor, options);

      expect(result.data[0]).toBeCloseTo(0.5, 1);
      expect(result.data[1]).toBeCloseTo(1.0, 1);
      expect(result.data[2]).toBeCloseTo(1.5, 1);
    });

    it("should reverse ImageNet normalization", () => {
      const tensor = {
        shape: [1, 1, 3] as const,
        data: new Float32Array([0.0, 0.0, 0.0]),
      };
      const options = {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
      };

      const result = denormalizeTensor(tensor, options);

      expect(result.data[0]).toBeCloseTo(0.485, 2);
      expect(result.data[1]).toBeCloseTo(0.456, 2);
      expect(result.data[2]).toBeCloseTo(0.406, 2);
    });
  });

  describe("reshapeCHWtoHWC", () => {
    it("should convert CHW to HWC layout", () => {
      // CHW: 3 channels x 2 height x 2 width
      const chw = new Float32Array([
        1,
        2,
        3,
        4, // Channel 0
        5,
        6,
        7,
        8, // Channel 1
        9,
        10,
        11,
        12, // Channel 2
      ]);

      const hwc = reshapeCHWtoHWC(
        { shape: [3, 2, 2] as const, data: chw },
        2,
        2
      );

      // HWC should interleave: [C0H0W0, C1H0W0, C2H0W0, C0H0W1, C1H0W1, ...]
      expect(hwc.shape).toEqual([2, 2, 3]);
      expect(hwc.data.length).toBe(12);
      expect(hwc.data[0]).toBe(1); // C0 at (0,0)
      expect(hwc.data[1]).toBe(5); // C1 at (0,0)
      expect(hwc.data[2]).toBe(9); // C2 at (0,0)
    });

    it("should preserve all values during reshape", () => {
      const chw = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const hwc = reshapeCHWtoHWC(
        { shape: [3, 2, 2] as const, data: chw },
        2,
        2
      );

      // All values should be present
      expect(new Set(hwc.data)).toEqual(new Set(chw));
    });

    it("should maintain correct shape for HWC interpretation", () => {
      const chw = new Float32Array(3 * 4 * 4);
      const hwc = reshapeCHWtoHWC(
        { shape: [3, 4, 4] as const, data: chw },
        4,
        4
      );

      expect(hwc.data.length).toBe(3 * 4 * 4);
      expect(hwc.shape).toEqual([4, 4, 3]);
    });
  });

  describe("reshapeHWCtoCHW", () => {
    it("should convert HWC to CHW layout", () => {
      // HWC: height=2, width=2, channels=3
      const hwc = new Float32Array([
        1,
        5,
        9, // (H0,W0): C0,C1,C2
        2,
        6,
        10, // (H0,W1): C0,C1,C2
        3,
        7,
        11, // (H1,W0): C0,C1,C2
        4,
        8,
        12, // (H1,W1): C0,C1,C2
      ]);

      const chw = reshapeHWCtoCHW(
        { shape: [2, 2, 3] as const, data: hwc },
        2,
        2
      );

      expect(chw.shape).toEqual([3, 2, 2]);
      expect(chw.data.length).toBe(12);
      // Channel 0: [1, 2, 3, 4]
      expect(chw.data[0]).toBe(1);
      expect(chw.data[1]).toBe(2);
      expect(chw.data[2]).toBe(3);
      expect(chw.data[3]).toBe(4);
    });

    it("should preserve all values during reshape", () => {
      const hwc = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const chw = reshapeHWCtoCHW(
        { shape: [2, 2, 3] as const, data: hwc },
        2,
        2
      );

      expect(new Set(chw.data)).toEqual(new Set(hwc));
    });

    it("should be inverse of CHW to HWC", () => {
      const original = new Float32Array([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
      const hwc = reshapeCHWtoHWC(
        { shape: [3, 2, 2] as const, data: original },
        2,
        2
      );
      const chw = reshapeHWCtoCHW(hwc, 2, 2);

      for (let i = 0; i < original.length; i++) {
        expect(chw.data[i]).toBe(original[i]);
      }
    });
  });
});
