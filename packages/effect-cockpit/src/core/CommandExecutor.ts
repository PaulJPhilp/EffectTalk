import { Effect, type Scope } from "effect";
import { SessionStore } from "../state/SessionStore.js";
import { BlockService } from "./BlockService.js";
import type { ProcessRuntime } from "./ProcessRuntime.js";
import { SlashCommands } from "./SlashCommands.js";

export interface CommandExecutorApi {
	readonly execute: (
		command: string,
	) => Effect.Effect<
		void,
		Error,
		Scope.Scope | SessionStore | BlockService | ProcessRuntime | SlashCommands
	>;
}

export class CommandExecutor extends Effect.Service<CommandExecutor>()(
	"effect-cockpit/CommandExecutor",
	{
		effect: Effect.fn(function* () {
			return {
				execute: (command: string) =>
					Effect.gen(function* () {
						const blockService = yield* BlockService;
						const sessionStore = yield* SessionStore;
						const slashCommands = yield* SlashCommands;

						// 1. Try to handle as slash command
						const handled = yield* slashCommands.handle(command);
						if (handled) return;

						// 2. Otherwise, execute as shell block
						const block = yield* blockService.create(command);
						yield* sessionStore.addBlock(block);
						yield* sessionStore.update((s) => ({
							...s,
							activeBlockId: block.id,
						}));

						yield* blockService.updateStatus(block.id, "running");

						const execution = blockService.execute(block).pipe(
							Effect.tapError((e) =>
								blockService.updateStatus(block.id, "failure"),
							),
							Effect.catchAll(() => Effect.void),
						);

						yield* execution;
					}),
			} satisfies CommandExecutorApi;
		}),
	},
) {}
