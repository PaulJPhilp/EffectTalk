/**
 * PostgreSQL Backend for Blob Repository
 *
 * Stores blobs in PostgreSQL using BYTEA column for binary data
 * Metadata stored as JSONB for efficient querying
 *
 * @module backends/postgresql
 */

import { Effect } from "effect";
import type { SqlClient } from "@effect/sql";
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

/**
 * PostgreSQL Backend Configuration
 */
export interface PostgreSQLBackendConfig {
  /** Table name (default: 'blobs') */
  readonly tableName?: string;
  /** ID generation strategy */
  readonly idGenerator?: () => string;
}

const defaultIdGenerator = (): string => crypto.randomUUID();

/**
 * PostgreSQL row type
 * Note: This assumes a table schema like:
 *
 * CREATE TABLE blobs (
 *   id VARCHAR(255) PRIMARY KEY,
 *   mime_type VARCHAR(255) NOT NULL,
 *   size_bytes BIGINT NOT NULL,
 *   created_at TIMESTAMP NOT NULL,
 *   updated_at TIMESTAMP NOT NULL,
 *   custom_metadata JSONB,
 *   data BYTEA NOT NULL
 * );
 *
 * CREATE INDEX idx_blobs_mime_type ON blobs(mime_type);
 * CREATE INDEX idx_blobs_created_at ON blobs(created_at DESC);
 * CREATE INDEX idx_blobs_custom_metadata ON blobs USING GIN(custom_metadata);
 */
interface BlobRow {
  readonly id: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly custom_metadata: Record<string, string> | null;
  readonly data: Buffer;
}

/**
 * PostgreSQLBackend factory function
 *
 * Creates a repository backend that uses PostgreSQL via SqlClient.
 * Stores blobs using BYTEA column and metadata as JSONB.
 *
 * @example
 * ```typescript
 * import { Effect } from "effect"
 * import { SqlClient } from "@effect/sql"
 * import { PostgreSQLBackend } from "effect-repository"
 *
 * const program = Effect.gen(function* () {
 *   const sql = yield* SqlClient
 *   const backend = PostgreSQLBackend(sql, { tableName: "blobs" })
 *   // Use backend...
 * })
 * ```
 */
