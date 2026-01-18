import { Effect, Layer, Scope } from "effect";
import { describe, it, expect } from "vitest";
import { BlockService, BlockServiceLive } from "../../src/core/BlockService.js";
import { SessionStoreLive } from "../../src/state/SessionStore.js";
import { ProcessRuntimeLive } from "../../src/core/ProcessRuntime.js";
import type { Session } from "../../src/types/session.js";

const initialSession: Session = {
  id: "test-session",
  blocks: [],
  activeBlockId: null,
  focusedBlockId: null,
  workingDirectory: "/test",
  environment: {},
  retentionConfig: {
    fullContentBlocks: 100,
    maxTotalBlocks: 100,
  },
};

const TestLayer = Layer.provide(
  BlockServiceLive,
  Layer.merge(
    SessionStoreLive(initialSession),
    ProcessRuntimeLive
  )
);

describe("BlockService", () => {
  it("should create a block", () =>
    Effect.gen(function* () {
      const service = yield* BlockService;
      const block = yield* service.create("echo hello");
      expect(block.command).toBe("echo hello");
      expect(block.status).toBe("idle");
      expect(block.id).toBeDefined();
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    ));

  it("should update block status", () =>
    Effect.gen(function* () {
      const service = yield* BlockService;
      yield* service.updateStatus("test-id", "running");
    }).pipe(
      Effect.provide(TestLayer),
      Effect.runPromise
    ));
});
