import { Effect, Layer } from "effect";
import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { SessionStore, SessionStoreLive } from "../../src/state/SessionStore.js";
import { BlockService, BlockServiceLive } from "../../src/core/BlockService.js";
import { ProcessRuntime, ProcessRuntimeLive } from "../../src/core/ProcessRuntime.js";
import { CommandExecutor, CommandExecutorLive } from "../../src/core/CommandExecutor.js";
import { Persistence, PersistenceLive } from "../../src/state/Persistence.js";
import { PluginManager, PluginManagerLive } from "../../src/core/PluginManager.js";
import type { Session } from "../../src/types/session.js";
import type { Plugin } from "../../src/types/plugin.js";

import { SlashCommands, SlashCommandsLive } from "../../src/core/SlashCommands.js";

const TEST_DB_PATH = path.join(os.tmpdir(), `effect-cockpit-test-p3-${Date.now()}.db`);

const initialSession: Session = {
  id: "integration-session-p3",
  blocks: [],
  activeBlockId: null,
  focusedBlockId: null,
  workingDirectory: process.cwd(),
  environment: { SNAPSHOT_TEST: "true" },
  retentionConfig: {
    fullContentBlocks: 100,
    maxTotalBlocks: 100,
  },
};

const sessionStore = SessionStoreLive(initialSession);
const persistence = PersistenceLive(TEST_DB_PATH);
const processRuntime = ProcessRuntimeLive;
const pluginManager = PluginManagerLive;
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
  pluginManager,
  slashCommands,
  blockService,
  commandExecutor
);

describe("Phase 3 Integration (Snapshots & Plugins)", () => {
  afterAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it("should manage snapshots and plugins", () =>
    Effect.gen(function* () {
      const executor = yield* CommandExecutor;
      const store = yield* SessionStore;
      const persistence = yield* Persistence;
      const pluginManager = yield* PluginManager;

      // --- SNAPSHOTS ---

      // 1. Create some state
      yield* executor.execute("echo 'Before Snapshot'");
      let session = yield* store.get;
      expect(session.blocks).toHaveLength(1);
      
      // 2. Create a snapshot
      yield* persistence.createSnapshot("backup-1", session);

      // 3. Modify state (add another block)
      yield* executor.execute("echo 'After Snapshot'");
      session = yield* store.get;
      expect(session.blocks).toHaveLength(2);

      // 4. Verify snapshot list
      const snapshots = yield* persistence.listSnapshots;
      expect(snapshots).toHaveLength(1);
      const firstSnapshot = snapshots[0];
      if (!firstSnapshot) throw new Error("Snapshot not found");
      expect(firstSnapshot.name).toBe("backup-1");

      // 5. Load snapshot
      const loadedSession = yield* persistence.loadSnapshot("backup-1");
      expect(loadedSession).toBeDefined();
      // Should only have the first block
      expect(loadedSession?.blocks).toHaveLength(1);
      expect(loadedSession?.blocks[0]?.command).toBe("echo 'Before Snapshot'");

      // --- PLUGINS ---

      // 6. Register a plugin
      const testPlugin: Plugin = {
        name: "TestPlugin",
        version: "1.0.0",
      };

      yield* pluginManager.register(testPlugin);

      // 7. Verify plugin registration
      const plugins = yield* pluginManager.getPlugins;
      expect(plugins).toHaveLength(1);
      expect(plugins[0]?.name).toBe("TestPlugin");

    }).pipe(
      Effect.provide(MainLayer),
      Effect.scoped,
      Effect.runPromise
    ));
});