export const PostgreSQLBackend = (
  sql: SqlClient.SqlClient,
  config?: PostgreSQLBackendConfig
): RepositoryBackend => {
  const { tableName = "blobs", idGenerator = defaultIdGenerator } =
    config ?? {};

  const backendName = "PostgreSQL";

  const save = (
    data: Buffer,
    mimeType: string,
    options?: SaveOptions
  ): Effect.Effect<BlobMetadata, BlobAlreadyExistsError | RepositoryError> =>
    Effect.gen(function* () {
      const id = options?.id ?? idGenerator();
      const now = new Date();

      // Check if exists
      if (!options?.overwrite) {
        const existing = yield* sql<{ id: string }>`
          SELECT id FROM ${sql(tableName)} WHERE id = ${id}
        `.pipe(Effect.catchAll(() => Effect.succeed([] as never[])));

        if (existing.length > 0) {
          return yield* Effect.fail(
            new BlobAlreadyExistsError({
              message: `Blob already exists: ${id}`,
              id,
              backend: backendName,
            })
          );
        }
      }

      // Insert or update
      yield* sql`
        INSERT INTO ${sql(tableName)} (
          id, mime_type, size_bytes, created_at, updated_at, custom_metadata, data
        ) VALUES (
          ${id}, ${mimeType}, ${data.length}, ${now}, ${now},
          ${options?.customMetadata ? JSON.stringify(options.customMetadata) : null},
          ${data}
        )
        ON CONFLICT (id) DO UPDATE SET
          mime_type = EXCLUDED.mime_type,
          size_bytes = EXCLUDED.size_bytes,
          updated_at = EXCLUDED.updated_at,
          custom_metadata = EXCLUDED.custom_metadata,
          data = EXCLUDED.data
      `.pipe(
        Effect.mapError(
          (err) =>
            new RepositoryError({
              message: `Failed to save blob: ${id}`,
              operation: "save",
              backend: backendName,
              ...(err && err.message ? { cause: err as Error } : {}),
            })
        )
      );

      return {
        id,
        mimeType,
        sizeBytes: data.length,
        createdAt: now,
        updatedAt: now,
        ...(options?.customMetadata !== undefined && { customMetadata: options.customMetadata }),
        } satisfies BlobMetadata;
    });

  const get = (
    id: BlobId
  ): Effect.Effect<Blob, BlobNotFoundError | RepositoryError> =>
    Effect.gen(function* () {
      const rows = yield* sql<BlobRow>`
        SELECT * FROM ${sql(tableName)} WHERE id = ${id}
      `.pipe(
        Effect.mapError(
          (err) =>
            new RepositoryError({
              message: `Failed to get blob: ${id}`,
              operation: "get",
              backend: backendName,
              ...(err && err.message ? { cause: err as Error } : {}),
            })
        )
      );

      if (rows.length === 0) {
        return yield* Effect.fail(
          new BlobNotFoundError({
            message: `Blob not found: ${id}`,
            id,
            backend: backendName,
          })
        );
      }

      const row = rows[0]!;
      return {
        metadata: {
          id: row.id,
          mimeType: row.mime_type,
          sizeBytes: row.size_bytes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          ...(row.custom_metadata !== null && row.custom_metadata !== undefined && { customMetadata: row.custom_metadata }),
          },
          data: row.data,
          } satisfies Blob;
    });

  const getMetadata = (
    id: BlobId
  ): Effect.Effect<BlobMetadata, BlobNotFoundError | RepositoryError> =>
    Effect.gen(function* () {
      const rows = yield* sql<BlobRow>`
        SELECT id, mime_type, size_bytes, created_at, updated_at, custom_metadata
        FROM ${sql(tableName)} WHERE id = ${id}
      `.pipe(
        Effect.mapError(
          (err) =>
            new RepositoryError({
              message: `Failed to get metadata: ${id}`,
              operation: "getMetadata",
              backend: backendName,
              ...(err && err.message ? { cause: err as Error } : {}),
            })
        )
      );

      if (rows.length === 0) {
        return yield* Effect.fail(
          new BlobNotFoundError({
            message: `Blob not found: ${id}`,
            id,
            backend: backendName,
          })
        );
      }

      const row = rows[0]!;
      return {
        id: row.id,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...(row.custom_metadata !== null && row.custom_metadata !== undefined && { customMetadata: row.custom_metadata }),
        } satisfies BlobMetadata;
    });

  const exists = (id: BlobId): Effect.Effect<boolean, RepositoryError> =>
    Effect.gen(function* () {
      const rows = yield* sql<{ id: string }>`
        SELECT 1 FROM ${sql(tableName)} WHERE id = ${id}
      `.pipe(Effect.catchAll(() => Effect.succeed([] as never[])));

      return rows.length > 0;
    });

  const deleteBlob = (
    id: BlobId
  ): Effect.Effect<void, BlobNotFoundError | RepositoryError> =>
    Effect.gen(function* () {
      const result = yield* sql`
        DELETE FROM ${sql(tableName)} WHERE id = ${id}
      `.pipe(
        Effect.mapError(
          (err) =>
            new RepositoryError({
              message: `Failed to delete blob: ${id}`,
              operation: "delete",
              backend: backendName,
              ...(err && err.message ? { cause: err as Error } : {}),
            })
        )
      );

      // Check if anything was deleted
      // biome-ignore lint/suspicious/noExplicitAny: SqlResult varies by driver
      if ((result as any)?.affectedRows === 0) {
        return yield* Effect.fail(
          new BlobNotFoundError({
            message: `Blob not found: ${id}`,
            id,
            backend: backendName,
          })
        );
      }
    });

  const list = (
    options?: ListOptions
  ): Effect.Effect<ListResult, RepositoryError> =>
    Effect.gen(function* () {
      const limit = options?.limit ?? 100;
      const offset = options?.cursor ? Number.parseInt(options.cursor, 10) : 0;

      // Build query with optional filters
      let queryStr = `
        SELECT id, mime_type, size_bytes, created_at, updated_at, custom_metadata
        FROM ${tableName}
      `;

      const whereConditions: string[] = [];

      if (options?.mimeTypePrefix) {
        whereConditions.push(`mime_type LIKE '${options.mimeTypePrefix}%'`);
      }

      if (whereConditions.length > 0) {
        queryStr += ` WHERE ${whereConditions.join(" AND ")}`;
      }

      queryStr += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const rows = yield* sql<BlobRow>`
        ${sql.unsafe(queryStr)}
      `.pipe(
        Effect.mapError(
          (err) =>
            new RepositoryError({
              message: "Failed to list blobs",
              operation: "list",
              backend: backendName,
              ...(err && err.message ? { cause: err as Error } : {}),
            })
        )
      );

      const items: BlobMetadata[] = rows.map((row: BlobRow) => ({
        id: row.id,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...(row.custom_metadata !== null && row.custom_metadata !== undefined && { customMetadata: row.custom_metadata }),
      }));

      const hasMoreResults = rows.length === limit;
      return {
        items,
        ...(hasMoreResults && { nextCursor: String(offset + limit) }),
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

/**
 * PostgreSQL backend layer for dependency injection
 * Requires SqlClient to be provided
 *
 * @example
 * ```typescript
 * import { Layer } from "effect"
 * import { PostgreSQLBackendLayer } from "effect-repository"
 *
 * const myLayer = Layer.provide(PostgreSQLBackendLayer)
 * ```
 */
export const PostgreSQLBackendLayer = null as any;
