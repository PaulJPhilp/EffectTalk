import { Data } from "effect";

/**
 * Error when prompt template is not found
 */
export class PromptNotFoundError extends Data.TaggedError(
	"PromptNotFoundError",
)<{
	readonly message: string;
	readonly promptId: string;
	readonly searchPath?: string;
	readonly cause?: unknown;
}> {}

/**
 * Error when variable validation fails
 */
export class VariableValidationError extends Data.TaggedError(
	"VariableValidationError",
)<{
	readonly message: string;
	readonly variableName: string;
	readonly expected: string;
	readonly received: unknown;
	readonly schemaErrors: readonly unknown[];
	readonly cause?: unknown;
}> {}

/**
 * Error when prompt version conflict occurs
 */
export class VersionConflictError extends Data.TaggedError(
	"VersionConflictError",
)<{
	readonly message: string;
	readonly promptId: string;
	readonly currentVersion: string;
	readonly attemptedVersion: string;
	readonly cause?: unknown;
}> {}

/**
 * Error when prompt rendering fails
 */
export class PromptRenderError extends Data.TaggedError("PromptRenderError")<{
	readonly message: string;
	readonly promptId: string;
	readonly templateContent: string;
	readonly variables: Record<string, unknown>;
	readonly cause?: unknown;
}> {}

/**
 * Error when template inheritance fails
 */
export class InheritanceError extends Data.TaggedError("InheritanceError")<{
	readonly message: string;
	readonly childTemplateId: string;
	readonly parentTemplateId: string;
	readonly cause?: unknown;
}> {}

/**
 * Error when storage operations fail
 */
export class StorageError extends Data.TaggedError("StorageError")<{
	readonly message: string;
	readonly operation: "read" | "write" | "delete" | "list";
	readonly path: string;
	readonly cause?: unknown;
}> {}

/**
 * Error when token limit is exceeded
 */
export class TokenLimitExceededError extends Data.TaggedError(
	"TokenLimitExceededError",
)<{
	readonly message: string;
	readonly limit: number;
	readonly actual: number;
	readonly promptId?: string;
}> {}
