import { Effect, Layer, Schema } from "effect";
import { VariableValidationError } from "../errors.js";
import type { ValidationResult } from "../types.js";

export interface ValidationServiceSchema {
	readonly validate: (
		variables: unknown,
		schema: Schema.Schema<unknown>,
	) => Effect.Effect<ValidationResult, never>;
}

export class ValidationService extends Effect.Service<ValidationServiceSchema>()(
	"ValidationService",
	{
		accessors: true,
		dependencies: [],
		effect: Effect.gen(function* () {
			const validate = (variables: unknown, schema: Schema.Schema<unknown>) =>
				Effect.gen(function* () {
					const decoded = yield* Schema.decodeUnknown(schema)(variables).pipe(
						Effect.either,
					);

					if (decoded._tag === "Left") {
						// Extract schema errors from the parse result
						// biome-ignore lint/suspicious/noExplicitAny: Schema error structure is dynamic
						const parseError = decoded.left as any;

						// Try to extract error details from the parse result
						// The error can be in different formats depending on the schema
						let schemaErrors: any[] = [];

						if (parseError.errors && Array.isArray(parseError.errors)) {
							schemaErrors = parseError.errors;
						} else if (Array.isArray(parseError)) {
							schemaErrors = parseError;
						} else {
							// Fallback: create a single error from the parse error
							schemaErrors = [
								{
									message: String(parseError) || "Validation failed",
								},
							];
						}

						const errors = schemaErrors.map((err: any) => {
							const pathStr = (err.path || [])
								.map((p: any) =>
									typeof p.key === "symbol" ? String(p.key) : p.key,
								)
								.join(".");

							return new VariableValidationError({
								message: err.message ?? String(err) ?? "Validation failed",
								variableName: pathStr || "root",
								expected: String(err.expected ?? "unknown"),
								received: err.actual,
								schemaErrors: [err],
							});
						});

						return {
							valid: false,
							errors:
								errors.length > 0
									? errors
									: [
											new VariableValidationError({
												message: "Validation failed",
												variableName: "root",
												expected: "valid",
												received: variables,
												schemaErrors: [],
											}),
										],
							warnings: [],
						};
					}

					return {
						valid: true,
						errors: [],
						warnings: [],
					};
				});

			return { validate } satisfies ValidationServiceSchema;
		}),
	},
) {}

export const ValidationServiceLayer = Layer.service(ValidationService);
