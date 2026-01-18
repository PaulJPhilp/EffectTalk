import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  InheritanceError,
  PromptNotFoundError,
  PromptRenderError,
  StorageError,
  TokenLimitExceededError,
  VariableValidationError,
  VersionConflictError,
} from "../../src/errors.js";

describe("Error Types", () => {
  describe("PromptNotFoundError", () => {
    it("should create error with proper fields", () => {
      const error = new PromptNotFoundError({
        message: "Prompt not found",
        promptId: "missing-prompt",
        searchPath: "/prompts/missing-prompt.liquid",
      });

      expect(error._tag).toBe("PromptNotFoundError");
      expect(error.message).toBe("Prompt not found");
      expect(error.promptId).toBe("missing-prompt");
      expect(error.searchPath).toBe("/prompts/missing-prompt.liquid");
    });

    it("should include cause when provided", () => {
      const cause = new Error("File not found");
      const error = new PromptNotFoundError({
        message: "Failed to load prompt",
        promptId: "test",
        cause,
      });

      expect(error.cause).toBe(cause);
    });
  });

  describe("VariableValidationError", () => {
    it("should create error with validation details", () => {
      const error = new VariableValidationError({
        message: "Invalid email format",
        variableName: "email",
        expected: "email",
        received: "not-an-email",
        schemaErrors: [{ message: "Invalid email" }],
      });

      expect(error._tag).toBe("VariableValidationError");
      expect(error.message).toBe("Invalid email format");
      expect(error.variableName).toBe("email");
      expect(error.expected).toBe("email");
      expect(error.received).toBe("not-an-email");
      expect(error.schemaErrors).toHaveLength(1);
    });

    it("should be catchable by tag", async () => {
      const effect = Effect.fail(
        new VariableValidationError({
          message: "Validation failed",
          variableName: "age",
          expected: "number",
          received: "string",
          schemaErrors: [],
        })
      ).pipe(
        Effect.catchTag("VariableValidationError", (err) => {
          return Effect.succeed({
            tag: err._tag,
            variable: err.variableName,
          });
        })
      );

      const result = await Effect.runPromise(effect);
      expect(result.tag).toBe("VariableValidationError");
      expect(result.variable).toBe("age");
    });
  });

  describe("VersionConflictError", () => {
    it("should create error with version details", () => {
      const error = new VersionConflictError({
        message: "Version conflict",
        promptId: "greeting",
        currentVersion: "1.0.0",
        attemptedVersion: "2.0.0",
      });

      expect(error._tag).toBe("VersionConflictError");
      expect(error.currentVersion).toBe("1.0.0");
      expect(error.attemptedVersion).toBe("2.0.0");
    });
  });

  describe("PromptRenderError", () => {
    it("should create error with render context", () => {
      const error = new PromptRenderError({
        message: "Render failed",
        promptId: "test",
        templateContent: "{{ invalid }}",
        variables: { name: "Alice" },
      });

      expect(error._tag).toBe("PromptRenderError");
      expect(error.promptId).toBe("test");
      expect(error.templateContent).toBe("{{ invalid }}");
      expect(error.variables).toEqual({ name: "Alice" });
    });

    it("should preserve debugging information", () => {
      const error = new PromptRenderError({
        message: "Template error",
        promptId: "complex",
        templateContent: "Complex template with many variables",
        variables: {
          user: "Alice",
          age: 30,
          email: "alice@example.com",
        },
      });

      expect(error.variables.user).toBe("Alice");
      expect(error.variables.age).toBe(30);
      expect(error.variables.email).toBe("alice@example.com");
    });
  });

  describe("InheritanceError", () => {
    it("should create error with template hierarchy", () => {
      const error = new InheritanceError({
        message: "Inheritance failed",
        childTemplateId: "child",
        parentTemplateId: "parent",
      });

      expect(error._tag).toBe("InheritanceError");
      expect(error.childTemplateId).toBe("child");
      expect(error.parentTemplateId).toBe("parent");
    });
  });

  describe("StorageError", () => {
    it("should create error with operation type", () => {
      const error = new StorageError({
        message: "Write failed",
        operation: "write",
        path: "/prompts/test.liquid",
      });

      expect(error._tag).toBe("StorageError");
      expect(error.operation).toBe("write");
      expect(error.path).toBe("/prompts/test.liquid");
    });

    it("should support different operations", () => {
      const operations: Array<"read" | "write" | "delete" | "list"> = [
        "read",
        "write",
        "delete",
        "list",
      ];

      operations.forEach((op) => {
        const error = new StorageError({
          message: `Operation ${op} failed`,
          operation: op,
          path: "/some/path",
        });
        expect(error.operation).toBe(op);
      });
    });
  });

  describe("TokenLimitExceededError", () => {
    it("should create error with token info", () => {
      const error = new TokenLimitExceededError({
        message: "Token limit exceeded",
        limit: 4000,
        actual: 5000,
        promptId: "long-prompt",
      });

      expect(error._tag).toBe("TokenLimitExceededError");
      expect(error.limit).toBe(4000);
      expect(error.actual).toBe(5000);
      expect(error.promptId).toBe("long-prompt");
    });

    it("should work without promptId", () => {
      const error = new TokenLimitExceededError({
        message: "Token limit exceeded",
        limit: 1000,
        actual: 1500,
      });

      expect(error.limit).toBe(1000);
      expect(error.actual).toBe(1500);
      expect(error.promptId).toBeUndefined();
    });
  });

  describe("Error Chaining with cause", () => {
    it("should chain errors with cause", () => {
      const originalError = new Error("Original error");
      const wrappedError = new StorageError({
        message: "Storage operation failed",
        operation: "read",
        path: "/test",
        cause: originalError,
      });

      expect(wrappedError.cause).toBe(originalError);
    });

    it("should support nested causes", () => {
      const root = new Error("Root cause");
      const level1 = new PromptNotFoundError({
        message: "Prompt not found",
        promptId: "test",
        cause: root,
      });
      const level2 = new PromptRenderError({
        message: "Render failed",
        promptId: "test",
        templateContent: "test",
        variables: {},
        cause: level1,
      });

      expect(level2.cause).toBe(level1);
      expect((level1 as any).cause).toBe(root);
    });
  });

  describe("Error Discrimination with catchTag", () => {
    it("should discriminate between different error types", async () => {
      const effect = Effect.gen(function* () {
        const error = yield* Effect.fail(
          new TokenLimitExceededError({
            message: "Too many tokens",
            limit: 1000,
            actual: 2000,
          })
        );
        return error;
      }).pipe(
        Effect.catchTag("TokenLimitExceededError", () =>
          Effect.succeed("caught token limit error")
        ),
        Effect.catchTag("PromptNotFoundError", () =>
          Effect.succeed("caught not found error")
        ),
        Effect.catchAll(() => Effect.succeed("caught unknown error"))
      );

      const result = await Effect.runPromise(effect);
      expect(result).toBe("caught token limit error");
    });

    it("should handle multiple error handlers", async () => {
      const testError = (error: any) =>
        Effect.fail(error).pipe(
          Effect.catchTag("PromptNotFoundError", () =>
            Effect.succeed("not found")
          ),
          Effect.catchTag("VariableValidationError", () =>
            Effect.succeed("validation failed")
          ),
          Effect.catchTag("TokenLimitExceededError", () =>
            Effect.succeed("token limit")
          ),
          Effect.catchAll(() => Effect.succeed("other"))
        );

      const notFound = await Effect.runPromise(
        testError(
          new PromptNotFoundError({
            message: "not found",
            promptId: "test",
          })
        )
      );
      expect(notFound).toBe("not found");

      const validation = await Effect.runPromise(
        testError(
          new VariableValidationError({
            message: "validation failed",
            variableName: "email",
            expected: "email",
            received: "invalid",
            schemaErrors: [],
          })
        )
      );
      expect(validation).toBe("validation failed");

      const tokenLimit = await Effect.runPromise(
        testError(
          new TokenLimitExceededError({
            message: "exceeded",
            limit: 100,
            actual: 200,
          })
        )
      );
      expect(tokenLimit).toBe("token limit");
    });
  });

  describe("Error Immutability", () => {
    it("should have readonly fields defined as properties", () => {
      const error = new PromptNotFoundError({
        message: "Not found",
        promptId: "test",
      });

      // Fields should be defined (readonly is compile-time only in JavaScript)
      expect(error.message).toBe("Not found");
      expect(error.promptId).toBe("test");
    });
  });

  describe("Error instanceof checks", () => {
    it("should pass instanceof checks", () => {
      const error = new PromptNotFoundError({
        message: "Not found",
        promptId: "test",
      });

      expect(error).toBeInstanceOf(PromptNotFoundError);
    });
  });
});

