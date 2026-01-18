/**
 * Schema validation tests for effect-regex MCP tools
 *
 * Tests MCP tool schema definitions and their properties
 */

import { describe, expect, it } from "vitest";
import {
  BUILD_REGEX_SCHEMA,
  TEST_REGEX_SCHEMA,
  LINT_REGEX_SCHEMA,
  CONVERT_REGEX_SCHEMA,
  EXPLAIN_REGEX_SCHEMA,
  LIBRARY_LIST_SCHEMA,
  OPTIMIZE_PATTERN_SCHEMA,
  ALL_TOOLS,
  ToolDefinition,
} from "../src/mcp/schemas.js";

describe("effect-regex MCP Tool Schemas", () => {
  describe("Schema structure validation", () => {
    it("should have valid ToolDefinition interface", () => {
      const tool: ToolDefinition = BUILD_REGEX_SCHEMA;
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    });

    it("should have consistent schema structure across all tools", () => {
      const tools = [
        BUILD_REGEX_SCHEMA,
        TEST_REGEX_SCHEMA,
        LINT_REGEX_SCHEMA,
        CONVERT_REGEX_SCHEMA,
        EXPLAIN_REGEX_SCHEMA,
        LIBRARY_LIST_SCHEMA,
        OPTIMIZE_PATTERN_SCHEMA,
      ];

      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe("string");
        expect(tool.name.length).toBeGreaterThan(0);

        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe("string");

        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });
  });

  describe("BUILD_REGEX_SCHEMA", () => {
    it("should have correct tool name", () => {
      expect(BUILD_REGEX_SCHEMA.name).toBe("build_regex");
    });

    it("should have descriptive description", () => {
      expect(BUILD_REGEX_SCHEMA.description).toContain("regex");
      expect(BUILD_REGEX_SCHEMA.description.length).toBeGreaterThan(0);
    });

    it("should have input property", () => {
      expect(BUILD_REGEX_SCHEMA.inputSchema.properties).toHaveProperty("input");
    });

    it("should support oneOf input variants", () => {
      const inputSchema = BUILD_REGEX_SCHEMA.inputSchema.properties.input;
      expect(inputSchema.oneOf).toBeDefined();
      expect(Array.isArray(inputSchema.oneOf)).toBe(true);
      expect(inputSchema.oneOf.length).toBeGreaterThan(0);
    });

    it("should support ast input type", () => {
      const inputSchema = BUILD_REGEX_SCHEMA.inputSchema.properties.input;
      const astVariant = inputSchema.oneOf.find(
        (v: any) => v.properties?.type?.const === "ast"
      );
      expect(astVariant).toBeDefined();
      expect(astVariant?.properties.ast).toBeDefined();
    });

    it("should support std input type", () => {
      const inputSchema = BUILD_REGEX_SCHEMA.inputSchema.properties.input;
      const stdVariant = inputSchema.oneOf.find(
        (v: any) => v.properties?.type?.const === "std"
      );
      expect(stdVariant).toBeDefined();
      expect(stdVariant?.properties.name).toBeDefined();
    });

    it("should support command input type", () => {
      const inputSchema = BUILD_REGEX_SCHEMA.inputSchema.properties.input;
      const commandVariant = inputSchema.oneOf.find(
        (v: any) => v.properties?.type?.const === "command"
      );
      expect(commandVariant).toBeDefined();
      expect(commandVariant?.properties.spec).toBeDefined();
    });

    it("should have dialect property", () => {
      expect(BUILD_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "dialect"
      );
      const dialect = BUILD_REGEX_SCHEMA.inputSchema.properties.dialect;
      expect(dialect.enum).toContain("js");
      expect(dialect.enum).toContain("re2");
      expect(dialect.enum).toContain("pcre");
    });

    it("should have anchor property", () => {
      expect(BUILD_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "anchor"
      );
      const anchor = BUILD_REGEX_SCHEMA.inputSchema.properties.anchor;
      expect(anchor.type).toBe("boolean");
    });

    it("should require input property", () => {
      expect(BUILD_REGEX_SCHEMA.inputSchema.required).toContain("input");
    });
  });

  describe("TEST_REGEX_SCHEMA", () => {
    it("should have correct tool name", () => {
      expect(TEST_REGEX_SCHEMA.name).toBe("test_regex");
    });

    it("should have pattern property", () => {
      expect(TEST_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "pattern"
      );
      const pattern = TEST_REGEX_SCHEMA.inputSchema.properties.pattern;
      expect(pattern.type).toBe("string");
    });

    it("should have dialect property with supported dialects", () => {
      expect(TEST_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "dialect"
      );
      const dialect = TEST_REGEX_SCHEMA.inputSchema.properties.dialect;
      expect(dialect.enum).toContain("js");
      expect(dialect.enum).toContain("re2-sim");
      expect(dialect.enum).toContain("re2");
    });

    it("should have cases property", () => {
      expect(TEST_REGEX_SCHEMA.inputSchema.properties).toHaveProperty("cases");
      const cases = TEST_REGEX_SCHEMA.inputSchema.properties.cases;
      expect(cases.type).toBe("array");
    });

    it("should enforce minimum test cases", () => {
      const cases = TEST_REGEX_SCHEMA.inputSchema.properties.cases;
      expect(cases.minItems).toBe(1);
    });

    it("should enforce maximum test cases", () => {
      const cases = TEST_REGEX_SCHEMA.inputSchema.properties.cases;
      expect(cases.maxItems).toBeDefined();
      expect(cases.maxItems).toBeGreaterThan(0);
    });

    it("should have test case structure", () => {
      const cases = TEST_REGEX_SCHEMA.inputSchema.properties.cases;
      const caseItem = cases.items;
      expect(caseItem.type).toBe("object");
      expect(caseItem.properties).toHaveProperty("input");
      expect(caseItem.properties).toHaveProperty("shouldMatch");
      expect(caseItem.properties).toHaveProperty("expectedCaptures");
    });

    it("should require pattern and cases", () => {
      expect(TEST_REGEX_SCHEMA.inputSchema.required).toContain("pattern");
      expect(TEST_REGEX_SCHEMA.inputSchema.required).toContain("cases");
    });

    it("should have timeoutMs property", () => {
      expect(TEST_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "timeoutMs"
      );
      const timeout = TEST_REGEX_SCHEMA.inputSchema.properties.timeoutMs;
      expect(timeout.type).toBe("integer");
      expect(timeout.minimum).toBeLessThanOrEqual(timeout.maximum);
    });
  });

  describe("LINT_REGEX_SCHEMA", () => {
    it("should have correct tool name", () => {
      expect(LINT_REGEX_SCHEMA.name).toBe("lint_regex");
    });

    it("should have pattern property", () => {
      expect(LINT_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "pattern"
      );
    });

    it("should have dialect property", () => {
      expect(LINT_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "dialect"
      );
      const dialect = LINT_REGEX_SCHEMA.inputSchema.properties.dialect;
      expect(dialect.enum).toContain("js");
      expect(dialect.enum).toContain("re2");
      expect(dialect.enum).toContain("pcre");
    });

    it("should require pattern", () => {
      expect(LINT_REGEX_SCHEMA.inputSchema.required).toContain("pattern");
    });
  });

  describe("CONVERT_REGEX_SCHEMA", () => {
    it("should have correct tool name", () => {
      expect(CONVERT_REGEX_SCHEMA.name).toBe("convert_regex");
    });

    it("should have pattern property", () => {
      expect(CONVERT_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "pattern"
      );
    });

    it("should have fromDialect property", () => {
      expect(CONVERT_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "fromDialect"
      );
      const fromDialect =
        CONVERT_REGEX_SCHEMA.inputSchema.properties.fromDialect;
      expect(fromDialect.enum).toContain("js");
      expect(fromDialect.enum).toContain("re2");
      expect(fromDialect.enum).toContain("pcre");
    });

    it("should have toDialect property", () => {
      expect(CONVERT_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "toDialect"
      );
      const toDialect = CONVERT_REGEX_SCHEMA.inputSchema.properties.toDialect;
      expect(toDialect.enum).toContain("js");
      expect(toDialect.enum).toContain("re2");
      expect(toDialect.enum).toContain("pcre");
    });

    it("should have allowDowngrades property", () => {
      expect(CONVERT_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "allowDowngrades"
      );
      const allowDowngrades =
        CONVERT_REGEX_SCHEMA.inputSchema.properties.allowDowngrades;
      expect(allowDowngrades.type).toBe("boolean");
      expect(allowDowngrades.default).toBe(true);
    });

    it("should require pattern and toDialect", () => {
      expect(CONVERT_REGEX_SCHEMA.inputSchema.required).toContain("pattern");
      expect(CONVERT_REGEX_SCHEMA.inputSchema.required).toContain("toDialect");
    });
  });

  describe("EXPLAIN_REGEX_SCHEMA", () => {
    it("should have correct tool name", () => {
      expect(EXPLAIN_REGEX_SCHEMA.name).toBe("explain_regex");
    });

    it("should have pattern property", () => {
      expect(EXPLAIN_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "pattern"
      );
    });

    it("should have format property with valid options", () => {
      expect(EXPLAIN_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "format"
      );
      const format = EXPLAIN_REGEX_SCHEMA.inputSchema.properties.format;
      expect(format.enum).toContain("tree");
      expect(format.enum).toContain("steps");
      expect(format.enum).toContain("summary");
    });

    it("should have dialect property", () => {
      expect(EXPLAIN_REGEX_SCHEMA.inputSchema.properties).toHaveProperty(
        "dialect"
      );
    });

    it("should require pattern", () => {
      expect(EXPLAIN_REGEX_SCHEMA.inputSchema.required).toContain("pattern");
    });
  });

  describe("LIBRARY_LIST_SCHEMA", () => {
    it("should have correct tool name", () => {
      expect(LIBRARY_LIST_SCHEMA.name).toBe("library_list");
    });

    it("should have optional filter property", () => {
      expect(LIBRARY_LIST_SCHEMA.inputSchema.properties).toHaveProperty(
        "filter"
      );
      const filter = LIBRARY_LIST_SCHEMA.inputSchema.properties.filter;
      expect(filter.type).toBe("object");
    });

    it("should support tag filtering", () => {
      const filter = LIBRARY_LIST_SCHEMA.inputSchema.properties.filter;
      expect(filter.properties).toHaveProperty("tag");
    });

    it("should support dialect filtering", () => {
      const filter = LIBRARY_LIST_SCHEMA.inputSchema.properties.filter;
      expect(filter.properties).toHaveProperty("dialect");
    });

    it("should support search filtering", () => {
      const filter = LIBRARY_LIST_SCHEMA.inputSchema.properties.filter;
      expect(filter.properties).toHaveProperty("search");
      expect(filter.properties.search.maxLength).toBeGreaterThan(0);
    });

    it("should not require any properties", () => {
      expect(LIBRARY_LIST_SCHEMA.inputSchema.required).toBeUndefined();
    });
  });

  describe("OPTIMIZE_PATTERN_SCHEMA", () => {
    it("should have correct tool name", () => {
      expect(OPTIMIZE_PATTERN_SCHEMA.name).toBe("optimize_pattern");
    });

    it("should have input property", () => {
      expect(OPTIMIZE_PATTERN_SCHEMA.inputSchema.properties).toHaveProperty(
        "input"
      );
    });

    it("should support std input type", () => {
      const inputSchema = OPTIMIZE_PATTERN_SCHEMA.inputSchema.properties.input;
      const stdVariant = inputSchema.oneOf.find(
        (v: any) => v.properties?.type?.const === "std"
      );
      expect(stdVariant).toBeDefined();
    });

    it("should support pattern input type", () => {
      const inputSchema = OPTIMIZE_PATTERN_SCHEMA.inputSchema.properties.input;
      const patternVariant = inputSchema.oneOf.find(
        (v: any) => v.properties?.type?.const === "pattern"
      );
      expect(patternVariant).toBeDefined();
      expect(patternVariant?.properties.pattern).toBeDefined();
    });

    it("should have optimization options", () => {
      expect(OPTIMIZE_PATTERN_SCHEMA.inputSchema.properties).toHaveProperty(
        "options"
      );
      const options = OPTIMIZE_PATTERN_SCHEMA.inputSchema.properties.options;
      expect(options.type).toBe("object");
      expect(options.properties).toHaveProperty("constantFolding");
      expect(options.properties).toHaveProperty("quantifierSimplification");
      expect(options.properties).toHaveProperty("characterClassMerging");
      expect(options.properties).toHaveProperty("alternationDedup");
      expect(options.properties).toHaveProperty("maxPasses");
    });

    it("should have dialect property", () => {
      expect(OPTIMIZE_PATTERN_SCHEMA.inputSchema.properties).toHaveProperty(
        "dialect"
      );
    });

    it("should require input", () => {
      expect(OPTIMIZE_PATTERN_SCHEMA.inputSchema.required).toContain("input");
    });

    it("should enforce maxPasses constraints", () => {
      const options = OPTIMIZE_PATTERN_SCHEMA.inputSchema.properties.options;
      const maxPasses = options.properties.maxPasses;
      expect(maxPasses.minimum).toBe(1);
      expect(maxPasses.maximum).toBe(10);
    });
  });

  describe("ALL_TOOLS array", () => {
    it("should contain all tool schemas", () => {
      expect(ALL_TOOLS).toContain(BUILD_REGEX_SCHEMA);
      expect(ALL_TOOLS).toContain(TEST_REGEX_SCHEMA);
      expect(ALL_TOOLS).toContain(LINT_REGEX_SCHEMA);
      expect(ALL_TOOLS).toContain(CONVERT_REGEX_SCHEMA);
      expect(ALL_TOOLS).toContain(EXPLAIN_REGEX_SCHEMA);
      expect(ALL_TOOLS).toContain(LIBRARY_LIST_SCHEMA);
      expect(ALL_TOOLS).toContain(OPTIMIZE_PATTERN_SCHEMA);
    });

    it("should have correct length", () => {
      expect(ALL_TOOLS.length).toBe(7);
    });

    it("should have unique tool names", () => {
      const names = ALL_TOOLS.map((tool) => tool.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("should all be valid tool definitions", () => {
      for (const tool of ALL_TOOLS) {
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe("string");
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe("string");
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.inputSchema).toBe("object");
      }
    });

    it("should be iterable", () => {
      let count = 0;
      for (const tool of ALL_TOOLS) {
        count++;
      }
      expect(count).toBe(7);
    });
  });

  describe("Dialect consistency", () => {
    it("should use consistent dialect enums across tools", () => {
      const getDialectEnum = (schema: any) => {
        const dialect = schema.inputSchema.properties.dialect;
        return dialect?.enum || [];
      };

      const buildDialects = getDialectEnum(BUILD_REGEX_SCHEMA);
      const testDialects = getDialectEnum(TEST_REGEX_SCHEMA);
      const lintDialects = getDialectEnum(LINT_REGEX_SCHEMA);

      // Build, lint, and convert should support js, re2, pcre
      expect(buildDialects).toEqual(["js", "re2", "pcre"]);
      expect(lintDialects).toEqual(["js", "re2", "pcre"]);

      // Test uses re2-sim variant
      expect(testDialects).toContain("js");
      expect(testDialects).toContain("re2");
    });

    it("should have default dialect where applicable", () => {
      const tools = [
        BUILD_REGEX_SCHEMA,
        TEST_REGEX_SCHEMA,
        LINT_REGEX_SCHEMA,
        CONVERT_REGEX_SCHEMA,
        EXPLAIN_REGEX_SCHEMA,
      ];

      for (const tool of tools) {
        const dialect = tool.inputSchema.properties.dialect;
        if (dialect) {
          expect(dialect.default).toBeDefined();
          expect(dialect.enum).toContain(dialect.default);
        }
      }
    });
  });

  describe("Type safety", () => {
    it("should have proper type annotations in properties", () => {
      const checkProperty = (schema: any, path: string[]) => {
        let obj: any = schema.inputSchema.properties;
        for (const key of path) {
          obj = obj[key];
          if (!obj) return;
        }
        expect(obj.type || obj.enum || obj.oneOf || obj.const).toBeDefined();
      };

      checkProperty(BUILD_REGEX_SCHEMA, ["input"]);
      checkProperty(BUILD_REGEX_SCHEMA, ["dialect"]);
      checkProperty(TEST_REGEX_SCHEMA, ["pattern"]);
      checkProperty(TEST_REGEX_SCHEMA, ["cases"]);
    });

    it("should define constraints on numeric properties", () => {
      const cases = TEST_REGEX_SCHEMA.inputSchema.properties.cases;
      expect(cases.minItems).toBeDefined();
      expect(cases.maxItems).toBeDefined();

      const timeout = TEST_REGEX_SCHEMA.inputSchema.properties.timeoutMs;
      expect(timeout.minimum).toBeDefined();
      expect(timeout.maximum).toBeDefined();
    });

    it("should define constraints on string properties", () => {
      const search =
        LIBRARY_LIST_SCHEMA.inputSchema.properties.filter.properties.search;
      expect(search.maxLength).toBeDefined();
    });
  });

  describe("Description completeness", () => {
    it("should have schema structure for all properties", () => {
      const checkSchemaStructure = (schema: any, toolName: string) => {
        const props = schema.inputSchema.properties;
        for (const [key, prop] of Object.entries(props)) {
          if (typeof prop === "object" && prop !== null) {
            // Properties should have some schema indicator
            const hasSchema =
              (prop as any).type ||
              (prop as any).enum ||
              (prop as any).oneOf ||
              (prop as any).properties ||
              (prop as any).$ref;
            expect(hasSchema).toBeDefined();
          }
        }
      };

      checkSchemaStructure(BUILD_REGEX_SCHEMA, "build_regex");
      checkSchemaStructure(TEST_REGEX_SCHEMA, "test_regex");
      checkSchemaStructure(LINT_REGEX_SCHEMA, "lint_regex");
    });

    it("should have meaningful tool descriptions", () => {
      const tools = ALL_TOOLS;
      for (const tool of tools) {
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.description).not.toBe("Tool description");
      }
    });
  });
});
