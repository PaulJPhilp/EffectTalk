import { Effect, FiberRef } from "effect"
import { randomUUID } from "node:crypto"

/**
 * FiberRef for request-scoped context
 * Automatically propagated across Effect operations within a fiber
 */
export const RequestIdRef = FiberRef.unsafeMake<string | undefined>(undefined)

export type ContextServiceSchema = {
  readonly getRequestId: () => Effect.Effect<string>
  readonly setRequestId: (id: string) => Effect.Effect<void>
  readonly generateRequestId: () => Effect.Effect<string>
  readonly withRequestId: <A, E, R>(
    requestId: string | undefined
  ) => (effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>
}

export class ContextService extends Effect.Service<ContextServiceSchema>()(
  "ContextService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        getRequestId: () =>
          Effect.gen(function* () {
            const current = yield* FiberRef.get(RequestIdRef)
            if (current) return current

            // Generate if not present
            const newId = randomUUID()
            yield* FiberRef.set(RequestIdRef, newId)
            return newId
          }),

        setRequestId: (id: string) => FiberRef.set(RequestIdRef, id),

        generateRequestId: () =>
          Effect.sync(() => randomUUID()),

        withRequestId:
          <A, E, R>(requestId: string | undefined) =>
          (effect: Effect.Effect<A, E, R>) =>
            Effect.gen(function* () {
              const id = requestId ?? randomUUID()
              yield* FiberRef.set(RequestIdRef, id)
              return yield* effect
            }),
      } satisfies ContextServiceSchema
    }),
  }
) {}