describe("Error Recovery Patterns", () => {
  it("should recover from PromptNotFoundError", async () => {
    const effect = Effect.fail(
      new PromptNotFoundError({
        message: "Prompt not found",
        promptId: "missing",
      })
    ).pipe(
      Effect.catchTag("PromptNotFoundError", () =>
        Effect.succeed({
          content: "Default prompt",
          metadata: { version: "default" },
        })
      )
    );

    const result = await Effect.runPromise(effect);
    expect(result.content).toBe("Default prompt");
  });

  it("should recover from TokenLimitExceededError", async () => {
    const effect = Effect.fail(
      new TokenLimitExceededError({
        message: "Too many tokens",
        limit: 100,
        actual: 200,
      })
    ).pipe(
      Effect.catchTag("TokenLimitExceededError", (err) =>
        Effect.succeed({
          truncated: true,
          limit: err.limit,
          actual: err.actual,
        })
      )
    );

    const result = await Effect.runPromise(effect);
    expect(result.truncated).toBe(true);
    expect(result.limit).toBe(100);
  });

  it("should provide fallback on validation error", async () => {
    const effect = Effect.fail(
      new VariableValidationError({
        message: "Invalid age",
        variableName: "age",
        expected: "number",
        received: "string",
        schemaErrors: [],
      })
    ).pipe(
      Effect.catchTag("VariableValidationError", (err) =>
        Effect.succeed({
          field: err.variableName,
          defaultValue: 0,
          message: `Using default for ${err.variableName}`,
        })
      )
    );

    const result = await Effect.runPromise(effect);
    expect(result.field).toBe("age");
    expect(result.defaultValue).toBe(0);
  });
});
