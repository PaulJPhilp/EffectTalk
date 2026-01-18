import { Context, Effect, Layer, Ref } from "effect";
import { SessionStore } from "../state/SessionStore.js";
import { Persistence } from "../state/Persistence.js";

export interface SlashCommand {
	readonly name: string;
	readonly description: string;
	readonly execute: (args: string[]) => Effect.Effect<void, Error, any>;
}

export interface SlashCommands {
	readonly register: (command: SlashCommand) => Effect.Effect<void>;
	readonly handle: (input: string) => Effect.Effect<boolean, Error, any>;
	readonly getAvailable: Effect.Effect<ReadonlyArray<SlashCommand>>;
}

export const SlashCommands = Context.GenericTag<SlashCommands>(
	"effect-cockpit/SlashCommands",
);

export const SlashCommandsLive = Layer.effect(
	SlashCommands,
	Effect.gen(function* () {
		const commands = yield* Ref.make<Record<string, SlashCommand>>({});
		const sessionStore = yield* SessionStore;
		const persistence = yield* Persistence;

		const register = (command: SlashCommand) =>
			Ref.update(commands, (current) => ({
				...current,
				[command.name]: command,
			}));

		const getAvailable = Effect.map(Ref.get(commands), (cmds) =>
			Object.values(cmds),
		);

		const handle = (input: string) =>
			Effect.gen(function* () {
				if (!input.startsWith("/")) return false;

				const parts = input.slice(1).trim().split(/\s+/);
				const name = parts[0];
				const args = parts.slice(1);

				const currentCommands = yield* Ref.get(commands);
				const command = currentCommands[name!];

				if (command) {
					yield* command.execute(args);
					return true;
				}

				return false;
			});

		// Register Core Commands
		const slash = { register, handle, getAvailable };

		yield* register({
			name: "clear",
			description: "Clears all blocks from the current session",
			execute: () =>
				sessionStore.update((s) => ({
					...s,
					blocks: [],
					activeBlockId: null,
					focusedBlockId: null,
				})),
		});

		yield* register({
			name: "snapshot",
			description: "Creates a named snapshot of the current session",
			execute: (args) =>
				Effect.gen(function* () {
					const name = args[0] || `snapshot-${Date.now()}`;
					const session = yield* sessionStore.get;
					yield* persistence.createSnapshot(name, session);
				}),
		});

		yield* register({
			name: "quit",
			description: "Exits the application",
			execute: () => Effect.sync(() => process.exit(0)),
		});

		yield* register({
			name: "exit",
			description: "Exits the application",
			execute: () => Effect.sync(() => process.exit(0)),
		});

		return SlashCommands.of(slash);
	}),
);
