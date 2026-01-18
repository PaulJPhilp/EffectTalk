import { Effect, Layer } from "effect"
import { describe, expect, it } from "vitest"
import { ArtifactService } from "../../src/services/index.js"
import type { Artifact } from "../../src/types.js"

describe("ArtifactService", () => {
  it("should create an artifact with content and metadata", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ArtifactService

      const artifact = yield* service.create(
        "const greeting = (name: string) => `Hello, ${name}!`",
        {
          title: "Greeting Function",
          tags: ["typescript", "function"],
        }
      )

      return artifact
    })

    const artifact = await Effect.runPromise(
      program.pipe(Effect.provide(ArtifactService.Default))
    )

    expect(artifact).toBeDefined()
    expect(artifact.id).toBeDefined()
    expect(artifact.metadata.title).toBe("Greeting Function")
    expect(artifact.metadata.tags).toContain("typescript")
  })

  it("should get an artifact by ID", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ArtifactService

      // Create an artifact
      const created = yield* service.create("test content", {
        title: "Test Artifact",
      })

      // Get it back
      const retrieved = yield* service.get(created.id)

      return retrieved
    })

    const artifact = await Effect.runPromise(
      program.pipe(Effect.provide(ArtifactService.Default))
    )

    expect(artifact).toBeDefined()
    expect(artifact.metadata.title).toBe("Test Artifact")
  })

  it("should list artifacts", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ArtifactService

      // Create a few artifacts
      yield* service.create("content 1", { title: "First" })
      yield* service.create("content 2", { title: "Second" })

      // List all
      const artifacts = yield* service.list()

      return artifacts
    })

    const artifacts = await Effect.runPromise(
      program.pipe(Effect.provide(ArtifactService.Default))
    )

    expect(Array.isArray(artifacts)).toBe(true)
    expect(artifacts.length).toBeGreaterThanOrEqual(2)
  })

  it("should detect artifact type from content", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ArtifactService

      // Create a TypeScript code artifact with filename hint for reliable detection
      const artifact = yield* service.create(
        "function add(a: number, b: number): number { return a + b; }",
        { title: "Add Function", filename: "add.ts" }
      )

      return artifact
    })

    const artifact = await Effect.runPromise(
      program.pipe(Effect.provide(ArtifactService.Default))
    )

    expect(artifact.type.category).toBe("code")
  })

  it("should handle artifact not found error", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ArtifactService
      yield* service.get("non-existent-id")
    })

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(ArtifactService.Default), Effect.either)
    )

    expect(result._tag).toBe("Left")
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ArtifactNotFoundError")
    }
  })

  it("should update an artifact with new content", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ArtifactService

      // Create initial artifact
      const created = yield* service.create("original content", {
        title: "Original",
      })

      // Update it
      const updated = yield* service.update(created.id, "updated content", {
        title: "Updated",
      })

      return { created, updated }
    })

    const { created, updated } = await Effect.runPromise(
      program.pipe(Effect.provide(ArtifactService.Default))
    )

    expect(updated.metadata.title).toBe("Updated")
  })
})
