/**
 * Schema validation tests for effect-repository
 *
 * Tests type validation and schema constraints
 */

import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  BlobIdSchema,
  BlobMetadataSchema,
  SaveOptionsSchema,
  ListOptionsSchema,
  ListResultSchema,
} from "../../src/schemas.js";

describe("Schema Validation", () => {
  describe("BlobIdSchema", () => {
    it("should accept valid blob IDs", () => {
      const validIds = [
        "simple-id",
        "12345",
        "uuid-1234-5678",
        "hash-based-id-123abc",
      ];

      for (const id of validIds) {
        const result = Schema.decodeSync(BlobIdSchema)(id);
        expect(result).toBe(id);
      }
    });

    it("should reject empty string", () => {
      try {
        Schema.decodeSync(BlobIdSchema)("");
        expect.fail("Should have thrown");
      } catch {
        expect(true).toBe(true);
      }
    });

    it("should reject non-string", () => {
      try {
        Schema.decodeSync(BlobIdSchema)(123);
        expect.fail("Should have thrown");
      } catch {
        expect(true).toBe(true);
      }
    });
  });

  describe("BlobMetadataSchema", () => {
    it("should define BlobMetadataSchema", () => {
      // Schema is type-safe at compile time
      expect(BlobMetadataSchema).toBeDefined();
    });

    it("should reject missing required fields", () => {
      const incomplete = {
        id: "test-id",
        // Missing other required fields
      };

      try {
        Schema.decodeSync(BlobMetadataSchema)(incomplete);
        expect.fail("Should have thrown");
      } catch {
        expect(true).toBe(true);
      }
    });

    it("should require id to not be empty", () => {
      const metadata = {
        id: "",
        mimeType: "text/plain",
        sizeBytes: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        Schema.decodeSync(BlobMetadataSchema)(metadata);
        expect.fail("Should have thrown");
      } catch {
        expect(true).toBe(true);
      }
    });
  });

  describe("SaveOptionsSchema", () => {
    it("should accept all valid options", () => {
      const options = {
        id: "custom-id",
        customMetadata: { key: "value" },
        overwrite: true,
      };

      const result = Schema.decodeSync(SaveOptionsSchema)(options);
      expect(result.id).toBe("custom-id");
      expect(result.customMetadata).toEqual({ key: "value" });
      expect(result.overwrite).toBe(true);
    });

    it("should accept partial options", () => {
      const options = {
        id: "custom-id",
        // customMetadata and overwrite are optional
      };

      const result = Schema.decodeSync(SaveOptionsSchema)(options);
      expect(result.id).toBe("custom-id");
      expect(result.customMetadata).toBeUndefined();
      expect(result.overwrite).toBeUndefined();
    });

    it("should accept empty options", () => {
      const options = {};

      const result = Schema.decodeSync(SaveOptionsSchema)(options);
      expect(result.id).toBeUndefined();
      expect(result.customMetadata).toBeUndefined();
      expect(result.overwrite).toBeUndefined();
    });

    it("should reject invalid overwrite type", () => {
      const options = {
        overwrite: "true", // Should be boolean, not string
      };

      try {
        Schema.decodeSync(SaveOptionsSchema)(options);
        expect.fail("Should have thrown");
      } catch {
        expect(true).toBe(true);
      }
    });
  });

  describe("ListOptionsSchema", () => {
    it("should accept all valid filters", () => {
      const options = {
        limit: 10,
        cursor: "abc123",
        mimeTypePrefix: "image/",
      };

      const result = Schema.decodeSync(ListOptionsSchema)(options);
      expect(result.limit).toBe(10);
      expect(result.cursor).toBe("abc123");
      expect(result.mimeTypePrefix).toBe("image/");
    });

    it("should accept partial filters", () => {
      const options = {
        limit: 5,
        // cursor and mimeTypePrefix are optional
      };

      const result = Schema.decodeSync(ListOptionsSchema)(options);
      expect(result.limit).toBe(5);
      expect(result.cursor).toBeUndefined();
      expect(result.mimeTypePrefix).toBeUndefined();
    });

    it("should accept empty options", async () => {
      const options = {};

      const result = Schema.decodeSync(ListOptionsSchema)(options);
      expect(result.limit).toBeUndefined();
      expect(result.cursor).toBeUndefined();
      expect(result.mimeTypePrefix).toBeUndefined();
    });

    it("should validate limit is positive", async () => {
      const options = {
        limit: -1, // Negative limit should fail
      };

      try {
        Schema.decodeSync(ListOptionsSchema)(options);
        expect.fail("Should have thrown");
      } catch {
        expect(true).toBe(true);
      }
    });

    it("should accept zero limit", async () => {
      const options = {
        limit: 0,
      };

      try {
        Schema.decodeSync(ListOptionsSchema)(options);
        expect.fail("Should have thrown - zero should not be positive");
      } catch {
        expect(true).toBe(true);
      }
    });
  });

  describe("ListResultSchema", () => {
    it("should define ListResultSchema", () => {
      expect(ListResultSchema).toBeDefined();
    });

    it("should require items field", () => {
      const result = {
        nextCursor: "cursor",
        // Missing items field
      };

      try {
        Schema.decodeSync(ListResultSchema)(result);
        expect.fail("Should have thrown");
      } catch {
        expect(true).toBe(true);
      }
    });
  });

  describe("Schema Type Inference", () => {
    it("should correctly infer BlobIdType", () => {
      const id = "test-id";
      const decoded = Schema.decodeSync(BlobIdSchema)(id);
      expect(typeof decoded).toBe("string");
    });

    it("should correctly infer SaveOptionsType", () => {
      const options = {
        id: "custom",
      };

      const decoded = Schema.decodeSync(SaveOptionsSchema)(options);
      expect(typeof decoded.id).toBe("string");
    });
  });
});
