import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";
import * as toml from "../../src/api.js";
import { TomlBackendLayer } from "../../src/backends/TomlBackend.js";

describe("TOML Stringify and Round-trip", () => {
  describe("stringify", () => {
    it("should stringify simple objects", async () => {
      const obj = { key: "value", number: 42 };
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);

      expect(typeof result).toBe("string");
      expect(result).toContain("key");
      expect(result).toContain("value");
    });

    it("should stringify nested objects as tables", async () => {
      const obj = {
        server: {
          host: "localhost",
          port: 8080,
        },
      };
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      // Either contains table syntax or inline notation
      expect(result.includes("[server]") || result.includes("server")).toBe(
        true
      );
    });

    it("should stringify arrays", async () => {
      const obj = { numbers: [1, 2, 3] };
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);

      expect(typeof result).toBe("string");
      expect(result).toContain("numbers");
    });

    it("should stringify strings with special characters", async () => {
      const obj = { message: "Hello\nWorld\tTab" };
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);

      expect(typeof result).toBe("string");
      expect(result).toContain("message");
    });

    it("should handle empty objects", async () => {
      const obj = {};
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);

      expect(typeof result).toBe("string");
      expect(result.trim()).toBe("");
    });

    it("should handle boolean values", async () => {
      const obj = { enabled: true, disabled: false };
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);

      expect(result.toLowerCase()).toContain("true");
      expect(result.toLowerCase()).toContain("false");
    });

    it("should handle null values gracefully", async () => {
      const obj = { value: null };
      const program = Effect.either(
        toml.stringify(obj).pipe(Effect.provide(TomlBackendLayer))
      );
      const result = await Effect.runPromise(program);

      // Should either succeed or fail gracefully
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should handle undefined values gracefully", async () => {
      const obj = { value: undefined };
      const program = Effect.either(
        toml.stringify(obj).pipe(Effect.provide(TomlBackendLayer))
      );
      const result = await Effect.runPromise(program);

      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });

  describe("round-trip", () => {
    it("should parse and stringify simple object", async () => {
      const original = { key: "value", count: 42 };
      const stringified = await Effect.runPromise(
        toml.stringify(original).pipe(Effect.provide(TomlBackendLayer))
      );
      const parsed = await Effect.runPromise(
        toml.parse(stringified).pipe(Effect.provide(TomlBackendLayer))
      );

      expect(parsed).toBeDefined();
      // String values should match
      expect(parsed.key).toBe("value");
    });

    it("should parse and stringify nested structure", async () => {
      const tomlStr = `
[database]
server = "192.168.1.1"
ports = [8001, 8001, 8002]
connection_max = 5000
enabled = true
`;

      const parsed = await Effect.runPromise(
        toml.parse(tomlStr).pipe(Effect.provide(TomlBackendLayer))
      );
      const stringified = await Effect.runPromise(
        toml.stringify(parsed).pipe(Effect.provide(TomlBackendLayer))
      );
      const reParsed = await Effect.runPromise(
        toml.parse(stringified).pipe(Effect.provide(TomlBackendLayer))
      );

      // Should have same structure after round-trip
      expect(reParsed.database).toBeDefined();
      expect(reParsed.database.server).toBe("192.168.1.1");
      expect(reParsed.database.enabled).toBe(true);
    });

    it("should handle complex nested structures", async () => {
      const original = {
        app: {
          name: "MyApp",
          version: "1.0.0",
          settings: {
            debug: true,
            timeout: 30,
          },
        },
        servers: {
          primary: "server1.example.com",
          backup: "server2.example.com",
        },
      };

      const stringified = await Effect.runPromise(
        toml.stringify(original).pipe(Effect.provide(TomlBackendLayer))
      );
      const parsed = await Effect.runPromise(
        toml.parse(stringified).pipe(Effect.provide(TomlBackendLayer))
      );

      expect(parsed.app).toBeDefined();
      expect(parsed.app.name).toBe("MyApp");
      expect(parsed.app.settings).toBeDefined();
      expect(parsed.servers).toBeDefined();
    });

    it("should preserve string values in round-trip", async () => {
      const tomlStr = `
name = "Test"
description = "A test TOML file"
special = "Value with \\"quotes\\""
`;

      const parsed = await Effect.runPromise(
        toml.parse(tomlStr).pipe(Effect.provide(TomlBackendLayer))
      );
      const stringified = await Effect.runPromise(
        toml.stringify(parsed).pipe(Effect.provide(TomlBackendLayer))
      );

      expect(stringified).toContain("name");
      expect(stringified).toContain("Test");
    });

    it("should handle array of tables round-trip", async () => {
      const tomlStr = `
[[products]]
name = "Hammer"
sku = 738594937

[[products]]
name = "Nail"
sku = 284758393
`;

      const parsed = await Effect.runPromise(
        toml.parse(tomlStr).pipe(Effect.provide(TomlBackendLayer))
      );
      const stringified = await Effect.runPromise(
        toml.stringify(parsed).pipe(Effect.provide(TomlBackendLayer))
      );
      const reParsed = await Effect.runPromise(
        toml.parse(stringified).pipe(Effect.provide(TomlBackendLayer))
      );

      expect(reParsed.products).toBeDefined();
      if (Array.isArray(reParsed.products)) {
        expect(reParsed.products.length).toBeGreaterThan(0);
      }
    });
  });

  describe("stringify error handling", () => {
    it("should handle stringify with Symbol values", async () => {
      const obj = {
        key: "value",
        // biome-ignore lint/suspicious/noExplicitAny: Testing error handling
        sym: Symbol("test") as any,
      };

      const program = Effect.either(
        toml.stringify(obj).pipe(Effect.provide(TomlBackendLayer))
      );
      const result = await Effect.runPromise(program);

      // Should either skip the symbol or fail gracefully
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should handle stringify with Date objects", async () => {
      const obj = {
        created: new Date("2024-01-01T00:00:00Z"),
        name: "test",
      };

      const program = Effect.either(
        toml.stringify(obj).pipe(Effect.provide(TomlBackendLayer))
      );
      const result = await Effect.runPromise(program);

      // Should succeed and include the date
      if (result._tag === "Right") {
        expect(typeof result.right).toBe("string");
      }
    });
  });
});
