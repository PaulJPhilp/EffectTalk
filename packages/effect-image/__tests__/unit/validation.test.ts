/**
 * Validation function tests for effect-image
 *
 * Tests all validation utilities for formats, dimensions, and data integrity.
 */

import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  validateFormat,
  validateDimensions,
  validateImageData,
  validateTensorData,
  detectImageFormat,
  validateQuality,
} from "../../src/index.js";

describe("Validation Functions", () => {
  describe("validateFormat", () => {
    it("should accept supported formats", async () => {
      const formats = ["jpeg", "png", "webp"];
      for (const fmt of formats) {
        const result = await Effect.runPromise(
          Effect.either(validateFormat(fmt))
        );
        expect(result._tag).toBe("Right");
      }
    });

    it("should reject unsupported formats", async () => {
      const invalid = ["bmp", "tiff", "gif", "unknown"];
      for (const fmt of invalid) {
        const result = await Effect.runPromise(
          Effect.either(validateFormat(fmt))
        );
        expect(result._tag).toBe("Left");
      }
    });

    it("should be case sensitive", async () => {
      const upper = await Effect.runPromise(
        Effect.either(validateFormat("JPEG"))
      );
      const mixed = await Effect.runPromise(
        Effect.either(validateFormat("Png"))
      );
      const lower = await Effect.runPromise(
        Effect.either(validateFormat("jpeg"))
      );

      expect(upper._tag).toBe("Left");
      expect(mixed._tag).toBe("Left");
      expect(lower._tag).toBe("Right");
    });
  });

  describe("validateDimensions", () => {
    it("should accept valid dimensions", async () => {
      const validDims = [
        { width: 1, height: 1 },
        { width: 256, height: 256 },
        { width: 1024, height: 768 },
        { width: 16384, height: 16384 },
      ];

      for (const dim of validDims) {
        const result = await Effect.runPromise(
          Effect.either(validateDimensions(dim.width, dim.height))
        );
        expect(result._tag).toBe("Right");
      }
    });

    it("should reject zero or negative dimensions", async () => {
      const invalid = [
        { width: 0, height: 100 },
        { width: 100, height: 0 },
        { width: -1, height: 100 },
        { width: 100, height: -1 },
      ];

      for (const dim of invalid) {
        const result = await Effect.runPromise(
          Effect.either(validateDimensions(dim.width, dim.height))
        );
        expect(result._tag).toBe("Left");
      }
    });

    it("should reject dimensions exceeding maximum", async () => {
      const result1 = await Effect.runPromise(
        Effect.either(validateDimensions(16385, 100))
      );
      const result2 = await Effect.runPromise(
        Effect.either(validateDimensions(100, 16385))
      );
      const result3 = await Effect.runPromise(
        Effect.either(validateDimensions(16385, 16385))
      );

      expect(result1._tag).toBe("Left");
      expect(result2._tag).toBe("Left");
      expect(result3._tag).toBe("Left");
    });

    it("should accept exactly at limits", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateDimensions(16384, 16384))
      );
      expect(result._tag).toBe("Right");
    });
  });

  describe("validateImageData", () => {
    it("should accept valid image data", async () => {
      const data = {
        width: 256,
        height: 256,
        channels: 3,
        format: "jpeg" as const,
        data: Buffer.alloc(256 * 256 * 3),
      };

      const result = await Effect.runPromise(
        Effect.either(validateImageData(data))
      );
      expect(result._tag).toBe("Right");
    });

    it("should accept RGBA images", async () => {
      const data = {
        width: 256,
        height: 256,
        channels: 4,
        format: "png" as const,
        data: Buffer.alloc(256 * 256 * 4),
      };

      const result = await Effect.runPromise(
        Effect.either(validateImageData(data))
      );
      expect(result._tag).toBe("Right");
    });

    it("should reject invalid channels", async () => {
      const data = {
        width: 256,
        height: 256,
        channels: 2,
        format: "jpeg" as const,
        data: Buffer.alloc(256 * 256 * 2),
      };

      const result = await Effect.runPromise(
        Effect.either(validateImageData(data))
      );
      expect(result._tag).toBe("Left");
    });

    it("should reject mismatched buffer size", async () => {
      const data = {
        width: 256,
        height: 256,
        channels: 3,
        format: "jpeg" as const,
        data: Buffer.alloc(100), // Wrong size
      };

      const result = await Effect.runPromise(
        Effect.either(validateImageData(data))
      );
      expect(result._tag).toBe("Left");
    });
  });

  describe("validateTensorData", () => {
    it("should accept valid tensor data", async () => {
      const tensor = {
        shape: [256, 256, 3] as const,
        data: new Float32Array(256 * 256 * 3),
      };

      const result = await Effect.runPromise(
        Effect.either(validateTensorData(tensor))
      );
      expect(result._tag).toBe("Right");
    });

    it("should accept 4-channel tensors", async () => {
      const tensor = {
        shape: [224, 224, 4] as const,
        data: new Float32Array(224 * 224 * 4),
      };

      const result = await Effect.runPromise(
        Effect.either(validateTensorData(tensor))
      );
      expect(result._tag).toBe("Right");
    });

    it("should reject invalid channel count", async () => {
      const tensor = {
        shape: [256, 256, 2] as const,
        data: new Float32Array(256 * 256 * 2),
      };

      const result = await Effect.runPromise(
        Effect.either(validateTensorData(tensor))
      );
      expect(result._tag).toBe("Left");
    });

    it("should reject mismatched tensor size", async () => {
      const tensor = {
        shape: [256, 256, 3] as const,
        data: new Float32Array(100), // Wrong size
      };

      const result = await Effect.runPromise(
        Effect.either(validateTensorData(tensor))
      );
      expect(result._tag).toBe("Left");
    });

    it("should reject invalid dimensions", async () => {
      const tensors = [
        { shape: [0, 256, 3] as const, data: new Float32Array(0) },
        { shape: [256, 0, 3] as const, data: new Float32Array(0) },
        { shape: [16385, 256, 3] as const, data: new Float32Array(0) },
      ];

      for (const tensor of tensors) {
        const result = await Effect.runPromise(
          Effect.either(validateTensorData(tensor))
        );
        expect(result._tag).toBe("Left");
      }
    });
  });

  describe("detectImageFormat", () => {
    it("should detect JPEG format", () => {
      // JPEG SOI marker
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const result = detectImageFormat(jpegBuffer);
      expect(result).toBe("jpeg");
    });

    it("should detect PNG format", () => {
      // PNG signature
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const result = detectImageFormat(pngBuffer);
      expect(result).toBe("png");
    });

    it("should detect WebP format", () => {
      // WebP signature
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      const result = detectImageFormat(webpBuffer);
      expect(result).toBe("webp");
    });

    it("should return undefined for unknown format", () => {
      const unknownBuffer = Buffer.from([0x00, 0x01, 0x02]);
      const result = detectImageFormat(unknownBuffer);
      expect(result).toBeUndefined();
    });

    it("should handle empty buffer", () => {
      const result = detectImageFormat(Buffer.alloc(0));
      expect(result).toBeUndefined();
    });
  });

  describe("validateQuality", () => {
    it("should accept valid quality values", async () => {
      const validQualities = [1, 50, 90, 100];
      for (const q of validQualities) {
        const result = await Effect.runPromise(
          Effect.either(validateQuality(q))
        );
        expect(result._tag).toBe("Right");
      }
    });

    it("should allow undefined quality", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateQuality(undefined))
      );
      expect(result._tag).toBe("Right");
    });

    it("should reject zero quality", async () => {
      const result = await Effect.runPromise(Effect.either(validateQuality(0)));
      expect(result._tag).toBe("Left");
    });

    it("should reject negative quality", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateQuality(-10))
      );
      expect(result._tag).toBe("Left");
    });

    it("should reject quality above 100", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateQuality(101))
      );
      expect(result._tag).toBe("Left");
    });

    it("should reject non-integer quality", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateQuality(50.5))
      );
      expect(result._tag).toBe("Left");
    });
  });
});
