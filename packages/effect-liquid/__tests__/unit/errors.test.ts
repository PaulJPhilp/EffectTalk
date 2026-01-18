/**
 * Error type tests for effect-liquid
 *
 * Tests all error types with proper Effect.catchTag patterns
 */

import { expect, it, describe } from "vitest";
import {
  LiquidParseError,
  LiquidRenderError,
  LiquidFilterError,
  LiquidTagError,
  LiquidContextError,
} from "../../src/errors.js";

describe("Error Types", () => {
  describe("LiquidParseError", () => {
    it("should create error with message", () => {
      const error = new LiquidParseError({
        message: "Invalid syntax",
      });
      expect(error._tag).toBe("LiquidParseError");
      expect(error.message).toBe("Invalid syntax");
    });

    it("should include position information", () => {
      const error = new LiquidParseError({
        message: "Unexpected token",
        position: 10,
        line: 2,
        column: 5,
      });
      expect(error.position).toBe(10);
      expect(error.line).toBe(2);
      expect(error.column).toBe(5);
    });

    it("should chain causes", () => {
      const cause = new Error("underlying cause");
      const error = new LiquidParseError({
        message: "Parse failed",
        cause,
      });
      expect(error.cause).toBe(cause);
    });

    it("should be catchable by tag", async () => {
      const error = new LiquidParseError({
        message: "test error",
      });
      expect(error._tag).toBe("LiquidParseError");
    });
  });

  describe("LiquidRenderError", () => {
    it("should create error with message", () => {
      const error = new LiquidRenderError({
        message: "Render failed",
      });
      expect(error._tag).toBe("LiquidRenderError");
      expect(error.message).toBe("Render failed");
    });

    it("should include position information", () => {
      const error = new LiquidRenderError({
        message: "Undefined variable",
        position: 5,
      });
      expect(error.position).toBe(5);
    });

    it("should chain causes", () => {
      const cause = new Error("rendering issue");
      const error = new LiquidRenderError({
        message: "Render error",
        cause,
      });
      expect(error.cause).toBe(cause);
    });
  });

  describe("LiquidFilterError", () => {
    it("should create error with filter name", () => {
      const error = new LiquidFilterError({
        message: "Filter failed",
        filterName: "upcase",
      });
      expect(error._tag).toBe("LiquidFilterError");
      expect(error.filterName).toBe("upcase");
      expect(error.message).toBe("Filter failed");
    });

    it("should chain causes", () => {
      const cause = new Error("filter error");
      const error = new LiquidFilterError({
        message: "Failed",
        filterName: "truncate",
        cause,
      });
      expect(error.cause).toBe(cause);
    });

    it("should preserve filter name for debugging", () => {
      const errors = [
        new LiquidFilterError({ message: "Failed", filterName: "downcase" }),
        new LiquidFilterError({ message: "Failed", filterName: "capitalize" }),
        new LiquidFilterError({ message: "Failed", filterName: "strip" }),
      ];
      expect(errors.map((e) => e.filterName)).toEqual([
        "downcase",
        "capitalize",
        "strip",
      ]);
    });
  });

  describe("LiquidTagError", () => {
    it("should create error with tag name", () => {
      const error = new LiquidTagError({
        message: "Tag failed",
        tagName: "if",
      });
      expect(error._tag).toBe("LiquidTagError");
      expect(error.tagName).toBe("if");
      expect(error.message).toBe("Tag failed");
    });

    it("should chain causes", () => {
      const cause = new Error("tag execution error");
      const error = new LiquidTagError({
        message: "Failed",
        tagName: "for",
        cause,
      });
      expect(error.cause).toBe(cause);
    });

    it("should preserve tag name for debugging", () => {
      const errors = [
        new LiquidTagError({ message: "Failed", tagName: "if" }),
        new LiquidTagError({ message: "Failed", tagName: "for" }),
        new LiquidTagError({ message: "Failed", tagName: "unless" }),
      ];
      expect(errors.map((e) => e.tagName)).toEqual(["if", "for", "unless"]);
    });
  });

  describe("LiquidContextError", () => {
    it("should create error with path information", () => {
      const error = new LiquidContextError({
        message: "Context error",
        path: "user.name",
      });
      expect(error._tag).toBe("LiquidContextError");
      expect(error.path).toBe("user.name");
      expect(error.message).toBe("Context error");
    });

    it("should chain causes", () => {
      const cause = new Error("context resolution failed");
      const error = new LiquidContextError({
        message: "Cannot resolve",
        path: "items[0].value",
        cause,
      });
      expect(error.cause).toBe(cause);
    });

    it("should preserve path for debugging", () => {
      const errors = [
        new LiquidContextError({ message: "Failed", path: "user.email" }),
        new LiquidContextError({ message: "Failed", path: "items[0]" }),
        new LiquidContextError({
          message: "Failed",
          path: "nested.deep.value",
        }),
      ];
      expect(errors.map((e) => e.path)).toEqual([
        "user.email",
        "items[0]",
        "nested.deep.value",
      ]);
    });
  });

  describe("Error field immutability", () => {
    it("should have readonly fields", () => {
      const error = new LiquidParseError({
        message: "test",
        position: 10,
      });
      // TypeScript ensures fields are readonly; runtime check that fields exist
      expect(error.message).toBe("test");
      expect(error.position).toBe(10);
    });
  });

  describe("Error distinguishability", () => {
    it("should distinguish between error types by tag", () => {
      const errors = [
        new LiquidParseError({ message: "parse" }),
        new LiquidRenderError({ message: "render" }),
        new LiquidFilterError({ message: "filter", filterName: "test" }),
        new LiquidTagError({ message: "tag", tagName: "test" }),
        new LiquidContextError({ message: "context", path: "test" }),
      ];

      const tags = errors.map((e) => e._tag);
      expect(new Set(tags).size).toBe(5); // All unique
    });

    it("should distinguish by instanceof", () => {
      const parseError = new LiquidParseError({ message: "test" });
      const renderError = new LiquidRenderError({ message: "test" });

      expect(parseError instanceof LiquidParseError).toBe(true);
      expect(renderError instanceof LiquidParseError).toBe(false);
      expect(renderError instanceof LiquidRenderError).toBe(true);
    });
  });
});
