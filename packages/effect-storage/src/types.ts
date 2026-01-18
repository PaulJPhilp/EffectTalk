/**
 * Type definitions for effect-storage
 * @packageDocumentation
 */

import type { Effect, Schema } from "effect";
import type {
  AlreadyExistsError,
  NotFoundError,
  StorageError,
  ValidationError,
} from "./errors.js";

/**
 * Configuration for creating a storage instance.
 *
 * @template TContent The type of content being stored
 * @template TMeta The type of metadata associated with content
 *
 * @example
 * ```typescript
 * import { Schema } from "effect"
 * import type { StorageConfig } from "effect-storage"
 *
 * const config: StorageConfig<string, { author: string }> = {
 *   basePath: "./storage",
 *   contentExtension: "txt",
 *   contentSchema: Schema.String,
 *   metadataSchema: Schema.Struct({ author: Schema.String }),
 *   organizationStrategy: "hash-based",
 *   hashDepth: 2,
 *   enableCaching: true,
 * }
 * ```
 */
export interface StorageConfig<TContent, TMeta> {
  /**
   * Base directory path where files will be stored.
   * Will be created if it doesn't exist (unless createMissingDirectories is false).
   */
  readonly basePath: string;

  /**
   * File extension for content files (without leading dot).
   * Example: "txt", "json", "md"
   *
   * Metadata is always stored with ".meta.json" extension.
   */
  readonly contentExtension: string;

  /**
   * Schema for validating content on parse/stringify.
   */
  readonly contentSchema: Schema.Schema<TContent, string>;

  /**
   * Schema for validating metadata.
   */
  readonly metadataSchema: Schema.Schema<TMeta>;

  /**
   * How to organize files in the directory structure.
   *
   * @default "flat"
   *
   * - "flat": All files in single directory
   * - "hash-based": Subdirectories based on ID hash prefix
   */
  readonly organizationStrategy?: "flat" | "hash-based";

  /**
   * For hash-based organization, number of characters from ID hash to use as directory prefix.
   *
   * @default 2
   *
   * Example with hashDepth=2 and id="abcd1234":
   * - Directory: storage/ab/
   * - Files: storage/ab/abcd1234.txt, storage/ab/abcd1234.meta.json
   */
  readonly hashDepth?: number;

  /**
   * Enable in-memory caching of loaded items.
   *
   * @default false
   *
   * - Cache is updated on save()
   * - Cache is invalidated on delete()
   * - Can be manually cleared with clearCache()
   */
  readonly enableCaching?: boolean;

  /**
   * Automatically create missing directories when saving.
   *
   * @default true
   */
  readonly createMissingDirectories?: boolean;
}

/**
 * Low-level storage backend interface.
 *
 * Backends implement core CRUD operations and are wrapped by the StorageService
 * for caching and higher-level functionality.
 *
 * @template TContent The type of content being stored
 * @template TMeta The type of metadata associated with content
 */
export interface StorageBackend<TContent, TMeta> {
  /**
   * Save content and metadata for an item.
   *
   * @param id Unique identifier for the item
   * @param content The content to store
   * @param metadata The metadata to store
   * @returns Effect that completes when save is successful
   */
  readonly save: (
    id: string,
    content: TContent,
    metadata: TMeta
  ) => Effect.Effect<void, StorageError | ValidationError>;

  /**
   * Load both content and metadata for an item.
   *
   * @param id Unique identifier for the item
   * @returns Effect containing both content and metadata
   */
  readonly load: (
    id: string
  ) => Effect.Effect<
    { content: TContent; metadata: TMeta },
    NotFoundError | StorageError | ValidationError
  >;

  /**
   * Load only the content for an item.
   *
   * @param id Unique identifier for the item
   * @returns Effect containing the content
   */
  readonly loadContent: (
    id: string
  ) => Effect.Effect<TContent, NotFoundError | StorageError | ValidationError>;

