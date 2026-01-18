/**
 * Error handling tests for effect-image
 *
 * Tests all error types, error construction, and error recovery patterns.
 */

import { describe, expect, it } from "vitest";
import {
  ImageDecodeError,
  ImageEncodeError,
  UnsupportedFormatError,
  ImageProcessError,
  InvalidDimensionsError,
  InvalidInputError,
  FileNotFoundError,
  FileIOError,
  MemoryError,
  BackendError,
} from "../../src/index.js";

describe("Error Types", () => {
  describe("ImageDecodeError", () => {
    it("should create error with proper fields", () => {
      const error = new ImageDecodeError({
        message: "Failed to decode image",
        format: "jpeg",
        cause: new Error("Underlying issue"),
      });

      expect(error._tag).toBe("ImageDecodeError");
      expect(error.message).toBe("Failed to decode image");
      expect(error.format).toBe("jpeg");
      expect(error.cause).toBeDefined();
    });

    it("should be catchable by tag", () => {
      const error = new ImageDecodeError({
        message: "Decode failed",
        format: "png",
      });

      expect(error._tag).toBe("ImageDecodeError");
      expect(error.format).toBe("png");
    });

    it("should work without optional fields", () => {
      const error = new ImageDecodeError({
        message: "Decode failed",
      });

      expect(error.format).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });
  });

  describe("ImageEncodeError", () => {
    it("should create error with proper fields", () => {
      const error = new ImageEncodeError({
        message: "Failed to encode",
        targetFormat: "webp",
        cause: new Error("Encoding failed"),
      });

      expect(error._tag).toBe("ImageEncodeError");
      expect(error.targetFormat).toBe("webp");
    });

    it("should track target format", () => {
      const formats = ["jpeg", "png", "webp"] as const;
      for (const fmt of formats) {
        const error = new ImageEncodeError({
          message: `Encode to ${fmt} failed`,
          targetFormat: fmt,
        });
        expect(error.targetFormat).toBe(fmt);
      }
    });
  });

  describe("UnsupportedFormatError", () => {
    it("should create error with proper fields", () => {
      const error = new UnsupportedFormatError({
        message: "Format not supported",
        format: "bmp",
        supportedFormats: ["jpeg", "png", "webp"],
      });

      expect(error._tag).toBe("UnsupportedFormatError");
      expect(error.format).toBe("bmp");
      expect(error.supportedFormats).toContain("jpeg");
    });

    it("should list all supported formats", () => {
      const error = new UnsupportedFormatError({
        message: "Format not supported",
        format: "tiff",
        supportedFormats: ["jpeg", "png", "webp"],
      });

      expect(error.supportedFormats.length).toBe(3);
      expect(error.supportedFormats).toEqual(
        expect.arrayContaining(["jpeg", "png", "webp"])
      );
    });
  });

  describe("ImageProcessError", () => {
    it("should create error with operation", () => {
      const error = new ImageProcessError({
        message: "Resize operation failed",
        operation: "resize",
      });

      expect(error._tag).toBe("ImageProcessError");
      expect(error.operation).toBe("resize");
    });

    it("should track different operations", () => {
      const operations = ["resize", "crop", "rotate", "normalize"];
      for (const op of operations) {
        const error = new ImageProcessError({
          message: `${op} failed`,
          operation: op,
        });
        expect(error.operation).toBe(op);
      }
    });
  });

  describe("InvalidDimensionsError", () => {
    it("should create error with dimensions and constraint", () => {
      const error = new InvalidDimensionsError({
        message: "Dimensions too large",
        width: 20000,
        height: 20000,
        constraint: "Must be <= 16384",
      });

      expect(error._tag).toBe("InvalidDimensionsError");
      expect(error.width).toBe(20000);
      expect(error.height).toBe(20000);
      expect(error.constraint).toBe("Must be <= 16384");
    });

    it("should preserve exact dimensions", () => {
      const error = new InvalidDimensionsError({
        message: "Invalid size",
        width: 0,
        height: 100,
        constraint: "Width must be >= 1",
      });

      expect(error.width).toBe(0);
      expect(error.height).toBe(100);
    });
  });

  describe("InvalidInputError", () => {
    it("should create error with parameter info", () => {
      const error = new InvalidInputError({
        message: "Invalid input",
        parameter: "quality",
        receivedValue: 150,
      });

      expect(error._tag).toBe("InvalidInputError");
      expect(error.parameter).toBe("quality");
      expect(error.receivedValue).toBe(150);
    });

    it("should handle various received values", () => {
      const values = [null, undefined, {}, [], "invalid"];
      for (const val of values) {
        const error = new InvalidInputError({
          message: "Invalid",
          parameter: "test",
          receivedValue: val,
        });
        expect(error.receivedValue).toBe(val);
      }
    });
  });

  describe("FileNotFoundError", () => {
    it("should create error with path", () => {
      const error = new FileNotFoundError({
        message: "File not found",
        path: "/images/missing.jpg",
      });

      expect(error._tag).toBe("FileNotFoundError");
      expect(error.path).toBe("/images/missing.jpg");
    });

    it("should preserve exact path", () => {
      const paths = [
        "/home/user/image.jpg",
        "relative/path/image.png",
        "./local/file.webp",
      ];
      for (const path of paths) {
        const error = new FileNotFoundError({
          message: "Not found",
          path,
        });
        expect(error.path).toBe(path);
      }
    });
  });

  describe("FileIOError", () => {
    it("should track read operations", () => {
      const error = new FileIOError({
        message: "Failed to read",
        path: "/images/file.jpg",
        operation: "read",
      });

      expect(error._tag).toBe("FileIOError");
      expect(error.operation).toBe("read");
    });

    it("should track write operations", () => {
      const error = new FileIOError({
        message: "Failed to write",
        path: "/output/result.jpg",
        operation: "write",
      });

      expect(error.operation).toBe("write");
    });
  });

  describe("MemoryError", () => {
    it("should create error with reason", () => {
      const error = new MemoryError({
        message: "Image too large",
        reason: "Decoded size exceeds available memory",
      });

      expect(error._tag).toBe("MemoryError");
      expect(error.reason).toBe("Decoded size exceeds available memory");
    });

    it("should track different reasons", () => {
      const reasons = [
        "Buffer allocation failed",
        "Tensor conversion exceeded memory",
        "Batch processing out of memory",
      ];
      for (const reason of reasons) {
        const error = new MemoryError({
          message: "Memory error",
          reason,
        });
        expect(error.reason).toBe(reason);
      }
    });
  });

  describe("BackendError", () => {
    it("should create error with backend name", () => {
      const error = new BackendError({
        message: "Sharp operation failed",
        backend: "sharp",
        cause: new Error("Sharp error"),
      });

      expect(error._tag).toBe("BackendError");
      expect(error.backend).toBe("sharp");
    });

    it("should track backend information", () => {
      const error = new BackendError({
        message: "Backend failed",
        backend: "sharp",
      });

      expect(error.backend).toBe("sharp");
    });
  });

  describe("Error Union Types", () => {
    it("should identify retryable errors", () => {
      const retryable = [
        new ImageDecodeError({ message: "Decode failed" }),
        new ImageEncodeError({
          message: "Encode failed",
          targetFormat: "jpeg",
        }),
        new ImageProcessError({
          message: "Process failed",
          operation: "resize",
        }),
        new FileIOError({
          message: "IO failed",
          path: "/test",
          operation: "read",
        }),
        new BackendError({ message: "Backend failed", backend: "sharp" }),
      ];

      expect(retryable.length).toBe(5);
    });

    it("should identify non-retryable errors", () => {
      const nonRetryable = [
        new UnsupportedFormatError({
          message: "Not supported",
          format: "bmp",
          supportedFormats: ["jpeg", "png", "webp"],
        }),
        new InvalidDimensionsError({
          message: "Bad dimensions",
          width: 0,
          height: 100,
          constraint: "Must be > 0",
        }),
        new InvalidInputError({
          message: "Bad input",
          parameter: "quality",
          receivedValue: 150,
        }),
        new MemoryError({
          message: "Memory exceeded",
          reason: "Image too large",
        }),
      ];

      expect(nonRetryable.length).toBe(4);
    });
  });
});
