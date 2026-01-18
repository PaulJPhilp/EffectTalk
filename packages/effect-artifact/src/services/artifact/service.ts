import { FileSystem } from "@effect/platform";
import { Effect, Layer } from "effect";
import {
	ArtifactNotFoundError,
	ArtifactStorageError,
	ArtifactValidationError,
} from "../../errors.js";
import type {
	Artifact,
	ArtifactMetadata,
	ArtifactQueryOptions,
	ArtifactType,
} from "../../types.js";
import { TypeDetectionService } from "../type-detection-service.js";
import type { ArtifactServiceApi } from "./api.js";

// ============================================================================ 
// Shared Helpers
// ============================================================================ 

const generateDiff = (oldContent: string, newContent: string): string => {
	const oldLines = oldContent.split("\n");
	const newLines = newContent.split("\n");
	const diffLines: string[] = [];

	let i = 0;
	let j = 0;

	while (i < oldLines.length || j < newLines.length) {
		if (
			i < oldLines.length &&
			j < newLines.length &&
			oldLines[i] === newLines[j]
		) {
			i++;
			j++;
		} else if (i < oldLines.length) {
			diffLines.push(`- ${oldLines[i]}`);
			i++;
		} else if (j < newLines.length) {
			diffLines.push(`+ ${newLines[j]}`);
			j++;
		}
	}

	return diffLines.join("\n");
};

// ============================================================================ 
// Implementation Factories
// ============================================================================ 

/**
 * Create an in-memory implementation of ArtifactService.
 */
