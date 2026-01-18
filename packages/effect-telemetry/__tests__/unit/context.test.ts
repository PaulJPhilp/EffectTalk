import { Effect } from "effect"
import { describe, expect, it } from "vitest"
import { ContextService, RequestIdRef } from "../../src/services/context-service.js"

describe("ContextService", () => {
  it("should generate request ID if not present", async () => {
    const program = Effect.gen(function* () {
      const context = yield* ContextService
      const id1 = yield* context.getRequestId()
      const id2 = yield* context.getRequestId()

      // Same ID within same fiber
      expect(id1).toBe(id2)
      // UUID v4 format (36 chars including hyphens)
      expect(id1).toMatch(/^[0-9a-f-]{36}$/)
    }).pipe(Effect.provide(ContextService.Default))

    await Effect.runPromise(program)
  })

  it("should set and get request ID", async () => {
    const program = Effect.gen(function* () {
      const context = yield* ContextService
      const testId = "test-request-123"

      yield* context.setRequestId(testId)
      const retrievedId = yield* context.getRequestId()

      expect(retrievedId).toBe(testId)
    }).pipe(Effect.provide(ContextService.Default))

    await Effect.runPromise(program)
  })

  it("should propagate request ID across Effect operations", async () => {
    const program = Effect.gen(function* () {
      const context = yield* ContextService

      const nestedOperation = Effect.gen(function* () {
        const id = yield* context.getRequestId()
        return id
      })

      const testId = "test-id-123"
      const id = yield* context.withRequestId(testId)(nestedOperation)

      expect(id).toBe(testId)
    }).pipe(Effect.provide(ContextService.Default))

    await Effect.runPromise(program)
  })

  it("should handle nested withRequestId calls with local scope", async () => {
    const program = Effect.gen(function* () {
      const context = yield* ContextService

      const operation1 = Effect.gen(function* () {
        const id1 = yield* context.getRequestId()
        expect(id1).toBe("id-1")
      })

      const operation2 = Effect.gen(function* () {
        const id2 = yield* context.getRequestId()
        expect(id2).toBe("id-2")
      })

      yield* context.withRequestId("id-1")(operation1)
      yield* context.withRequestId("id-2")(operation2)
    }).pipe(Effect.provide(ContextService.Default))

    await Effect.runPromise(program)
  })

  it("should generate unique request IDs on demand", async () => {
    const program = Effect.gen(function* () {
      const context = yield* ContextService
      const id1 = yield* context.generateRequestId()
      const id2 = yield* context.generateRequestId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^[0-9a-f-]{36}$/)
      expect(id2).toMatch(/^[0-9a-f-]{36}$/)
    }).pipe(Effect.provide(ContextService.Default))

    await Effect.runPromise(program)
  })

  it("should clear request ID when set to undefined context", async () => {
    const program = Effect.gen(function* () {
      const context = yield* ContextService

      yield* context.setRequestId("test-id")
      let id = yield* context.getRequestId()
      expect(id).toBe("test-id")

      // Using withRequestId with undefined generates new ID
      const newIdFromUndefined = yield* context.withRequestId(undefined)(
        context.getRequestId()
      )
      expect(newIdFromUndefined).not.toBe("test-id")
      expect(newIdFromUndefined).toMatch(/^[0-9a-f-]{36}$/)
    }).pipe(Effect.provide(ContextService.Default))

    await Effect.runPromise(program)
  })
})
