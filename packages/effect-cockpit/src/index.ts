import os from "node:os";
import path from "node:path";
import { Effect, Layer, Scope, Stream } from "effect";
import { render } from "ink";
import React from "react";
import { BlockService } from "./core/BlockService.js";
import { CommandExecutor } from "./core/CommandExecutor.js";
import { ProcessRuntime } from "./core/ProcessRuntime.js";
import { SlashCommands } from "./core/SlashCommands.js";
import { Persistence } from "./state/Persistence.js";
import { SessionStore } from "./state/SessionStore.js";
import type { Session } from "./types/session.js";
import { App } from "./ui/App.js";

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

const MainLayer = Layer.mergeAll(
	SessionStore.Default(initialSession),
	Persistence.Default(DB_PATH),
	ProcessRuntime.Default(),
	SlashCommands.Default(),
	BlockService.Default(),
	CommandExecutor.Default(),
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
						.pipe(Effect.provide(MainLayer), Effect.scoped) as Effect.Effect<
						void,
						Error,
						never
					>,
				).catch(console.error);
			},
			onFocusNext: () => {
				Effect.runPromise(
					store.focusNext.pipe(Effect.provide(MainLayer), Effect.scoped),
				).catch(console.error);
			},
			onFocusPrev: () => {
				Effect.runPromise(
					store.focusPrev.pipe(Effect.provide(MainLayer), Effect.scoped),
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
