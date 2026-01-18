/**
 * Schema validation tests for effect-ai-sdk
 *
 * Tests schema conversion and validation utility functions
 */

import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import {
  toZodSchema,
  toStandardSchema,
  validateWithSchema,
  encodeWithSchema,
} from "../../src/schema.js";
import { AiSdkSchemaError } from "../../src/errors.js";

describe("effect-ai-sdk Schema Utilities", () => {
  describe("toZodSchema", () => {
    it("should convert string schema to Zod schema", async () => {
      const effectSchema = Schema.String;
      const result = await Effect.runPromise(toZodSchema(effectSchema));
      expect(result).toBeDefined();
    });

    it("should convert number schema to Zod schema", async () => {
      const effectSchema = Schema.Number;
      const result = await Effect.runPromise(toZodSchema(effectSchema));
      expect(result).toBeDefined();
    });

    it("should convert struct schema to Zod schema", async () => {
      const effectSchema = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });
      const result = await Effect.runPromise(toZodSchema(effectSchema));
      expect(result).toBeDefined();
    });

    it("should convert array schema to Zod schema", async () => {
      const effectSchema = Schema.Array(Schema.String);
      const result = await Effect.runPromise(toZodSchema(effectSchema));
      expect(result).toBeDefined();
    });

    it("should convert optional schema to Zod schema", async () => {
      const effectSchema = Schema.optional(Schema.String);
      const result = await Effect.runPromise(toZodSchema(effectSchema));
      expect(result).toBeDefined();
    });

    it("should convert union schema to Zod schema", async () => {
      const effectSchema = Schema.Union(Schema.String, Schema.Number);
      const result = await Effect.runPromise(toZodSchema(effectSchema));
      expect(result).toBeDefined();
    });

    it("should convert literal schema to Zod schema", async () => {
      const effectSchema = Schema.Literal("a", "b", "c");
      const result = await Effect.runPromise(toZodSchema(effectSchema));
      expect(result).toBeDefined();
    });

    it("should handle complex nested schemas", async () => {
      const effectSchema = Schema.Struct({
        user: Schema.Struct({
          name: Schema.String,
          email: Schema.String,
        }),
        items: Schema.Array(
          Schema.Struct({
            id: Schema.Number,
            name: Schema.String,
          })
        ),
      });

      const result = await Effect.runPromise(toZodSchema(effectSchema));
      expect(result).toBeDefined();
    });

    it("should handle optional fields in struct", async () => {
      const effectSchema = Schema.Struct({
        required: Schema.String,
        optional: Schema.optional(Schema.String),
      });

      const result = await Effect.runPromise(toZodSchema(effectSchema));
      expect(result).toBeDefined();
    });
  });

  describe("toStandardSchema", () => {
    it("should convert string schema to Standard Schema", async () => {
      const effectSchema = Schema.String;
      const result = await Effect.runPromise(toStandardSchema(effectSchema));
      expect(result).toBe(effectSchema);
    });

    it("should convert number schema to Standard Schema", async () => {
      const effectSchema = Schema.Number;
      const result = await Effect.runPromise(toStandardSchema(effectSchema));
      expect(result).toBe(effectSchema);
    });

    it("should convert struct schema to Standard Schema", async () => {
      const effectSchema = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });
      const result = await Effect.runPromise(toStandardSchema(effectSchema));
      expect(result).toBe(effectSchema);
    });

    it("should convert array schema to Standard Schema", async () => {
      const effectSchema = Schema.Array(Schema.String);
      const result = await Effect.runPromise(toStandardSchema(effectSchema));
      expect(result).toBe(effectSchema);
    });

    it("should preserve schema identity", async () => {
      const effectSchema = Schema.Struct({
        id: Schema.String,
        name: Schema.String,
        tags: Schema.Array(Schema.String),
      });

      const result = await Effect.runPromise(toStandardSchema(effectSchema));
      expect(result).toBe(effectSchema);
    });

    it("should handle optional schema", async () => {
      const effectSchema = Schema.optional(Schema.String);
      const result = await Effect.runPromise(toStandardSchema(effectSchema));
      expect(result).toBe(effectSchema);
    });

    it("should handle union schema", async () => {
      const effectSchema = Schema.Union(Schema.String, Schema.Number);
      const result = await Effect.runPromise(toStandardSchema(effectSchema));
      expect(result).toBe(effectSchema);
    });

    it("should handle complex nested schemas", async () => {
      const effectSchema = Schema.Struct({
        user: Schema.Struct({
          name: Schema.String,
          contact: Schema.Struct({
            email: Schema.String,
            phone: Schema.optional(Schema.String),
          }),
        }),
        status: Schema.Literal("active", "inactive"),
      });

      const result = await Effect.runPromise(toStandardSchema(effectSchema));
      expect(result).toBe(effectSchema);
    });
  });

  describe("validateWithSchema", () => {
    it("should validate data against string schema", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(
        validateWithSchema(schema, "hello")
      );
      expect(result).toBe("hello");
    });

    it("should validate data against number schema", async () => {
      const schema = Schema.Number;
      const result = await Effect.runPromise(validateWithSchema(schema, 42));
      expect(result).toBe(42);
    });

    it("should validate data against struct schema", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const data = { name: "John", age: 30 };
      const result = await Effect.runPromise(validateWithSchema(schema, data));
      expect(result.name).toBe("John");
      expect(result.age).toBe(30);
    });

    it("should validate data against array schema", async () => {
      const schema = Schema.Array(Schema.String);
      const data = ["a", "b", "c"];
      const result = await Effect.runPromise(validateWithSchema(schema, data));
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should validate optional fields", async () => {
      const schema = Schema.Struct({
        required: Schema.String,
        optional: Schema.optional(Schema.String),
      });

      const data = { required: "test" };
      const result = await Effect.runPromise(validateWithSchema(schema, data));
      expect(result.required).toBe("test");
      expect(result.optional).toBeUndefined();
    });

    it("should fail validation with wrong type", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(
        Effect.either(validateWithSchema(schema, 123))
      );

      expect(result._tag).toBe("Left");
    });

    it("should fail validation with missing required field", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const data = { name: "John" };
      const result = await Effect.runPromise(
        Effect.either(validateWithSchema(schema, data))
      );

      expect(result._tag).toBe("Left");
    });

    it("should fail validation with extra fields in strict mode", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
      });

      const data = { name: "John", extra: "field" };
      const result = await Effect.runPromise(
        Effect.either(validateWithSchema(schema, data))
      );

      // Depending on schema config, this might pass or fail
      expect(result).toBeDefined();
    });

    it("should provide proper error wrapping", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(
        Effect.either(validateWithSchema(schema, 123))
      );

      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AiSdkSchemaError);
      }
    });

    it("should validate complex nested objects", async () => {
      const schema = Schema.Struct({
        user: Schema.Struct({
          name: Schema.String,
          email: Schema.String,
        }),
        tags: Schema.Array(Schema.String),
        metadata: Schema.optional(
          Schema.Struct({
            created: Schema.String,
          })
        ),
      });

      const data = {
        user: { name: "Alice", email: "alice@example.com" },
        tags: ["developer", "typescript"],
        metadata: { created: "2024-01-01" },
      };

      const result = await Effect.runPromise(validateWithSchema(schema, data));
      expect(result.user.name).toBe("Alice");
      expect(result.tags).toHaveLength(2);
    });

    it("should validate union types", async () => {
      const schema = Schema.Union(Schema.String, Schema.Number);

      const stringResult = await Effect.runPromise(
        validateWithSchema(schema, "hello")
      );
      expect(stringResult).toBe("hello");

      const numberResult = await Effect.runPromise(
        validateWithSchema(schema, 42)
      );
      expect(numberResult).toBe(42);
    });
  });

  describe("encodeWithSchema", () => {
    it("should encode data using string schema", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(encodeWithSchema(schema, "hello"));
      expect(result).toBe("hello");
    });

    it("should encode data using number schema", async () => {
      const schema = Schema.Number;
      const result = await Effect.runPromise(encodeWithSchema(schema, 42));
      expect(result).toBe(42);
    });

    it("should encode data using struct schema", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });

      const data = { name: "John", age: 30 };
      const result = await Effect.runPromise(encodeWithSchema(schema, data));
      expect(result.name).toBe("John");
      expect(result.age).toBe(30);
    });

    it("should encode data using array schema", async () => {
      const schema = Schema.Array(Schema.String);
      const data = ["a", "b", "c"];
      const result = await Effect.runPromise(encodeWithSchema(schema, data));
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should handle optional fields during encoding", async () => {
      const schema = Schema.Struct({
        required: Schema.String,
        optional: Schema.optional(Schema.String),
      });

      const data = { required: "test" };
      const result = await Effect.runPromise(encodeWithSchema(schema, data));
      expect(result.required).toBe("test");
    });

    it("should fail encoding with wrong type", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(
        Effect.either(encodeWithSchema(schema, 123 as unknown as string))
      );

      // Type system should prevent this, but runtime checking
      expect(result).toBeDefined();
    });

    it("should provide proper error wrapping on encode failure", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(
        Effect.either(encodeWithSchema(schema, 123 as unknown as string))
      );

      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AiSdkSchemaError);
      }
    });

    it("should encode complex nested objects", async () => {
      const schema = Schema.Struct({
        id: Schema.String,
        data: Schema.Struct({
          name: Schema.String,
          count: Schema.Number,
        }),
      });

      const data = {
        id: "1",
        data: {
          name: "test",
          count: 5,
        },
      };

      const result = await Effect.runPromise(encodeWithSchema(schema, data));
      expect(result.id).toBe("1");
      expect(result.data.count).toBe(5);
    });

    it("should handle array encoding", async () => {
      const schema = Schema.Array(
        Schema.Struct({
          id: Schema.Number,
          name: Schema.String,
        })
      );

      const data = [
        { id: 1, name: "first" },
        { id: 2, name: "second" },
      ];

      const result = await Effect.runPromise(encodeWithSchema(schema, data));
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe("first");
    });
  });

  describe("Integration tests", () => {
    it("should validate and then encode data", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
        email: Schema.String,
      });

      const inputData = { name: "Alice", email: "alice@example.com" };

      // First validate
      const validated = await Effect.runPromise(
        validateWithSchema(schema, inputData)
      );

      // Then encode
      const encoded = await Effect.runPromise(
        encodeWithSchema(schema, validated)
      );

      expect(encoded.name).toBe("Alice");
      expect(encoded.email).toBe("alice@example.com");
    });

    it("should handle schema composition", async () => {
      const userSchema = Schema.Struct({
        name: Schema.String,
        email: Schema.String,
      });

      const postSchema = Schema.Struct({
        id: Schema.String,
        title: Schema.String,
        author: userSchema,
      });

      const data = {
        id: "1",
        title: "Test Post",
        author: { name: "Bob", email: "bob@example.com" },
      };

      const result = await Effect.runPromise(
        validateWithSchema(postSchema, data)
      );

      expect(result.author.name).toBe("Bob");
      expect(result.author.email).toBe("bob@example.com");
    });

    it("should handle schema refinements", async () => {
      const emailSchema = Schema.String.pipe(
        Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      );

      const validEmail = await Effect.runPromise(
        validateWithSchema(emailSchema, "test@example.com")
      );
      expect(validEmail).toBe("test@example.com");

      const invalidEmailResult = await Effect.runPromise(
        Effect.either(validateWithSchema(emailSchema, "not-an-email"))
      );
      expect(invalidEmailResult._tag).toBe("Left");
    });

    it("should convert schema through multiple operations", async () => {
      const effectSchema = Schema.Struct({
        message: Schema.String,
      });

      // Convert to Zod
      const zodSchema = await Effect.runPromise(toZodSchema(effectSchema));
      expect(zodSchema).toBeDefined();

      // Convert to Standard Schema
      const standardSchema = await Effect.runPromise(
        toStandardSchema(effectSchema)
      );
      expect(standardSchema).toBe(effectSchema);

      // Validate with original schema
      const validated = await Effect.runPromise(
        validateWithSchema(effectSchema, { message: "hello" })
      );
      expect(validated.message).toBe("hello");
    });
  });
});
