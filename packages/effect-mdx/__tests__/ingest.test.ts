import { FileSystem } from "@effect/platform";
import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import { MdxConfigService } from "../src/config";
import { ingestPatterns, processMdxFiles } from "../src/ingest";

const MockFileSystemLive = Layer.succeed(FileSystem.FileSystem, {
  readFileString: (path: string) => {
    if (path.includes("pattern-1.mdx")) {
      return Effect.succeed(`---
id: pattern-1
title: "Pattern 1"
description: "This is the first pattern."
moduleId: "module-1"
stage: 1
---

# Pattern 1 Content`);
    } else if (path.includes("pattern-2.mdx")) {
      return Effect.succeed(`---
id: pattern-2
title: "Pattern 2"
description: "This is the second pattern."
moduleId: "module-1"
stage: 2
---

# Pattern 2 Content`);
    }
    return Effect.fail(new Error("File not found"));
  },
  writeFileString: (path: string, content: string) => {
    // For testing, we just succeed. In a real mock, you might store this.
    return Effect.succeed(undefined);
  },
  makeDirectory: (path: string, options?: { recursive?: boolean }) =>
    Effect.succeed(undefined),
  exists: (path: string) => {
    if (path.includes("./patterns")) {
      return Effect.succeed(true);
    }
    return Effect.succeed(false);
  },
  remove: (path: string, options?: { recursive?: boolean }) =>
    Effect.succeed(undefined),
  readDirectory: (path: string) =>
    Effect.succeed(["pattern-1.mdx", "pattern-2.mdx"]),
});

const MdxConfigServiceLive = Layer.succeed(MdxConfigService, {
  getConfig: () => ({
    remarkPlugins: [],
    rehypePlugins: [],
    sanitize: false,
    slug: false,
    autolinkHeadings: false,
  }),
});

describe("Ingestion Logic", () => {
  it("should process a list of MDX files and return a catalog", async () => {
    const files = [
      {
        path: "pattern-1.mdx",
        content: `---
id: pattern-1
title: "Pattern 1"
description: "This is the first pattern."
moduleId: "module-1"
stage: 1
---

# Pattern 1 Content`,
      },
      {
        path: "pattern-2.mdx",
        content: `---
id: pattern-2
title: "Pattern 2"
description: "This is the second pattern."
moduleId: "module-1"
stage: 2
---

# Pattern 2 Content`,
      },
    ];

    const program = processMdxFiles(files).pipe(
      Effect.provide(
        Layer.provide(
          MdxServiceLayer,
          Layer.merge(MockFileSystemLive, MdxConfigServiceLive)
        )
      )
    );

    const result = await Effect.runPromise(program);

    expect(result.patterns).toHaveLength(2);
    expect(result.patterns[0].id).toBe("pattern-1");
    expect(result.patterns[1].title).toBe("Pattern 2");
    expect(result.enrichedPatterns["pattern-1"].content).toBe(
      "\n# Pattern 1 Content"
    );
  });

  it("should ingest patterns from the filesystem and write a catalog", async () => {
    const program = ingestPatterns().pipe(
      Effect.provide(MockFileSystemLive),
      Effect.provide(
        Layer.provide(
          MdxServiceLayer,
          Layer.merge(MockFileSystemLive, MdxConfigServiceLive)
        )
      )
    );

    const result = await Effect.runPromise(program);

    // This test is primarily to ensure the e2e flow works with the mock FS.
    // The actual catalog content is tested in the previous test.
    expect(result).toBeUndefined();
  });
});
