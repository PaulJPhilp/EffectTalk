import { Effect, Ref } from "effect";
import type { Block } from "../types/block.js";
import type { Session } from "../types/session.js";

export interface SessionStoreApi {
	readonly get: Effect.Effect<Session>;
	readonly update: (
		updateFn: (session: Session) => Session,
	) => Effect.Effect<void>;
	readonly addBlock: (block: Block) => Effect.Effect<void>;
	readonly updateBlock: (
		blockId: string,
		updateFn: (block: Block) => Block,
	) => Effect.Effect<void>;
	readonly appendOutput: (
		blockId: string,
		chunk: string,
		type: "stdout" | "stderr",
	) => Effect.Effect<void>;
	readonly setFocus: (blockId: string | null) => Effect.Effect<void>;
	readonly focusNext: Effect.Effect<void>;
	readonly focusPrev: Effect.Effect<void>;
}

export class SessionStore extends Effect.Service<SessionStore>()(
	"effect-cockpit/SessionStore",
	{
		effect: Effect.fn(function* (initialSession: Session) {
			const state = yield* Ref.make(initialSession);

			const get = Ref.get(state);
			const update = (updateFn: (session: Session) => Session) =>
				Ref.update(state, updateFn);

			const addBlock = (block: Block) =>
				update((session) => ({
					...session,
					blocks: [...session.blocks, block],
					// Auto-focus new blocks
					focusedBlockId: block.id,
				}));

			const updateBlock = (
				blockId: string,
				updateFn: (block: Block) => Block,
			) =>
				update((session) => ({
					...session,
					blocks: session.blocks.map((b) =>
						b.id === blockId ? updateFn(b) : b,
					),
					activeBlockId:
						session.activeBlockId === blockId
							? session.activeBlockId
							: session.activeBlockId,
				}));

			const appendOutput = (
				blockId: string,
				chunk: string,
				type: "stdout" | "stderr",
			) =>
				updateBlock(blockId, (block) => ({
					...block,
					stdout: type === "stdout" ? block.stdout + chunk : block.stdout,
					stderr: type === "stderr" ? block.stderr + chunk : block.stderr,
				}));

			const setFocus = (blockId: string | null) =>
				update((session) => ({
					...session,
					focusedBlockId: blockId,
				}));

			const focusNext = update((session) => {
				if (session.blocks.length === 0) return session;
				const currentIndex = session.blocks.findIndex(
					(b) => b.id === session.focusedBlockId,
				);
				const nextIndex =
					currentIndex === -1 || currentIndex === session.blocks.length - 1
						? 0
						: currentIndex + 1;
				const nextBlock = session.blocks[nextIndex];
				return nextBlock
					? { ...session, focusedBlockId: nextBlock.id }
					: session;
			});

			const focusPrev = update((session) => {
				if (session.blocks.length === 0) return session;
				const currentIndex = session.blocks.findIndex(
					(b) => b.id === session.focusedBlockId,
				);
				const prevIndex =
					currentIndex === -1 || currentIndex === 0
						? session.blocks.length - 1
						: currentIndex - 1;
				const prevBlock = session.blocks[prevIndex];
				return prevBlock
					? { ...session, focusedBlockId: prevBlock.id }
					: session;
			});

			return {
				get,
				update,
				addBlock,
				updateBlock,
				appendOutput,
				setFocus,
				focusNext,
				focusPrev,
			} satisfies SessionStoreApi;
		}),
	}
) {}
