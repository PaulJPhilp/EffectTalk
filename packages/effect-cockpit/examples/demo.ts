import os from "node:os";
import path from "node:path";
import { Effect, Layer } from "effect";
import { render } from "ink";
import React from "react";
import { BlockService } from "../src/core/BlockService.js";
import { CommandExecutor } from "../src/core/CommandExecutor.js";
import { ProcessRuntime } from "../src/core/ProcessRuntime.js";
import { SlashCommands } from "../src/core/SlashCommands.js";
import { Persistence } from "../src/state/Persistence.js";
import { SessionStore } from "../src/state/SessionStore.js";
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
				"# 🎯 Welcome to Effect Cockpit!\n\nThis is a **comprehensive demo** of the effect-cockpit package.\n\n## What Can You Do?\n\n### Commands\n- Real shell commands: `echo 'Hello'`, `ls -la`, `pwd`, `date`\n- Try: `echo 'Testing Effect Cockpit'`\n- Try: `sleep 2 && echo 'Long-running command'`\n\n### Navigation\n- **Shift + Up/Down**: Navigate between blocks\n- **Ctrl + B**: Toggle sidebar\n- **Ctrl + C**: Exit application\n\n### Slash Commands\n- `/help`: Show available slash commands\n- `/clear`: Clear all blocks\n- `/snapshot [name]`: Create a session snapshot\n- `/info`: Show session information\n- `/reset`: Reset to initial state\n- `/quit` or `/exit`: Close the app",
			stderr: "",
			startTime: Date.now(),
			endTime: Date.now(),
			metadata: {},
		},
		{
			id: "echo-example",
			command: "echo 'Example: Real command execution'",
			status: "success",
			stdout: "Example: Real command execution\n",
			stderr: "",
			startTime: Date.now() - 5000,
			endTime: Date.now() - 4990,
			exitCode: 0,
			metadata: {},
		},
		{
			id: "pwd-example",
			command: "pwd",
			status: "success",
			stdout: `${process.cwd()}\n`,
			stderr: "",
			startTime: Date.now() - 3000,
			endTime: Date.now() - 2990,
			exitCode: 0,
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
const MainLayer = Layer.mergeAll(
	SessionStore.Default(demoSession),
	Persistence.Default(DB_PATH),
	ProcessRuntime.Default(),
	SlashCommands.Default(),
	BlockService.Default(),
	CommandExecutor.Default(),
);

const program = Effect.gen(function* () {
	const store = yield* SessionStore;
	const executor = yield* CommandExecutor;
	const slash = yield* SlashCommands;
	const persistence = yield* Persistence;

	// Register additional demo slash commands
	yield* slash.register({
		name: "help",
		description: "Show available slash commands",
		execute: () =>
			Effect.gen(function* () {
				const sessionStore = yield* SessionStore;
				const helpBlock = {
					id: crypto.randomUUID(),
					command: "/help",
					status: "success" as const,
					stdout: "## Available Slash Commands\n\n  /help: Show available slash commands\n  /info: Display session information\n  /reset: Reset session to initial state\n  /clear: Clear all blocks from session\n  /snapshot: Create a session snapshot\n  /quit: Exit the application",
					stderr: "",
					startTime: Date.now(),
					endTime: Date.now(),
					exitCode: 0,
					metadata: {},
				};
				yield* sessionStore.addBlock(helpBlock);
			}),
	});

	yield* slash.register({
		name: "info",
		description: "Display session information",
		execute: () =>
			Effect.gen(function* () {
				const sessionStore = yield* SessionStore;
				const session = yield* sessionStore.get;
				const infoBlock = {
					id: crypto.randomUUID(),
					command: "/info",
					status: "success" as const,
					stdout: `Session Information\n\nID: ${session.id}\nBlocks: ${session.blocks.length}\nDirectory: ${session.workingDirectory}\nFocused: ${session.focusedBlockId || "None"}\nMax Blocks: ${session.retentionConfig.maxTotalBlocks}`,
					stderr: "",
					startTime: Date.now(),
					endTime: Date.now(),
					exitCode: 0,
					metadata: {},
				};
				yield* sessionStore.addBlock(infoBlock);
			}),
	});

	yield* slash.register({
		name: "reset",
		description: "Reset session to initial state",
		execute: () =>
			Effect.gen(function* () {
				const sessionStore = yield* SessionStore;
				yield* sessionStore.update((s) => ({
					...s,
					blocks: demoSession.blocks,
					activeBlockId: null,
					focusedBlockId: demoSession.focusedBlockId,
				}));
			}),
	});

	// Fetch updated slash commands after registration
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
