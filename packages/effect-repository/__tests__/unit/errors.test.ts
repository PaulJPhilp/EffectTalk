/**
 * Error handling tests for effect-repository
 *
 * Tests all error types, error construction, error recovery,
 * and error tag-based matching patterns.
 */

import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { InMemoryBackend } from "../../src/index.js"
import {
  BlobNotFoundError,
  BlobAlreadyExistsError,
  RepositoryError,
  InvalidBlobError,
  StorageQuotaError,
} from "../../src/errors.js"

describe("Error Types", () => {
  describe("BlobNotFoundError", () => {
    it("should create error with proper fields", () => {
      const error = new BlobNotFoundError({
        message: "Blob not found",
        id: "missing-id",
        backend: "InMemory",
      })

      expect(error._tag).toBe("BlobNotFoundError")
      expect(error.message).toBe("Blob not found")
      expect(error.id).toBe("missing-id")
      expect(error.backend).toBe("InMemory")
    })

    it("should be catchable by tag", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        return yield* backend.get("nonexistent").pipe(
          Effect.catchTag("BlobNotFoundError", (err) => {
            return Effect.succeed({
              tag: err._tag,
              id: err.id,
              hasFallback: true,
            })
          })
        )
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result.tag).toBe("BlobNotFoundError")
      expect(result.id).toBe("nonexistent")
      expect(result.hasFallback).toBe(true)
    })

    it("should preserve error through pipeline", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        return yield* backend.get("missing").pipe(
          Effect.tapError((err) =>
            Effect.logWarning(
              `Failed to get blob: ${(err as BlobNotFoundError).id}`
            )
          )
        )
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(Effect.either(program))
      expect(result._tag).toBe("Left")
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(BlobNotFoundError)
      }
    })
  })

  describe("BlobAlreadyExistsError", () => {
    it("should create error with proper fields", () => {
      const error = new BlobAlreadyExistsError({
        message: "Blob already exists",
        id: "duplicate-id",
        backend: "InMemory",
      })

      expect(error._tag).toBe("BlobAlreadyExistsError")
      expect(error.message).toBe("Blob already exists")
      expect(error.id).toBe("duplicate-id")
      expect(error.backend).toBe("InMemory")
    })

    it("should be catchable by tag during save", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* backend.save(Buffer.from("data"), "text/plain", {
          id: "test-id",
        })

        return yield* backend
          .save(Buffer.from("new data"), "text/plain", { id: "test-id" })
          .pipe(
            Effect.catchTag("BlobAlreadyExistsError", (err) => {
              return Effect.succeed({
                tag: err._tag,
                id: err.id,
                recovered: true,
              })
            })
          )
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result.tag).toBe("BlobAlreadyExistsError")
      expect(result.id).toBe("test-id")
      expect(result.recovered).toBe(true)
    })

    it("should not be thrown when overwrite=true", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const first = yield* backend.save(Buffer.from("data"), "text/plain", {
          id: "test-id",
        })

        const second = yield* backend.save(Buffer.from("new data"), "text/plain", {
          id: "test-id",
          overwrite: true,
        })

        const retrieved = yield* backend.get("test-id")
        return {
          firstId: first.id,
          secondId: second.id,
          retrievedData: retrieved.data.toString(),
        }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result.firstId).toBe("test-id")
      expect(result.secondId).toBe("test-id")
      expect(result.retrievedData).toBe("new data")
    })
  })

  describe("RepositoryError", () => {
    it("should create error with proper fields", () => {
      const cause = new Error("Underlying issue")
      const error = new RepositoryError({
        message: "Repository operation failed",
        operation: "save",
        backend: "InMemory",
        cause,
      })

      expect(error._tag).toBe("RepositoryError")
      expect(error.message).toBe("Repository operation failed")
      expect(error.operation).toBe("save")
      expect(error.backend).toBe("InMemory")
      expect(error.cause).toBe(cause)
    })

    it("should support all operation types", () => {
      const operations = [
        "save",
        "get",
        "delete",
        "list",
        "exists",
        "getMetadata",
      ] as const

      for (const op of operations) {
        const error = new RepositoryError({
          message: `Failed: ${op}`,
          operation: op,
          backend: "InMemory",
        })

        expect(error.operation).toBe(op)
      }
    })
  })

  describe("InvalidBlobError", () => {
    it("should create error with proper fields", () => {
      const error = new InvalidBlobError({
        message: "Invalid blob",
        reason: "corrupted_data",
        receivedValue: "bad",
      })

      expect(error._tag).toBe("InvalidBlobError")
      expect(error.message).toBe("Invalid blob")
      expect(error.reason).toBe("corrupted_data")
      expect(error.receivedValue).toBe("bad")
    })

    it("should handle optional receivedValue", () => {
      const error = new InvalidBlobError({
        message: "Invalid blob",
        reason: "invalid_mime",
      })

      expect(error.receivedValue).toBeUndefined()
    })
  })

  describe("StorageQuotaError", () => {
    it("should create error with proper fields", () => {
      const error = new StorageQuotaError({
        message: "Storage quota exceeded",
        backend: "InMemory",
        quotaBytes: 1000,
        usedBytes: 950,
      })

      expect(error._tag).toBe("StorageQuotaError")
      expect(error.message).toBe("Storage quota exceeded")
      expect(error.backend).toBe("InMemory")
      expect(error.quotaBytes).toBe(1000)
      expect(error.usedBytes).toBe(950)
    })

    it("should handle optional quota fields", () => {
      const error = new StorageQuotaError({
        message: "Quota exceeded",
        backend: "InMemory",
      })

      expect(error.quotaBytes).toBeUndefined()
      expect(error.usedBytes).toBeUndefined()
    })
  })
})

describe("Error Recovery Patterns", () => {
  it("should recover from BlobNotFoundError with fallback", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      const blob = yield* backend
        .get("missing-id")
        .pipe(
          Effect.catchTag("BlobNotFoundError", () =>
            Effect.succeed({
              metadata: {
                id: "fallback-id",
                mimeType: "text/plain",
                sizeBytes: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              data: Buffer.from(""),
            })
          )
        )

      return blob.metadata.id
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result).toBe("fallback-id")
  })

  it("should handle multiple error types in sequence", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Try to get nonexistent blob
      const result1 = yield* backend
        .get("missing")
        .pipe(
          Effect.catchTag("BlobNotFoundError", () =>
            Effect.succeed({ recovered: "not_found" })
          )
        )

      // Try to save duplicate
      yield* backend.save(Buffer.from("data"), "text/plain", {
        id: "test-id",
      })

      const result2 = yield* backend
        .save(Buffer.from("new"), "text/plain", { id: "test-id" })
        .pipe(
          Effect.catchTag("BlobAlreadyExistsError", () =>
            Effect.succeed({ recovered: "already_exists" })
          )
        )

      return { result1, result2 }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.result1.recovered).toBe("not_found")
    expect(result.result2.recovered).toBe("already_exists")
  })

  it("should allow retrying failed operations", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Save a blob
      const saved = yield* backend.save(
        Buffer.from("data"),
        "text/plain"
      )

      // Attempt to get it
      let attempts = 0
      const result = yield* backend.get(saved.id).pipe(
        Effect.catchTag("BlobNotFoundError", () => {
          attempts++
          return attempts < 2
            ? Effect.fail(
                new BlobNotFoundError({
                  message: "Retry",
                  id: saved.id,
                  backend: "InMemory",
                })
              )
            : Effect.succeed({
                metadata: saved,
                data: Buffer.from("fallback"),
              })
        })
      )

      return { recovered: true, attempts }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.recovered).toBe(true)
  })
})
