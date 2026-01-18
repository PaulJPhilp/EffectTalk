import { Effect, Layer, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import { createFileStorage } from "effect-storage";
import type {
	StorageError as StorageServiceError,
	NotFoundError as StorageNotFoundError,
} from "effect-storage";
import { PromptConfig, PromptConfigLayer } from "../config/prompt-config.js";
import { PromptNotFoundError, StorageError } from "../errors.js";
import type { PromptTemplate, QueryOptions } from "../types.js";
import {
	PromptMetadataSchema,
	type PromptMetadata,
} from "../schemas/metadata-schema.js";

export interface PromptStorageServiceSchema {
	readonly load: (
		promptId: string,
	) => Effect.Effect<PromptTemplate, PromptNotFoundError | StorageError>;

	readonly save: (
		template: PromptTemplate,
	) => Effect.Effect<void, StorageError>;

	readonly list: (
		options?: QueryOptions,
	) => Effect.Effect<readonly PromptTemplate[], StorageError>;

	readonly delete: (
		promptId: string,
	) => Effect.Effect<void, PromptNotFoundError | StorageError>;
}

export class PromptStorageService extends Effect.Service<PromptStorageServiceSchema>()(
	"PromptStorageService",
	{
		accessors: true,
		dependencies: [],
		effect: Effect.gen(function* () {
			const config = yield* PromptConfig;

			const promptsDir = yield* config.getPromptsDir();
			const enableCaching = yield* config.getEnableCaching();

			// Create storage layer using effect-storage
			const storageApi = yield* createFileStorage({
				basePath: promptsDir,
				contentExtension: "liquid",
				contentSchema: Schema.String,
				metadataSchema: PromptMetadataSchema,
				enableCaching,
			});

			const load = (promptId: string) =>
				Effect.gen(function* () {
					// Load content and metadata from storage
					const result = yield* storageApi.load(promptId).pipe(
						Effect.mapError((err) => {
							// Map storage errors to domain errors
							if (err._tag === "NotFoundError") {
								return new PromptNotFoundError({
									message: `Prompt not found: ${promptId}`,
									promptId,
									searchPath: promptsDir,
									cause: err.cause,
								});
							}
							return new StorageError({
								message: `Failed to load prompt: ${promptId}`,
								operation: "read",
								path: promptsDir,
								...(err && err.message ? { cause: err as Error } : {}),
							});
						}),
					);

					const metadata = result.metadata as PromptMetadata;

					// Transform storage format to PromptTemplate domain model
					const templateMetadata: any = {
						version: metadata.version ?? "1.0.0",
						created: new Date(metadata.created ?? Date.now()),
						updated: new Date(metadata.updated ?? Date.now()),
						tags: metadata.tags ?? [],
					};
					if (metadata.author !== undefined) {
						templateMetadata.author = metadata.author;
					}
					if (metadata.extends !== undefined) {
						templateMetadata.extends = metadata.extends;
					}
					if (metadata.maxTokens !== undefined) {
						templateMetadata.maxTokens = metadata.maxTokens;
					}

					const template: PromptTemplate = {
						id: promptId,
						name: metadata.name ?? promptId,
						...(metadata.description !== undefined && {
							description: metadata.description,
						}),
						content: result.content,
						metadata: templateMetadata,
					};

					return template;
				});

			const save = (template: PromptTemplate) =>
				Effect.gen(function* () {
					// Transform domain model to storage format
					const metadataToSave: PromptMetadata = {
						name: template.name,
						description: template.description,
						version: template.metadata.version,
						created: template.metadata.created.toISOString(),
						tags: template.metadata.tags,
						author: template.metadata.author,
						extends: template.metadata.extends,
						maxTokens: template.metadata.maxTokens,
					};

					// Save via effect-storage
					yield* storageApi
						.save(template.id, template.content, metadataToSave)
						.pipe(
							Effect.mapError(
								(err) =>
									new StorageError({
										message: `Failed to save prompt: ${template.id}`,
										operation: "write",
										path: promptsDir,
										...(err && err.message ? { cause: err as Error } : {}),
									}),
							),
						);
				});

			const list = (options?: QueryOptions) =>
				Effect.gen(function* () {
					// Get all prompt IDs from storage
					const ids = yield* storageApi.list().pipe(
						Effect.mapError(
							(err) =>
								new StorageError({
									message: "Failed to list prompts",
									operation: "list",
									path: promptsDir,
									...(err && err.message ? { cause: err as Error } : {}),
								}),
						),
					);

					// Load all templates concurrently
					const templates = yield* Effect.all(
						ids.map((id) =>
							load(id).pipe(
								Effect.catchTag("PromptNotFoundError", (err) =>
									Effect.fail(
										new StorageError({
											message: `Prompt not found during list: ${err.promptId}`,
											operation: "list",
											path: promptsDir,
											cause: err,
										}),
									),
								),
							),
						),
						{ concurrency: 10 },
					);

					// Apply filters (domain-specific logic)
					let filtered: PromptTemplate[] = templates;
					if (options?.tags && options.tags.length > 0) {
						filtered = filtered.filter((t: PromptTemplate) =>
							options.tags!.some((tag: string) =>
								t.metadata.tags.includes(tag),
							),
						);
					}
					if (options?.namePattern) {
						const pattern = new RegExp(options.namePattern, "i");
						filtered = filtered.filter((t: PromptTemplate) =>
							pattern.test(t.name),
						);
					}

					return filtered as readonly PromptTemplate[];
				});

			const deletePrompt = (promptId: string) =>
				Effect.gen(function* () {
					// Delete via effect-storage
					yield* storageApi.delete(promptId).pipe(
						Effect.mapError((err) => {
							// Map storage errors to domain errors
							if (err._tag === "NotFoundError") {
								return new PromptNotFoundError({
									message: `Prompt not found: ${promptId}`,
									promptId,
									searchPath: promptsDir,
									cause: err.cause,
								});
							}
							return new StorageError({
								message: `Failed to delete prompt: ${promptId}`,
								operation: "delete",
								path: promptsDir,
								...(err && err.message ? { cause: err as Error } : {}),
							});
						}),
					);
				});

			return {
				load,
				save,
				list,
				delete: deletePrompt,
			} satisfies PromptStorageServiceSchema;
		}),
	},
) {}

export const PromptStorageServiceLayer = PromptConfigLayer.pipe(
	Layer.provide(Layer.service(PromptStorageService)),
);
