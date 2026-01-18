/**
 * In-Memory Backend for Blob Repository
 *
 * Stores blobs in memory using Effect.Ref
 * Useful for testing and development
 *
 * @module backends/memory
 */

import { Effect, Ref } from "effect";
import crypto from "node:crypto";
import {
  BlobAlreadyExistsError,
  BlobNotFoundError,
  RepositoryError,
} from "../errors.js";
import type {
  Blob,
  BlobId,
  BlobMetadata,
  ListOptions,
  ListResult,
  SaveOptions,
} from "../types.js";
import type { RepositoryBackend } from "./types.js";

const defaultIdGenerator = (): string => crypto.randomUUID();

/**
 * InMemoryBackend Service
 *
 * Stores blobs in memory using Ref<Map>.
 * Useful for testing and development.
 * All data is lost when the effect context is garbage collected.
 */
export class InMemoryBackend extends Effect.Service<InMemoryBackend>()(
  "InMemoryBackend",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const storageRef = yield* Ref.make(new Map<BlobId, Blob>());
      const backendName = "InMemory";
      const idGenerator = defaultIdGenerator;

      const save = (data: Buffer, mimeType: string, options?: SaveOptions) =>
        Effect.gen(function* () {
          const id = options?.id ?? idGenerator();
          const storage = yield* Ref.get(storageRef);

          // Check if exists
          if (!options?.overwrite && storage.has(id)) {
            return yield* Effect.fail(
              new BlobAlreadyExistsError({
                message: `Blob already exists: ${id}`,
                id,
                backend: backendName,
              })
            );
          }

          const now = new Date();
          const metadata: BlobMetadata = {
            id,
            mimeType,
            sizeBytes: data.length,
            createdAt: now,
            updatedAt: now,
            customMetadata: options?.customMetadata,
          };

          const blob: Blob = {
            metadata,
            data,
          };

          yield* Ref.update(storageRef, (map) => new Map(map).set(id, blob));

          return metadata;
        });

      const get = (id: BlobId) =>
        Effect.gen(function* () {
          const storage = yield* Ref.get(storageRef);
          const blob = storage.get(id);

          if (!blob) {
            return yield* Effect.fail(
              new BlobNotFoundError({
                message: `Blob not found: ${id}`,
                id,
                backend: backendName,
              })
            );
          }

          return blob;
        });

      const getMetadata = (id: BlobId) =>
        Effect.gen(function* () {
          const storage = yield* Ref.get(storageRef);
          const blob = storage.get(id);

          if (!blob) {
            return yield* Effect.fail(
              new BlobNotFoundError({
                message: `Blob not found: ${id}`,
                id,
                backend: backendName,
              })
            );
          }

          return blob.metadata;
        });

      const exists = (id: BlobId) =>
        Effect.gen(function* () {
          const storage = yield* Ref.get(storageRef);
          return storage.has(id);
        });

      const deleteBlob = (id: BlobId) =>
        Effect.gen(function* () {
          const storage = yield* Ref.get(storageRef);

          if (!storage.has(id)) {
            return yield* Effect.fail(
              new BlobNotFoundError({
                message: `Blob not found: ${id}`,
                id,
                backend: backendName,
              })
            );
          }

          yield* Ref.update(storageRef, (map) => {
            const newMap = new Map(map);
            newMap.delete(id);
            return newMap;
          });
        });

      const list = (options?: ListOptions) =>
        Effect.gen(function* () {
          const storage = yield* Ref.get(storageRef);
          let items = Array.from(storage.values()).map((blob) => blob.metadata);

          // Apply MIME type prefix filter
          if (options?.mimeTypePrefix) {
            items = items.filter((meta) =>
              meta.mimeType.startsWith(options.mimeTypePrefix!)
            );
          }

          // Apply limit
          const limit = options?.limit ?? items.length;
          const limitedItems = items.slice(0, limit);

          return {
            items: limitedItems,
            nextCursor: items.length > limit ? String(limit) : undefined,
            totalCount: items.length,
          } satisfies ListResult;
        });

      return {
        save,
        get,
        getMetadata,
        exists,
        delete: deleteBlob,
        list,
      } satisfies RepositoryBackend;
    }),
  }
) {}

export const InMemoryBackendLayer = InMemoryBackend.Default;
