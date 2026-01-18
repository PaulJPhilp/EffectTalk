import { Context, Effect, Layer } from "effect";
import { Kysely } from "kysely";
import type { Session } from "../types/session.js";
import type { Block } from "../types/block.js";

export interface DatabaseSchema {
	sessions: {
		id: string;
		workingDirectory: string;
		environment: string; // JSON
		createdAt: number;
	};
	blocks: {
		id: string;
		sessionId: string;
		command: string;
		status: string;
		exitCode?: number;
		stdout: string;
		stderr: string;
		startTime: number;
		endTime?: number;
		metadata: string; // JSON
	};
	snapshots: {
		name: string;
		sessionId: string;
		createdAt: number;
	};
}

export interface PersistenceApi {
	readonly saveSession: (session: Session) => Effect.Effect<void>;
	readonly loadLastSession: Effect.Effect<Session | null>;
	readonly createSnapshot: (
		name: string,
		session: Session,
	) => Effect.Effect<void>;
	readonly listSnapshots: Effect.Effect<
		ReadonlyArray<{ name: string; createdAt: number }>
	>;
	readonly loadSnapshot: (name: string) => Effect.Effect<Session | null>;
}

export class Persistence extends Effect.Service<Persistence>()(
	"effect-cockpit/Persistence",
	{
		effect: Effect.fn(function* (dbPath: string) {
			const isBun = !!(globalThis as any).Bun;

			let dialect: any;
			if (isBun) {
				const { BunSqliteDialect } = yield* Effect.promise(
					() => import("kysely-bun-sqlite"),
				);
				// @ts-ignore: bun-specific
				const { Database } = yield* Effect.promise(() => import("bun:sqlite"));
				dialect = new BunSqliteDialect({
					database: new Database(dbPath),
				});
			} else {
				const { SqliteDialect } = yield* Effect.promise(() => import("kysely"));
				const { default: Database } = yield* Effect.promise(
					() => import("better-sqlite3"),
				);
				dialect = new SqliteDialect({
					database: new (Database as any)(dbPath),
				});
			}

			const db = new Kysely<DatabaseSchema>({
				dialect,
			});

			// Initialize tables
			yield* Effect.promise(() =>
				db.schema
					.createTable("sessions")
					.ifNotExists()
					.addColumn("id", "text", (col) => col.primaryKey())
					.addColumn("workingDirectory", "text", (col) => col.notNull())
					.addColumn("environment", "text", (col) => col.notNull())
					.addColumn("createdAt", "integer", (col) => col.notNull())
					.execute(),
			);

			yield* Effect.promise(() =>
				db.schema
					.createTable("blocks")
					.ifNotExists()
					.addColumn("id", "text", (col) => col.primaryKey())
					.addColumn("sessionId", "text", (col) =>
						col.notNull().references("sessions.id"),
					)
					.addColumn("command", "text", (col) => col.notNull())
					.addColumn("status", "text", (col) => col.notNull())
					.addColumn("exitCode", "integer")
					.addColumn("stdout", "text", (col) => col.notNull())
					.addColumn("stderr", "text", (col) => col.notNull())
					.addColumn("startTime", "integer", (col) => col.notNull())
					.addColumn("endTime", "integer")
					.addColumn("metadata", "text", (col) => col.notNull())
					.execute(),
			);

			yield* Effect.promise(() =>
				db.schema
					.createTable("snapshots")
					.ifNotExists()
					.addColumn("name", "text", (col) => col.primaryKey())
					.addColumn("sessionId", "text", (col) => col.notNull())
					.addColumn("createdAt", "integer", (col) => col.notNull())
					.execute(),
			);

			yield* Effect.addFinalizer(() => Effect.promise(() => db.destroy()));

			const saveSessionImpl = (session: Session) =>
				Effect.gen(function* () {
					yield* Effect.promise(() =>
						db
							.insertInto("sessions")
							.values({
								id: session.id,
								workingDirectory: session.workingDirectory,
								environment: JSON.stringify(session.environment),
								createdAt: Date.now(),
							})
							.onConflict((oc) =>
								oc.column("id").doUpdateSet({
									workingDirectory: session.workingDirectory,
									environment: JSON.stringify(session.environment),
								}),
							)
							.execute(),
					);

					for (const block of session.blocks) {
						yield* Effect.promise(() =>
							db
								.insertInto("blocks")
								.values({
									id: block.id,
									sessionId: session.id,
									command: block.command,
									status: block.status,
									exitCode: block.exitCode,
									stdout: block.stdout,
									stderr: block.stderr,
									startTime: block.startTime,
									endTime: block.endTime,
									metadata: JSON.stringify(block.metadata),
								})
								.onConflict((oc) =>
									oc.column("id").doUpdateSet({
										status: block.status,
										exitCode: block.exitCode,
										stdout: block.stdout,
										stderr: block.stderr,
										endTime: block.endTime,
										metadata: JSON.stringify(block.metadata),
									}),
								)
								.execute(),
						);
					}
				});

			return {
				saveSession: saveSessionImpl,
				loadLastSession: Effect.gen(function* () {
					const sessionRow = yield* Effect.promise(() =>
						db
							.selectFrom("sessions")
							.selectAll()
							.orderBy("createdAt", "desc")
							.limit(1)
							.executeTakeFirst(),
					);

					if (!sessionRow) return null;

					const blockRows = yield* Effect.promise(() =>
						db
							.selectFrom("blocks")
							.selectAll()
							.where("sessionId", "=", sessionRow.id)
							.orderBy("startTime", "asc")
							.execute(),
					);

					return {
						id: sessionRow.id,
						workingDirectory: sessionRow.workingDirectory,
						environment: JSON.parse(sessionRow.environment),
						blocks: blockRows.map((row) => ({
							...row,
							status: row.status as any,
							metadata: JSON.parse(row.metadata),
						})),
						activeBlockId: null,
						focusedBlockId: null,
						retentionConfig: {
							fullContentBlocks: 100,
							maxTotalBlocks: 100,
						},
					} as Session;
				}),
				createSnapshot: (name, session) =>
					Effect.gen(function* () {
						yield* saveSessionImpl(session);
						yield* Effect.promise(() =>
							db
								.insertInto("snapshots")
								.values({
									name,
									sessionId: session.id,
									createdAt: Date.now(),
								})
								.execute(),
						);
					}),
				listSnapshots: Effect.promise(() =>
					db
						.selectFrom("snapshots")
						.selectAll()
						.orderBy("createdAt", "desc")
						.execute(),
				),
				loadSnapshot: (name) =>
					Effect.gen(function* () {
						const snapshot = yield* Effect.promise(() =>
							db
								.selectFrom("snapshots")
								.selectAll()
								.where("name", "=", name)
								.executeTakeFirst(),
						);

						if (!snapshot) return null;

						const sessionRow = yield* Effect.promise(() =>
							db
								.selectFrom("sessions")
								.selectAll()
								.where("id", "=", snapshot.sessionId)
								.executeTakeFirst(),
						);

						if (!sessionRow) return null;

						const blockRows = yield* Effect.promise(() =>
							db
								.selectFrom("blocks")
								.selectAll()
								.where("sessionId", "=", sessionRow.id)
								.orderBy("startTime", "asc")
								.execute(),
						);

						return {
							id: sessionRow.id,
							workingDirectory: sessionRow.workingDirectory,
							environment: JSON.parse(sessionRow.environment),
							blocks: blockRows.map((row) => ({
								...row,
								status: row.status as any,
								metadata: JSON.parse(row.metadata),
							})),
							activeBlockId: null,
							focusedBlockId: null,
							retentionConfig: {
								fullContentBlocks: 100,
								maxTotalBlocks: 100,
							},
						} as Session;
					}),
			} satisfies PersistenceApi;
		}),
	}
) {}
