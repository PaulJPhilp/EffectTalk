/**
 * AST node type tests for effect-liquid
 *
 * Tests AST node structure and type correctness
 */

import { expect, it, describe } from "vitest";
import type {
  TextNode,
  VariableNode,
  FilterNode,
  TagNode,
  IfNode,
  UnlessNode,
  ForNode,
  CaseNode,
  WhenNode,
  AssignNode,
  CaptureNode,
  CommentNode,
  IncludeNode,
  RenderNode,
  AstNode,
} from "../../src/ast.js";

describe("AST Node Types", () => {
  describe("TextNode", () => {
    it("should create text node", () => {
      const node: TextNode = {
        type: "text",
        value: "Hello, world!",
      };
      expect(node.type).toBe("text");
      expect(node.value).toBe("Hello, world!");
    });

    it("should include position metadata", () => {
      const node: TextNode = {
        type: "text",
        value: "test",
        position: 10,
        line: 2,
        column: 5,
      };
      expect(node.position).toBe(10);
      expect(node.line).toBe(2);
      expect(node.column).toBe(5);
    });

    it("should handle empty text", () => {
      const node: TextNode = {
        type: "text",
        value: "",
      };
      expect(node.value).toBe("");
    });

    it("should handle special characters", () => {
      const node: TextNode = {
        type: "text",
        value: "\n\t<>&\"'",
      };
      expect(node.value).toBe("\n\t<>&\"'");
    });
  });

  describe("VariableNode", () => {
    it("should create variable node", () => {
      const node: VariableNode = {
        type: "variable",
        name: "username",
      };
      expect(node.type).toBe("variable");
      expect(node.name).toBe("username");
    });

    it("should include filters", () => {
      const node: VariableNode = {
        type: "variable",
        name: "text",
        filters: [
          { name: "upcase", args: [] },
          { name: "truncate", args: [10] },
        ],
      };
      expect(node.filters).toHaveLength(2);
      expect(node.filters?.[0]).toEqual({ name: "upcase", args: [] });
      expect(node.filters?.[1]).toEqual({ name: "truncate", args: [10] });
    });

    it("should support dotted variable names", () => {
      const node: VariableNode = {
        type: "variable",
        name: "user.profile.email",
      };
      expect(node.name).toBe("user.profile.email");
    });

    it("should support array indexing", () => {
      const node: VariableNode = {
        type: "variable",
        name: "items[0].name",
      };
      expect(node.name).toBe("items[0].name");
    });
  });

  describe("FilterNode", () => {
    it("should create filter node", () => {
      const filter: FilterNode = {
        name: "upcase",
        args: [],
      };
      expect(filter.name).toBe("upcase");
      expect(filter.args).toHaveLength(0);
    });

    it("should include filter arguments", () => {
      const filter: FilterNode = {
        name: "truncate",
        args: [50, "..."],
      };
      expect(filter.args).toEqual([50, "..."]);
    });

    it("should handle various argument types", () => {
      const filter: FilterNode = {
        name: "complex",
        args: [42, "text", true, null, { key: "value" }],
      };
      expect(filter.args).toHaveLength(5);
      expect(filter.args[0]).toBe(42);
      expect(filter.args[1]).toBe("text");
      expect(filter.args[2]).toBe(true);
      expect(filter.args[3]).toBe(null);
      expect(filter.args[4]).toEqual({ key: "value" });
    });
  });

  describe("TagNode", () => {
    it("should create tag node", () => {
      const node: TagNode = {
        type: "tag",
        name: "assign",
        args: ["x", "10"],
        body: [],
      };
      expect(node.type).toBe("tag");
      expect(node.name).toBe("assign");
      expect(node.args).toEqual(["x", "10"]);
      expect(node.body).toHaveLength(0);
    });

    it("should include trimming flags", () => {
      const node: TagNode = {
        type: "tag",
        name: "if",
        args: ["condition"],
        body: [],
        trimLeft: true,
        trimRight: false,
      };
      expect(node.trimLeft).toBe(true);
      expect(node.trimRight).toBe(false);
    });

    it("should include position metadata", () => {
      const node: TagNode = {
        type: "tag",
        name: "test",
        args: [],
        body: [],
        position: 20,
        line: 3,
      };
      expect(node.position).toBe(20);
      expect(node.line).toBe(3);
    });
  });

  describe("IfNode", () => {
    it("should create if node", () => {
      const node: IfNode = {
        type: "if",
        condition: "show",
        body: [],
      };
      expect(node.type).toBe("if");
      expect(node.condition).toBe("show");
      expect(node.body).toHaveLength(0);
    });

    it("should include elsif branches", () => {
      const node: IfNode = {
        type: "if",
        condition: "a",
        body: [],
        elsif: [
          { condition: "b", body: [] },
          { condition: "c", body: [] },
        ],
      };
      expect(node.elsif).toHaveLength(2);
      expect(node.elsif?.[0].condition).toBe("b");
      expect(node.elsif?.[1].condition).toBe("c");
    });

    it("should include else body", () => {
      const node: IfNode = {
        type: "if",
        condition: "test",
        body: [],
        elseBody: [{ type: "text", value: "else" }],
      };
      expect(node.elseBody).toHaveLength(1);
      expect(node.elseBody?.[0].type).toBe("text");
    });

    it("should support complete if/elsif/else structure", () => {
      const node: IfNode = {
        type: "if",
        condition: "a",
        body: [{ type: "text", value: "a" }],
        elsif: [
          { condition: "b", body: [{ type: "text", value: "b" }] },
          { condition: "c", body: [{ type: "text", value: "c" }] },
        ],
        elseBody: [{ type: "text", value: "default" }],
      };
      expect(node.condition).toBe("a");
      expect(node.elsif).toHaveLength(2);
      expect(node.elseBody).toBeDefined();
    });
  });

  describe("UnlessNode", () => {
    it("should create unless node", () => {
      const node: UnlessNode = {
        type: "unless",
        condition: "disabled",
        body: [],
      };
      expect(node.type).toBe("unless");
      expect(node.condition).toBe("disabled");
      expect(node.body).toHaveLength(0);
    });

    it("should include body content", () => {
      const node: UnlessNode = {
        type: "unless",
        condition: "hidden",
        body: [{ type: "text", value: "visible" }],
      };
      expect(node.body).toHaveLength(1);
      expect(node.body[0].type).toBe("text");
    });
  });

  describe("ForNode", () => {
    it("should create for node", () => {
      const node: ForNode = {
        type: "for",
        variable: "item",
        collection: "items",
        body: [],
      };
      expect(node.type).toBe("for");
      expect(node.variable).toBe("item");
      expect(node.collection).toBe("items");
    });

    it("should include limit and offset", () => {
      const node: ForNode = {
        type: "for",
        variable: "item",
        collection: "items",
        body: [],
        limit: 10,
        offset: 5,
      };
      expect(node.limit).toBe(10);
      expect(node.offset).toBe(5);
    });

    it("should support reversed iteration", () => {
      const node: ForNode = {
        type: "for",
        variable: "item",
        collection: "items",
        body: [],
        reversed: true,
      };
      expect(node.reversed).toBe(true);
    });

    it("should support all modifiers", () => {
      const node: ForNode = {
        type: "for",
        variable: "x",
        collection: "arr",
        body: [],
        limit: 5,
        offset: 2,
        reversed: true,
      };
      expect(node.limit).toBe(5);
      expect(node.offset).toBe(2);
      expect(node.reversed).toBe(true);
    });
  });

  describe("CaseNode", () => {
    it("should create case node", () => {
      const node: CaseNode = {
        type: "case",
        expression: "status",
        when: [],
      };
      expect(node.type).toBe("case");
      expect(node.expression).toBe("status");
      expect(node.when).toHaveLength(0);
    });

    it("should include when branches", () => {
      const node: CaseNode = {
        type: "case",
        expression: "color",
        when: [
          { values: ["red"], body: [] },
          { values: ["blue", "navy"], body: [] },
        ],
      };
      expect(node.when).toHaveLength(2);
      expect(node.when[0].values).toEqual(["red"]);
      expect(node.when[1].values).toEqual(["blue", "navy"]);
    });

    it("should include else body", () => {
      const node: CaseNode = {
        type: "case",
        expression: "test",
        when: [],
        elseBody: [{ type: "text", value: "default" }],
      };
      expect(node.elseBody).toBeDefined();
      expect(node.elseBody?.[0].value).toBe("default");
    });
  });

  describe("WhenNode", () => {
    it("should create when node", () => {
      const node: WhenNode = {
        values: ["a", "b"],
        body: [],
      };
      expect(node.values).toEqual(["a", "b"]);
      expect(node.body).toHaveLength(0);
    });

    it("should support multiple values", () => {
      const node: WhenNode = {
        values: [1, 2, 3, 4],
        body: [{ type: "text", value: "matched" }],
      };
      expect(node.values).toHaveLength(4);
      expect(node.body).toHaveLength(1);
    });
  });

  describe("AssignNode", () => {
    it("should create assign node", () => {
      const node: AssignNode = {
        type: "assign",
        variable: "x",
        value: 10,
      };
      expect(node.type).toBe("assign");
      expect(node.variable).toBe("x");
      expect(node.value).toBe(10);
    });

    it("should support various value types", () => {
      const values = [
        { variable: "a", value: "string" },
        { variable: "b", value: 42 },
        { variable: "c", value: true },
        { variable: "d", value: [1, 2, 3] },
        { variable: "e", value: { key: "val" } },
      ];

      values.forEach(({ variable, value }) => {
        const node: AssignNode = { type: "assign", variable, value };
        expect(node.value).toEqual(value);
      });
    });
  });

  describe("CaptureNode", () => {
    it("should create capture node", () => {
      const node: CaptureNode = {
        type: "capture",
        variable: "output",
        body: [],
      };
      expect(node.type).toBe("capture");
      expect(node.variable).toBe("output");
      expect(node.body).toHaveLength(0);
    });

    it("should include body content", () => {
      const node: CaptureNode = {
        type: "capture",
        variable: "result",
        body: [{ type: "text", value: "captured" }],
      };
      expect(node.body).toHaveLength(1);
      expect(node.body[0].value).toBe("captured");
    });
  });

  describe("CommentNode", () => {
    it("should create comment node", () => {
      const node: CommentNode = {
        type: "comment",
        content: "This is a comment",
      };
      expect(node.type).toBe("comment");
      expect(node.content).toBe("This is a comment");
    });

    it("should preserve comment content as-is", () => {
      const node: CommentNode = {
        type: "comment",
        content: "{% if %}this should not be parsed{% endif %}",
      };
      expect(node.content).toContain("{% if %}");
    });
  });

  describe("IncludeNode", () => {
    it("should create include node", () => {
      const node: IncludeNode = {
        type: "include",
        template: "header",
      };
      expect(node.type).toBe("include");
      expect(node.template).toBe("header");
    });

    it("should include with object", () => {
      const node: IncludeNode = {
        type: "include",
        template: "user",
        with: { name: "Alice", age: 30 },
      };
      expect(node.with).toEqual({ name: "Alice", age: 30 });
    });

    it("should include for iteration", () => {
      const node: IncludeNode = {
        type: "include",
        template: "item",
        for: "items",
      };
      expect(node.for).toBe("items");
    });
  });

  describe("RenderNode", () => {
    it("should create render node", () => {
      const node: RenderNode = {
        type: "render",
        template: "component",
      };
      expect(node.type).toBe("render");
      expect(node.template).toBe("component");
    });

    it("should include with object", () => {
      const node: RenderNode = {
        type: "render",
        template: "card",
        with: { title: "Hello", content: "World" },
      };
      expect(node.with).toEqual({ title: "Hello", content: "World" });
    });
  });

  describe("AstNode union type", () => {
    it("should accept all node types", () => {
      const nodes: AstNode[] = [
        { type: "text", value: "test" },
        { type: "variable", name: "test" },
        { type: "tag", name: "test", args: [], body: [] },
        { type: "if", condition: "test", body: [] },
        { type: "unless", condition: "test", body: [] },
        { type: "for", variable: "x", collection: "y", body: [] },
        { type: "case", expression: "test", when: [] },
        { type: "assign", variable: "x", value: 1 },
        { type: "capture", variable: "x", body: [] },
        { type: "comment", content: "test" },
        { type: "include", template: "test" },
        { type: "render", template: "test" },
      ];

      expect(nodes).toHaveLength(12);
      expect(nodes.every((n) => typeof n.type === "string")).toBe(true);
    });
  });
});
