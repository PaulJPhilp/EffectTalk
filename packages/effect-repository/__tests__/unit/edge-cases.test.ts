/**
 * Edge case tests for effect-repository
 *
 * Tests boundary conditions, special input values, and corner cases
 */

import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { InMemoryBackend } from "../../src/index.js"
import { save, get, list } from "../../src/api.js"

describe("Edge Cases", () => {
  describe("Empty and Zero-Size Blobs", () => {
    it("should accept zero-byte blobs", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const metadata = yield* save(
          backend,
          Buffer.alloc(0),
          "text/plain"
        )

        expect(metadata.sizeBytes).toBe(0)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should retrieve zero-byte blobs correctly", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const metadata = yield* save(backend, Buffer.alloc(0), "text/plain")
        const blob = yield* get(backend, metadata.id)

        expect(blob.data.length).toBe(0)
        expect(blob.data).toEqual(Buffer.alloc(0))
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("Special Characters in IDs and Metadata", () => {
    it("should handle IDs with special characters", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const specialId = "blob-id_with-dash.and.dots-123"

        const metadata = yield* save(backend, Buffer.from("data"), "text/plain", {
          id: specialId,
        })

        expect(metadata.id).toBe(specialId)

        const blob = yield* get(backend, specialId)
        expect(blob.metadata.id).toBe(specialId)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should handle UUIDs as IDs", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const uuid = "550e8400-e29b-41d4-a716-446655440000"

        const metadata = yield* save(backend, Buffer.from("data"), "text/plain", {
          id: uuid,
        })

        expect(metadata.id).toBe(uuid)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should handle metadata keys with special characters", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const metadata = yield* save(
          backend,
          Buffer.from("data"),
          "text/plain",
          {
            customMetadata: {
              "x-custom-header": "value",
              "content.type": "application/json",
              "Cache_Control": "no-cache",
            },
          }
        )

        expect(metadata.customMetadata).toEqual({
          "x-custom-header": "value",
          "content.type": "application/json",
          Cache_Control: "no-cache",
        })
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("Large Values", () => {
    it("should handle large blobs (1MB+)", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const largeData = Buffer.alloc(1024 * 1024) // 1MB

        const metadata = yield* save(backend, largeData, "application/octet-stream")

        expect(metadata.sizeBytes).toBe(1024 * 1024)

        const blob = yield* get(backend, metadata.id)
        expect(blob.data.length).toBe(1024 * 1024)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should handle many metadata fields", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        // Create object with many keys
        const customMeta: Record<string, string> = {}
        for (let i = 0; i < 100; i++) {
          customMeta[`key-${i}`] = `value-${i}`
        }

        const metadata = yield* save(
          backend,
          Buffer.from("data"),
          "text/plain",
          { customMetadata: customMeta }
        )

        expect(Object.keys(metadata.customMetadata!).length).toBe(100)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("Binary Data Integrity", () => {
    it("should preserve exact binary data with all byte values", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        // Create buffer with all possible byte values
        const buffer = Buffer.alloc(256)
        for (let i = 0; i < 256; i++) {
          buffer[i] = i
        }

        const metadata = yield* save(
          backend,
          buffer,
          "application/octet-stream"
        )

        const blob = yield* get(backend, metadata.id)

        expect(Buffer.compare(blob.data, buffer)).toBe(0)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should preserve binary data with null bytes", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const buffer = Buffer.from([0, 1, 0, 2, 0, 3, 0])
        const metadata = yield* save(
          backend,
          buffer,
          "application/octet-stream"
        )

        const blob = yield* get(backend, metadata.id)

        expect(Buffer.compare(blob.data, buffer)).toBe(0)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("MIME Type Edge Cases", () => {
    it("should accept MIME types with parameters", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const mimeType = "text/plain; charset=utf-8"
        const metadata = yield* save(backend, Buffer.from("data"), mimeType)

        expect(metadata.mimeType).toBe(mimeType)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should accept vendor-specific MIME types", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const vendorMime = "application/vnd.api+json"
        const metadata = yield* save(backend, Buffer.from("data"), vendorMime)

        expect(metadata.mimeType).toBe(vendorMime)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should preserve custom MIME types exactly", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const customMime = "application/x-custom-format+json; version=2"
        const metadata = yield* save(backend, Buffer.from("data"), customMime)

        expect(metadata.mimeType).toBe(customMime)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("Duplicate ID Handling", () => {
    it("should reject duplicate ID without overwrite", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data1"), "text/plain", {
          id: "test-id",
        })

        return yield* Effect.either(
          save(backend, Buffer.from("data2"), "text/plain", {
            id: "test-id",
          })
        )
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result._tag).toBe("Left")
    })

    it("should allow overwrite with same ID", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const first = yield* save(
          backend,
          Buffer.from("original"),
          "text/plain",
          { id: "test-id" }
        )

        const second = yield* save(
          backend,
          Buffer.from("replacement"),
          "text/plain",
          { id: "test-id", overwrite: true }
        )

        const retrieved = yield* get(backend, "test-id")

        return {
          firstId: first.id,
          secondId: second.id,
          finalData: retrieved.data.toString(),
        }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result.firstId).toBe("test-id")
      expect(result.secondId).toBe("test-id")
      expect(result.finalData).toBe("replacement")
    })

    it("should update metadata on overwrite", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data"), "text/plain", {
          id: "test-id",
          customMetadata: { version: "1" },
        })

        yield* save(backend, Buffer.from("data"), "text/plain", {
          id: "test-id",
          overwrite: true,
          customMetadata: { version: "2" },
        })

        const blob = yield* get(backend, "test-id")
        return blob.metadata.customMetadata
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result).toEqual({ version: "2" })
    })
  })

  describe("List Operations with Edge Cases", () => {
    it("should handle list with zero limit", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data"), "text/plain")

        // Zero limit might be invalid per schema, but test handling
        return yield* Effect.either(list(backend, { limit: 0 }))
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      // Either it fails validation or returns empty
      expect(
        result._tag === "Left" || (result._tag === "Right" && result.right.items.length === 0)
      ).toBe(true)
    })

    it("should handle list with very large limit", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data1"), "text/plain")
        yield* save(backend, Buffer.from("data2"), "text/plain")

        const result = yield* list(backend, { limit: 1000000 })

        expect(result.items.length).toBe(2)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should handle empty MIME type prefix", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data"), "text/plain")
        yield* save(backend, Buffer.from("data"), "image/png")

        // Empty prefix matches everything
        const result = yield* list(backend, { mimeTypePrefix: "" })

        expect(result.items.length).toBe(2)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should filter with exact MIME type as prefix", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        yield* save(backend, Buffer.from("data"), "text/plain")
        yield* save(backend, Buffer.from("data"), "text/html")
        yield* save(backend, Buffer.from("data"), "text/plain; charset=utf-8")

        // Exact prefix matching
        const result = yield* list(backend, {
          mimeTypePrefix: "text/plain",
        })

        expect(result.items.length).toBe(2)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("Timestamp Consistency", () => {
    it("should set createdAt and updatedAt on save", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const beforeSave = new Date()

        const metadata = yield* save(backend, Buffer.from("data"), "text/plain")

        const afterSave = new Date()

        expect(metadata.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeSave.getTime()
        )
        expect(metadata.createdAt.getTime()).toBeLessThanOrEqual(
          afterSave.getTime()
        )
        expect(metadata.updatedAt.getTime()).toBe(metadata.createdAt.getTime())
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should preserve metadata on overwrite", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend

        const first = yield* save(
          backend,
          Buffer.from("data"),
          "text/plain",
          { id: "test-id" }
        )

        const second = yield* save(
          backend,
          Buffer.from("new data"),
          "text/plain",
          { id: "test-id", overwrite: true }
        )

        return {
          sameId: first.id === second.id,
          firstDate: first.createdAt instanceof Date,
          secondDate: second.createdAt instanceof Date,
        }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      const result = await Effect.runPromise(program)
      expect(result.sameId).toBe(true)
      expect(result.firstDate).toBe(true)
      expect(result.secondDate).toBe(true)
    })
  })
})
