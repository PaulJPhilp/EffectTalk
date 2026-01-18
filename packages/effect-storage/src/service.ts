/**
 * StorageService implementation for effect-storage
 * @packageDocumentation
 */

import { Effect, Ref } from "effect";
import { FileSystem } from "@effect/platform";
import type { StorageConfig, StorageServiceApi } from "./types.js";
import { createFileSystemBackend } from "./backends/file-system.js";
import { createMemoryBackend } from "./backends/memory.js";

/**
 * Create a file storage API with filesystem backend.
 *
 * Returns an Effect that provides the StorageServiceApi interface.
 * The returned Effect requires FileSystem capability.
 *
 * @template TContent The type of content being stored
 * @template TMeta The type of metadata associated with content
 *
 * @param config Storage configuration including basePath, schemas, and optional caching
 * @returns Effect<StorageServiceApi<TContent, TMeta>, StorageError | ValidationError, FileSystem>
 *
 * @example
 * ```typescript
 * import { Schema, Effect } from "effect"
 * import { createFileStorage } from "effect-storage"
 *
 * const program = Effect.gen(function* () {
 *   const storage = yield* createFileStorage({
 *     basePath: "./storage",
 *     contentExtension: "txt",
 *     contentSchema: Schema.String,
 *     metadataSchema: Schema.Struct({ version: Schema.Number }),
 *   })
 *   yield* storage.save("doc-1", "Hello", { version: 1 })
 * })
 *
 * await Effect.runPromise(program)
 * ```
 */
export const createFileStorage = <TContent, TMeta>(
  config: StorageConfig<TContent, TMeta>
): Effect.Effect<
  StorageServiceApi<TContent, TMeta>,
  never,
  FileSystem.FileSystem
> => {
  return Effect.gen(function* () {
    const backend = yield* createFileSystemBackend(config);
    const cache = config.enableCaching
      ? yield* Ref.make(
          new Map<string, { content: TContent; metadata: TMeta }>()
        )
      : undefined;

    const api: StorageServiceApi<TContent, TMeta> = {
      save: (id, content, metadata) =>
        Effect.gen(function* () {
          yield* backend.save(id, content, metadata);
          if (cache) {
            yield* Ref.update(cache, (c) =>
              new Map(c).set(id, { content, metadata })
            );
          }
        }),

      load: (id) =>
        Effect.gen(function* () {
          if (cache) {
            const cached = yield* Ref.get(cache);
            if (cached.has(id)) {
              return cached.get(id)!;
            }
          }
          const result = yield* backend.load(id);
          if (cache) {
            yield* Ref.update(cache, (c) => new Map(c).set(id, result));
          }
          return result;
        }),

      loadContent: (id) =>
        Effect.gen(function* () {
          if (cache) {
            const cached = yield* Ref.get(cache);
            if (cached.has(id)) {
              return cached.get(id)!.content;
            }
          }
          return yield* backend.loadContent(id);
        }),

      loadMetadata: (id) =>
        Effect.gen(function* () {
          if (cache) {
            const cached = yield* Ref.get(cache);
            if (cached.has(id)) {
              return cached.get(id)!.metadata;
            }
          }
          return yield* backend.loadMetadata(id);
        }),

      delete: (id) =>
        Effect.gen(function* () {
          yield* backend.delete(id);
          if (cache) {
            yield* Ref.update(cache, (c) => {
              const updated = new Map(c);
              updated.delete(id);
              return updated;
            });
          }
        }),

      exists: (id) => backend.exists(id),
      list: () => backend.list(),
      listWithMetadata: () => backend.listWithMetadata(),
      clearCache: () => (cache ? Ref.set(cache, new Map()) : Effect.void),
    };

    return api;
  }) as Effect.Effect<
    StorageServiceApi<TContent, TMeta>,
    never,
    FileSystem.FileSystem
  >;
};

/**
 * Create an in-memory storage API for testing.
 *
 * Returns a pure Effect with no dependencies. Useful for testing and development.
 *
 * @template TContent The type of content being stored
 * @template TMeta The type of metadata associated with content
 *
 * @param config Storage configuration (without basePath)
 * @returns Effect<StorageServiceApi<TContent, TMeta>>
 *
 * @example
 * ```typescript
 * import { Schema, Effect } from "effect"
 * import { createMemoryStorage } from "effect-storage"
 *
 * const program = Effect.gen(function* () {
 *   const storage = yield* createMemoryStorage({
 *     contentExtension: "txt",
 *     contentSchema: Schema.String,
 *     metadataSchema: Schema.Struct({ version: Schema.Number }),
 *   })
 *   yield* storage.save("doc-1", "Hello", { version: 1 })
 * })
 *
 * await Effect.runPromise(program)
 * ```
 */
export const createMemoryStorage = <TContent, TMeta>(
  config: Omit<StorageConfig<TContent, TMeta>, "basePath">
): Effect.Effect<StorageServiceApi<TContent, TMeta>> => {
  return Effect.sync(() => {
    const backend = createMemoryBackend(
      config.contentSchema,
      config.metadataSchema
    );
    const cacheRef = config.enableCaching
      ? new Map<string, { content: TContent; metadata: TMeta }>()
      : undefined;

    const api: StorageServiceApi<TContent, TMeta> = {
      save: (id, content, metadata) =>
        Effect.gen(function* () {
          yield* backend.save(id, content, metadata);
          if (cacheRef) {
            cacheRef.set(id, { content, metadata });
          }
        }),

      load: (id) =>
        Effect.gen(function* () {
          if (cacheRef?.has(id)) {
            return cacheRef.get(id)!;
          }
          const result = yield* backend.load(id);
          if (cacheRef) {
            cacheRef.set(id, result);
          }
          return result;
        }),

      loadContent: (id) =>
        Effect.gen(function* () {
          if (cacheRef?.has(id)) {
            return cacheRef.get(id)!.content;
          }
          return yield* backend.loadContent(id);
        }),

      loadMetadata: (id) =>
        Effect.gen(function* () {
          if (cacheRef?.has(id)) {
            return cacheRef.get(id)!.metadata;
          }
          return yield* backend.loadMetadata(id);
        }),

      delete: (id) =>
        Effect.gen(function* () {
          yield* backend.delete(id);
          if (cacheRef) {
            cacheRef.delete(id);
          }
        }),

      exists: (id) => backend.exists(id),
      list: () => backend.list(),
      listWithMetadata: () => backend.listWithMetadata(),
      clearCache: () => {
        if (cacheRef) {
          cacheRef.clear();
        }
        return Effect.void;
      },
    };

    return api;
  });
};
