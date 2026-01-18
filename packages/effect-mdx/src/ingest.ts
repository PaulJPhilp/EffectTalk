import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { stringify as stringifyJson } from "effect-json";
import type { EnrichedPattern, Pattern } from "./catalog-types.js";
import { defaultMdxConfigLayer } from "./config.js";
import { MdxService, MdxServiceLayer } from "./service.js";
import { CatalogSchema } from "./schemas/catalog-schemas.js";

export const processMdxFiles = (files: { path: string; content: string }[]) =>
  Effect.gen(function* () {
    const mdx = yield* MdxService;
    const patterns: Pattern[] = [];
    const enrichedPatterns: EnrichedPattern[] = [];

    for (const file of files) {
      const parsed = yield* mdx.readMdxAndFrontmatter(file.path);

      const pattern: Pattern = {
        id: (parsed.frontmatter.id as string) || file.path.replace(".mdx", ""),
        title: (parsed.frontmatter.title as string) || "Untitled Pattern",
        description: (parsed.frontmatter.description as string) || "",
        moduleId: (parsed.frontmatter.moduleId as string) || "unknown",
        stage: (parsed.frontmatter.stage as number) || 1,
        contentPath: file.path,
      };

      patterns.push(pattern);
      enrichedPatterns.push({
        ...pattern,
        content: parsed.mdxBody,
      });
    }

    return {
      patterns,
      enrichedPatterns: Object.fromEntries(
        enrichedPatterns.map((p) => [p.id, p])
      ),
      generatedAt: new Date().toISOString(),
    };
  });

export const ingestPatterns = () =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const patternsDir = "./patterns";
    const exists = yield* fs.exists(patternsDir);

    if (!exists) {
      console.log("No patterns directory found.");
      return;
    }

    const entries = yield* fs.readDirectory(patternsDir);
    const files = yield* Effect.forEach(entries, (entry) => {
      const filePath = `${patternsDir}/${entry}`;
      return fs
        .readFileString(filePath)
        .pipe(Effect.map((content) => ({ path: filePath, content })));
    });

    const catalog = yield* processMdxFiles(files);

    // Serialize catalog with schema validation
    const catalogJson = yield* stringifyJson(CatalogSchema, catalog).pipe(
      Effect.mapError((err) => {
        console.error(`Failed to serialize catalog: ${err.message}`);
        return err;
      })
    );

    yield* fs.writeFileString("./catalog.json", catalogJson);

    console.log(`Ingested ${catalog.patterns.length} patterns`);
  });

// Run the ingestion
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const depsLayer = Layer.merge(NodeFileSystem.layer, defaultMdxConfigLayer);
  const runtimeLayer = Layer.provideMerge(MdxServiceLayer, depsLayer);

  Effect.runPromise(ingestPatterns().pipe(Effect.provide(runtimeLayer))).catch(
    console.error
  );
}
