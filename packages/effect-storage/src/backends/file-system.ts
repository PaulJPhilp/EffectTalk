/**
 * FileSystem storage backend for effect-storage
 * @packageDocumentation
 */

import { Effect, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import type { StorageBackend, StorageConfig } from "../types.js";
import { NotFoundError, StorageError, ValidationError } from "../errors.js";
import {
  getContentPath,
  getMetadataPath,
  getItemDirectory,
  ensureDirectory,
  extractIdsFromDirectory,
} from "../utils/path-utils.js";
import { parse as parseJson, stringify as stringifyJson } from "effect-json";

/**
 * Create a FileSystem-backed storage backend.
 *
 * Stores content and metadata in separate files with optional organization by hash prefix.
 *
 * @template TContent The type of content being stored
 * @template TMeta The type of metadata associated with content
 *
 * @param config Storage configuration
 * @returns A storage backend using FileSystem
 *
 * @example
 * ```typescript
 * import { Schema } from "effect"
 * import { createFileSystemBackend } from "effect-storage"
 *
 * const config = {
 *   basePath: "./storage",
 *   contentExtension: "txt",
 *   contentSchema: Schema.String,
 *   metadataSchema: Schema.Struct({ version: Schema.Number }),
 *   organizationStrategy: "flat" as const,
 * }
 *
 * const backend = createFileSystemBackend(config)
 * ```
 */
export const createFileSystemBackend = <TContent, TMeta>(
  config: StorageConfig<TContent, TMeta>
): Effect.Effect<
  StorageBackend<TContent, TMeta>,
  never,
  FileSystem.FileSystem
> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const strategy = config.organizationStrategy ?? "flat";
    const hashDepth = config.hashDepth ?? 2;
    const createMissingDirs = config.createMissingDirectories ?? true;

    // Ensure base directory exists (best effort - ignore errors if unable to check)
    if (createMissingDirs) {
      yield* ensureDirectory(fs, config.basePath).pipe(
        Effect.orElse(() => Effect.void)
      );
    }

    return {
      save: (id, content, metadata) =>
        Effect.gen(function* () {
          // Validate content by serializing it
          const contentString = yield* stringifyJson(
            config.contentSchema,
            content
          ).pipe(
            Effect.mapError(
              (err) =>
                new ValidationError({
                  message: `Failed to validate content: ${String(err)}`,
                  id,
                  field: "content",
                  cause: err instanceof Error ? err : undefined,
                })
            )
          );

          // Validate metadata by serializing it
          const metadataString = yield* stringifyJson(
            config.metadataSchema,
            metadata
          ).pipe(
            Effect.mapError(
              (err) =>
                new ValidationError({
                  message: `Failed to validate metadata: ${String(err)}`,
                  id,
                  field: "metadata",
                  cause: err instanceof Error ? err : undefined,
                })
            )
          );

          // Ensure directory exists
          const itemDir = getItemDirectory(
            config.basePath,
            id,
            strategy,
            hashDepth
          );
          if (createMissingDirs) {
            yield* ensureDirectory(fs, itemDir).pipe(
              Effect.orElse(() => Effect.void)
            );
          }

          // Write content file
          const contentPath = getContentPath(
            config.basePath,
            id,
            config.contentExtension,
            strategy,
            hashDepth
          );
          yield* fs.writeFileString(contentPath, contentString).pipe(
            Effect.mapError(
              (err) =>
                new StorageError({
                  message: `Failed to write content file: ${String(err)}`,
                  operation: "save",
                  id,
                  path: contentPath,
                  cause: err instanceof Error ? err : undefined,
                })
            )
          );

          // Write metadata file
          const metadataPath = getMetadataPath(
            config.basePath,
            id,
            strategy,
            hashDepth
          );
          yield* fs.writeFileString(metadataPath, metadataString).pipe(
            Effect.mapError(
              (err) =>
                new StorageError({
                  message: `Failed to write metadata file: ${String(err)}`,
                  operation: "save",
                  id,
                  path: metadataPath,
                  cause: err instanceof Error ? err : undefined,
                })
            )
          );
        }),

      load: (id) =>
        Effect.gen(function* () {
          const contentPath = getContentPath(
            config.basePath,
            id,
            config.contentExtension,
            strategy,
            hashDepth
          );
          const metadataPath = getMetadataPath(
            config.basePath,
            id,
            strategy,
            hashDepth
          );

          // Load content
          const contentString = yield* fs.readFileString(contentPath).pipe(
            Effect.mapError((err: unknown) => {
              const platformErr = err as Record<string, unknown>;
              if (platformErr?.reason === "NotFound") {
                return new NotFoundError({
                  id,
                  basePath: config.basePath,
                }) as NotFoundError | StorageError;
              }
              return new StorageError({
                message: `Failed to read content file: ${err instanceof Error ? err.message : String(err)}`,
                operation: "load",
                id,
                path: contentPath,
                cause: err instanceof Error ? err : undefined,
              });
            })
          );

          // Parse content
          const content = yield* parseJson(
            config.contentSchema,
            contentString
          ).pipe(
            Effect.mapError(
              (err) =>
                new ValidationError({
                  message: `Failed to parse content: ${String(err)}`,
                  id,
                  field: "content",
                  cause: err instanceof Error ? err : undefined,
                })
            )
          );

          // Load metadata
          const metadataString = yield* fs.readFileString(metadataPath).pipe(
            Effect.mapError((err: unknown) => {
              const platformErr = err as Record<string, unknown>;
              if (platformErr?.reason === "NotFound") {
                return new NotFoundError({
                  id,
                  basePath: config.basePath,
                }) as NotFoundError | StorageError;
              }
              return new StorageError({
                message: `Failed to read metadata file: ${err instanceof Error ? err.message : String(err)}`,
                operation: "load",
                id,
                path: metadataPath,
                cause: err instanceof Error ? err : undefined,
              });
            })
          );

          // Parse metadata
          const metadata = yield* parseJson(
            config.metadataSchema,
            metadataString
          ).pipe(
            Effect.mapError(
              (err) =>
                new ValidationError({
                  message: `Failed to parse metadata: ${String(err)}`,
                  id,
                  field: "metadata",
                  cause: err instanceof Error ? err : undefined,
                })
            )
          );

          return { content, metadata };
        }),

      loadContent: (id) =>
        Effect.gen(function* () {
          const contentPath = getContentPath(
            config.basePath,
            id,
            config.contentExtension,
            strategy,
            hashDepth
          );

          const contentString = yield* fs.readFileString(contentPath).pipe(
            Effect.mapError((err: unknown) => {
              const platformErr = err as Record<string, unknown>;
              if (platformErr?.reason === "NotFound") {
                return new NotFoundError({
                  id,
                  basePath: config.basePath,
                }) as NotFoundError | StorageError;
              }
              return new StorageError({
                message: `Failed to read content file: ${err instanceof Error ? err.message : String(err)}`,
                operation: "loadContent",
                id,
                path: contentPath,
                cause: err instanceof Error ? err : undefined,
              });
            })
          );

          return yield* parseJson(config.contentSchema, contentString).pipe(
            Effect.mapError(
              (err) =>
                new ValidationError({
                  message: `Failed to parse content: ${String(err)}`,
                  id,
                  field: "content",
                  cause: err instanceof Error ? err : undefined,
                })
            )
          );
        }),

      loadMetadata: (id) =>
        Effect.gen(function* () {
          const metadataPath = getMetadataPath(
            config.basePath,
            id,
            strategy,
            hashDepth
          );

          const metadataString = yield* fs.readFileString(metadataPath).pipe(
            Effect.mapError((err: unknown) => {
              const platformErr = err as Record<string, unknown>;
              if (platformErr?.reason === "NotFound") {
                return new NotFoundError({
                  id,
                  basePath: config.basePath,
                }) as NotFoundError | StorageError;
              }
              return new StorageError({
                message: `Failed to read metadata file: ${err instanceof Error ? err.message : String(err)}`,
                operation: "loadMetadata",
                id,
                path: metadataPath,
                cause: err instanceof Error ? err : undefined,
              });
            })
          );

          return yield* parseJson(config.metadataSchema, metadataString).pipe(
            Effect.mapError(
              (err) =>
                new ValidationError({
                  message: `Failed to parse metadata: ${String(err)}`,
                  id,
                  field: "metadata",
                  cause: err instanceof Error ? err : undefined,
                })
            )
          );
        }),

      delete: (id) =>
        Effect.gen(function* () {
          const contentPath = getContentPath(
            config.basePath,
            id,
            config.contentExtension,
            strategy,
            hashDepth
          );
          const metadataPath = getMetadataPath(
            config.basePath,
            id,
            strategy,
            hashDepth
          );

          // Check if item exists with error mapping
          const exists = yield* fs
            .exists(contentPath)
            .pipe(
              Effect.mapError(
                (err) =>
                  new StorageError({
                    message: `Failed to check item existence: ${String(err)}`,
                    operation: "delete",
                    id,
                    path: contentPath,
                    cause: err instanceof Error ? err : undefined,
                  })
              )
            );
          if (!exists) {
            return yield* Effect.fail(
              new NotFoundError({
                id,
                basePath: config.basePath,
              })
            );
          }

          // Delete content file with error mapping
          yield* fs
            .remove(contentPath)
            .pipe(
              Effect.mapError(
                (err) =>
                  new StorageError({
                    message: `Failed to delete content file: ${String(err)}`,
                    operation: "delete",
                    id,
                    path: contentPath,
                    cause: err instanceof Error ? err : undefined,
                  })
              ),
              Effect.asVoid
            );

          // Note: Metadata file is not deleted (orphaned metadata files are harmless)
        }),

      exists: (id) =>
        Effect.gen(function* () {
          const contentPath = getContentPath(
            config.basePath,
            id,
            config.contentExtension,
            strategy,
            hashDepth
          );
          return yield* fs.exists(contentPath).pipe(
            Effect.mapError(
              (err) =>
                new StorageError({
                  message: `Failed to check existence: ${String(err)}`,
                  operation: "list",
                  id,
                  path: contentPath,
                  cause: err instanceof Error ? err : undefined,
                })
            )
          );
        }),

      list: () => extractIdsFromDirectory(fs, config.basePath, strategy),

      listWithMetadata: () =>
        Effect.gen(function* () {
          const ids = yield* extractIdsFromDirectory(
            fs,
            config.basePath,
            strategy
          );
          const items: Array<{ id: string; metadata: TMeta }> = [];

          for (const id of ids) {
            const metadataPath = getMetadataPath(
              config.basePath,
              id,
              strategy,
              hashDepth
            );
            const metadataString = yield* fs
              .readFileString(metadataPath)
              .pipe(Effect.orElse(() => Effect.succeed("{}")));

            const metadata = yield* parseJson(
              config.metadataSchema,
              metadataString
            ).pipe(
              Effect.mapError(
                (err) =>
                  new ValidationError({
                    message: `Failed to parse metadata: ${String(err)}`,
                    id,
                    field: "metadata",
                    cause: err instanceof Error ? err : undefined,
                  })
              )
            );

            items.push({ id, metadata });
          }

          return items as ReadonlyArray<{
            id: string;
            metadata: TMeta;
          }>;
        }),
    };
  });
