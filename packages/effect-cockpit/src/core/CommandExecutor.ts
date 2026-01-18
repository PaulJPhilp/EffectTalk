import { Context, Effect, Layer, Scope } from "effect";
import { BlockService } from "./BlockService.js";
import { SessionStore } from "../state/SessionStore.js";
import { ProcessRuntime } from "./ProcessRuntime.js";
import { SlashCommands } from "./SlashCommands.js";

export interface CommandExecutor {
	readonly execute: (
		command: string,
	) => Effect.Effect<
		void,
		Error,
		Scope.Scope | SessionStore | BlockService | ProcessRuntime | SlashCommands
	>;
}

export const CommandExecutor = Context.GenericTag<CommandExecutor>(
	"effect-cockpit/CommandExecutor",
);

export const CommandExecutorLive = Layer.effect(
	CommandExecutor,
	Effect.gen(function* () {
		const blockService = yield* BlockService;
		const sessionStore = yield* SessionStore;
		const slashCommands = yield* SlashCommands;

		return CommandExecutor.of({
			execute: (command: string) =>
				Effect.gen(function* () {
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
		});
	}),
);
