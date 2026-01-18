import { Effect, Layer } from "effect";
import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import {
	SessionStore,
	SessionStoreLive,
} from "../../src/state/SessionStore.js";
import { BlockService, BlockServiceLive } from "../../src/core/BlockService.js";
import {
	ProcessRuntime,
	ProcessRuntimeLive,
} from "../../src/core/ProcessRuntime.js";
import {
	CommandExecutor,
	CommandExecutorLive,
} from "../../src/core/CommandExecutor.js";
import { Persistence, PersistenceLive } from "../../src/state/Persistence.js";
import type { Session } from "../../src/types/session.js";

import {
	SlashCommands,
	SlashCommandsLive,
} from "../../src/core/SlashCommands.js";

const TEST_DB_PATH = path.join(
	os.tmpdir(),
	`effect-cockpit-test-p2-${Date.now()}.db`,
);

const initialSession: Session = {
	id: "integration-session-p2",
	blocks: [],
	activeBlockId: null,
	focusedBlockId: null,
	workingDirectory: process.cwd(),
	environment: { TEST_VAR: "true" },
	retentionConfig: {
		fullContentBlocks: 100,
		maxTotalBlocks: 100,
	},
};

const sessionStore = SessionStoreLive(initialSession);
const persistence = PersistenceLive(TEST_DB_PATH);
const processRuntime = ProcessRuntimeLive;
const slashCommands = SlashCommandsLive.pipe(
	Layer.provideMerge(sessionStore),
	Layer.provideMerge(persistence),
);
const blockService = BlockServiceLive.pipe(
	Layer.provideMerge(sessionStore),
	Layer.provideMerge(processRuntime),
);
const commandExecutor = CommandExecutorLive.pipe(
	Layer.provideMerge(blockService),
	Layer.provideMerge(sessionStore),
	Layer.provideMerge(slashCommands),
);

const MainLayer = Layer.mergeAll(
	sessionStore,
	persistence,
	processRuntime,
	slashCommands,
	blockService,
	commandExecutor,
);

describe("Phase 2 Integration (Focus & Workspace)", () => {
	afterAll(() => {
		if (fs.existsSync(TEST_DB_PATH)) {
			fs.unlinkSync(TEST_DB_PATH);
		}
	});

	it("should handle multi-block focus and workspace state correctly", () =>
		Effect.gen(function* () {
			const executor = yield* CommandExecutor;
			const store = yield* SessionStore;

			// 1. Verify Initial Workspace State (Sidebar Data)
			let session = yield* store.get;
			expect(session.workingDirectory).toBe(process.cwd());
			expect(session.environment["TEST_VAR"]).toBe("true");

			// 2. Execute multiple commands to create blocks
			// We don't care about the output here, just the block creation and focus
			yield* executor.execute("echo 'Block 1'");
			session = yield* store.get;
			const block1 = session.blocks[0];
			if (!block1) throw new Error("Block 1 not found");
			const block1Id = block1.id;

			// New block should be auto-focused
			expect(session.focusedBlockId).toBe(block1Id);

			yield* executor.execute("echo 'Block 2'");
			session = yield* store.get;
			const block2 = session.blocks[1];
			if (!block2) throw new Error("Block 2 not found");
			const block2Id = block2.id;

			expect(session.focusedBlockId).toBe(block2Id);

			yield* executor.execute("echo 'Block 3'");
			session = yield* store.get;
			const block3 = session.blocks[2];
			if (!block3) throw new Error("Block 3 not found");
			const block3Id = block3.id;

			expect(session.focusedBlockId).toBe(block3Id);

			// 3. Test Navigation Logic (simulating Shift+Up/Down)

			// Prev -> Block 2
			yield* store.focusPrev;
			session = yield* store.get;
			expect(session.focusedBlockId).toBe(block2Id);

			// Prev -> Block 1
			yield* store.focusPrev;
			session = yield* store.get;
			expect(session.focusedBlockId).toBe(block1Id);

			// Prev (Wrap) -> Block 3
			yield* store.focusPrev;
			session = yield* store.get;
			expect(session.focusedBlockId).toBe(block3Id);

			// Next (Wrap) -> Block 1
			yield* store.focusNext;
			session = yield* store.get;
			expect(session.focusedBlockId).toBe(block1Id);

			// Set explicit focus
			yield* store.setFocus(block2Id);
			session = yield* store.get;
			expect(session.focusedBlockId).toBe(block2Id);

			// 4. Verify Metadata Persistence (part of Rich Rendering foundation)
			// We can check if metadata fields are preserved (even if empty for now)
			expect(session.blocks[0]?.metadata).toBeDefined();
		}).pipe(Effect.provide(MainLayer), Effect.scoped, Effect.runPromise));
});
