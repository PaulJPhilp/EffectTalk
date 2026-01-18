/**
 * Testing utilities for effect-repository
 *
 * Provides helpers and fixtures for testing blob repository implementations
 *
 * @example
 * ```typescript
 * import { createTestBlob, createTestBlobData } from "effect-repository/testing"
 * import { InMemoryBackend } from "effect-repository"
 * import { Effect } from "effect"
 *
 * const program = Effect.gen(function* () {
 *   const backend = yield* InMemoryBackend
 *   const testData = createTestBlobData("Hello, World!")
 *   const metadata = yield* backend.save(testData, "text/plain")
 *   return metadata.id
 * }).pipe(Effect.provide(InMemoryBackend.Default))
 *
 * const blobId = await Effect.runPromise(program)
 * ```
 *
 * @module testing
 */

import crypto from "node:crypto"
import type { BlobMetadata } from "./types.js"

/**
 * Create test blob data as a Buffer
 *
 * @param content - String content to create buffer from (default: random data)
 * @returns A Buffer containing the test data
 */
export const createTestBlobData = (content?: string): Buffer => {
  if (content) {
    return Buffer.from(content, "utf-8")
  }
  return crypto.randomBytes(1024) // 1KB of random data
}

/**
 * Create a test blob metadata object
 *
 * Useful for testing metadata handling without saving blobs
 *
 * @param overrides - Partial metadata to override defaults
 * @returns Complete BlobMetadata object
 */
export const createTestBlobMetadata = (
  overrides?: Partial<BlobMetadata>
): BlobMetadata => {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    mimeType: "application/octet-stream",
    sizeBytes: 1024,
    createdAt: now,
    updatedAt: now,
    customMetadata: {},
    ...overrides,
  }
}

/**
 * Create multiple test blobs for batch operations
 *
 * @param count - Number of test blobs to create
 * @param baseContent - Optional base content (will be suffixed with index)
 * @returns Array of tuples containing [data, mimeType, id]
 */
export const createTestBlobs = (
  count: number,
  baseContent?: string
): Array<{
  data: Buffer
  mimeType: string
  id: string
}> => {
  return Array.from({ length: count }, (_, i) => ({
    data: createTestBlobData(baseContent ? `${baseContent}-${i}` : undefined),
    mimeType: `application/test-${i}`,
    id: crypto.randomUUID(),
  }))
}

/**
 * Assert that a blob matches expected properties
 *
 * @param blob - The blob to assert
 * @param expected - Expected properties to match
 * @throws If assertions fail
 */
export const assertBlobMatches = (
  blob: { data: Buffer; metadata: BlobMetadata },
  expected: {
    dataSize?: number
    mimeType?: string
    hasCustomMetadata?: boolean
  }
): void => {
  if (expected.dataSize !== undefined) {
    if (blob.data.length !== expected.dataSize) {
      throw new Error(
        `Expected data size ${expected.dataSize}, got ${blob.data.length}`
      )
    }
  }

  if (expected.mimeType !== undefined) {
    if (blob.metadata.mimeType !== expected.mimeType) {
      throw new Error(
        `Expected mimeType ${expected.mimeType}, got ${blob.metadata.mimeType}`
      )
    }
  }

  if (expected.hasCustomMetadata !== undefined) {
    const hasMetadata =
      blob.metadata.customMetadata && Object.keys(blob.metadata.customMetadata).length > 0
    if (hasMetadata !== expected.hasCustomMetadata) {
      throw new Error(
        `Expected custom metadata ${expected.hasCustomMetadata ? "present" : "absent"}`
      )
    }
  }
}
