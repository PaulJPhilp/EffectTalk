/**
 * FileSystem Backend for Blob Repository
 *
 * Stores blobs as files in the filesystem with JSON metadata sidecars
 * Uses hash-based directory structure for organization
 *
 * @module backends/filesystem
 */

import { FileSystem } from "@effect/platform";
import { Effect, Schema as S } from "effect";
import { stringify as stringifyJson, parse as parseJson } from "effect-json";
import crypto from "node:crypto";
import path from "node:path";
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

/**
 * Schema for BlobMetadata with proper Date handling
 * Dates are stored as ISO strings in JSON and parsed back to Date objects
 */
const BlobMetadataSchema = S.Struct({
  id: S.String,
  mimeType: S.String,
  sizeBytes: S.Number,
  createdAt: S.Date,
  updatedAt: S.Date,
  customMetadata: S.optional(
    S.Record({
      key: S.String,
      value: S.String,
    })
  ),
});

/**
 * FileSystemBackend Configuration
 */
export interface FileSystemBackendConfig {
  /** Base directory for blob storage */
  readonly basePath: string;
  /** Hash-based subdirectories (e.g., 2 = first 2 chars of ID as subdir) */
  readonly hashDepth?: number;
  /** ID generation strategy */
  readonly idGenerator?: () => string;
}

/**
 * Default ID generator using crypto.randomUUID()
 */
const defaultIdGenerator = (): string => crypto.randomUUID();

/**
 * FileSystemBackend Service
 *
 * Stores blobs in filesystem with hash-based directory structure.
 * Metadata stored as JSON sidecar files.
 * Example structure:
 *   /blobs
 *   ├── 12/
 *   │   ├── 12ab34cd...blob
 *   │   └── 12ab34cd...meta.json
 *   ├── 34/
 *   │   ├── 34ef56gh...blob
 *   │   └── 34ef56gh...meta.json
 */
