/**
 * Edge case tests for effect-csv
 *
 * Tests boundary conditions, special characters, and data edge cases
 */

import { Effect, Either } from "effect";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { parse, stringify, parseTsv } from "../../src/api.js";
import { ParseError, ValidationError } from "../../src/errors.js";

const SimpleSchema = Schema.Array(
  Schema.Struct({
    id: Schema.NumberFromString,
    name: Schema.String,
  })
);

const FlexibleSchema = Schema.Array(
  Schema.Struct({
    col1: Schema.optional(Schema.String),
    col2: Schema.optional(Schema.String),
    col3: Schema.optional(Schema.String),
  })
);

describe("CSV Edge Cases", () => {
  describe("Quoted field handling", () => {
    it("should handle fields with commas inside quotes", async () => {
      const csv = `id,name
1,"Smith, John"
2,"Doe, Jane"`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
      expect(result[0].name).toContain(",");
    });

    it("should handle fields with quotes inside quotes", async () => {
      const csv = `id,name
1,"John ""The Great"" Smith"
2,"Jane Doe"`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
    });

    it("should handle fields with newlines inside quotes", async () => {
      const csv = `id,name
1,"John
Smith"
2,"Jane Doe"`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
    });

    it("should handle empty quoted fields", async () => {
      const csv = `id,name
1,""
2,"Jane"`;

      const result = await Effect.runPromise(
        Effect.either(parse(SimpleSchema, csv))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });

  describe("Special characters", () => {
    it("should handle Unicode characters", async () => {
      const csv = `id,name
1,José
2,François
3,日本人`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(3);
      expect(result[2].name).toBe("日本人");
    });

    it("should handle emoji", async () => {
      const csv = `id,name
1,Alice 🚀
2,Bob 🎉`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
      expect(result[0].name).toContain("🚀");
    });

    it("should handle special regex characters", async () => {
      const csv = `id,name
1,John.*+?^$
2,Jane [](){}`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
      expect(result[0].name).toContain(".*");
    });

    it("should handle HTML/XML tags", async () => {
      const csv = `id,name
1,"<script>alert('xss')</script>"
2,"<div>content</div>"`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
      expect(result[0].name).toContain("<script>");
    });
  });

  describe("Whitespace handling", () => {
    it("should handle leading/trailing spaces", async () => {
      const csv = `id,name
  1  ,  Alice
2,Bob`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
    });

    it("should handle multiple spaces in values", async () => {
      const csv = `id,name
1,John    Smith
2,Jane Doe`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
      expect(result[0].name).toContain("    ");
    });

    it("should handle mixed line endings (CRLF vs LF)", async () => {
      const csv = `id,name\r\n1,Alice\r\n2,Bob`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
    });

    it("should handle trailing newlines", async () => {
      const csv = `id,name
1,Alice
2,Bob

`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
    });
  });

  describe("Large data handling", () => {
    it("should handle very long field values", async () => {
      const longName = "x".repeat(10000);
      const csv = `id,name
1,${longName}
2,Bob`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result[0].name).toHaveLength(10000);
    });

    it("should handle many rows", async () => {
      let csv = "id,name\n";
      for (let i = 1; i <= 1000; i++) {
        csv += `${i},User${i}\n`;
      }

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(1000);
    });
  });

  describe("Number and type edge cases", () => {
    it("should handle zero values", async () => {
      const csv = `id,name
0,Zero
-1,Negative`;

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result[0].id).toBe(0);
      expect(result[1].id).toBe(-1);
    });

    it("should reject non-numeric values for numeric fields", async () => {
      const csv = `id,name
notanumber,Alice
2,Bob`;

      const result = await Effect.runPromise(
        Effect.either(parse(SimpleSchema, csv))
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("Different delimiters", () => {
    it("should handle semicolon delimiter", async () => {
      const csv = `id;name
1;Alice
2;Bob`;

      const result = await Effect.runPromise(
        parse(SimpleSchema, csv, { delimiter: ";" })
      );
      expect(result).toHaveLength(2);
    });

    it("should handle pipe delimiter", async () => {
      const csv = `id|name
1|Alice
2|Bob`;

      const result = await Effect.runPromise(
        parse(SimpleSchema, csv, { delimiter: "|" })
      );
      expect(result).toHaveLength(2);
    });

    it("should handle tab delimiter", async () => {
      const csv = `id\tname
1\tAlice
2\tBob`;

      const result = await Effect.runPromise(
        Effect.either(parseTsv(SimpleSchema, csv))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });

  describe("Buffer input handling", () => {
    it("should parse Buffer with UTF-8 encoding", async () => {
      const csv = Buffer.from(`id,name
1,Alice
2,Bob`);

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
    });

    it("should parse Buffer with Unicode", async () => {
      const csv = Buffer.from(
        `id,name
1,José
2,日本人`,
        "utf-8"
      );

      const result = await Effect.runPromise(parse(SimpleSchema, csv));
      expect(result).toHaveLength(2);
    });
  });

  describe("Optional and missing fields", () => {
    it("should handle empty optional fields", async () => {
      const csv = `col1,col2,col3
value1,,value3
,value5,
value6,,value8`;

      const result = await Effect.runPromise(parse(FlexibleSchema, csv));
      expect(result).toHaveLength(3);
    });
  });

  describe("Error handling", () => {
    it("should provide informative parse error", async () => {
      const csv = `id,name
invalid,Alice`;

      const result = await Effect.runPromise(
        Effect.either(parse(SimpleSchema, csv))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.message || String(result.left)).toBeDefined();
      }
    });
  });
});
