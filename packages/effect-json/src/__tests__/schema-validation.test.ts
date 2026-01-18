/**
 * Schema validation tests for effect-json
 *
 * Tests Effect.Schema integration and complex schema validation scenarios
 */

import { Effect, Either, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { jsonBackend } from "../services/json/implementations/json.js";

describe("Schema Validation with JSON", () => {
  describe("basic schema validation", () => {
    it("should validate simple schema", async () => {
      const UserSchema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });

      const json = '{"id":1,"name":"alice"}';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(UserSchema)(parsed);
      expect(result).toEqual({ id: 1, name: "alice" });
    });

    it("should reject invalid schema", async () => {
      const UserSchema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });

      const json = '{"id":"not-a-number","name":"alice"}';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateEither(UserSchema)(parsed);
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should handle optional fields", async () => {
      const ConfigSchema = Schema.Struct({
        required: Schema.String,
        optional: Schema.optional(Schema.String),
      });

      const json = '{"required":"value"}';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(ConfigSchema)(parsed);
      expect(result.required).toBe("value");
      expect(result.optional).toBeUndefined();
    });

    it("should handle optional with default", async () => {
      const ConfigSchema = Schema.Struct({
        name: Schema.String,
        timeout: Schema.optional(Schema.Number),
      });

      const json = '{"name":"test"}';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(ConfigSchema)(parsed);
      expect(result.name).toBe("test");
      expect(result.timeout).toBeUndefined();
    });
  });

  describe("complex schema types", () => {
    it("should validate arrays", async () => {
      const ArraySchema = Schema.Array(Schema.Number);

      const json = "[1,2,3,4,5]";
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(ArraySchema)(parsed);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    it("should validate array of objects", async () => {
      const ItemSchema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });
      const ListSchema = Schema.Array(ItemSchema);

      const json = '[{"id":1,"name":"a"},{"id":2,"name":"b"}]';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(ListSchema)(parsed);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toBe("a");
    });

    it("should validate nested structures", async () => {
      const AddressSchema = Schema.Struct({
        street: Schema.String,
        city: Schema.String,
        zip: Schema.String,
      });

      const UserSchema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
        address: AddressSchema,
      });

      const json =
        '{"id":1,"name":"alice","address":{"street":"Main St","city":"NYC","zip":"10001"}}';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(UserSchema)(parsed);
      expect(result.address.city).toBe("NYC");
    });

    it("should validate union types", async () => {
      const UnionSchema = Schema.Union(
        Schema.Struct({ type: Schema.Literal("a"), value: Schema.String }),
        Schema.Struct({ type: Schema.Literal("b"), value: Schema.Number })
      );

      const jsonA = '{"type":"a","value":"test"}';
      const parsedA = await Effect.runPromise(jsonBackend.parse(jsonA));
      const resultA = Schema.validateSync(UnionSchema)(parsedA);
      expect(resultA.type).toBe("a");

      const jsonB = '{"type":"b","value":42}';
      const parsedB = await Effect.runPromise(jsonBackend.parse(jsonB));
      const resultB = Schema.validateSync(UnionSchema)(parsedB);
      expect(resultB.type).toBe("b");
    });
  });

  describe("schema transformations", () => {
    it("should transform numeric strings", async () => {
      const ConfigSchema = Schema.Struct({
        timeout: Schema.Number,
      });

      const json = '{"timeout":5000}';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(ConfigSchema)(parsed);
      expect(result.timeout).toBe(5000);
      expect(typeof result.timeout).toBe("number");
    });

    it("should handle timestamp parsing", async () => {
      const ConfigSchema = Schema.Struct({
        timestamp: Schema.String,
      });

      const dateStr = "2024-01-15T00:00:00.000Z";
      const parsed = await Effect.runPromise(
        jsonBackend.parse(`{"timestamp":"${dateStr}"}`)
      );

      const result = Schema.validateSync(ConfigSchema)(parsed);
      expect(typeof result.timestamp).toBe("string");
      expect(result.timestamp).toBe(dateStr);
    });

    it("should validate numeric ranges", async () => {
      const ConfigSchema = Schema.Struct({
        timeout: Schema.Number,
      });

      // Valid case
      const validJson = '{"timeout":5000}';
      const validParsed = await Effect.runPromise(jsonBackend.parse(validJson));
      const validResult = Schema.validateSync(ConfigSchema)(validParsed);
      expect(validResult.timeout).toBe(5000);

      // Invalid case (not a number)
      const invalidJson = '{"timeout":"not-a-number"}';
      const invalidParsed = await Effect.runPromise(
        jsonBackend.parse(invalidJson)
      );
      const invalidResult = Schema.validateEither(ConfigSchema)(invalidParsed);
      expect(Either.isLeft(invalidResult)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle very large arrays", async () => {
      const ArraySchema = Schema.Array(
        Schema.Struct({
          id: Schema.Number,
          value: Schema.String,
        })
      );

      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      }));
      const json = JSON.stringify(items);
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(ArraySchema)(parsed);
      expect(result.length).toBe(100);
      expect(result[99].id).toBe(99);
    });

    it("should validate with lenient parsing", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
      });

      const json = '{"name":"test","extra":"ignored"}';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      // Schema by default ignores extra fields
      const result = Schema.validateSync(schema)(parsed);
      expect(result.name).toBe("test");
      expect((result as any).extra).toBeUndefined();
    });

    it("should handle mixed field types", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
        enabled: Schema.Boolean,
        tags: Schema.Array(Schema.String),
        metadata: Schema.optional(
          Schema.Struct({
            created: Schema.String,
            updated: Schema.String,
          })
        ),
      });

      const json = `{
        "id": 42,
        "enabled": true,
        "tags": ["a", "b", "c"],
        "metadata": {
          "created": "2024-01-01",
          "updated": "2024-01-15"
        }
      }`;
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(schema)(parsed);
      expect(result.id).toBe(42);
      expect(result.enabled).toBe(true);
      expect(result.tags.length).toBe(3);
      expect(result.metadata?.created).toBe("2024-01-01");
    });

    it("should handle recursive structures", async () => {
      const schema = Schema.Struct({
        value: Schema.Number,
        items: Schema.Array(Schema.String),
      });

      const json = JSON.stringify({
        value: 1,
        items: ["a", "b", "c"],
      });
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateSync(schema)(parsed);
      expect(result.value).toBe(1);
      expect(result.items.length).toBe(3);
    });
  });

  describe("error messages", () => {
    it("should provide clear error for missing required field", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });

      const json = '{"id":1}';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateEither(schema)(parsed);
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const error = result.left;
        expect(error).toBeDefined();
      }
    });

    it("should provide clear error for type mismatch", async () => {
      const schema = Schema.Struct({
        count: Schema.Number,
      });

      const json = '{"count":"not-a-number"}';
      const parsed = await Effect.runPromise(jsonBackend.parse(json));

      const result = Schema.validateEither(schema)(parsed);
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  describe("batch validation", () => {
    it("should validate multiple objects", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });

      const jsonl = `{"id":1,"name":"alice"}\n{"id":2,"name":"bob"}\n{"id":3,"name":"charlie"}`;
      const lines = jsonl.split("\n");

      const results = lines.map(async (line) => {
        const parsed = await Effect.runPromise(jsonBackend.parse(line));
        return Schema.validateSync(schema)(parsed);
      });

      const validated = await Promise.all(results);
      expect(validated.length).toBe(3);
      expect(validated[0].name).toBe("alice");
      expect(validated[2].name).toBe("charlie");
    });
  });
});
