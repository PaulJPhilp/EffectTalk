import { Effect, Layer } from "effect";
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { SessionStore, SessionStoreLive } from "../../src/state/SessionStore.js";
import { BlockService, BlockServiceLive } from "../../src/core/BlockService.js";
import { ProcessRuntime, ProcessRuntimeLive } from "../../src/core/ProcessRuntime.js";
import { CommandExecutor, CommandExecutorLive } from "../../src/core/CommandExecutor.js";
import { Persistence, PersistenceLive } from "../../src/state/Persistence.js";
import type { Session } from "../../src/types/session.js";

import { SlashCommands, SlashCommandsLive } from "../../src/core/SlashCommands.js";

const TEST_DB_PATH = path.join(os.tmpdir(), `effect-cockpit-test-${Date.now()}.db`);

const initialSession: Session = {
  id: "integration-session",
  blocks: [],
  activeBlockId: null,
  focusedBlockId: null,
  workingDirectory: process.cwd(),
  environment: {},
  retentionConfig: {
    fullContentBlocks: 100,
    maxTotalBlocks: 100,
  },
};

// Assemble the real application layer (minus the UI)
const sessionStore = SessionStoreLive(initialSession);
const persistence = PersistenceLive(TEST_DB_PATH);
const processRuntime = ProcessRuntimeLive;
const slashCommands = SlashCommandsLive.pipe(
  Layer.provideMerge(sessionStore),
  Layer.provideMerge(persistence)
);
const blockService = BlockServiceLive.pipe(
  Layer.provideMerge(sessionStore),
  Layer.provideMerge(processRuntime)
);
const commandExecutor = CommandExecutorLive.pipe(
  Layer.provideMerge(blockService),
  Layer.provideMerge(sessionStore),
  Layer.provideMerge(slashCommands)
);

const MainLayer = Layer.mergeAll(
  sessionStore,
  persistence,
  processRuntime,
  slashCommands,
  blockService,
  commandExecutor
);

describe("Phase 1 Integration (No Mocks)", () => {
  
  afterAll(() => {
    // Cleanup the test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it("should execute a real command, capture output, and persist to SQLite", () =>
    Effect.gen(function* () {
      const executor = yield* CommandExecutor;
      const store = yield* SessionStore;
      const persistence = yield* Persistence;

      // 1. Execute a real command
      yield* executor.execute("echo 'Hello Integration'");

      // 2. Poll output until we see the result (since streaming is async)
      // We'll wait up to 2 seconds
      let found = false;
      for (let i = 0; i < 20; i++) {
        const session = yield* store.get;
        const block = session.blocks[0];
        if (block && block.status === "success" && block.stdout.includes("Hello Integration")) {
          found = true;
          break;
        }
        yield* Effect.sleep("100 millis");
      }

      const sessionAfterExec = yield* store.get;
      const block = sessionAfterExec.blocks[0];

      expect(found).toBe(true);
      expect(block).toBeDefined();
      expect(block?.command).toBe("echo 'Hello Integration'");
      expect(block?.status).toBe("success");
      expect(block?.exitCode).toBe(0);

      // 3. Persist to SQLite
      yield* persistence.saveSession(sessionAfterExec);

      // 4. Verify Persistence by "restarting" (reading from the same DB file)
      // We define a new scope to simulate a fresh start
      const loadedSession = yield* Effect.provide(
        Effect.gen(function* () {
          const freshPersistence = yield* Persistence;
          return yield* freshPersistence.loadLastSession;
        }),
        PersistenceLive(TEST_DB_PATH) // Same DB file
      );

      expect(loadedSession).toBeDefined();
      expect(loadedSession?.id).toBe(initialSession.id);
      expect(loadedSession?.blocks).toHaveLength(1);
      const loadedBlock = loadedSession?.blocks[0];
      expect(loadedBlock).toBeDefined();
      expect(loadedBlock?.command).toBe("echo 'Hello Integration'");
      expect(loadedBlock?.stdout).toContain("Hello Integration");
      expect(loadedBlock?.status).toBe("success");

    }).pipe(
      Effect.provide(MainLayer),
      Effect.scoped,
      Effect.runPromise
    ));
});
