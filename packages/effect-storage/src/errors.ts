/**
 * error definitions for effect-storage
 * @packageDocumentation
 */

import { Data } from "effect";

/**
 * Raised when a requested item is not found in storage.
 *
 * @example
 * ```typescript
 * import { Effect } from "effect"
 * import { StorageService, NotFoundError } from "effect-storage"
 *
 * const load = Effect.gen(function* () {
 *   const storage = yield* StorageService
 *   return yield* storage.load("nonexistent").pipe(
 *     Effect.catchTag("NotFoundError", (err) => {
 *       console.log(`Item not found: ${err.id}`)
 *       return { content: "", metadata: {} }
 *     })
 *   )
 * })
 * ```
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly id: string;
  readonly basePath: string;
  readonly cause?: Error;
}> {}

/**
 * Raised when a storage operation fails.
 *
 * Covers filesystem errors, permission issues, and other I/O failures.
 *
 * @example
 * ```typescript
 * import { Effect } from "effect"
 * import { StorageService, StorageError } from "effect-storage"
 *
 * const save = Effect.gen(function* () {
 *   const storage = yield* StorageService
 *   return yield* storage.save("doc-1", content, meta).pipe(
 *     Effect.catchTag("StorageError", (err) => {
 *       console.log(`Storage failed: ${err.message}`)
 *       throw err
 *     })
 *   )
 * })
 * ```
 */
export class StorageError extends Data.TaggedError("StorageError")<{
  readonly message: string;
  readonly operation: string;
  readonly id?: string;
  readonly path?: string;
  readonly cause?: Error;
}> {}

/**
 * Raised when schema validation fails for content or metadata.
 *
 * @example
 * ```typescript
 * import { Effect } from "effect"
 * import { StorageService, ValidationError } from "effect-storage"
 *
 * const load = Effect.gen(function* () {
 *   const storage = yield* StorageService
 *   return yield* storage.load("doc-1").pipe(
 *     Effect.catchTag("ValidationError", (err) => {
 *       console.log(`Invalid ${err.field}: ${err.message}`)
 *       throw err
 *     })
 *   )
 * })
 * ```
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly id: string;
  readonly field: "content" | "metadata";
  readonly cause?: Error;
}> {}

/**
 * Raised when attempting to save an item that already exists.
 *
 * Note: Current implementation allows overwriting existing items.
 * This error is reserved for future use when uniqueness enforcement is added.
 *
 * @example
 * ```typescript
 * import { Effect } from "effect"
 * import { StorageService, AlreadyExistsError } from "effect-storage"
 *
 * const save = Effect.gen(function* () {
 *   const storage = yield* StorageService
 *   return yield* storage.save("doc-1", content, meta).pipe(
 *     Effect.catchTag("AlreadyExistsError", (err) => {
 *       console.log(`Item already exists: ${err.id}`)
 *       throw err
 *     })
 *   )
 * })
 * ```
 */
export class AlreadyExistsError extends Data.TaggedError("AlreadyExistsError")<{
  readonly id: string;
  readonly basePath: string;
}> {}
