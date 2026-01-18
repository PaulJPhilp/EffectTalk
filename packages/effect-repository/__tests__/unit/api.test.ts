/**
 * API function tests for effect-repository
 *
 * Tests public API convenience functions and operations
 */

import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { InMemoryBackend } from "../../src/index.js"
import {
  save,
  get,
  getMetadata,
  exists,
  deleteBlob,
  list,
} from "../../src/api.js"

describe("API Functions", () => {
  describe("save", () => {
    it("should save blob and return metadata", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const metadata = yield* save(
          backend,
          Buffer.from("test data"),
          "text/plain"
        )

        expect(metadata.mimeType).toBe("text/plain")
        expect(metadata.sizeBytes).toBe(9)
        expect(metadata.id).toBeDefined()
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should accept save options", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const metadata = yield* save(
          backend,
          Buffer.from("data"),
          "application/json",
          {
            id: "custom-id",
            customMetadata: { version: "1.0" },
          }
        )

        expect(metadata.id).toBe("custom-id")
        expect(metadata.customMetadata).toEqual({ version: "1.0" })
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should generate unique IDs when not provided", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const meta1 = yield* save(backend, Buffer.from("data1"), "text/plain")
        const meta2 = yield* save(backend, Buffer.from("data2"), "text/plain")

        expect(meta1.id).not.toBe(meta2.id)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("get", () => {
    it("should retrieve blob by ID", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const metadata = yield* save(
          backend,
          Buffer.from("test data"),
          "text/plain"
        )

        const blob = yield* get(backend, metadata.id)

        expect(blob.data.toString()).toBe("test data")
        expect(blob.metadata.mimeType).toBe("text/plain")
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should fail for nonexistent ID", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        return yield* Effect.either(get(backend, "nonexistent"))
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result._tag).toBe("Left")
    })
  })

  describe("getMetadata", () => {
    it("should retrieve metadata without data", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(
          backend,
          Buffer.from("large data content"),
          "text/plain",
          { id: "meta-test" }
        )

        const metadata = yield* getMetadata(backend, "meta-test")

        expect(metadata.id).toBe("meta-test")
        expect(metadata.mimeType).toBe("text/plain")
        expect(metadata.sizeBytes).toBe(18)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should fail for nonexistent ID", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        return yield* Effect.either(getMetadata(backend, "missing"))
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result._tag).toBe("Left")
    })

    it("should preserve metadata consistency", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const originalMeta = yield* save(
          backend,
          Buffer.from("data"),
          "application/json",
          { customMetadata: { key: "value" } }
        )

        const retrievedMeta = yield* getMetadata(backend, originalMeta.id)

        expect(retrievedMeta.id).toBe(originalMeta.id)
        expect(retrievedMeta.mimeType).toBe(originalMeta.mimeType)
        expect(retrievedMeta.sizeBytes).toBe(originalMeta.sizeBytes)
        expect(retrievedMeta.customMetadata).toEqual(originalMeta.customMetadata)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("exists", () => {
    it("should return true for existing blob", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const metadata = yield* save(backend, Buffer.from("data"), "text/plain")
        const doesExist = yield* exists(backend, metadata.id)

        expect(doesExist).toBe(true)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should return false for nonexistent blob", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const doesExist = yield* exists(backend, "nonexistent")

        expect(doesExist).toBe(false)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("deleteBlob", () => {
    it("should delete blob and make it inaccessible", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const metadata = yield* save(backend, Buffer.from("data"), "text/plain")
        const existsBefore = yield* exists(backend, metadata.id)

        yield* deleteBlob(backend, metadata.id)

        const existsAfter = yield* exists(backend, metadata.id)

        return { existsBefore, existsAfter }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result.existsBefore).toBe(true)
      expect(result.existsAfter).toBe(false)
    })

    it("should fail to delete nonexistent blob", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        return yield* Effect.either(deleteBlob(backend, "nonexistent"))
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result._tag).toBe("Left")
    })
  })

  describe("list", () => {
    it("should list all blobs", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data1"), "text/plain")
        yield* save(backend, Buffer.from("data2"), "text/plain")
        yield* save(backend, Buffer.from("data3"), "image/png")

        const result = yield* list(backend)

        expect(result.items.length).toBe(3)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should filter by MIME type prefix", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data1"), "text/plain")
        yield* save(backend, Buffer.from("data2"), "text/html")
        yield* save(backend, Buffer.from("data3"), "image/png")

        const result = yield* list(backend, { mimeTypePrefix: "text/" })

        expect(result.items.length).toBe(2)
        expect(result.items.every((m) => m.mimeType.startsWith("text/"))).toBe(
          true
        )
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should apply limit", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* Effect.all([
          save(backend, Buffer.from("data1"), "text/plain"),
          save(backend, Buffer.from("data2"), "text/plain"),
          save(backend, Buffer.from("data3"), "text/plain"),
          save(backend, Buffer.from("data4"), "text/plain"),
        ])

        const result = yield* list(backend, { limit: 2 })

        expect(result.items.length).toBe(2)
        expect(result.nextCursor).toBeDefined()
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should return empty result for no matches", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data"), "text/plain")

        const result = yield* list(backend, { mimeTypePrefix: "image/" })

        expect(result.items.length).toBe(0)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should report totalCount when available", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data1"), "text/plain")
        yield* save(backend, Buffer.from("data2"), "text/plain")
        yield* save(backend, Buffer.from("data3"), "text/plain")

        const result = yield* list(backend)

        expect(result.totalCount).toBe(3)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })
})

describe("API Composition", () => {
  it("should support complete CRUD workflow via API", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Create
      const metadata = yield* save(
        backend,
        Buffer.from("initial data"),
        "text/plain",
        { id: "workflow-test" }
      )

      // Read (full blob)
      const blob = yield* get(backend, "workflow-test")
      expect(blob.data.toString()).toBe("initial data")

      // Read (metadata only)
      const meta = yield* getMetadata(backend, "workflow-test")
      expect(meta.id).toBe("workflow-test")

      // Check existence
      const exists1 = yield* exists(backend, "workflow-test")
      expect(exists1).toBe(true)

      // Update (via overwrite)
      yield* save(
        backend,
        Buffer.from("updated data"),
        "text/plain",
        { id: "workflow-test", overwrite: true }
      )

      const updated = yield* get(backend, "workflow-test")
      expect(updated.data.toString()).toBe("updated data")

      // Delete
      yield* deleteBlob(backend, "workflow-test")

      // Verify deletion
      const exists2 = yield* exists(backend, "workflow-test")
      expect(exists2).toBe(false)

      return { success: true }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.success).toBe(true)
  })

  it("should handle concurrent operations", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      const results = yield* Effect.all([
        save(backend, Buffer.from("data1"), "text/plain"),
        save(backend, Buffer.from("data2"), "text/plain"),
        save(backend, Buffer.from("data3"), "text/plain"),
      ])

      expect(results.length).toBe(3)

      const listed = yield* list(backend)
      expect(listed.items.length).toBe(3)

      return { concurrent: true }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.concurrent).toBe(true)
  })
})
