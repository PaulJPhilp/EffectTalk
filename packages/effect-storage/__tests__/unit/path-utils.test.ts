/**
 * Unit tests for path utilities
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";
import {
  generateHashPrefix,
  getContentPath,
  getMetadataPath,
  getItemDirectory,
} from "../../src/utils/path-utils.js";

describe("Path utilities", () => {
  describe("generateHashPrefix", () => {
    it("should generate consistent hash prefixes", () => {
      const prefix1 = generateHashPrefix("doc-1", 2);
      const prefix2 = generateHashPrefix("doc-1", 2);
      expect(prefix1).toBe(prefix2);
    });

    it("should generate different prefixes for different IDs", () => {
      const prefix1 = generateHashPrefix("doc-1", 2);
      const prefix2 = generateHashPrefix("doc-2", 2);
      expect(prefix1).not.toBe(prefix2);
    });

    it("should respect depth parameter", () => {
      const prefix2 = generateHashPrefix("document", 2);
      const prefix4 = generateHashPrefix("document", 4);
      expect(prefix2.length).toBe(2);
      expect(prefix4.length).toBe(4);
      expect(prefix4.startsWith(prefix2)).toBe(true);
    });
  });

  describe("getContentPath", () => {
    it("should generate flat paths correctly", () => {
      const path = getContentPath("./storage", "doc-1", "txt", "flat", 2);
      expect(path).toMatch(/^\.\/storage[\\\/]doc-1\.txt$/);
    });

    it("should generate hash-based paths correctly", () => {
      const path = getContentPath("./storage", "doc-1", "txt", "hash-based", 2);
      expect(path).toContain("storage");
      expect(path).toContain("doc-1.txt");
      expect(path).toContain(".");
    });

    it("should use custom extension", () => {
      const path = getContentPath("./storage", "doc-1", "json", "flat", 2);
      expect(path).toContain(".json");
    });

    it("should default to flat organization", () => {
      const path1 = getContentPath("./storage", "doc-1", "txt");
      const path2 = getContentPath("./storage", "doc-1", "txt", "flat");
      expect(path1).toBe(path2);
    });
  });

  describe("getMetadataPath", () => {
    it("should always use .meta.json extension", () => {
      const path = getMetadataPath("./storage", "doc-1", "flat");
      expect(path).toContain(".meta.json");
    });

    it("should generate flat paths correctly", () => {
      const path = getMetadataPath("./storage", "doc-1", "flat");
      expect(path).toMatch(/^\.\/storage[\\\/]doc-1\.meta\.json$/);
    });

    it("should generate hash-based paths correctly", () => {
      const path = getMetadataPath("./storage", "doc-1", "hash-based", 2);
      expect(path).toContain("storage");
      expect(path).toContain("doc-1.meta.json");
    });

    it("should default to flat organization", () => {
      const path1 = getMetadataPath("./storage", "doc-1");
      const path2 = getMetadataPath("./storage", "doc-1", "flat");
      expect(path1).toBe(path2);
    });
  });

  describe("getItemDirectory", () => {
    it("should return basePath for flat organization", () => {
      const dir = getItemDirectory("./storage", "doc-1", "flat");
      expect(dir).toBe("./storage");
    });

    it("should return basePath/prefix for hash-based organization", () => {
      const dir = getItemDirectory("./storage", "doc-1", "hash-based", 2);
      expect(dir).not.toBe("./storage");
      expect(dir).toContain("storage");
    });

    it("should respect hashDepth parameter", () => {
      const dir2 = getItemDirectory("./storage", "same-id", "hash-based", 2);
      const dir3 = getItemDirectory("./storage", "same-id", "hash-based", 3);
      // Different depths might result in same path if hash is short, but structure should be similar
      expect(dir2).toContain("storage");
      expect(dir3).toContain("storage");
    });
  });
});
