import { Effect, Layer } from "effect";
import { describe, it, expect } from "vitest";
import {
	SessionStore,
	SessionStoreLive,
} from "../../src/state/SessionStore.js";
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

describe("SessionStore", () => {
	it("should get initial session", () =>
		Effect.gen(function* () {
			const store = yield* SessionStore;
			const session = yield* store.get;
			expect(session.id).toBe("test-session");
		}).pipe(
			Effect.provide(SessionStoreLive(initialSession)),
			Effect.runPromise,
		));

	it("should add a block", () =>
		Effect.gen(function* () {
			const store = yield* SessionStore;
			const block = {
				id: "block-1",
				command: "ls",
				status: "idle" as const,
				stdout: "",
				stderr: "",
				startTime: Date.now(),
				metadata: {},
			};
			yield* store.addBlock(block);
			const session = yield* store.get;
			expect(session.blocks).toHaveLength(1);
			expect(session.blocks[0]?.id).toBe("block-1");
		}).pipe(
			Effect.provide(SessionStoreLive(initialSession)),
			Effect.runPromise,
		));

	it("should handle focus navigation", () =>
		Effect.gen(function* () {
			const store = yield* SessionStore;
			const block1 = {
				...initialSession.blocks[0],
				id: "1",
				command: "cmd1",
				status: "idle" as const,
				stdout: "",
				stderr: "",
				startTime: 0,
				metadata: {},
			};
			const block2 = {
				...initialSession.blocks[0],
				id: "2",
				command: "cmd2",
				status: "idle" as const,
				stdout: "",
				stderr: "",
				startTime: 0,
				metadata: {},
			};
			const block3 = {
				...initialSession.blocks[0],
				id: "3",
				command: "cmd3",
				status: "idle" as const,
				stdout: "",
				stderr: "",
				startTime: 0,
				metadata: {},
			};

			yield* store.addBlock(block1);
			yield* store.addBlock(block2);
			yield* store.addBlock(block3);

			// Initial focus should be on last added block (3)
			let session = yield* store.get;
			expect(session.focusedBlockId).toBe("3");

			// Prev -> 2
			yield* store.focusPrev;
			session = yield* store.get;
			expect(session.focusedBlockId).toBe("2");

			// Prev -> 1
			yield* store.focusPrev;
			session = yield* store.get;
			expect(session.focusedBlockId).toBe("1");

			// Prev (wrap) -> 3
			yield* store.focusPrev;
			session = yield* store.get;
			expect(session.focusedBlockId).toBe("3");

			// Next (wrap) -> 1
			yield* store.focusNext;
			session = yield* store.get;
			expect(session.focusedBlockId).toBe("1");
		}).pipe(
			Effect.provide(SessionStoreLive(initialSession)),
			Effect.runPromise,
		));
});
