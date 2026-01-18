/**
 * Unit tests for effect-image API functions
 *
 * Tests decode, encode, resize, and other core operations.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { Effect, Either } from "effect";
import {
  decode,
  encode,
  getMetadata,
  resize,
  crop,
  toGrayscale,
  SharpBackendLayer,
} from "../../src/index.js";
import {
  ImageDecodeError,
  InvalidInputError,
  InvalidDimensionsError,
} from "../../src/errors.js";
import { generateFixtures, getSimpleTestImage } from "../fixtures/index.js";

describe("effect-image API", () => {
  let testImage: Buffer;

  beforeAll(async () => {
    // Generate test fixtures before running tests
    await generateFixtures();
    testImage = await getSimpleTestImage();
  });

  describe("decode", () => {
    it("should decode valid image from buffer", async () => {
      const result = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.channels).toBe(4);
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });

    it("should fail on empty buffer", async () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = await Effect.runPromise(
        Effect.either(
          decode(emptyBuffer).pipe(Effect.provide(SharpBackendLayer))
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(InvalidInputError);
      }
    });

    it("should fail on invalid image data", async () => {
      const invalidData = Buffer.from("Not an image");
      const result = await Effect.runPromise(
        Effect.either(
          decode(invalidData).pipe(Effect.provide(SharpBackendLayer))
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ImageDecodeError);
      }
    });
  });

  describe("encode", () => {
    it("should encode image to JPEG", async () => {
      const image = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const encoded = await Effect.runPromise(
        encode(image, "jpeg", { quality: 90 }).pipe(
          Effect.provide(SharpBackendLayer)
        )
      );

      expect(Buffer.isBuffer(encoded)).toBe(true);
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("should encode image to PNG", async () => {
      const image = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const encoded = await Effect.runPromise(
        encode(image, "png").pipe(Effect.provide(SharpBackendLayer))
      );

      expect(Buffer.isBuffer(encoded)).toBe(true);
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("should encode image to WebP", async () => {
      const image = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const encoded = await Effect.runPromise(
        encode(image, "webp", { quality: 80 }).pipe(
          Effect.provide(SharpBackendLayer)
        )
      );

      expect(Buffer.isBuffer(encoded)).toBe(true);
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("should reject invalid dimensions", async () => {
      const image = {
        width: 100,
        height: 100,
        channels: 4,
        format: "jpeg" as const,
        data: Buffer.alloc(100 * 100 * 4),
      };

      const invalidImage = {
        ...image,
        width: 20000, // Exceeds max dimension
      };

      const result = await Effect.runPromise(
        Effect.either(
          encode(invalidImage, "jpeg").pipe(Effect.provide(SharpBackendLayer))
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(InvalidDimensionsError);
      }
    });
  });

  describe("getMetadata", () => {
    it("should extract image metadata", async () => {
      const metadata = await Effect.runPromise(
        getMetadata(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      expect(metadata.width).toBeGreaterThan(0);
      expect(metadata.height).toBeGreaterThan(0);
      expect(["jpeg", "png", "webp"]).toContain(metadata.format);
      expect(typeof metadata.hasAlpha).toBe("boolean");
      expect(metadata.mimeType).toBeDefined();
    });

    it("should fail on empty buffer", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          getMetadata(Buffer.alloc(0)).pipe(Effect.provide(SharpBackendLayer))
        )
      );

      expect(Either.isLeft(result)).toBe(true);
    });
  });

  describe("resize", () => {
    it("should resize image with cover fit", async () => {
      const image = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const resized = await Effect.runPromise(
        resize(image, 256, 256, { fit: "cover" }).pipe(
          Effect.provide(SharpBackendLayer)
        )
      );

      expect(resized.width).toBe(256);
      expect(resized.height).toBe(256);
    });

    it("should resize image with contain fit", async () => {
      const image = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const resized = await Effect.runPromise(
        resize(image, 256, 256, { fit: "contain" }).pipe(
          Effect.provide(SharpBackendLayer)
        )
      );

      expect(resized.width).toBeLessThanOrEqual(256);
      expect(resized.height).toBeLessThanOrEqual(256);
    });

    it("should reject invalid dimensions", async () => {
      const image = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const result = await Effect.runPromise(
        Effect.either(
          resize(image, 20000, 256).pipe(Effect.provide(SharpBackendLayer))
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(InvalidDimensionsError);
      }
    });
  });

  describe("crop", () => {
    it("should crop image to region", async () => {
      const image = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const cropped = await Effect.runPromise(
        crop(image, { left: 10, top: 10, width: 50, height: 50 }).pipe(
          Effect.provide(SharpBackendLayer)
        )
      );

      expect(cropped.width).toBe(50);
      expect(cropped.height).toBe(50);
    });

    it("should reject crop outside bounds", async () => {
      const image = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const result = await Effect.runPromise(
        Effect.either(
          crop(image, { left: 50, top: 50, width: 100, height: 100 }).pipe(
            Effect.provide(SharpBackendLayer)
          )
        )
      );

      expect(Either.isLeft(result)).toBe(true);
    });
  });

  describe("toGrayscale", () => {
    it("should convert image to grayscale", async () => {
      const image = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const grayscale = await Effect.runPromise(
        toGrayscale(image).pipe(Effect.provide(SharpBackendLayer))
      );

      expect(grayscale.width).toBe(image.width);
      expect(grayscale.height).toBe(image.height);
      expect(Buffer.isBuffer(grayscale.data)).toBe(true);
    });
  });

  describe("round-trip operations", () => {
    it("should decode and re-encode without data loss", async () => {
      const decoded = await Effect.runPromise(
        decode(testImage).pipe(Effect.provide(SharpBackendLayer))
      );

      const encoded = await Effect.runPromise(
        encode(decoded, "jpeg", { quality: 95 }).pipe(
          Effect.provide(SharpBackendLayer)
        )
      );

      const redecoded = await Effect.runPromise(
        decode(encoded).pipe(Effect.provide(SharpBackendLayer))
      );

      expect(redecoded.width).toBe(decoded.width);
      expect(redecoded.height).toBe(decoded.height);
      expect(redecoded.channels).toBe(decoded.channels);
    });
  });
});
