import { Effect, Layer, Scope, Stream } from "effect";
import { render } from "ink";
import React from "react";
import { App } from "./ui/App.js";
import { SessionStore, SessionStoreLive } from "./state/SessionStore.js";
import { BlockService, BlockServiceLive } from "./core/BlockService.js";
import { ProcessRuntime, ProcessRuntimeLive } from "./core/ProcessRuntime.js";
import {
	CommandExecutor,
	CommandExecutorLive,
} from "./core/CommandExecutor.js";
import { SlashCommands, SlashCommandsLive } from "./core/SlashCommands.js";
import { Persistence, PersistenceLive } from "./state/Persistence.js";
import type { Session } from "./types/session.js";
import path from "node:path";
import os from "node:os";

const DB_PATH = path.join(os.homedir(), ".effect-cockpit.db");

const initialSession: Session = {
	id: "default-session",
	blocks: [],
	activeBlockId: null,
	focusedBlockId: null,
	workingDirectory: process.cwd(),
	environment: process.env as Record<string, string>,
	retentionConfig: {
		fullContentBlocks: 100,
		maxTotalBlocks: 100,
	},
};

const sessionStore = SessionStoreLive(initialSession);
const persistence = PersistenceLive(DB_PATH);
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

const program = Effect.gen(function* () {
	const store = yield* SessionStore;
	const executor = yield* CommandExecutor;
	const persistence = yield* Persistence;
	const slash = yield* SlashCommands;

	// Hydrate from DB
	const savedSession = yield* persistence.loadLastSession;
	if (savedSession) {
		yield* store.update(() => savedSession);
	}

	const availableSlash = yield* slash.getAvailable;

	const renderApp = (session: Session) => {
		return React.createElement(App, {
			session,
			slashCommands: availableSlash,
			onExecute: (command) => {
				Effect.runPromise(
					executor
						.execute(command)
						.pipe(Effect.provide(MainLayer), Effect.scoped),
				).catch(console.error);
			},
			onFocusNext: () => {
				Effect.runPromise(
					store.focusNext.pipe(Effect.provide(MainLayer)),
				).catch(console.error);
			},
			onFocusPrev: () => {
				Effect.runPromise(
					store.focusPrev.pipe(Effect.provide(MainLayer)),
				).catch(console.error);
			},
		});
	};

	const currentSessionState = yield* store.get;
	const instance = render(renderApp(currentSessionState));

	// Reactive loop
	const loop = Effect.gen(function* () {
		let lastSession = currentSessionState;
		while (true) {
			const currentSession = yield* store.get;
			if (currentSession !== lastSession) {
				instance.rerender(renderApp(currentSession));
				lastSession = currentSession;
			}
			yield* Effect.sleep("16 millis");
		}
	});

	// Auto-save loop
	const autoSave = Effect.gen(function* () {
		while (true) {
			yield* Effect.sleep("5 seconds");
			const currentSession = yield* store.get;
			yield* persistence.saveSession(currentSession);
		}
	});

	yield* Effect.fork(loop);
	yield* Effect.fork(autoSave);

	yield* Effect.addFinalizer(() =>
		Effect.gen(function* () {
			const finalSession = yield* store.get;
			yield* persistence.saveSession(finalSession);
			Effect.sync(() => instance.unmount());
		}),
	);

	yield* Effect.never;
});

Effect.runPromise(program.pipe(Effect.provide(MainLayer), Effect.scoped)).catch(
	console.error,
);
