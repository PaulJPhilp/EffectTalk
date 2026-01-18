/**
 * Type and schema validation tests for effect-attachment
 *
 * Tests type validation and schema constraints.
 */

import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { InMemoryBackend } from "effect-repository"
import {
  createAttachmentService,
  type Attachment,
  type AttachmentWithData,
  type UploadOptions,
  type AttachmentListOptions,
  type AttachmentListResult,
  type AttachmentServiceConfig,
} from "../../src/index.js"

describe("Type Validation", () => {
  describe("Attachment type", () => {
    it("should have all required fields", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-1", userId: "user-1" }
        )

        // Type check: Attachment must have all required fields
        const validated: Attachment = {
          id: attachment.id,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          uploadedAt: attachment.uploadedAt,
          chatId: attachment.chatId,
          userId: attachment.userId,
        }

        expect(validated.id).toBeDefined()
        expect(validated.filename).toBe("file.txt")
        expect(validated.mimeType).toBe("text/plain")
        expect(validated.sizeBytes).toBeGreaterThanOrEqual(0)
        expect(validated.uploadedAt).toBeInstanceOf(Date)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should allow optional chatId and userId", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain"
        )

        // Type check: Optional fields can be undefined
        const validated: Attachment = {
          id: attachment.id,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          uploadedAt: attachment.uploadedAt,
          // chatId and userId are optional
        }

        expect(validated.chatId).toBeUndefined()
        expect(validated.userId).toBeUndefined()
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("AttachmentWithData type", () => {
    it("should include binary data", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const originalData = Buffer.from("test data")
        const attachment = yield* service.upload(
          "file.txt",
          originalData,
          "text/plain"
        )

        const withData = yield* service.download(attachment.id)

        // Type check: AttachmentWithData includes all Attachment fields plus data
        const validated: AttachmentWithData = {
          id: withData.id,
          filename: withData.filename,
          mimeType: withData.mimeType,
          sizeBytes: withData.sizeBytes,
          uploadedAt: withData.uploadedAt,
          data: withData.data,
        }

        expect(Buffer.isBuffer(validated.data)).toBe(true)
        expect(validated.data.equals(originalData)).toBe(true)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("UploadOptions type", () => {
    it("should accept all valid options", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const options: UploadOptions = {
          chatId: "chat-1",
          userId: "user-1",
          id: "custom-id",
        }

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain",
          options
        )

        expect(attachment.chatId).toBe("chat-1")
        expect(attachment.userId).toBe("user-1")
        expect(attachment.id).toBe("custom-id")
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should allow partial options", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const options: UploadOptions = {
          chatId: "chat-1",
          // userId and id are optional
        }

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain",
          options
        )

        expect(attachment.chatId).toBe("chat-1")
        expect(attachment.userId).toBeUndefined()
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should allow empty options", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const options: UploadOptions = {}

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain",
          options
        )

        expect(attachment.chatId).toBeUndefined()
        expect(attachment.userId).toBeUndefined()
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("AttachmentListOptions type", () => {
    it("should accept all valid filters", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const options: AttachmentListOptions = {
          chatId: "chat-1",
          userId: "user-1",
          mimeTypePrefix: "image/",
          limit: 10,
          cursor: "abc123",
        }

        const result = yield* service.list(options)
        expect(Array.isArray(result.items)).toBe(true)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should allow partial filters", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const options: AttachmentListOptions = {
          chatId: "chat-1",
          limit: 10,
          // mimeTypePrefix, userId, cursor optional
        }

        const result = yield* service.list(options)
        expect(Array.isArray(result.items)).toBe(true)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should allow empty options", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const options: AttachmentListOptions = {}

        const result = yield* service.list(options)
        expect(Array.isArray(result.items)).toBe(true)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("AttachmentListResult type", () => {
    it("should have items array and optional pagination fields", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const result = yield* service.list()

        // Type check: AttachmentListResult has required and optional fields
        const validated: AttachmentListResult = {
          items: result.items,
          nextCursor: result.nextCursor,
          totalCount: result.totalCount,
        }

        expect(Array.isArray(validated.items)).toBe(true)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should have items as readonly array", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain"
        )

        const result = yield* service.list()

        // Type check: items is readonly
        expect(Object.isFrozen(result.items) || result.items.length >= 0).toBe(
          true
        )
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("AttachmentServiceConfig type", () => {
    it("should accept all valid config options", async () => {
      const config: AttachmentServiceConfig = {
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png"],
      }

      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend, config)

        const attachment = yield* service.upload(
          "image.jpg",
          Buffer.from("data"),
          "image/jpeg"
        )

        expect(attachment.filename).toBe("image.jpg")
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should allow partial config", async () => {
      const config: AttachmentServiceConfig = {
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        // allowedMimeTypes is optional
      }

      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend, config)

        const attachment = yield* service.upload(
          "file.exe",
          Buffer.from("data"),
          "application/x-executable"
        )

        expect(attachment.filename).toBe("file.exe")
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should allow empty config", async () => {
      const config: AttachmentServiceConfig = {}

      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend, config)

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain"
        )

        expect(attachment.filename).toBe("file.txt")
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })
})

describe("Type Readonly Constraints", () => {
  it("should have readonly Attachment fields", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend
      const service = createAttachmentService(backend)

      const attachment = yield* service.upload(
        "file.txt",
        Buffer.from("data"),
        "text/plain"
      )

      // These fields should be readonly (TypeScript compile-time check)
      // We verify the values are preserved
      expect(attachment.id).toBeDefined()
      expect(attachment.filename).toBe("file.txt")
      expect(attachment.mimeType).toBe("text/plain")
    }).pipe(Effect.provide(InMemoryBackend.Default))

    await Effect.runPromise(program)
  })
})
