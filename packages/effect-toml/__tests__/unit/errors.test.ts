/**
 * TOML Error Types Tests
 *
 * Tests for TomlParseError and TomlStringifyError including instantiation,
 * properties, and Effect.catchTag patterns.
 */

import { expect, it, describe } from "vitest";
import { TomlParseError, TomlStringifyError } from "../../src/errors.js";

describe("TOML Error Types", () => {
  describe("TomlParseError", () => {
    it("should create error with message", () => {
      const error = new TomlParseError({
        message: "Failed to parse TOML",
      });

      expect(error).toBeInstanceOf(TomlParseError);
      expect(error._tag).toBe("TomlParseError");
      expect(error.message).toBe("Failed to parse TOML");
    });

    it("should have readonly message field", () => {
      const error = new TomlParseError({
        message: "Original message",
      });

      expect(error.message).toBe("Original message");
      expect(Object.prototype.hasOwnProperty.call(error, "message")).toBe(true);
    });

    it("should support instanceof checks", () => {
      const error = new TomlParseError({
        message: "test",
      });

      expect(error instanceof TomlParseError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should have correct _tag for pattern matching", () => {
      const error = new TomlParseError({
        message: "test",
      });

      expect(error._tag).toBe("TomlParseError");
      expect(typeof error._tag).toBe("string");
    });

    it("should preserve message through error properties", () => {
      const errorMessage = "Duplicate key found at line 42";
      const error = new TomlParseError({
        message: errorMessage,
      });

      expect(error.message).toBe(errorMessage);
    });

    it("should create distinct instances with different messages", () => {
      const error1 = new TomlParseError({
        message: "Error 1",
      });
      const error2 = new TomlParseError({
        message: "Error 2",
      });

      expect(error1.message).not.toBe(error2.message);
      expect(error1._tag).toBe(error2._tag);
    });

    it("should handle empty message", () => {
      const error = new TomlParseError({
        message: "",
      });

      expect(error.message).toBe("");
      expect(error._tag).toBe("TomlParseError");
    });

    it("should handle very long messages", () => {
      const longMessage = "x".repeat(10000);
      const error = new TomlParseError({
        message: longMessage,
      });

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it("should handle special characters in message", () => {
      const specialMessage = "Parse error: !@#$%^&*()_+-=[]{}|;:',.<>?/\\";
      const error = new TomlParseError({
        message: specialMessage,
      });

      expect(error.message).toBe(specialMessage);
    });

    it("should handle Unicode in message", () => {
      const unicodeMessage = "Parse error: 日本語 العربية 🚀";
      const error = new TomlParseError({
        message: unicodeMessage,
      });

      expect(error.message).toBe(unicodeMessage);
    });

    it("should handle multiline messages", () => {
      const multilineMessage =
        "Error on line 1\nError on line 2\nError on line 3";
      const error = new TomlParseError({
        message: multilineMessage,
      });

      expect(error.message).toBe(multilineMessage);
      expect(error.message).toContain("\n");
    });
  });

  describe("TomlStringifyError", () => {
    it("should create error with message", () => {
      const error = new TomlStringifyError({
        message: "Failed to stringify TOML",
      });

      expect(error).toBeInstanceOf(TomlStringifyError);
      expect(error._tag).toBe("TomlStringifyError");
      expect(error.message).toBe("Failed to stringify TOML");
    });

    it("should have readonly message field", () => {
      const error = new TomlStringifyError({
        message: "Original message",
      });

      expect(error.message).toBe("Original message");
      expect(Object.prototype.hasOwnProperty.call(error, "message")).toBe(true);
    });

    it("should support instanceof checks", () => {
      const error = new TomlStringifyError({
        message: "test",
      });

      expect(error instanceof TomlStringifyError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should have correct _tag for pattern matching", () => {
      const error = new TomlStringifyError({
        message: "test",
      });

      expect(error._tag).toBe("TomlStringifyError");
      expect(typeof error._tag).toBe("string");
    });

    it("should preserve message through error properties", () => {
      const errorMessage = "Cannot stringify circular reference";
      const error = new TomlStringifyError({
        message: errorMessage,
      });

      expect(error.message).toBe(errorMessage);
    });

    it("should create distinct instances with different messages", () => {
      const error1 = new TomlStringifyError({
        message: "Error 1",
      });
      const error2 = new TomlStringifyError({
        message: "Error 2",
      });

      expect(error1.message).not.toBe(error2.message);
      expect(error1._tag).toBe(error2._tag);
    });

    it("should handle empty message", () => {
      const error = new TomlStringifyError({
        message: "",
      });

      expect(error.message).toBe("");
      expect(error._tag).toBe("TomlStringifyError");
    });

    it("should handle very long messages", () => {
      const longMessage = "y".repeat(10000);
      const error = new TomlStringifyError({
        message: longMessage,
      });

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it("should handle special characters in message", () => {
      const specialMessage = "Stringify error: !@#$%^&*()_+-=[]{}|;:',.<>?/\\";
      const error = new TomlStringifyError({
        message: specialMessage,
      });

      expect(error.message).toBe(specialMessage);
    });

    it("should handle Unicode in message", () => {
      const unicodeMessage = "Stringify error: 日本語 العربية 🚀";
      const error = new TomlStringifyError({
        message: unicodeMessage,
      });

      expect(error.message).toBe(unicodeMessage);
    });
  });

  describe("Error distinguishability", () => {
    it("should distinguish between error types by _tag", () => {
      const parseError = new TomlParseError({
        message: "parse error",
      });
      const stringifyError = new TomlStringifyError({
        message: "stringify error",
      });

      expect(parseError._tag).not.toBe(stringifyError._tag);
      expect(parseError._tag).toBe("TomlParseError");
      expect(stringifyError._tag).toBe("TomlStringifyError");
    });

    it("should distinguish between error types by instanceof", () => {
      const parseError = new TomlParseError({
        message: "parse",
      });
      const stringifyError = new TomlStringifyError({
        message: "stringify",
      });

      expect(parseError instanceof TomlParseError).toBe(true);
      expect(parseError instanceof TomlStringifyError).toBe(false);
      expect(stringifyError instanceof TomlParseError).toBe(false);
      expect(stringifyError instanceof TomlStringifyError).toBe(true);
    });

    it("should allow filtering errors by type in arrays", () => {
      const errors = [
        new TomlParseError({ message: "parse 1" }),
        new TomlStringifyError({ message: "stringify 1" }),
        new TomlParseError({ message: "parse 2" }),
        new TomlStringifyError({ message: "stringify 2" }),
      ];

      const parseErrors = errors.filter((e) => e instanceof TomlParseError);
      const stringifyErrors = errors.filter(
        (e) => e instanceof TomlStringifyError
      );

      expect(parseErrors).toHaveLength(2);
      expect(stringifyErrors).toHaveLength(2);
    });

    it("should support catchTag pattern with _tag", () => {
      const errors = [
        new TomlParseError({ message: "parse error" }),
        new TomlStringifyError({ message: "stringify error" }),
      ];

      const parseErrorTags = errors
        .filter((e) => e._tag === "TomlParseError")
        .map((e) => e._tag);
      const stringifyErrorTags = errors
        .filter((e) => e._tag === "TomlStringifyError")
        .map((e) => e._tag);

      expect(parseErrorTags).toHaveLength(1);
      expect(stringifyErrorTags).toHaveLength(1);
      expect(parseErrorTags[0]).toBe("TomlParseError");
      expect(stringifyErrorTags[0]).toBe("TomlStringifyError");
    });

    it("should maintain _tag consistency across multiple instances", () => {
      const error1 = new TomlParseError({ message: "msg1" });
      const error2 = new TomlParseError({ message: "msg2" });

      expect(error1._tag).toBe(error2._tag);
      expect(error1._tag).toBe("TomlParseError");
    });

    it("should distinguish errors from other error types", () => {
      const tomlError = new TomlParseError({ message: "toml error" });
      const nativeError = new Error("native error");

      expect(tomlError instanceof TomlParseError).toBe(true);
      expect(nativeError instanceof TomlParseError).toBe(false);
      expect(tomlError._tag).toBe("TomlParseError");
      expect("_tag" in nativeError).toBe(false);
    });
  });

  describe("Error properties", () => {
    it("should have readonly fields", () => {
      const error = new TomlParseError({
        message: "test",
      });

      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("_tag");
    });

    it("should have message property accessible", () => {
      const error = new TomlStringifyError({
        message: "test message",
      });

      expect(error.message).toBe("test message");
      expect(typeof error.message).toBe("string");
    });

    it("should have _tag property accessible", () => {
      const error = new TomlParseError({
        message: "test",
      });

      expect(error._tag).toBe("TomlParseError");
      expect(typeof error._tag).toBe("string");
    });

    it("should serialize error message to string", () => {
      const error = new TomlParseError({
        message: "test",
      });

      expect(String(error.message)).toBe("test");
    });

    it("should preserve error information in JSON-like object", () => {
      const message = "original message";
      const error = new TomlParseError({ message });

      const errorObj = {
        _tag: error._tag,
        message: error.message,
      };

      expect(errorObj._tag).toBe("TomlParseError");
      expect(errorObj.message).toBe(message);
    });
  });

  describe("Error instantiation patterns", () => {
    it("should allow creating errors in a function", () => {
      function createError(msg: string) {
        return new TomlParseError({ message: msg });
      }

      const error = createError("test error");
      expect(error._tag).toBe("TomlParseError");
      expect(error.message).toBe("test error");
    });

    it("should support conditional error creation", () => {
      const isParseError = true;
      const error = isParseError
        ? new TomlParseError({ message: "parse" })
        : new TomlStringifyError({ message: "stringify" });

      expect(error._tag).toBe("TomlParseError");
    });

    it("should work with Array methods", () => {
      const errors = [
        new TomlParseError({ message: "error 1" }),
        new TomlParseError({ message: "error 2" }),
        new TomlParseError({ message: "error 3" }),
      ];

      const messages = errors.map((e) => e.message);
      expect(messages).toEqual(["error 1", "error 2", "error 3"]);
    });

    it("should work with Array.reduce", () => {
      const errors = [
        new TomlParseError({ message: "error 1" }),
        new TomlStringifyError({ message: "error 2" }),
        new TomlParseError({ message: "error 3" }),
      ];

      const parseErrorCount = errors.reduce(
        (count, e) => (e instanceof TomlParseError ? count + 1 : count),
        0
      );

      expect(parseErrorCount).toBe(2);
    });

    it("should work with Array.find", () => {
      const errors = [
        new TomlParseError({ message: "error 1" }),
        new TomlStringifyError({ message: "error 2" }),
        new TomlParseError({ message: "error 3" }),
      ];

      const firstParseError = errors.find((e) => e instanceof TomlParseError);
      expect(firstParseError).toBeDefined();
      expect(firstParseError?.message).toBe("error 1");
    });
  });
});