export const makeInMemory = Effect.gen(function* () {
	const typeDetection = yield* TypeDetectionService;

	// In-memory store: Map<artifactId, Map<version, Artifact>>
	const store = new Map<string, Map<string, Artifact>>();

	const create = (
		content: string,
		metadata: Partial<ArtifactMetadata>,
		explicitType?: ArtifactType | undefined,
	) =>
		Effect.gen(function* () {
			if (!content || typeof content !== "string") {
				return yield* Effect.fail(
					new ArtifactValidationError({
						message: "Content must be a non-empty string",
						field: "content",
						value: content,
					}),
				);
			}

			const type = 
				explicitType ??
				(yield* typeDetection.detectType(content, {
					filename: (metadata as any).filename,
					mimeType: (metadata as any).mimeType,
				}));

			const id = crypto.randomUUID();
			const version = metadata.version ?? "1.0.0";
			const now = new Date();

			const artifact: Artifact = {
				id,
				type,
				content,
				metadata: {
					version,
					created: now,
					updated: now,
					title: metadata.title ?? "Untitled Artifact",
				tags: metadata.tags ?? [],
					...metadata,
				},
			};

			// Store artifact
			if (!store.has(id)) {
				store.set(id, new Map());
			}
			store.get(id)!.set(version, artifact);

			return artifact;
		});

	const get = (id: string, version?: string | undefined) =>
		Effect.gen(function* () {
			const versions = store.get(id);
			if (!versions) {
				return yield* Effect.fail(
					new ArtifactNotFoundError({ artifactId: id, version }),
				);
			}

			if (version) {
				const artifact = versions.get(version);
				if (!artifact) {
					return yield* Effect.fail(
						new ArtifactNotFoundError({
							artifactId: id,
							version,
						}),
					);
				}
				return artifact;
			}

			// Get latest version
			const sorted = Array.from(versions.entries()).sort((a, b) =>
				b[0].localeCompare(a[0], undefined, { numeric: true }),
			);

			if (sorted.length === 0) {
				return yield* Effect.fail(
					new ArtifactNotFoundError({ artifactId: id }),
				);
			}

			const latest = sorted[0]?.[1];
			if (!latest) {
				return yield* Effect.fail(
					new ArtifactNotFoundError({ artifactId: id }),
				);
			}

			return latest;
		});

	const update = (
		id: string,
		newContent: string,
		newMetadata?: Partial<ArtifactMetadata> | undefined,
	) =>
		Effect.gen(function* () {
			const current = yield* get(id);

			if (!newContent || typeof newContent !== "string") {
				return yield* Effect.fail(
					new ArtifactValidationError({
						message: "Content must be a non-empty string",
						field: "content",
						value: newContent,
					}),
				);
			}

			const versionParts = current.metadata.version.split(".").map(Number);
			const major = versionParts[0] ?? 1;
			const minor = versionParts[1] ?? 0;
			const patch = versionParts[2] ?? 0;
			const newVersion = `${major}.${minor}.${patch + 1}`;

			const now = new Date();
			const artifact: Artifact = {
				...current,
				content: newContent,
				metadata: {
					...current.metadata,
					version: newVersion,
					updated: now,
					parentVersion: current.metadata.version,
					...newMetadata,
				},
			};

			store.get(id)!.set(newVersion, artifact);
			return artifact;
		});

	const deleteArtifact = (id: string) =>
		Effect.gen(function* () {
			if (!store.has(id)) {
				return yield* Effect.fail(
					new ArtifactNotFoundError({ artifactId: id }),
				);
			}
			store.delete(id);
		});

	const list = (options?: ArtifactQueryOptions | undefined) =>
		Effect.sync(() => {
			const artifacts: Artifact[] = [];

			for (const versions of store.values()) {
				const sorted = Array.from(versions.values()).sort((a, b) =>
					b.metadata.version.localeCompare(a.metadata.version, undefined, {
						numeric: true,
					}),
				);
				if (sorted.length > 0 && sorted[0]) {
					artifacts.push(sorted[0]);
				}
			}

			let filtered = artifacts;

			if (options?.category) {
				filtered = filtered.filter((a) => a.type.category === options.category);
			}

			if (options?.tags && options.tags.length > 0) {
				filtered = filtered.filter((a) =>
					options.tags!.some((tag) => a.metadata.tags.includes(tag)),
				);
			}

			if (options?.authorPattern) {
				const pattern = new RegExp(options.authorPattern, "i");
				filtered = filtered.filter((a) =>
					a.metadata.author ? pattern.test(a.metadata.author) : false,
				);
			}

			if (options?.generatedBy) {
				filtered = filtered.filter(
					(a) => a.metadata.generatedBy === options.generatedBy,
				);
			}

			if (options?.afterDate) {
				filtered = filtered.filter(
					(a) => a.metadata.created >= options.afterDate!,
				);
			}

			if (options?.beforeDate) {
				filtered = filtered.filter(
					(a) => a.metadata.created <= options.beforeDate!,
				);
			}

			return filtered as readonly Artifact[];
		});

	const getVersionHistory = (id: string) =>
		Effect.gen(function* () {
			const versions = store.get(id);
			if (!versions) {
				return yield* Effect.fail(
					new ArtifactNotFoundError({ artifactId: id }),
				);
			}

			const sorted = Array.from(versions.values()).sort((a, b) =>
				b.metadata.version.localeCompare(a.metadata.version, undefined, {
					numeric: true,
				}),
			);

			return sorted as readonly Artifact[];
		});

	const diff = (id: string, version1: string, version2: string) =>
		Effect.gen(function* () {
			const oldArtifact = yield* get(id, version1);
			const newArtifact = yield* get(id, version2);

			const diffContent = generateDiff(oldArtifact.content, newArtifact.content);

			return {
				oldVersion: oldArtifact,
				newVersion: newArtifact,
				changes: {
					contentChanged: oldArtifact.content !== newArtifact.content,
					metadataChanged:
						JSON.stringify(oldArtifact.metadata) !==
						JSON.stringify(newArtifact.metadata),
					typeChanged:
						JSON.stringify(oldArtifact.type) !==
						JSON.stringify(newArtifact.type),
					diff: diffContent,
				},
			};
		});

	const updateRenderingHints = (id: string, hints: Record<string, unknown>) =>
		Effect.gen(function* () {
			const artifact = yield* get(id);
			return {
				...artifact,
				renderingHints: hints as any,
			};
		});

	return {
		create,
		get,
		update,
		delete: deleteArtifact,
		list,
		getVersionHistory,
		diff,
		updateRenderingHints,
	} satisfies ArtifactServiceApi;
});

/**
 * Create a FileSystem implementation of ArtifactService.
 */
