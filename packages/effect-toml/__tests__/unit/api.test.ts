import { Effect } from "effect";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as toml from "../../src/api";
import { TomlBackendLayer } from "../../src/backends/TomlBackend";

describe("TOML API", () => {
  const exampleToml = readFileSync(
    join(__dirname, "../fixtures/example.toml"),
    "utf-8"
  );

  it("should parse a TOML string", async () => {
    const program = toml
      .parse(exampleToml)
      .pipe(Effect.provide(TomlBackendLayer));
    const result = await Effect.runPromise(program);
    expect(result).toEqual({
      title: "TOML Example",
      owner: {
        name: "Tom Preston-Werner",
        organization: "GitHub",
        bio: "GitHub Cofounder & CEO\nLikes tater tots and beer.\n",
        dob: expect.any(Object),
      },
      database: {
        server: "192.168.1.1",
        ports: [8001n, 8001n, 8002n],
        connection_max: 5000n,
        enabled: true,
      },
      servers: {
        alpha: {
          ip: "10.0.0.1",
          dc: "eqdc10",
        },
        beta: {
          ip: "10.0.0.2",
          dc: "eqdc10",
        },
      },
      clients: {
        data: [
          ["gamma", "delta"],
          [1n, 2n],
        ],
        hosts: ["alpha", "omega"],
      },
    });
  });

  it("should stringify a JavaScript object to a TOML string", async () => {
    const obj = {
      title: "TOML Example",
      owner: {
        name: "Tom Preston-Werner",
      },
    };
    const program = toml.stringify(obj).pipe(Effect.provide(TomlBackendLayer));
    const result = await Effect.runPromise(program);
    expect(result.trim()).toEqual(
      "title = 'TOML Example'\nowner.name = 'Tom Preston-Werner'"
    );
  });

  it("should fail to parse an invalid TOML string", async () => {
    const program = toml
      .parse("invalid toml")
      .pipe(Effect.provide(TomlBackendLayer));
    const result = await Effect.runPromiseExit(program);
    expect(result._tag).toBe("Failure");
  });
});
