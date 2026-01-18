import { Effect, Schema, Either } from "effect";
import { describe, expect, it } from "vitest";
import { parse, stringify, parseTsv, stringifyTsv } from "../../src/api.js";
import { ParseError, ValidationError } from "../../src/errors.js";

const SimpleUserSchema = Schema.Array(
  Schema.Struct({
    id: Schema.NumberFromString,
    name: Schema.String,
  })
);

describe("CSV API Functions", () => {
  describe("parse()", () => {
    it("should parse valid CSV data", async () => {
      const csv = `id,name
1,Alice
2,Bob`;

      const result = await Effect.runPromise(parse(SimpleUserSchema, csv));

      expect(result).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });

    it("should parse CSV from Buffer", async () => {
      const csv = Buffer.from(`id,name
1,Alice`);

      const result = await Effect.runPromise(parse(SimpleUserSchema, csv));

      expect(result).toEqual([{ id: 1, name: "Alice" }]);
    });

    it("should handle custom delimiter", async () => {
      const csv = `id;name
1;Alice
2;Bob`;

      const result = await Effect.runPromise(
        parse(SimpleUserSchema, csv, { delimiter: ";" })
      );

      expect(result).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });

    it("should fail on validation error", async () => {
      const csv = `id,name
invalid,Alice`;

      const result = await Effect.runPromise(
        Effect.either(parse(SimpleUserSchema, csv))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("stringify()", () => {
    it("should stringify data to CSV", async () => {
      const data = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];

      const result = await Effect.runPromise(stringify(SimpleUserSchema, data));

      expect(result).toContain("id,name");
      expect(result).toContain("1,Alice");
      expect(result).toContain("2,Bob");
    });

    it("should handle custom delimiter", async () => {
      const data = [{ id: 1, name: "Alice" }];

      const result = await Effect.runPromise(
        stringify(SimpleUserSchema, data, { delimiter: ";" })
      );

      expect(result).toContain("id;name");
      expect(result).toContain("1;Alice");
    });

    it("should handle quoted fields with special characters", async () => {
      const data = [{ id: 1, name: "Alice, Jr." }];

      const result = await Effect.runPromise(stringify(SimpleUserSchema, data));

      expect(result).toContain('"Alice, Jr."');
    });
  });

  describe("parseTsv()", () => {
    it("should parse TSV data", async () => {
      const tsv = `id\tname
1\tAlice
2\tBob`;

      const result = await Effect.runPromise(parseTsv(SimpleUserSchema, tsv));

      expect(result).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });
  });

  describe("stringifyTsv()", () => {
    it("should stringify to TSV", async () => {
      const data = [{ id: 1, name: "Alice" }];

      const result = await Effect.runPromise(
        stringifyTsv(SimpleUserSchema, data)
      );

      expect(result).toContain("id\tname");
      expect(result).toContain("1\tAlice");
    });
  });

  describe("round-trip", () => {
    it("should parse and stringify consistently", async () => {
      const originalData = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];

      const csv = await Effect.runPromise(
        stringify(SimpleUserSchema, originalData)
      );

      const parsed = await Effect.runPromise(parse(SimpleUserSchema, csv));

      expect(parsed).toEqual(originalData);
    });
  });
});
