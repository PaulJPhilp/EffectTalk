/**
 * Path utilities for file organization in effect-storage
 * @packageDocumentation
 */

import { Effect } from "effect";
import { createHash } from "crypto";
import { join } from "path";
import { FileSystem } from "@effect/platform";
import { StorageError } from "../errors.js";

/**
 * Generate hash prefix from an ID.
 *
 * @param id The unique identifier
 * @param depth Number of characters to extract from hash
 * @returns Hash prefix for directory organization
 *
 * @example
 * ```typescript
 * generateHashPrefix("my-document", 2) // "my"
 * generateHashPrefix("my-document", 3) // "my-"
 * ```
 */
export const generateHashPrefix = (id: string, depth: number): string => {
  const hash = createHash("sha256").update(id).digest("hex");
  return hash.slice(0, depth);
};

/**
 * Get the path for a content file.
 *
 * @param basePath Root storage directory
 * @param id Item identifier
 * @param extension File extension (without dot)
 * @param strategy "flat" or "hash-based" organization
 * @param hashDepth For hash-based strategy, directory depth
 * @returns Full path to content file
 *
 * @example
 * ```typescript
 * // Flat organization
 * getContentPath("./storage", "doc-1", "txt", "flat", 0)
 * // "./storage/doc-1.txt"
 *
 * // Hash-based organization
 * getContentPath("./storage", "doc-1", "txt", "hash-based", 2)
 * // "./storage/do/doc-1.txt"
 * ```
 */
export const getContentPath = (
  basePath: string,
  id: string,
  extension: string,
  strategy: "flat" | "hash-based" = "flat",
  hashDepth: number = 2
): string => {
  const filename = `${id}.${extension}`;

  if (strategy === "hash-based") {
    const prefix = generateHashPrefix(id, hashDepth);
    return join(basePath, prefix, filename);
  }

  return join(basePath, filename);
};

/**
 * Get the path for a metadata file.
 *
 * Metadata is always stored as JSON with ".meta.json" extension.
 *
 * @param basePath Root storage directory
 * @param id Item identifier
 * @param strategy "flat" or "hash-based" organization
 * @param hashDepth For hash-based strategy, directory depth
 * @returns Full path to metadata file
 *
 * @example
 * ```typescript
 * // Flat organization
 * getMetadataPath("./storage", "doc-1", "flat", 0)
 * // "./storage/doc-1.meta.json"
 *
 * // Hash-based organization
 * getMetadataPath("./storage", "doc-1", "hash-based", 2)
 * // "./storage/do/doc-1.meta.json"
 * ```
 */
export const getMetadataPath = (
  basePath: string,
  id: string,
  strategy: "flat" | "hash-based" = "flat",
  hashDepth: number = 2
): string => {
  const filename = `${id}.meta.json`;

  if (strategy === "hash-based") {
    const prefix = generateHashPrefix(id, hashDepth);
    return join(basePath, prefix, filename);
  }

  return join(basePath, filename);
};

/**
 * Get the directory containing an item's files.
 *
 * @param basePath Root storage directory
 * @param id Item identifier
 * @param strategy "flat" or "hash-based" organization
 * @param hashDepth For hash-based strategy, directory depth
 * @returns Directory path
 *
 * @example
 * ```typescript
 * getItemDirectory("./storage", "doc-1", "flat", 0)
 * // "./storage"
 *
 * getItemDirectory("./storage", "doc-1", "hash-based", 2)
 * // "./storage/do"
 * ```
 */
export const getItemDirectory = (
  basePath: string,
  id: string,
  strategy: "flat" | "hash-based" = "flat",
  hashDepth: number = 2
): string => {
  if (strategy === "hash-based") {
    const prefix = generateHashPrefix(id, hashDepth);
    return join(basePath, prefix);
  }

  return basePath;
};

/**
 * Ensure a directory exists, creating it if necessary.
 *
 * Handles both flat and hash-based directory structures.
 *
 * @param fs FileSystem service
 * @param dirPath Directory path to ensure
 * @returns Effect that completes when directory exists
 */
export const ensureDirectory = (
  fs: FileSystem.FileSystem,
  dirPath: string
): Effect.Effect<void, StorageError> =>
  fs.stat(dirPath).pipe(
    Effect.catchTag("SystemError", () =>
      fs.makeDirectory(dirPath, { recursive: true }).pipe(
        Effect.mapError(
          (err) =>
            new StorageError({
              message: `Failed to create directory: ${String(err)}`,
              operation: "ensureDirectory",
              path: dirPath,
              cause: err instanceof Error ? err : undefined,
            })
        )
      )
    ),
    Effect.mapError(
      (err) =>
        new StorageError({
          message: `Failed to access directory: ${String(err)}`,
          operation: "ensureDirectory",
          path: dirPath,
          cause: err instanceof Error ? err : undefined,
        })
    ),
    Effect.asVoid
  );

/**
 * Extract all item IDs from a directory.
 *
 * Scans the directory for .meta.json files and extracts IDs.
 *
 * @param fs FileSystem service
 * @param basePath Directory to scan
 * @param strategy "flat" or "hash-based" organization
 * @returns Effect containing array of IDs
 */
export const extractIdsFromDirectory = (
  fs: FileSystem.FileSystem,
  basePath: string,
  strategy: "flat" | "hash-based" = "flat"
): Effect.Effect<readonly string[], StorageError> =>
  Effect.gen(function* () {
    const entries = yield* fs.readDirectory(basePath).pipe(
      Effect.mapError(
        (err) =>
          new StorageError({
            message: `Failed to read directory: ${String(err)}`,
            operation: "extractIdsFromDirectory",
            path: basePath,
            cause: err instanceof Error ? err : undefined,
          })
      )
    );

    if (strategy === "flat") {
      return (entries as readonly string[])
        .filter((name: string) => name.endsWith(".meta.json"))
        .map((name: string) => name.replace(".meta.json", ""));
    }

    // Hash-based: recursively scan subdirectories
    const ids: string[] = [];

    for (const dirName of entries as readonly string[]) {
      const subPath = join(basePath, dirName);
      const subEntries = yield* fs.readDirectory(subPath).pipe(
        Effect.catchTag("SystemError", () =>
          Effect.succeed([] as readonly string[])
        ),
        Effect.mapError(
          (err) =>
            new StorageError({
              message: `Failed to read subdirectory: ${String(err)}`,
              operation: "extractIdsFromDirectory",
              path: subPath,
              cause: err instanceof Error ? err : undefined,
            })
        )
      );

      for (const fileName of subEntries as readonly string[]) {
        if (fileName.endsWith(".meta.json")) {
          ids.push(fileName.replace(".meta.json", ""));
        }
      }
    }

    return ids;
  });