export const makeFileSystem = (baseDir: string) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const typeDetection = yield* TypeDetectionService;

		const getArtifactDir = (id: string) => `${baseDir}/${id}`;
		const getContentPath = (id: string, version: string) =>
			`${getArtifactDir(id)}/v${version}.txt`;
		const getMetadataPath = (id: string, version: string) =>
			`${getArtifactDir(id)}/v${version}.meta.json`;

		const ensureDir = (id: string) =>
			fs.makeDirectory(getArtifactDir(id), { recursive: true }).pipe(
				Effect.mapError(
					(e) =>
						new ArtifactStorageError({
							message: `Failed to create artifact directory: ${e.message}`,
							operation: "ensureDir",
							artifactId: id,
							cause: e as any,
						}),
				),
			);

		const create = (
			content: string,
			metadata: Partial<ArtifactMetadata>,
			explicitType?: ArtifactType | undefined,
		) =>
			Effect.gen(function* () {
				if (!content || typeof content !== "string") {
					return yield* Effect.fail(
						new ArtifactValidationError({
							message: "Content must be a non-empty string",
							field: "content",
							value: content,
						}),
					);
				}

				const type = 
					explicitType ??
					(yield* typeDetection.detectType(content, {
						filename: (metadata as any).filename,
						mimeType: (metadata as any).mimeType,
					}));

				const id = crypto.randomUUID();
				const version = metadata.version ?? "1.0.0";
				const now = new Date();

				const artifact: Artifact = {
					id,
					type,
					content,
					metadata: {
						version,
						created: now,
						updated: now,
						title: metadata.title ?? "Untitled Artifact",
					tags: metadata.tags ?? [],
						...metadata,
					},
				};

				yield* ensureDir(id);

				yield* fs
					.writeFileString(getContentPath(id, version), content)
					.pipe(
						Effect.mapError(
							(e) =>
								new ArtifactStorageError({
									message: `Failed to write artifact content: ${e.message}`,
									operation: "create.content",
									artifactId: id,
									cause: e as any,
								}),
						),
					);

				yield* fs
					.writeFileString(
						getMetadataPath(id, version),
						JSON.stringify(artifact.metadata),
					)
					.pipe(
						Effect.mapError(
							(e) =>
								new ArtifactStorageError({
									message: `Failed to write artifact metadata: ${e.message}`,
									operation: "create.metadata",
									artifactId: id,
									cause: e as any,
								}),
						),
					);

				return artifact;
			});

		const get = (id: string, version?: string | undefined) =>
			Effect.gen(function* () {
				let targetVersion = version;

				if (!targetVersion) {
					// Find latest version by listing directory
					const files = yield* fs.readDirectory(getArtifactDir(id)).pipe(
						Effect.mapError(
							() => new ArtifactNotFoundError({ artifactId: id, version }),
						),
					);

					const versions = files
						.filter((f) => f.endsWith(".meta.json"))
						.map((f) => f.replace(/^v/, "").replace(".meta.json", ""))
						.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

					if (versions.length === 0 || !versions[0]) {
						return yield* Effect.fail(
							new ArtifactNotFoundError({ artifactId: id }),
						);
					}
					targetVersion = versions[0];
				}

				const metadataContent = yield* fs
					.readFileString(getMetadataPath(id, targetVersion))
					.pipe(
						Effect.mapError(
							() =>
								new ArtifactNotFoundError({
									artifactId: id,
									version: targetVersion,
								}),
						),
					);

				const metadata = JSON.parse(metadataContent) as ArtifactMetadata;

				const content = yield* fs
					.readFileString(getContentPath(id, targetVersion))
					.pipe(
						Effect.mapError(
							(e) =>
								new ArtifactStorageError({
									message: `Failed to read artifact content: ${e.message}`,
									operation: "get.content",
									artifactId: id,
									cause: e as any,
								}),
						),
					);

				// Recover type from metadata or detection
				const type = yield* typeDetection.detectType(content, {
					filename: (metadata as any).filename,
				});

				return {
					id,
					type,
					content,
					metadata,
				};
			});

		const todo = (op: string) =>
			Effect.fail(
				new ArtifactStorageError({
					message: `${op} not yet implemented for FileSystem`,
					operation: op,
				}),
			);

		return {
			create,
			get,
			update: (id) => todo("update"),
			delete: (id) => todo("delete"),
			list: () => todo("list"),
			getVersionHistory: (id) => todo("getVersionHistory"),
			diff: (id, v1, v2) => todo("diff"),
			updateRenderingHints: (id, hints) => todo("updateRenderingHints"),
		} satisfies ArtifactServiceApi;
	});

// ============================================================================ 
// Service Definition
// ============================================================================ 

/**
 * ArtifactService - manages AI artifacts
 */
export class ArtifactService extends Effect.Service<ArtifactService>()(
	"ArtifactService",
	{
		accessors: true,
		dependencies: [TypeDetectionService.Default],
		effect: makeInMemory,
	},
) {}
