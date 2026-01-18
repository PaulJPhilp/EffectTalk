import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { lit } from "../src/core/ast.js";
import {
  DialectIncompatibilityError,
  EmitError,
  OptimizationError,
  RegexCompilationError,
  TestExecutionError,
  ValidationError,
} from "../src/errors/index.js";

describe("Error Types", () => {
  describe("RegexCompilationError", () => {
    it("should create error with pattern, dialect, and cause", () => {
      const error = new RegexCompilationError({
        pattern: "[a-z+",
        dialect: "js",
        cause: new Error("Invalid pattern"),
      });

      expect(error._tag).toBe("RegexCompilationError");
      expect(error.pattern).toBe("[a-z+");
      expect(error.dialect).toBe("js");
      expect(error.cause).toBeInstanceOf(Error);
    });

    it("should be catchable with Effect.catchTags", async () => {
      const program = Effect.gen(function* () {
        yield* Effect.fail(
          new RegexCompilationError({
            pattern: "invalid",
            dialect: "js",
            cause: new Error("test"),
          })
        );
        return "success";
      }).pipe(
        Effect.catchTags({
          RegexCompilationError: (error) =>
            Effect.succeed(`Caught: ${error.pattern}`),
        })
      );

      const result = await Effect.runPromise(program);
      expect(result).toBe("Caught: invalid");
    });
  });

  describe("OptimizationError", () => {
    it("should create error with AST, phase, and reason", () => {
      const ast = lit("test");
      const error = new OptimizationError({
        ast,
        phase: "constant-folding",
        reason: "Invalid AST structure",
      });

      expect(error._tag).toBe("OptimizationError");
      expect(error.ast).toBe(ast);
      expect(error.phase).toBe("constant-folding");
      expect(error.reason).toBe("Invalid AST structure");
    });

    it("should be catchable with Effect.catchTags", async () => {
      const program = Effect.gen(function* () {
        yield* Effect.fail(
          new OptimizationError({
            ast: lit("test"),
            phase: "test-phase",
            reason: "test reason",
          })
        );
        return "success";
      }).pipe(
        Effect.catchTags({
          OptimizationError: (error) => Effect.succeed(`Phase: ${error.phase}`),
        })
      );

      const result = await Effect.runPromise(program);
      expect(result).toBe("Phase: test-phase");
    });
  });

  describe("TestExecutionError", () => {
    it("should create error with pattern and reason", () => {
      const error = new TestExecutionError({
        pattern: "\\d+",
        reason: "Timeout exceeded",
      });

      expect(error._tag).toBe("TestExecutionError");
      expect(error.pattern).toBe("\\d+");
      expect(error.reason).toBe("Timeout exceeded");
      expect(error.timedOut).toBeUndefined();
      expect(error.testCase).toBeUndefined();
    });

    it("should create error with test case and timeout flag", () => {
      const testCase = { input: "test", shouldMatch: true };
      const error = new TestExecutionError({
        pattern: ".*",
        testCase,
        reason: "Catastrophic backtracking",
        timedOut: true,
      });

      expect(error.testCase).toEqual(testCase);
      expect(error.timedOut).toBe(true);
    });

    it("should be catchable with Effect.catchTags", async () => {
      const program = Effect.gen(function* () {
        yield* Effect.fail(
          new TestExecutionError({
            pattern: "test",
            reason: "test error",
          })
        );
        return "success";
      }).pipe(
        Effect.catchTags({
          TestExecutionError: (error) =>
            Effect.succeed(`Error: ${error.reason}`),
        })
      );

      const result = await Effect.runPromise(program);
      expect(result).toBe("Error: test error");
    });
  });

  describe("ValidationError", () => {
    it("should create error with pattern, issues, and dialect", () => {
      const issues = [
        {
          code: "INVALID_PATTERN" as const,
          severity: "error" as const,
          message: "Invalid regex syntax",
        },
      ];

      const error = new ValidationError({
        pattern: "[a-z+",
        issues,
        dialect: "js",
      });

      expect(error._tag).toBe("ValidationError");
      expect(error.pattern).toBe("[a-z+");
      expect(error.issues).toEqual(issues);
      expect(error.dialect).toBe("js");
    });

    it("should be catchable with Effect.catchTags", async () => {
      const program = Effect.gen(function* () {
        yield* Effect.fail(
          new ValidationError({
            pattern: "invalid",
            issues: [],
            dialect: "js",
          })
        );
        return "success";
      }).pipe(
        Effect.catchTags({
          ValidationError: (error) =>
            Effect.succeed(`Validated: ${error.pattern}`),
        })
      );

      const result = await Effect.runPromise(program);
      expect(result).toBe("Validated: invalid");
    });
  });

  describe("DialectIncompatibilityError", () => {
    it("should create error with dialect, feature, and pattern", () => {
      const error = new DialectIncompatibilityError({
        dialect: "re2",
        feature: "lookahead",
        pattern: "(?=test)",
      });

      expect(error._tag).toBe("DialectIncompatibilityError");
      expect(error.dialect).toBe("re2");
      expect(error.feature).toBe("lookahead");
      expect(error.pattern).toBe("(?=test)");
    });

    it("should be catchable with Effect.catchTags", async () => {
      const program = Effect.gen(function* () {
        yield* Effect.fail(
          new DialectIncompatibilityError({
            dialect: "re2",
            feature: "backreference",
            pattern: "\\1",
          })
        );
        return "success";
      }).pipe(
        Effect.catchTags({
          DialectIncompatibilityError: (error) =>
            Effect.succeed(`Incompatible: ${error.feature}`),
        })
      );

      const result = await Effect.runPromise(program);
      expect(result).toBe("Incompatible: backreference");
    });
  });

  describe("EmitError", () => {
    it("should create error with builder, dialect, and cause", () => {
      const builder = { type: "test" };
      const cause = new Error("Emission failed");
      const error = new EmitError({
        builder,
        dialect: "js",
        cause,
      });

      expect(error._tag).toBe("EmitError");
      expect(error.builder).toBe(builder);
      expect(error.dialect).toBe("js");
      expect(error.cause).toBe(cause);
    });

    it("should be catchable with Effect.catchTags", async () => {
      const program = Effect.gen(function* () {
        yield* Effect.fail(
          new EmitError({
            builder: {},
            dialect: "re2",
            cause: new Error("test"),
          })
        );
        return "success";
      }).pipe(
        Effect.catchTags({
          EmitError: (error) => Effect.succeed(`Emit: ${error.dialect}`),
        })
      );

      const result = await Effect.runPromise(program);
      expect(result).toBe("Emit: re2");
    });
  });

  describe("Multiple error types handling", () => {
    it("should handle multiple error types with catchTags", async () => {
      const program = Effect.gen(function* () {
        const random = Math.random();
        if (random < 0.5) {
          yield* Effect.fail(
            new ValidationError({
              pattern: "test",
              issues: [],
              dialect: "js",
            })
          );
        } else {
          yield* Effect.fail(
            new TestExecutionError({
              pattern: "test",
              reason: "timeout",
            })
          );
        }
        return "success";
      }).pipe(
        Effect.catchTags({
          ValidationError: () => Effect.succeed("handled-validation"),
          TestExecutionError: () => Effect.succeed("handled-test"),
        })
      );

      const result = await Effect.runPromise(program);
      expect(["handled-validation", "handled-test"]).toContain(result);
    });
  });

  describe("Error serialization", () => {
    it("should serialize RegexCompilationError to JSON", () => {
      const error = new RegexCompilationError({
        pattern: "[a-z",
        dialect: "js",
        cause: new Error("test"),
      });

      const serialized = JSON.stringify(error);
      expect(serialized).toContain("RegexCompilationError");
      expect(serialized).toContain("[a-z");
      expect(serialized).toContain("js");
    });

    it("should serialize ValidationError with issues", () => {
      const error = new ValidationError({
        pattern: "test",
        issues: [
          {
            code: "INVALID_PATTERN" as const,
            severity: "error" as const,
            message: "Bad pattern",
          },
        ],
        dialect: "re2",
      });

      const serialized = JSON.stringify(error);
      expect(serialized).toContain("ValidationError");
      expect(serialized).toContain("INVALID_PATTERN");
      expect(serialized).toContain("re2");
    });
  });
});
