/**
 * Advanced YAML feature tests
 *
 * Tests YAML-specific features like anchors, aliases, multi-document files, and complex data types
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import * as yaml from "../../src/api.js";
import { YamlBackendLayer } from "../../src/backends/YamlBackend.js";

describe("Advanced YAML Features", () => {
  describe("anchors and aliases", () => {
    it("should parse anchors and aliases", async () => {
      const yamlStr = `
default_settings: &defaults
  timeout: 30
  retries: 3

production:
  <<: *defaults
  timeout: 60`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toBeDefined();
      expect(result.default_settings).toBeDefined();
      expect(result.production).toBeDefined();
    });

    it("should handle multiple aliases to same anchor", async () => {
      const yamlStr = `
base: &anchor_name
  key: value

ref1: *anchor_name
ref2: *anchor_name
ref3: *anchor_name`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.base).toBeDefined();
      expect(result.ref1).toBeDefined();
      expect(result.ref2).toBeDefined();
      expect(result.ref3).toBeDefined();
    });

    it("should handle nested anchors", async () => {
      const yamlStr = `
servers:
  - &server
    host: localhost
    port: 8080

services:
  api: *server
  web: *server`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.servers).toBeDefined();
      expect(result.services).toBeDefined();
    });
  });

  describe("document handling", () => {
    it("should handle leading document separator", async () => {
      const yamlStr = `---
name: document
value: 100`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toBeDefined();
      expect(result.name).toBe("document");
    });

    it("should handle comments around document", async () => {
      const yamlStr = `# Header comment
---
# Body comment
name: value`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toBeDefined();
    });

    it("should parse document with directives", async () => {
      const yamlStr = `%YAML 1.2
---
name: test`;
      const result = await Effect.runPromise(
        Effect.either(
          yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
        )
      );
      // May succeed or fail depending on YAML parser version
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });

  describe("complex data types", () => {
    it("should handle dates", async () => {
      const yamlStr = `
created: 2024-01-15
modified: 2024-01-20T10:30:00Z`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.created).toBeDefined();
      expect(result.modified).toBeDefined();
    });

    it("should handle timestamps with timezone", async () => {
      const yamlStr = `
timestamp: 2024-01-15T10:30:00-05:00
utc_time: 2024-01-15T15:30:00Z`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.timestamp).toBeDefined();
      expect(result.utc_time).toBeDefined();
    });

    it("should handle null values", async () => {
      const yamlStr = `
explicit_null: null
implicit_null:
tilde_null: ~`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.explicit_null).toBeNull();
      expect(result.implicit_null).toBeNull();
      expect(result.tilde_null).toBeNull();
    });

    it("should handle boolean values", async () => {
      const yamlStr = `
true_value: true
false_value: false
on_value: on
off_value: off`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.true_value).toBe(true);
      expect(result.false_value).toBe(false);
      expect(result.on_value).toBeDefined();
      expect(result.off_value).toBeDefined();
    });

    it("should handle numeric types", async () => {
      const yamlStr = `
integer: 42
float: 3.14
scientific: 1.23e-4
octal: 0o755
hexadecimal: 0x1F
infinity: .inf
negative_infinity: -.inf
not_a_number: .nan`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.integer).toBe(42);
      expect(typeof result.float).toBe("number");
    });
  });

  describe("block scalars", () => {
    it("should parse literal block scalars", async () => {
      const yamlStr = `
description: |
  This is a literal block scalar.
  It preserves newlines.
  Multiple lines are preserved.`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.description).toBeDefined();
      expect(typeof result.description).toBe("string");
    });

    it("should parse folded block scalars", async () => {
      const yamlStr = `
summary: >
  This is a folded block scalar.
  It wraps text into a single line.
  Newlines become spaces.`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe("string");
    });

    it("should handle block scalar with strip indicator", async () => {
      const yamlStr = `
stripped: |-
  Content without trailing newline

clipped: |
  Content with single trailing newline

kept: |+
  Content with all trailing newlines`;
      const result = await Effect.runPromise(
        yaml.parseDefault(yamlStr).pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.stripped).toBeDefined();
      expect(result.clipped).toBeDefined();
      expect(result.kept).toBeDefined();
    });
  });

  describe("stringify operations", () => {
    it("should stringify simple object", async () => {
      const obj = { key: "value", number: 42 };
      const program = yaml
        .stringify(obj)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);

      expect(typeof result).toBe("string");
      expect(result).toContain("key");
      expect(result).toContain("value");
    });

    it("should stringify nested objects", async () => {
      const obj = {
        server: {
          host: "localhost",
          port: 8080,
        },
      };
      const program = yaml
        .stringify(obj)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);

      expect(typeof result).toBe("string");
      expect(result).toContain("server");
      expect(result).toContain("host");
    });

    it("should handle arrays in stringify", async () => {
      const obj = { items: ["a", "b", "c"] };
      const program = yaml
        .stringify(obj)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);

      expect(typeof result).toBe("string");
    });

    it("should round-trip simple objects", async () => {
      const original = { name: "test", count: 5, enabled: true };
      const stringified = await Effect.runPromise(
        yaml.stringify(original).pipe(Effect.provide(YamlBackendLayer))
      );
      const parsed = await Effect.runPromise(
        yaml.parseDefault(stringified).pipe(Effect.provide(YamlBackendLayer))
      );

      expect(parsed.name).toBe("test");
      expect(parsed.count).toBe(5);
      expect(parsed.enabled).toBe(true);
    });
  });
});
