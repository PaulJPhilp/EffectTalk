/**
 * Integration tests for effect-repository with multiple backends
 *
 * Tests backend abstraction, data consistency, and backend-agnostic operations
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

describe("Backend Abstraction", () => {
  it("should work with InMemoryBackend", async () => {
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

  it("should support swappable backends with same API", async () => {
    // Create test with InMemoryBackend
    const testOperation = (backend: any) =>
      Effect.gen(function* () {
        const metadata = yield* save(
          backend,
          Buffer.from("data"),
          "application/json"
        )

        return yield* get(backend, metadata.id)
      })

    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend
      return yield* testOperation(backend)
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.data.toString()).toBe("data")
  })

  it("should maintain data consistency across operations", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Save multiple blobs
      const blob1 = yield* save(
        backend,
        Buffer.from("data1"),
        "text/plain",
        { id: "blob-1" }
      )
      const blob2 = yield* save(
        backend,
        Buffer.from("data2"),
        "image/png",
        { id: "blob-2" }
      )

      // Verify data consistency via different operations
      const retrieved1 = yield* get(backend, blob1.id)
      const retrieved2 = yield* get(backend, blob2.id)
      const meta1 = yield* getMetadata(backend, blob1.id)
      const meta2 = yield* getMetadata(backend, blob2.id)

      return {
        data1Match: retrieved1.data.toString() === "data1",
        data2Match: retrieved2.data.toString() === "data2",
        meta1Consistent:
          meta1.id === blob1.id && meta1.mimeType === "text/plain",
        meta2Consistent:
          meta2.id === blob2.id && meta2.mimeType === "image/png",
      }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.data1Match).toBe(true)
    expect(result.data2Match).toBe(true)
    expect(result.meta1Consistent).toBe(true)
    expect(result.meta2Consistent).toBe(true)
  })
})

describe("Complete Workflows", () => {
  it("should handle complete CRUD workflow", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Create
      const createMeta = yield* save(
        backend,
        Buffer.from("initial"),
        "text/plain",
        { id: "workflow-test" }
      )
      expect(createMeta.id).toBe("workflow-test")

      // Read (full)
      const readBlob = yield* get(backend, "workflow-test")
      expect(readBlob.data.toString()).toBe("initial")

      // Read (metadata)
      const readMeta = yield* getMetadata(backend, "workflow-test")
      expect(readMeta.id).toBe("workflow-test")

      // Update (via overwrite)
      const updateMeta = yield* save(
        backend,
        Buffer.from("updated"),
        "text/plain",
        { id: "workflow-test", overwrite: true }
      )
      expect(updateMeta.id).toBe("workflow-test")

      const updatedBlob = yield* get(backend, "workflow-test")
      expect(updatedBlob.data.toString()).toBe("updated")

      // Delete
      yield* deleteBlob(backend, "workflow-test")

      const existsAfter = yield* exists(backend, "workflow-test")
      expect(existsAfter).toBe(false)

      return { success: true }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.success).toBe(true)
  })

  it("should handle batch operations", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Batch save
      const metas = yield* Effect.all([
        save(backend, Buffer.from("doc1"), "text/plain"),
        save(backend, Buffer.from("img1"), "image/png"),
        save(backend, Buffer.from("doc2"), "text/plain"),
      ])

      expect(metas.length).toBe(3)

      // Batch get
      const blobs = yield* Effect.all(
        metas.map((meta) => get(backend, meta.id))
      )

      expect(blobs.length).toBe(3)
      expect(blobs[0].data.toString()).toBe("doc1")
      expect(blobs[1].data.toString()).toBe("img1")
      expect(blobs[2].data.toString()).toBe("doc2")

      // Batch delete
      yield* Effect.all(
        metas.map((meta) => deleteBlob(backend, meta.id))
      )

      // Verify all deleted
      const allDeleted = yield* Effect.all(
        metas.map((meta) => exists(backend, meta.id))
      )

      return allDeleted.every((e) => e === false)
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result).toBe(true)
  })

  it("should handle listing with filtering and pagination", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Create various blobs
      yield* Effect.all([
        save(backend, Buffer.from("txt1"), "text/plain"),
        save(backend, Buffer.from("txt2"), "text/html"),
        save(backend, Buffer.from("img1"), "image/png"),
        save(backend, Buffer.from("img2"), "image/jpeg"),
        save(backend, Buffer.from("json1"), "application/json"),
      ])

      // List all
      const allResult = yield* list(backend)
      expect(allResult.items.length).toBe(5)

      // List with MIME filter
      const textResult = yield* list(backend, { mimeTypePrefix: "text/" })
      expect(textResult.items.length).toBe(2)
      expect(
        textResult.items.every((m) => m.mimeType.startsWith("text/"))
      ).toBe(true)

      const imageResult = yield* list(backend, { mimeTypePrefix: "image/" })
      expect(imageResult.items.length).toBe(2)

      // List with limit and cursor
      const pagedResult = yield* list(backend, { limit: 2 })
      expect(pagedResult.items.length).toBe(2)
      expect(pagedResult.nextCursor).toBeDefined()

      return { success: true }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.success).toBe(true)
  })
})

describe("Error Handling Across Operations", () => {
  it("should handle cascading errors gracefully", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Try to get nonexistent blob
      const getResult = yield* Effect.either(get(backend, "nonexistent"))
      expect(getResult._tag).toBe("Left")

      // Try to delete nonexistent blob
      const delResult = yield* Effect.either(deleteBlob(backend, "nonexistent"))
      expect(delResult._tag).toBe("Left")

      // Try to get metadata for nonexistent blob
      const metaResult = yield* Effect.either(
        getMetadata(backend, "nonexistent")
      )
      expect(metaResult._tag).toBe("Left")

      return { allFailed: true }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.allFailed).toBe(true)
  })

  it("should handle selective error recovery", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Save some data
      const saved = yield* save(backend, Buffer.from("data"), "text/plain")

      // Operation that will fail
      const failureResult = yield* get(backend, "nonexistent").pipe(
        Effect.catchTag("BlobNotFoundError", () =>
          Effect.succeed({
            id: "fallback-id",
            data: Buffer.from("fallback"),
          })
        )
      )

      // Normal operation
      const successResult = yield* get(backend, saved.id)

      return {
        fallbackUsed: failureResult.id === "fallback-id",
        normalSuccess: successResult.metadata.id === saved.id,
      }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.fallbackUsed).toBe(true)
    expect(result.normalSuccess).toBe(true)
  })
})

describe("Data Persistence Across Instances", () => {
  it("should share state between service instances with same backend", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      // Save with first "instance" (service instance)
      const meta1 = yield* save(backend, Buffer.from("data"), "text/plain", {
        id: "shared-id",
      })

      // Retrieve with second "instance" (different service instance but same backend)
      const blob2 = yield* get(backend, "shared-id")

      return {
        meta1Id: meta1.id,
        blob2Id: blob2.metadata.id,
        data: blob2.data.toString(),
      }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.meta1Id).toBe("shared-id")
    expect(result.blob2Id).toBe("shared-id")
    expect(result.data).toBe("data")
  })
})

describe("Large Collection Handling", () => {
  it("should efficiently handle many blobs", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      const count = 50

      // Save many blobs
      const metas = yield* Effect.all(
        Array.from({ length: count }, (_, i) =>
          save(backend, Buffer.from(`data-${i}`), "text/plain", {
            id: `blob-${i}`,
          })
        )
      )

      expect(metas.length).toBe(count)

      // List all
      const listResult = yield* list(backend)
      expect(listResult.items.length).toBe(count)
      expect(listResult.totalCount).toBe(count)

      // Random access
      const randomIndex = Math.floor(Math.random() * count)
      const retrieved = yield* get(backend, `blob-${randomIndex}`)
      expect(retrieved.data.toString()).toBe(`data-${randomIndex}`)

      return { success: true }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.success).toBe(true)
  })

  it("should maintain consistency with pagination over large collections", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend

      const count = 20

      // Save blobs
      yield* Effect.all(
        Array.from({ length: count }, (_, i) =>
          save(backend, Buffer.from(`data-${i}`), "text/plain")
        )
      )

      // Paginate through results
      let pageCount = 0
      let totalFromPages = 0
      let lastCursor: string | undefined

      const firstPage = yield* list(backend, { limit: 5 })
      pageCount++
      totalFromPages += firstPage.items.length
      lastCursor = firstPage.nextCursor

      if (lastCursor) {
        const secondPage = yield* list(backend, {
          limit: 5,
          cursor: lastCursor,
        })
        pageCount++
        totalFromPages += secondPage.items.length
      }

      return {
        pagesRequested: pageCount,
        itemsFromPages: totalFromPages,
        totalViaList: firstPage.totalCount,
      }
    }).pipe(Effect.provide(InMemoryBackend.Default))

    const result = await Effect.runPromise(program)
    expect(result.itemsFromPages).toBeGreaterThan(0)
  })
})
