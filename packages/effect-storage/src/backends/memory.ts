/**
 * In-memory storage backend for effect-storage
 * @packageDocumentation
 */

import { Effect, Schema } from "effect";
import type { StorageBackend } from "../types.js";
import { NotFoundError, StorageError, ValidationError } from "../errors.js";

/**
 * Create an in-memory storage backend.
 *
 * Useful for testing and scenarios where persistence isn't needed.
 * All data is lost when the process ends.
 *
 * @template TContent The type of content being stored
 * @template TMeta The type of metadata associated with content
 *
 * @param contentSchema Schema for validating content
 * @param metadataSchema Schema for validating metadata
 * @returns A storage backend using an in-memory Map
 *
 * @example
 * ```typescript
 * import { Schema } from "effect"
 * import { createMemoryBackend } from "effect-storage"
 *
 * const ContentSchema = Schema.String
 * const MetaSchema = Schema.Struct({ version: Schema.Number })
 *
 * const backend = createMemoryBackend(ContentSchema, MetaSchema)
 * ```
 */
export const createMemoryBackend = <TContent, TMeta>(
  contentSchema: Schema.Schema<TContent, any>,
  metadataSchema: Schema.Schema<TMeta, any>
): StorageBackend<TContent, TMeta> => {
  const storage = new Map<string, { content: TContent; metadata: TMeta }>();

  return {
    save: (id, content, metadata) =>
      Effect.gen(function* () {
        // Validate content
        const validatedContent = yield* Schema.decode(contentSchema)(
          content
        ).pipe(
          Effect.mapError(
            (parseError) =>
              new ValidationError({
                message: `Failed to validate content: ${String(parseError)}`,
                id,
                field: "content",
                ...(parseError instanceof Error ? { cause: parseError } : {}),
              })
          )
        );

        // Validate metadata
        const validatedMetadata = yield* Schema.decode(metadataSchema)(
          metadata
        ).pipe(
          Effect.mapError(
            (parseError) =>
              new ValidationError({
                message: `Failed to validate metadata: ${String(parseError)}`,
                id,
                field: "metadata",
                ...(parseError instanceof Error ? { cause: parseError } : {}),
              })
          )
        );

        storage.set(id, {
          content: validatedContent,
          metadata: validatedMetadata,
        });
      }),

    load: (id) =>
      Effect.sync(() => {
        const item = storage.get(id);
        if (!item) {
          return Effect.fail(new NotFoundError({ id, basePath: "[memory]" }));
        }
        return Effect.succeed(item);
      }).pipe(Effect.flatten),

    loadContent: (id) =>
      Effect.sync(() => {
        const item = storage.get(id);
        if (!item) {
          return Effect.fail(new NotFoundError({ id, basePath: "[memory]" }));
        }
        return Effect.succeed(item.content);
      }).pipe(Effect.flatten),

    loadMetadata: (id) =>
      Effect.sync(() => {
        const item = storage.get(id);
        if (!item) {
          return Effect.fail(new NotFoundError({ id, basePath: "[memory]" }));
        }
        return Effect.succeed(item.metadata);
      }).pipe(Effect.flatten),

    delete: (id) =>
      Effect.sync(() => {
        if (!storage.has(id)) {
          return Effect.fail(new NotFoundError({ id, basePath: "[memory]" }));
        }
        storage.delete(id);
        return Effect.void;
      }).pipe(Effect.flatten),

    exists: (id) => Effect.sync(() => storage.has(id)),

    list: () => Effect.sync(() => Array.from(storage.keys())),

    listWithMetadata: () =>
      Effect.gen(function* () {
        const ids = Array.from(storage.keys());
        const items = [];

        for (const id of ids) {
          const item = storage.get(id);
          if (item) {
            items.push({ id, metadata: item.metadata });
          }
        }

        return items as ReadonlyArray<{ id: string; metadata: TMeta }>;
      }),
  };
};
