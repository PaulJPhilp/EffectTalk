import * as cheerio from "cheerio";
import { Effect } from "effect";
import { JsonService, validateAgainstSchema } from "effect-json";
import { HtmlError } from "@/effect-html/errors.js";
import { HtmlMetadataSchema, type HtmlMetadata } from "@/effect-html/schemas.js";

export interface HtmlServiceSchema {
  /**
   * Parse HTML content into a CheerioAPI instance
   */
  readonly parse: (
    html: string
  ) => Effect.Effect<cheerio.CheerioAPI, HtmlError>;

  /**
   * Extract metadata (title, description, etc.) from HTML content
   */
  readonly extractMetadata: (
    html: string
  ) => Effect.Effect<HtmlMetadata, HtmlError>;

  /**
   * Extract JSON-LD data from HTML content
   */
  readonly extractJsonLd: (
    html: string
  ) => Effect.Effect<Array<unknown>, HtmlError>;
}

export class HtmlService extends Effect.Service<HtmlServiceSchema>()(
  "HtmlService",
  {
    effect: Effect.gen(function* () {
      const jsonService = yield* JsonService;

      const parse = (html: string) =>
        Effect.try({
          try: () => cheerio.load(html),
          catch: (error) =>
            new HtmlError({
              reason: `Failed to parse HTML: ${error instanceof Error ? error.message : String(error)}`,
              cause: error,
            }),
        });

      const extractMetadata = (html: string) =>
        Effect.gen(function* () {
          const $ = yield* parse(html);

          const rawMetadata = {
            title:
              $("title").text() ||
              $('meta[property="og:title"]').attr("content") ||
              undefined,
            description:
              $('meta[name="description"]').attr("content") ||
              $('meta[property="og:description"]').attr("content") ||
              undefined,
            keywords: ($('meta[name="keywords"]').attr("content") || "")
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean),
            favicon:
              $('link[rel="icon"]').attr("href") ||
              $('link[rel="shortcut icon"]').attr("href") ||
              undefined,
            openGraph: {} as Record<string, string>,
          };

          $('meta[property^="og:"]').each((_, element) => {
            const property = $(element).attr("property");
            const content = $(element).attr("content");
            if (property && content) {
              rawMetadata.openGraph[property.replace("og:", "")] = content;
            }
          });

          return yield* validateAgainstSchema(
            HtmlMetadataSchema,
            rawMetadata
          ).pipe(
            Effect.mapError(
              (error) =>
                new HtmlError({
                  reason: `Metadata validation failed: ${error instanceof Error ? error.message : String(error)}`,
                  cause: error,
                })
            )
          );
        });

      const extractJsonLd = (html: string) =>
        Effect.gen(function* () {
          const $ = yield* parse(html);
          const scripts = $('script[type="application/ld+json"]');
          const results: Array<unknown> = [];

          for (const element of scripts.toArray()) {
            const content = $(element).text();
            if (content) {
              const parsed = yield* jsonService.parse("json", content).pipe(
                Effect.mapError(
                  (error) =>
                    new HtmlError({
                      reason: `Failed to parse JSON-LD: ${error instanceof Error ? error.message : String(error)}`,
                      cause: error,
                    })
                )
              );
              results.push(parsed);
            }
          }

          return results;
        });

      return {
        parse,
        extractMetadata,
        extractJsonLd,
      };
    }),
  }
) {}

export const HtmlServiceLayer = HtmlService.Default;
