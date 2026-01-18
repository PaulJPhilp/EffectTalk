import { FileSystem } from "@effect/platform";
import { Effect } from "effect";
import { parse as parseJson } from "effect-json";
import type { EnrichedPattern, ModuleView, Pattern } from "./catalog-types.js";
import { CatalogSchema } from "./schemas/catalog-schemas.js";

export interface CatalogService {
  readonly byModule: (moduleId: string) => Effect.Effect<Pattern[], never>;
  readonly getModuleView: (
    moduleId: string
  ) => Effect.Effect<ModuleView, never>;
  readonly getById: (
    patternId: string
  ) => Effect.Effect<EnrichedPattern, Error>;
  readonly getAll: () => Effect.Effect<Pattern[], never>;
}

export class CatalogService extends Effect.Service<CatalogService>()(
  "CatalogService",
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      // In-memory catalog implementation
      let patterns: Pattern[] = [];
      let enrichedPatterns: Map<string, EnrichedPattern> = new Map();

      // Try to read the catalog from the JSON file created by ingestion
      const catalogExists = yield* fs.exists("./catalog.json");

      if (!catalogExists) {
        console.warn(
          "Catalog not found. Run 'bun run ingest:patterns' to generate it."
        );
      } else {
        const catalogJson = yield* fs.readFileString("./catalog.json");
        const catalogData = yield* parseJson(CatalogSchema, catalogJson).pipe(
          Effect.mapError((err) => {
            console.error(`Failed to load catalog: ${err.message}`);
            return err;
          }),
          Effect.catchAll(() =>
            Effect.succeed({
              patterns: [],
              enrichedPatterns: {},
              generatedAt: new Date().toISOString(),
            })
          )
        );

        patterns = (catalogData.patterns || []) as Pattern[];
        enrichedPatterns = new Map<string, EnrichedPattern>(
          Object.entries(catalogData.enrichedPatterns || {})
        );
      }

      return {
        byModule: (moduleId: string): Effect.Effect<Pattern[], never> => {
          return Effect.succeed(
            patterns.filter((p) => p.moduleId === moduleId)
          );
        },
        getModuleView: (moduleId: string): Effect.Effect<ModuleView, never> => {
          const modulePatterns = patterns.filter(
            (p) => p.moduleId === moduleId
          );

          // Group by stage
          const stagesMap = new Map<number, Pattern[]>();
          for (const pattern of modulePatterns) {
            const stagePatterns = stagesMap.get(pattern.stage) || [];
            stagePatterns.push(pattern);
            stagesMap.set(pattern.stage, stagePatterns);
          }

          // Sort patterns within each stage (assuming they have some order)
          const stages = Array.from(stagesMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([stage, patterns]) => ({
              stage,
              title: `Stage ${stage}`, // Placeholder - could be enhanced
              patterns: patterns.sort((a, b) => a.id.localeCompare(b.id)),
            }));

          return Effect.succeed({
            moduleId,
            stages,
          });
        },
        getById: (patternId: string): Effect.Effect<EnrichedPattern, Error> => {
          const pattern = enrichedPatterns.get(patternId);
          if (!pattern) {
            return Effect.fail(new Error(`Pattern not found: ${patternId}`));
          }
          return Effect.succeed(pattern);
        },
        getAll: (): Effect.Effect<Pattern[], never> => {
          return Effect.succeed([...patterns]);
        },
      };
    }),
  }
) {}

export const CatalogLayer = CatalogService.Default;
