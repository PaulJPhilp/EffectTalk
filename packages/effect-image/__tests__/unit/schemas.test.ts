/**
 * Schema validation tests for effect-image
 *
 * Tests type validation and schema constraints
 */

import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  ImageFormatSchema,
  ImageDataSchema,
  TensorDataSchema,
  ImageMetadataSchema,
  ResizeOptionsSchema,
  CropOptionsSchema,
  EncodeOptionsSchema,
  NormalizeOptionsSchema,
  MLPreprocessConfigSchema,
} from "../../src/index.js";

describe("Schema Validation", () => {
  describe("ImageFormatSchema", () => {
    it("should accept supported formats", () => {
      const formats = ["jpeg", "png", "webp"] as const;
      for (const fmt of formats) {
        const result = Schema.decodeSync(ImageFormatSchema)(fmt);
        expect(result).toBe(fmt);
      }
    });

    it("should reject unsupported formats", () => {
      expect(() => {
        Schema.decodeSync(ImageFormatSchema)("bmp");
      }).toThrow();
    });
  });

  describe("ImageDataSchema", () => {
    it("should validate complete ImageData", () => {
      const data = {
        width: 256,
        height: 256,
        channels: 3,
        format: "jpeg" as const,
        data: Buffer.alloc(256 * 256 * 3),
      };

      const result = Schema.decodeSync(ImageDataSchema)(data);
      expect(result.width).toBe(256);
      expect(result.height).toBe(256);
      expect(result.channels).toBe(3);
      expect(result.format).toBe("jpeg");
    });

    it("should accept RGBA images", () => {
      const data = {
        width: 128,
        height: 128,
        channels: 4,
        format: "png" as const,
        data: Buffer.alloc(128 * 128 * 4),
      };

      const result = Schema.decodeSync(ImageDataSchema)(data);
      expect(result.channels).toBe(4);
    });

    it("should reject invalid channels", () => {
      expect(() => {
        Schema.decodeSync(ImageDataSchema)({
          width: 256,
          height: 256,
          channels: 2,
          format: "jpeg" as const,
          data: Buffer.alloc(256 * 256 * 2),
        });
      }).toThrow();
    });

    it("should reject missing required fields", () => {
      expect(() => {
        Schema.decodeSync(ImageDataSchema)({
          width: 256,
          height: 256,
          format: "jpeg" as const,
          // Missing channels and data
        });
      }).toThrow();
    });
  });

  describe("TensorDataSchema", () => {
    it("should validate complete TensorData", () => {
      const tensor = {
        shape: [256, 256, 3] as const,
        data: new Float32Array(256 * 256 * 3),
      };

      const result = Schema.decodeSync(TensorDataSchema)(tensor);
      expect(result.shape).toEqual([256, 256, 3]);
      expect(result.data).toBeInstanceOf(Float32Array);
    });

    it("should accept 4-channel tensors", () => {
      const tensor = {
        shape: [224, 224, 4] as const,
        data: new Float32Array(224 * 224 * 4),
      };

      const result = Schema.decodeSync(TensorDataSchema)(tensor);
      expect(result.shape[2]).toBe(4);
    });

    it("should reject invalid tensor structure", () => {
      expect(() => {
        Schema.decodeSync(TensorDataSchema)({
          shape: [256, 256, 3],
          // Missing data
        });
      }).toThrow();
    });
  });

  describe("ImageMetadataSchema", () => {
    it("should validate complete ImageMetadata", () => {
      const metadata = {
        width: 1024,
        height: 768,
        format: "jpeg" as const,
        colorSpace: "srgb",
        hasAlpha: false,
        isProgressive: false,
      };

      const result = Schema.decodeSync(ImageMetadataSchema)(metadata);
      expect(result.width).toBe(1024);
      expect(result.format).toBe("jpeg");
    });

    it("should handle optional fields", () => {
      const metadata = {
        width: 512,
        height: 512,
        format: "png" as const,
      };

      const result = Schema.decodeSync(ImageMetadataSchema)(metadata);
      expect(result.width).toBe(512);
    });
  });

  describe("ResizeOptionsSchema", () => {
    it("should validate resize options with fit mode", () => {
      const options = {
        width: 256,
        height: 256,
        fit: "cover" as const,
      };

      const result = Schema.decodeSync(ResizeOptionsSchema)(options);
      expect(result.width).toBe(256);
      expect(result.fit).toBe("cover");
    });

    it("should accept all fit modes", () => {
      const fits = ["cover", "contain", "fill", "inside", "outside"] as const;
      for (const fit of fits) {
        const options = {
          width: 256,
          height: 256,
          fit,
        };
        const result = Schema.decodeSync(ResizeOptionsSchema)(options);
        expect(result.fit).toBe(fit);
      }
    });

    it("should handle partial options", () => {
      const options = { width: 200 };
      const result = Schema.decodeSync(ResizeOptionsSchema)(options);
      expect(result.width).toBe(200);
    });
  });

  describe("CropOptionsSchema", () => {
    it("should validate crop options", () => {
      const options = {
        left: 10,
        top: 20,
        width: 100,
        height: 100,
      };

      const result = Schema.decodeSync(CropOptionsSchema)(options);
      expect(result.left).toBe(10);
      expect(result.top).toBe(20);
    });

    it("should require all crop parameters", () => {
      expect(() => {
        Schema.decodeSync(CropOptionsSchema)({
          left: 10,
          top: 20,
          // Missing width and height
        });
      }).toThrow();
    });
  });

  describe("EncodeOptionsSchema", () => {
    it("should validate encode options", () => {
      const options = {
        format: "jpeg" as const,
        quality: 90,
      };

      const result = Schema.decodeSync(EncodeOptionsSchema)(options);
      expect(result.format).toBe("jpeg");
      expect(result.quality).toBe(90);
    });

    it("should accept partial options", () => {
      const options = { format: "png" as const };
      const result = Schema.decodeSync(EncodeOptionsSchema)(options);
      expect(result.format).toBe("png");
    });

    it("should validate quality range", () => {
      expect(() => {
        Schema.decodeSync(EncodeOptionsSchema)({
          format: "jpeg" as const,
          quality: 150,
        });
      }).toThrow();
    });
  });

  describe("NormalizeOptionsSchema", () => {
    it("should validate normalization options", () => {
      const options = {
        mean: [0.485, 0.456, 0.406],
        std: [0.229, 0.224, 0.225],
      };

      const result = Schema.decodeSync(NormalizeOptionsSchema)(options);
      expect(result.mean).toEqual([0.485, 0.456, 0.406]);
    });

    it("should handle partial normalization options", () => {
      const options = {
        mean: [0.5, 0.5, 0.5],
      };

      const result = Schema.decodeSync(NormalizeOptionsSchema)(options);
      expect(result.mean).toEqual([0.5, 0.5, 0.5]);
    });
  });

  describe("MLPreprocessConfigSchema", () => {
    it("should validate ML preprocessing config", () => {
      const config = {
        width: 224,
        height: 224,
        normalize: {
          mean: [0.485, 0.456, 0.406],
          std: [0.229, 0.224, 0.225],
        },
      };

      const result = Schema.decodeSync(MLPreprocessConfigSchema)(config);
      expect(result.width).toBe(224);
      expect(result.height).toBe(224);
    });

    it("should require width and height", () => {
      expect(() => {
        Schema.decodeSync(MLPreprocessConfigSchema)({
          normalize: {
            mean: [0.5, 0.5, 0.5],
          },
        });
      }).toThrow();
    });
  });
});