  /**
   * Load only the metadata for an item.
   *
   * @param id Unique identifier for the item
   * @returns Effect containing the metadata
   */
  readonly loadMetadata: (
    id: string
  ) => Effect.Effect<TMeta, NotFoundError | StorageError | ValidationError>;

  /**
   * Delete an item's content and metadata.
   *
   * @param id Unique identifier for the item
   * @returns Effect that completes when deletion is successful
   */
  readonly delete: (
    id: string
  ) => Effect.Effect<void, NotFoundError | StorageError>;

  /**
   * Check if an item exists.
   *
   * @param id Unique identifier for the item
   * @returns Effect containing true if item exists, false otherwise
   */
  readonly exists: (id: string) => Effect.Effect<boolean, StorageError>;

  /**
   * List all item IDs.
   *
   * @returns Effect containing array of all item IDs
   */
  readonly list: () => Effect.Effect<readonly string[], StorageError>;

  /**
   * List all items with their metadata.
   *
   * @returns Effect containing array of id + metadata pairs
   */
  readonly listWithMetadata: () => Effect.Effect<
    ReadonlyArray<{ id: string; metadata: TMeta }>,
    StorageError | ValidationError
  >;
}

/**
 * Service API for typed storage operations.
 *
 * The StorageService wraps a backend and adds optional caching.
 * All operations are Effect-based for composability.
 *
 * @template TContent The type of content being stored
 * @template TMeta The type of metadata associated with content
 */
export interface StorageServiceApi<TContent, TMeta> {
  /**
   * Save content and metadata for an item.
   *
   * @param id Unique identifier for the item
   * @param content The content to store
   * @param metadata The metadata to store
   * @returns Effect that completes when save is successful
   */
  readonly save: (
    id: string,
    content: TContent,
    metadata: TMeta
  ) => Effect.Effect<void, StorageError | ValidationError>;

  /**
   * Load both content and metadata for an item.
   *
   * @param id Unique identifier for the item
   * @returns Effect containing both content and metadata
   */
  readonly load: (
    id: string
  ) => Effect.Effect<
    { content: TContent; metadata: TMeta },
    NotFoundError | StorageError | ValidationError
  >;

  /**
   * Load only the content for an item.
   *
   * @param id Unique identifier for the item
   * @returns Effect containing the content
   */
  readonly loadContent: (
    id: string
  ) => Effect.Effect<TContent, NotFoundError | StorageError | ValidationError>;

  /**
   * Load only the metadata for an item.
   *
   * @param id Unique identifier for the item
   * @returns Effect containing the metadata
   */
  readonly loadMetadata: (
    id: string
  ) => Effect.Effect<TMeta, NotFoundError | StorageError | ValidationError>;

  /**
   * Delete an item's content and metadata.
   *
   * @param id Unique identifier for the item
   * @returns Effect that completes when deletion is successful
   */
  readonly delete: (
    id: string
  ) => Effect.Effect<void, NotFoundError | StorageError>;

  /**
   * Check if an item exists.
   *
   * @param id Unique identifier for the item
   * @returns Effect containing true if item exists, false otherwise
   */
  readonly exists: (id: string) => Effect.Effect<boolean, StorageError>;

  /**
   * List all item IDs.
   *
   * @returns Effect containing array of all item IDs
   */
  readonly list: () => Effect.Effect<readonly string[], StorageError>;

  /**
   * List all items with their metadata.
   *
   * @returns Effect containing array of id + metadata pairs
   */
  readonly listWithMetadata: () => Effect.Effect<
    ReadonlyArray<{ id: string; metadata: TMeta }>,
    StorageError | ValidationError
  >;

  /**
   * Clear the in-memory cache.
   *
   * Only has effect if caching is enabled via config.
   *
   * @returns Effect that completes when cache is cleared
   */
  readonly clearCache: () => Effect.Effect<void>;
}
