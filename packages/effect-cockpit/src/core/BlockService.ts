import { Effect, Stream, Scope } from "effect";
import type { Block, BlockStatus } from "../types/block.js";
import { ProcessRuntime } from "./ProcessRuntime.js";
import { SessionStore } from "../state/SessionStore.js";

export interface BlockServiceApi {
	readonly create: (command: string) => Effect.Effect<Block>;
	readonly execute: (
		block: Block,
	) => Effect.Effect<void, Error, Scope.Scope | ProcessRuntime | SessionStore>;
	readonly updateStatus: (
		blockId: string,
		status: BlockStatus,
	) => Effect.Effect<void, never, SessionStore>;
}

export class BlockService extends Effect.Service<BlockService>()(
	"effect-cockpit/BlockService",
	{
		effect: Effect.fn(function* () {
			return {
				create: (command: string) =>
					Effect.sync(() => ({
						id: crypto.randomUUID(),
						command,
						status: "idle",
						stdout: "",
						stderr: "",
						startTime: Date.now(),
						metadata: {},
					})),
				updateStatus: (blockId: string, status: BlockStatus) =>
					Effect.gen(function* () {
						const sessionStore = yield* SessionStore;
						yield* sessionStore.updateBlock(blockId, (b: Block) => ({
							...b,
							status,
							endTime:
								status === "success" ||
								status === "failure" ||
								status === "interrupted"
									? Date.now()
									: b.endTime,
						}));
					}),
				execute: (block: Block) =>
					Effect.gen(function* () {
						const runtime = yield* ProcessRuntime;
						const sessionStore = yield* SessionStore;

						// Simple command parsing: splitting by space for now
						const parts = block.command.trim().split(/\s+/);
						const command = parts[0] ?? "";
						const args = parts.slice(1);

						const process = yield* runtime.spawn(command, args);

						yield* process.onData.pipe(
							Stream.runForEach((data) =>
								sessionStore.appendOutput(block.id, data, "stdout"),
							),
							Effect.fork,
						);

						const { exitCode } = yield* process.onExit;

						yield* sessionStore.updateBlock(block.id, (b: Block) => ({
							...b,
							exitCode,
							status: exitCode === 0 ? "success" : "failure",
							endTime: Date.now(),
						}));
					}).pipe(
						Effect.catchAll((e) => Effect.fail(e as Error)),
						Effect.scoped,
					),
			} satisfies BlockServiceApi;
		}),
	}
) {}
