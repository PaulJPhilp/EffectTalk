import { Effect } from "effect";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as yaml from "../../src/api";
import { YamlBackendLayer } from "../../src/backends/YamlBackend";

describe("YAML API", () => {
  const exampleYaml = readFileSync(
    join(__dirname, "../fixtures/example.yaml"),
    "utf-8"
  );

  it("should parse a YAML string", async () => {
    const program = yaml
      .parse(exampleYaml)
      .pipe(Effect.provide(YamlBackendLayer));
    const result = await Effect.runPromise(program);
    expect(result).toEqual({
      title: "YAML Example",
      owner: {
        name: "Tom Preston-Werner",
        organization: "GitHub",
        bio: "GitHub Cofounder & CEO\nLikes tater tots and beer.\n",
        dob: "1979-05-27T07:32:00-08:00",
      },
      database: {
        server: "192.168.1.1",
        ports: [8001, 8001, 8002],
        connection_max: 5000,
        enabled: true,
      },
      servers: [
        { name: "alpha", ip: "10.0.0.1", dc: "eqdc10" },
        { name: "beta", ip: "10.0.0.2", dc: "eqdc10" },
      ],
      clients: {
        data: [
          ["gamma", "delta"],
          [1, 2],
        ],
        hosts: ["alpha", "omega"],
      },
    });
  });

  it("should stringify a JavaScript object to a YAML string", async () => {
    const obj = {
      title: "YAML Example",
      owner: {
        name: "Tom Preston-Werner",
      },
    };
    const program = yaml.stringify(obj).pipe(Effect.provide(YamlBackendLayer));
    const result = await Effect.runPromise(program);
    expect(result.trim()).toEqual(
      "title: YAML Example\nowner:\n  name: Tom Preston-Werner"
    );
  });

  it("should fail to parse an invalid YAML string", async () => {
    const program = yaml
      .parse("invalid yaml: [")
      .pipe(Effect.provide(YamlBackendLayer));
    const result = await Effect.runPromiseExit(program);
    expect(result._tag).toBe("Failure");
  });
});