export class FileSystemBackend extends Effect.Service<FileSystemBackend>()(
  "FileSystemBackend",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const backendName = "FileSystem";

      return (config: FileSystemBackendConfig) => {
        const {
          basePath,
          hashDepth = 2,
          idGenerator = defaultIdGenerator,
        } = config;

        /**
         * Get file paths for blob and metadata
         */
        const getPaths = (
          id: BlobId
        ): { blobPath: string; metaPath: string } => {
          let dir = basePath;

          // Create hash-based subdirectory structure
          if (hashDepth > 0 && id.length >= hashDepth) {
            const hashPrefix = id.slice(0, hashDepth);
            dir = path.join(basePath, hashPrefix);
          }

          return {
            blobPath: path.join(dir, `${id}.blob`),
            metaPath: path.join(dir, `${id}.meta.json`),
          };
        };

        const save = (data: Buffer, mimeType: string, options?: SaveOptions) =>
          Effect.gen(function* () {
            const id = options?.id ?? idGenerator();
            const { blobPath, metaPath } = getPaths(id);
            const dir = path.dirname(blobPath);

            // Check if exists and overwrite not allowed
            if (!options?.overwrite) {
              const blobExists = yield* fs
                .exists(blobPath)
                .pipe(Effect.catchAll(() => Effect.succeed(false)));
              if (blobExists) {
                return yield* Effect.fail(
                  new BlobAlreadyExistsError({
                    message: `Blob already exists: ${id}`,
                    id,
                    backend: backendName,
                  })
                );
              }
            }

            // Create directory if needed
            yield* fs.makeDirectory(dir, { recursive: true }).pipe(
              Effect.mapError(
                (err) =>
                  new RepositoryError({
                    message: `Failed to create directory: ${dir}`,
                    operation: "save",
                    backend: backendName,
                    cause: err as Error,
                  })
              )
            );

            // Create metadata
            const now = new Date();
            const metadata: BlobMetadata = {
              id,
              mimeType,
              sizeBytes: data.length,
              createdAt: now,
              updatedAt: now,
              customMetadata: options?.customMetadata,
            };

            // Write blob data
            yield* fs.writeFile(blobPath, data).pipe(
              Effect.mapError(
                (err) =>
                  new RepositoryError({
                    message: `Failed to write blob: ${id}`,
                    operation: "save",
                    backend: backendName,
                    cause: err as Error,
                  })
              )
            );

            // Write metadata
            const metaJson = yield* stringifyJson(
              BlobMetadataSchema,
              metadata
            ).pipe(
              Effect.mapError((err) => {
                const message =
                  err instanceof Error ? err.message : String(err);
                return new RepositoryError({
                  message: `Failed to stringify metadata: ${id}: ${message}`,
                  operation: "save",
                  backend: backendName,
                  cause: err instanceof Error ? err : new Error(message),
                });
              })
            );
            yield* fs.writeFileString(metaPath, metaJson).pipe(
              Effect.mapError(
                (err) =>
                  new RepositoryError({
                    message: `Failed to write metadata: ${id}`,
                    operation: "save",
                    backend: backendName,
                    cause: err as Error,
                  })
              )
            );

            return metadata;
          });

        const get = (id: BlobId) =>
          Effect.gen(function* () {
            const { blobPath, metaPath } = getPaths(id);

            // Read metadata
            const metaJson = yield* fs.readFileString(metaPath).pipe(
              Effect.mapError(
                (err) =>
                  new BlobNotFoundError({
                    message: `Blob not found: ${id}`,
                    id,
                    backend: backendName,
                  })
              )
            );

            const metadata = yield* parseJson(
              BlobMetadataSchema,
              metaJson
            ).pipe(
              Effect.mapError((err) => {
                const message =
                  err instanceof Error ? err.message : String(err);
                return new RepositoryError({
                  message: `Failed to parse metadata for ${id}: ${message}`,
                  operation: "get",
                  backend: backendName,
                  cause: err instanceof Error ? err : new Error(message),
                });
              })
            );

            // Read blob data
            const fileData = yield* fs.readFile(blobPath).pipe(
              Effect.mapError(
                (err) =>
                  new RepositoryError({
                    message: `Failed to read blob: ${id}`,
                    operation: "get",
                    backend: backendName,
                    cause: err,
                  })
              )
            );

            const data = Buffer.isBuffer(fileData)
              ? fileData
              : Buffer.from(fileData as Uint8Array);

            return {
              metadata,
              data,
            } satisfies Blob;
          });

        const getMetadata = (id: BlobId) =>
          Effect.gen(function* () {
            const { metaPath } = getPaths(id);

            const metaJson = yield* fs.readFileString(metaPath).pipe(
              Effect.mapError(
                (err) =>
                  new BlobNotFoundError({
                    message: `Blob not found: ${id}`,
                    id,
                    backend: backendName,
                  })
              )
            );

            const parsedMeta = JSON.parse(metaJson) as BlobMetadata;
            const metadata: BlobMetadata = {
              ...parsedMeta,
              createdAt: new Date(parsedMeta.createdAt),
              updatedAt: new Date(parsedMeta.updatedAt),
            };

            return metadata;
          });

        const exists = (id: BlobId) =>
          Effect.gen(function* () {
            const { blobPath } = getPaths(id);
            return yield* fs
              .exists(blobPath)
              .pipe(Effect.catchAll(() => Effect.succeed(false)));
          });

        const deleteBlob = (id: BlobId) =>
          Effect.gen(function* () {
            const { blobPath, metaPath } = getPaths(id);

            const blobExists = yield* fs
              .exists(blobPath)
              .pipe(Effect.catchAll(() => Effect.succeed(false)));
            if (!blobExists) {
              return yield* Effect.fail(
                new BlobNotFoundError({
                  message: `Blob not found: ${id}`,
                  id,
                  backend: backendName,
                })
              );
            }

            // Delete blob
            yield* fs.remove(blobPath).pipe(
              Effect.mapError(
                (err) =>
                  new RepositoryError({
                    message: `Failed to delete blob: ${id}`,
                    operation: "delete",
                    backend: backendName,
                    cause: err as Error,
                  })
              )
            );

            // Delete metadata (ignore if not found)
            yield* fs.remove(metaPath).pipe(Effect.catchAll(() => Effect.void));
          });

        const list = (options?: ListOptions) =>
          Effect.gen(function* () {
            // Scan all blob files and extract metadata
            const metadataList: BlobMetadata[] = [];

            const scanDirectory = (
              dir: string
            ): Effect.Effect<void, RepositoryError> =>
              Effect.gen(function* () {
                const entries = yield* fs
                  .readDirectory(dir)
                  .pipe(Effect.catchAll(() => Effect.succeed([])));

                for (const entry of entries) {
                  const fullPath = path.join(dir, entry);
                  const stats = yield* fs
                    .stat(fullPath)
                    .pipe(Effect.catchAll(() => Effect.succeed(null)));

                  if (stats?.type === "Directory") {
                    yield* scanDirectory(fullPath);
                  } else if (entry.endsWith(".meta.json")) {
                    const metaJson = yield* fs
                      .readFileString(fullPath)
                      .pipe(Effect.catchAll(() => Effect.succeed("{}")));

                    const parsedMeta = JSON.parse(metaJson) as BlobMetadata;
                    const metadata: BlobMetadata = {
                      ...parsedMeta,
                      createdAt: new Date(parsedMeta.createdAt),
                      updatedAt: new Date(parsedMeta.updatedAt),
                    };

                    // Apply filters
                    if (
                      options?.mimeTypePrefix &&
                      !metadata.mimeType.startsWith(options.mimeTypePrefix)
                    ) {
                      continue;
                    }

                    metadataList.push(metadata);
                  }
                }
              });

            yield* scanDirectory(basePath);

            // Apply limit
            const limit = options?.limit ?? metadataList.length;
            const items = metadataList.slice(0, limit);

            return {
              items,
              nextCursor:
                metadataList.length > limit ? String(limit) : undefined,
              totalCount: metadataList.length,
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
      };
    }),
  }
) {}

export const FileSystemBackendLayer = FileSystemBackend.Default;
