import os from "node:os";
import path from "node:path";
import { Effect, Layer } from "effect";
import { render } from "ink";
import React from "react";
import { BlockService, BlockServiceLive } from "../src/core/BlockService.js";
import {
	CommandExecutor,
	CommandExecutorLive,
} from "../src/core/CommandExecutor.js";
import { PluginManager, PluginManagerLive } from "../src/core/PluginManager.js";
import {
	ProcessRuntime,
	ProcessRuntimeLive,
} from "../src/core/ProcessRuntime.js";
import { SlashCommands, SlashCommandsLive } from "../src/core/SlashCommands.js";
import { Persistence, PersistenceLive } from "../src/state/Persistence.js";
import { SessionStore, SessionStoreLive } from "../src/state/SessionStore.js";
import { App } from "../src/ui/App.js";
import type { Session } from "../types/session.js";

// Define a custom initial session for the Demo App
const demoSession: Session = {
	id: "demo-session",
	blocks: [
		{
			id: "welcome-block",
			command: "welcome",
			status: "success",
			stdout:
				"# Welcome to Effect Cockpit!\n\nThis is a **demo application** running on the effect-cockpit harness.\n\nTry running commands like:\n- `ls -la`\n- `echo 'Hello World'`\n- `git status`\n\nUse `Shift + Up/Down` to navigate blocks.\n\n### Slash Commands\n- `/clear`: Clear the session\n- `/snapshot <name>`: Create a snapshot\n- `/quit` or `/exit`: Close the app",
			stderr: "",
			startTime: Date.now(),
			endTime: Date.now(),
			metadata: {},
		},
		{
			id: "instruction-block",
			command: "help",
			status: "success",
			stdout:
				"You can also use **Ctrl+B** to toggle the sidebar.\n\nEverything you see is powered by **Effect** and **Ink**.",
			stderr: "",
			startTime: Date.now(),
			endTime: Date.now(),
			metadata: {},
		},
	],
	activeBlockId: null,
	focusedBlockId: "welcome-block",
	workingDirectory: process.cwd(),
	environment: process.env as Record<string, string>,
	retentionConfig: {
		fullContentBlocks: 100,
		maxTotalBlocks: 100,
	},
};

const DB_PATH = path.join(os.tmpdir(), "effect-cockpit-demo.db");

// Compose the application layer
const sessionStore = SessionStoreLive(demoSession);
const persistence = PersistenceLive(DB_PATH);
const processRuntime = ProcessRuntimeLive;
const pluginManager = PluginManagerLive;
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
	pluginManager,
	slashCommands,
	blockService,
	commandExecutor,
);

const program = Effect.gen(function* () {
	const store = yield* SessionStore;
	const executor = yield* CommandExecutor;
	const slash = yield* SlashCommands;

	const availableSlash = yield* slash.getAvailable;

	// Render logic
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

	const initialSessionState = yield* store.get;
	const instance = render(renderApp(initialSessionState));

	// Reactive loop
	const loop = Effect.gen(function* () {
		let lastSession = initialSessionState;
		while (true) {
			const currentSession = yield* store.get;
			if (currentSession !== lastSession) {
				instance.rerender(renderApp(currentSession));
				lastSession = currentSession;
			}
			yield* Effect.sleep("16 millis");
		}
	});

	yield* Effect.fork(loop);
	yield* Effect.addFinalizer(() => Effect.sync(() => instance.unmount()));
	yield* Effect.never;
});

// Run the demo
Effect.runPromise(program.pipe(Effect.provide(MainLayer), Effect.scoped)).catch(
	console.error,
);
