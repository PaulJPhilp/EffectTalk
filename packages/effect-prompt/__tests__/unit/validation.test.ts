import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  CommonVariableSchemas,
  PromptMetadataSchema,
  PromptTemplateSchema,
  ConversationSchema,
} from "../../src/schemas.js";
import { ValidationService } from "../../src/services/validation-service.js";

describe("ValidationService", () => {
  describe("Basic type validation", () => {
    it("should validate valid string", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.validate("hello", Schema.String);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should reject invalid string", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.validate(123, Schema.String);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should validate valid number", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.validate(42, Schema.Number);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should reject invalid number", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.validate("not a number", Schema.Number);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });
  });

  describe("Struct validation", () => {
    it("should validate valid struct", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.validate(
          { name: "Alice", age: 30 },
          schema
        );

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should reject struct with missing fields", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.validate({ name: "Alice" }, schema);

        expect(result.valid).toBe(false);
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should reject struct with wrong types", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.validate(
          { name: "Alice", age: "thirty" },
          schema
        );

        expect(result.valid).toBe(false);
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should handle optional fields", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
        email: Schema.optional(Schema.String),
      });

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const withEmail = yield* service.validate(
          { name: "Alice", email: "alice@example.com" },
          schema
        );
        expect(withEmail.valid).toBe(true);

        const withoutEmail = yield* service.validate({ name: "Alice" }, schema);
        expect(withoutEmail.valid).toBe(true);
        return withoutEmail;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });
  });

  describe("CommonVariableSchemas", () => {
    it("should validate text schema", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.validate(
          "hello",
          CommonVariableSchemas.text
        );

        expect(result.valid).toBe(true);
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should validate number schema", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const numberSchema = CommonVariableSchemas.number(0, 100);

        const valid = yield* service.validate(50, numberSchema);
        expect(valid.valid).toBe(true);

        const tooHigh = yield* service.validate(150, numberSchema);
        expect(tooHigh.valid).toBe(false);
        return tooHigh;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should validate email schema", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const valid = yield* service.validate(
          "user@example.com",
          CommonVariableSchemas.email
        );
        expect(valid.valid).toBe(true);

        const invalid = yield* service.validate(
          "not-an-email",
          CommonVariableSchemas.email
        );
        expect(invalid.valid).toBe(false);
        return invalid;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should validate URL schema", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const valid = yield* service.validate(
          "https://example.com",
          CommonVariableSchemas.url
        );
        expect(valid.valid).toBe(true);

        const invalid = yield* service.validate(
          "not-a-url",
          CommonVariableSchemas.url
        );
        expect(invalid.valid).toBe(false);
        return invalid;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should validate string array schema", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const valid = yield* service.validate(
          ["apple", "banana", "cherry"],
          CommonVariableSchemas.stringArray
        );
        expect(valid.valid).toBe(true);

        const invalid = yield* service.validate(
          ["apple", 123, "cherry"],
          CommonVariableSchemas.stringArray
        );
        expect(invalid.valid).toBe(false);
        return invalid;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should validate json schema", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const valid = yield* service.validate(
          { key: "value", nested: { data: 123 } },
          CommonVariableSchemas.json
        );
        expect(valid.valid).toBe(true);
        return valid;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });
  });

  describe("Array validation", () => {
    it("should validate array of strings", async () => {
      const schema = Schema.Array(Schema.String);

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const valid = yield* service.validate(["a", "b", "c"], schema);
        expect(valid.valid).toBe(true);

        const invalid = yield* service.validate(["a", 1, "c"], schema);
        expect(invalid.valid).toBe(false);
        return invalid;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });

    it("should validate empty arrays", async () => {
      const schema = Schema.Array(Schema.String);

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const result = yield* service.validate([], schema);
        expect(result.valid).toBe(true);
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });
  });

  describe("Union type validation", () => {
    it("should validate union types", async () => {
      const schema = Schema.Union(Schema.String, Schema.Number);

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const stringResult = yield* service.validate("hello", schema);
        expect(stringResult.valid).toBe(true);

        const numberResult = yield* service.validate(42, schema);
        expect(numberResult.valid).toBe(true);

        const invalidResult = yield* service.validate(true, schema);
        expect(invalidResult.valid).toBe(false);
        return invalidResult;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });
  });

  describe("Literal validation", () => {
    it("should validate literal values", async () => {
      const schema = Schema.Literal("admin", "user", "guest");

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const validAdmin = yield* service.validate("admin", schema);
        expect(validAdmin.valid).toBe(true);

        const invalid = yield* service.validate("superuser", schema);
        expect(invalid.valid).toBe(false);
        return invalid;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });
  });

  describe("Complex nested structures", () => {
    it("should validate complex nested data", async () => {
      const schema = Schema.Struct({
        user: Schema.Struct({
          name: Schema.String,
          email: Schema.String,
          age: Schema.Number,
        }),
        tags: Schema.Array(Schema.String),
        metadata: Schema.optional(Schema.Struct({})),
      });

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;

        const valid = yield* service.validate(
          {
            user: { name: "Alice", email: "alice@example.com", age: 30 },
            tags: ["developer", "typescript"],
          },
          schema
        );
        expect(valid.valid).toBe(true);

        const invalid = yield* service.validate(
          {
            user: { name: "Alice", email: "alice@example.com" },
            tags: ["developer"],
          },
          schema
        );
        expect(invalid.valid).toBe(false);
        return invalid;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });
  });

  describe("Error messages", () => {
    it("should provide error details", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
      });

      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.validate({}, schema);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toBeDefined();
        return result;
      }).pipe(Effect.provide(ValidationService.Default));

      await Effect.runPromise(program);
    });
  });
});
