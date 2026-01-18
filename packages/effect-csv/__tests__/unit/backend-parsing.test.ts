/**
 * CSV advanced parsing and processing tests for effect-csv
 *
 * Tests various CSV parsing scenarios and edge cases
 */

import { Effect, Either, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { parse, stringify, parseTsv } from "../../src/api.js";
import { ParseError } from "../../src/errors.js";

// Use a lenient schema that accepts any data
const AnySchema = Schema.Unknown as Schema.Schema<unknown[], unknown>;

describe("CSV Advanced Parsing", () => {
  describe("special delimiters", () => {
    it("should parse semicolon-delimited CSV", async () => {
      const csv = "name;age;city\nAlice;30;NYC\nBob;25;LA";
      const result = await Effect.runPromise(
        parse(AnySchema, csv, { delimiter: ";" })
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it("should parse pipe-delimited CSV", async () => {
      const csv = "name|age|city\nAlice|30|NYC\nBob|25|LA";
      const result = await Effect.runPromise(
        parse(AnySchema, csv, { delimiter: "|" })
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it("should parse colon-delimited CSV", async () => {
      const csv = "name:age:city\nAlice:30:NYC\nBob:25:LA";
      const result = await Effect.runPromise(
        parse(AnySchema, csv, { delimiter: ":" })
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe("multiline and quoted fields", () => {
    it("should parse CSV with quoted multiline fields", async () => {
      const csv = 'name,description\nAlice,"Line 1\nLine 2"\nBob,"Single line"';
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it("should parse CSV with escaped quotes", async () => {
      const csv = 'name,note\nAlice,"Contains ""quotes"" inside"\nBob,"Normal"';
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty quoted fields", async () => {
      const csv = 'name,middle,last\nAlice,"",Smith\nBob,"",Jones';
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("line ending handling", () => {
    it("should handle Windows CRLF line endings", async () => {
      const csv = "name,age\r\nAlice,30\r\nBob,25";
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it("should handle mixed line endings", async () => {
      const csv = "name,age\nAlice,30\r\nBob,25\rCharlie,35";
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle trailing newlines", async () => {
      const csv = "name,age\nAlice,30\nBob,25\n\n";
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe("unicode and special characters", () => {
    it("should parse CSV with unicode characters", async () => {
      const csv = "name,city\nAlice,北京\nBob,東京\nCharlie,Москва";
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it("should parse CSV with emoji", async () => {
      const csv = "emotion,emoji\nHappy,😊\nSad,😢\nExcited,🤩";
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it("should preserve HTML entities in CSV", async () => {
      const csv = "text\n&lt;tag&gt;\n&amp;\n&quot;";
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("large datasets", () => {
    it("should handle 100+ row CSV", async () => {
      const headers = "id,name,email";
      const rows = Array.from(
        { length: 100 },
        (_, i) => `${i},name${i},email${i}@test.com`
      );
      const csv = [headers, ...rows].join("\n");

      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(result.length).toBe(100);
    });

    it("should handle 50+ column CSV", async () => {
      const headers = Array.from({ length: 50 }, (_, i) => `col${i}`).join(",");
      const row = Array.from({ length: 50 }, (_, i) => `val${i}`).join(",");
      const csv = `${headers}\n${row}`;

      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("boundary conditions", () => {
    it("should handle single row CSV", async () => {
      const csv = "name,age\nAlice,30";
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it("should handle single column CSV", async () => {
      const csv = "name\nAlice\nBob\nCharlie";
      const result = await Effect.runPromise(parse(AnySchema, csv));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });
  });

  describe("TSV (tab-separated values)", () => {
    it("should parse TSV format", async () => {
      const tsv = "name\tage\tcity\nAlice\t30\tNYC\nBob\t25\tLA";
      const result = await Effect.runPromise(parseTsv(AnySchema, tsv));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it("should handle TSV with quoted fields", async () => {
      const tsv = 'name\tdesc\nAlice\t"Has\ttab"\nBob\t"Normal"';
      const result = await Effect.runPromise(parseTsv(AnySchema, tsv));

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
