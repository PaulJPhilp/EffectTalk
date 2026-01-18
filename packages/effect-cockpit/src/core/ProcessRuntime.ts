import { Effect, Stream, Scope } from "effect";
import { spawn } from "node:child_process";
import os from "node:os";

export interface Process {
	readonly write: (data: string) => Effect.Effect<void>;
	readonly resize: (cols: number, rows: number) => Effect.Effect<void>;
	readonly kill: (signal?: string) => Effect.Effect<void>;
	readonly onData: Stream.Stream<string, Error>;
	readonly onExit: Effect.Effect<{ exitCode: number; signal?: number }, Error>;
}

export interface ProcessOptions {
	readonly cwd?: string;
	readonly env?: Record<string, string>;
	readonly cols?: number;
	readonly rows?: number;
}

export interface ProcessRuntimeApi {
	readonly spawn: (
		command: string,
		args: string[],
		options?: ProcessOptions,
	) => Effect.Effect<Process, Error, Scope.Scope>;
}

export class ProcessRuntime extends Effect.Service<ProcessRuntime>()(
	"effect-cockpit/ProcessRuntime",
	{
		effect: Effect.fn(function* () {
			return {
				spawn: (command, args, options) =>
					Effect.gen(function* () {
						// Use shell for better compatibility
						const shell =
							os.platform() === "win32" ? "powershell.exe" : "/bin/bash";
						const shellArgs = ["-c", `${command} ${args.join(" ")}`];

						const child = spawn(shell, shellArgs, {
							cwd: options?.cwd ?? process.cwd(),
							env: { ...process.env, ...options?.env },
							stdio: ["pipe", "pipe", "pipe"],
						});

						const onData = Stream.merge(
							Stream.async<string, Error>((emit) => {
								child.stdout!.setEncoding("utf8");
								child.stdout!.on("data", (chunk) => emit.single(chunk));
								child.stdout!.on("end", () => emit.end());
								child.stdout!.on("error", (err) => emit.fail(err));
							}),
							Stream.async<string, Error>((emit) => {
								child.stderr!.setEncoding("utf8");
								child.stderr!.on("data", (chunk) => emit.single(chunk));
								child.stderr!.on("end", () => emit.end());
								child.stderr!.on("error", (err) => emit.fail(err));
							}),
						);

						const onExit = Effect.async<
							{ exitCode: number; signal?: number },
							Error
						>((resume) => {
							child.on("close", (code, signal) => {
								resume(
									Effect.succeed({
										exitCode: code ?? 0,
										signal: signal === null ? undefined : 0,
									}),
								);
							});
							child.on("error", (err) => {
								// If spawn fails immediately
								resume(Effect.fail(err));
							});
						});

						const write = (data: string) =>
							Effect.sync(() => {
								if (child.stdin) {
									child.stdin.write(data);
								}
							});

						const resize = (cols: number, rows: number) => Effect.void; // child_process doesn't support resize

						const kill = (signal?: string) =>
							Effect.sync(() => {
								child.kill(signal as NodeJS.Signals);
							});

						yield* Effect.addFinalizer(() =>
							Effect.sync(() => {
								if (!child.killed) {
									child.kill();
								}
							}),
						);

						return { write, resize, kill, onData, onExit };
					}),
			} satisfies ProcessRuntimeApi;
		}),
	}
) {}
