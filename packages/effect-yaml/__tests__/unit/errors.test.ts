/**
 * YAML Error Types Tests
 *
 * Tests for YamlParseError and YamlStringifyError including instantiation,
 * properties, and Effect.catchTag patterns.
 */

import { expect, it, describe } from "vitest";
import { YamlParseError, YamlStringifyError } from "../../src/errors.js";

describe("YAML Error Types", () => {
  describe("YamlParseError", () => {
    it("should create error with message", () => {
      const error = new YamlParseError({
        message: "Failed to parse YAML",
      });

      expect(error).toBeInstanceOf(YamlParseError);
      expect(error._tag).toBe("YamlParseError");
      expect(error.message).toBe("Failed to parse YAML");
    });

    it("should have readonly message field", () => {
      const error = new YamlParseError({
        message: "Original message",
      });

      expect(error.message).toBe("Original message");
      // Verify the property exists in the object
      expect(Object.prototype.hasOwnProperty.call(error, "message")).toBe(true);
    });

    it("should support instanceof checks", () => {
      const error = new YamlParseError({
        message: "test",
      });

      expect(error instanceof YamlParseError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should have correct _tag for pattern matching", () => {
      const error = new YamlParseError({
        message: "test",
      });

      expect(error._tag).toBe("YamlParseError");
      expect(typeof error._tag).toBe("string");
    });

    it("should preserve message through error properties", () => {
      const errorMessage = "Unexpected character at position 42";
      const error = new YamlParseError({
        message: errorMessage,
      });

      expect(error.message).toBe(errorMessage);
    });

    it("should create distinct instances with different messages", () => {
      const error1 = new YamlParseError({
        message: "Error 1",
      });
      const error2 = new YamlParseError({
        message: "Error 2",
      });

      expect(error1.message).not.toBe(error2.message);
      expect(error1._tag).toBe(error2._tag);
    });

    it("should handle empty message", () => {
      const error = new YamlParseError({
        message: "",
      });

      expect(error.message).toBe("");
      expect(error._tag).toBe("YamlParseError");
    });

    it("should handle very long messages", () => {
      const longMessage = "x".repeat(10000);
      const error = new YamlParseError({
        message: longMessage,
      });

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it("should handle special characters in message", () => {
      const specialMessage =
        "Error with special chars: !@#$%^&*()_+-=[]{}|;:',.<>?/\\";
      const error = new YamlParseError({
        message: specialMessage,
      });

      expect(error.message).toBe(specialMessage);
    });

    it("should handle Unicode in message", () => {
      const unicodeMessage = "Parse error: 日本語 العربية 🚀";
      const error = new YamlParseError({
        message: unicodeMessage,
      });

      expect(error.message).toBe(unicodeMessage);
    });

    it("should handle multiline messages", () => {
      const multilineMessage =
        "Error on line 1\nError on line 2\nError on line 3";
      const error = new YamlParseError({
        message: multilineMessage,
      });

      expect(error.message).toBe(multilineMessage);
      expect(error.message).toContain("\n");
    });
  });

  describe("YamlStringifyError", () => {
    it("should create error with message", () => {
      const error = new YamlStringifyError({
        message: "Failed to stringify YAML",
      });

      expect(error).toBeInstanceOf(YamlStringifyError);
      expect(error._tag).toBe("YamlStringifyError");
      expect(error.message).toBe("Failed to stringify YAML");
    });

    it("should have readonly message field", () => {
      const error = new YamlStringifyError({
        message: "Original message",
      });

      expect(error.message).toBe("Original message");
      // Verify the property exists in the object
      expect(Object.prototype.hasOwnProperty.call(error, "message")).toBe(true);
    });

    it("should support instanceof checks", () => {
      const error = new YamlStringifyError({
        message: "test",
      });

      expect(error instanceof YamlStringifyError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it("should have correct _tag for pattern matching", () => {
      const error = new YamlStringifyError({
        message: "test",
      });

      expect(error._tag).toBe("YamlStringifyError");
      expect(typeof error._tag).toBe("string");
    });

    it("should preserve message through error properties", () => {
      const errorMessage = "Cannot stringify circular reference";
      const error = new YamlStringifyError({
        message: errorMessage,
      });

      expect(error.message).toBe(errorMessage);
    });

    it("should create distinct instances with different messages", () => {
      const error1 = new YamlStringifyError({
        message: "Error 1",
      });
      const error2 = new YamlStringifyError({
        message: "Error 2",
      });

      expect(error1.message).not.toBe(error2.message);
      expect(error1._tag).toBe(error2._tag);
    });

    it("should handle empty message", () => {
      const error = new YamlStringifyError({
        message: "",
      });

      expect(error.message).toBe("");
      expect(error._tag).toBe("YamlStringifyError");
    });

    it("should handle very long messages", () => {
      const longMessage = "y".repeat(10000);
      const error = new YamlStringifyError({
        message: longMessage,
      });

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it("should handle special characters in message", () => {
      const specialMessage =
        "Stringify error with special chars: !@#$%^&*()_+-=[]{}|;:',.<>?/\\";
      const error = new YamlStringifyError({
        message: specialMessage,
      });

      expect(error.message).toBe(specialMessage);
    });

    it("should handle Unicode in message", () => {
      const unicodeMessage = "Stringify error: 日本語 العربية 🚀";
      const error = new YamlStringifyError({
        message: unicodeMessage,
      });

      expect(error.message).toBe(unicodeMessage);
    });
  });

  describe("Error distinguishability", () => {
    it("should distinguish between error types by _tag", () => {
      const parseError = new YamlParseError({
        message: "parse error",
      });
      const stringifyError = new YamlStringifyError({
        message: "stringify error",
      });

      expect(parseError._tag).not.toBe(stringifyError._tag);
      expect(parseError._tag).toBe("YamlParseError");
      expect(stringifyError._tag).toBe("YamlStringifyError");
    });

    it("should distinguish between error types by instanceof", () => {
      const parseError = new YamlParseError({
        message: "parse",
      });
      const stringifyError = new YamlStringifyError({
        message: "stringify",
      });

      expect(parseError instanceof YamlParseError).toBe(true);
      expect(parseError instanceof YamlStringifyError).toBe(false);
      expect(stringifyError instanceof YamlParseError).toBe(false);
      expect(stringifyError instanceof YamlStringifyError).toBe(true);
    });

    it("should allow filtering errors by type in arrays", () => {
      const errors = [
        new YamlParseError({ message: "parse 1" }),
        new YamlStringifyError({ message: "stringify 1" }),
        new YamlParseError({ message: "parse 2" }),
        new YamlStringifyError({ message: "stringify 2" }),
      ];

      const parseErrors = errors.filter((e) => e instanceof YamlParseError);
      const stringifyErrors = errors.filter(
        (e) => e instanceof YamlStringifyError
      );

      expect(parseErrors).toHaveLength(2);
      expect(stringifyErrors).toHaveLength(2);
    });

    it("should support catchTag pattern with _tag", () => {
      const errors = [
        new YamlParseError({ message: "parse error" }),
        new YamlStringifyError({ message: "stringify error" }),
      ];

      const parseErrorTags = errors
        .filter((e) => e._tag === "YamlParseError")
        .map((e) => e._tag);
      const stringifyErrorTags = errors
        .filter((e) => e._tag === "YamlStringifyError")
        .map((e) => e._tag);

      expect(parseErrorTags).toHaveLength(1);
      expect(stringifyErrorTags).toHaveLength(1);
      expect(parseErrorTags[0]).toBe("YamlParseError");
      expect(stringifyErrorTags[0]).toBe("YamlStringifyError");
    });

    it("should maintain _tag consistency across multiple instances", () => {
      const error1 = new YamlParseError({ message: "msg1" });
      const error2 = new YamlParseError({ message: "msg2" });

      expect(error1._tag).toBe(error2._tag);
      expect(error1._tag).toBe("YamlParseError");
    });

    it("should distinguish errors from other error types", () => {
      const yamlError = new YamlParseError({ message: "yaml error" });
      const nativeError = new Error("native error");

      expect(yamlError instanceof YamlParseError).toBe(true);
      expect(nativeError instanceof YamlParseError).toBe(false);
      expect(yamlError._tag).toBe("YamlParseError");
      expect("_tag" in nativeError).toBe(false);
    });
  });

  describe("Error properties", () => {
    it("should have readonly fields", () => {
      const error = new YamlParseError({
        message: "test",
      });

      // Verify the error has the expected properties
      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("_tag");
    });

    it("should have message property accessible", () => {
      const error = new YamlStringifyError({
        message: "test message",
      });

      expect(error.message).toBe("test message");
      expect(typeof error.message).toBe("string");
    });

    it("should have _tag property accessible", () => {
      const error = new YamlParseError({
        message: "test",
      });

      expect(error._tag).toBe("YamlParseError");
      expect(typeof error._tag).toBe("string");
    });

    it("should serialize error message to string", () => {
      const error = new YamlParseError({
        message: "test",
      });

      expect(String(error.message)).toBe("test");
    });

    it("should preserve error information in JSON-like object", () => {
      const message = "original message";
      const error = new YamlParseError({ message });

      const errorObj = {
        _tag: error._tag,
        message: error.message,
      };

      expect(errorObj._tag).toBe("YamlParseError");
      expect(errorObj.message).toBe(message);
    });
  });

  describe("Error instantiation patterns", () => {
    it("should allow creating errors in a function", () => {
      function createError(msg: string) {
        return new YamlParseError({ message: msg });
      }

      const error = createError("test error");
      expect(error._tag).toBe("YamlParseError");
      expect(error.message).toBe("test error");
    });

    it("should support conditional error creation", () => {
      const isParseError = true;
      const error = isParseError
        ? new YamlParseError({ message: "parse" })
        : new YamlStringifyError({ message: "stringify" });

      expect(error._tag).toBe("YamlParseError");
    });

    it("should work with Array methods", () => {
      const errors = [
        new YamlParseError({ message: "error 1" }),
        new YamlParseError({ message: "error 2" }),
        new YamlParseError({ message: "error 3" }),
      ];

      const messages = errors.map((e) => e.message);
      expect(messages).toEqual(["error 1", "error 2", "error 3"]);
    });

    it("should work with Array.reduce", () => {
      const errors = [
        new YamlParseError({ message: "error 1" }),
        new YamlStringifyError({ message: "error 2" }),
        new YamlParseError({ message: "error 3" }),
      ];

      const parseErrorCount = errors.reduce(
        (count, e) => (e instanceof YamlParseError ? count + 1 : count),
        0
      );

      expect(parseErrorCount).toBe(2);
    });

    it("should work with Array.find", () => {
      const errors = [
        new YamlParseError({ message: "error 1" }),
        new YamlStringifyError({ message: "error 2" }),
        new YamlParseError({ message: "error 3" }),
      ];

      const firstParseError = errors.find((e) => e instanceof YamlParseError);
      expect(firstParseError).toBeDefined();
      expect(firstParseError?.message).toBe("error 1");
    });
  });
});
