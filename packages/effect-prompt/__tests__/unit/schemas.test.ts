/**
 * Schema validation tests for effect-prompt
 *
 * Tests type validation and schema constraints for all prompt schemas
 */

import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
	PromptMetadataSchema,
	PromptTemplateSchema,
	ConversationMessageSchema,
	ConversationSchema,
	CommonVariableSchemas,
} from "../../src/schemas.js";

describe("Schema Validation - effect-prompt", () => {
	describe("PromptMetadataSchema", () => {
		it("should validate complete prompt metadata", () => {
			const now = new Date().toISOString();
			const metadata = {
				version: "1.0.0",
				created: now,
				updated: now,
				tags: ["test", "prompt"],
				author: "John Doe",
				extends: "base-template",
				maxTokens: 2048,
			};

			const result = Schema.decodeSync(PromptMetadataSchema)(metadata);
			expect(result.version).toBe("1.0.0");
			expect(result.tags).toEqual(["test", "prompt"]);
			expect(result.author).toBe("John Doe");
			expect(result.maxTokens).toBe(2048);
		});

		it("should validate metadata with required fields only", () => {
			const now = new Date().toISOString();
			const metadata = {
				version: "1.0.0",
				created: now,
				updated: now,
				tags: [],
			};

			const result = Schema.decodeSync(PromptMetadataSchema)(metadata);
			expect(result.version).toBe("1.0.0");
			expect(result.author).toBeUndefined();
			expect(result.extends).toBeUndefined();
		});

		it("should accept multiple tags", () => {
			const now = new Date().toISOString();
			const metadata = {
				version: "2.0.0",
				created: now,
				updated: now,
				tags: ["ai", "generation", "template", "system"],
			};

			const result = Schema.decodeSync(PromptMetadataSchema)(metadata);
			expect(result.tags).toHaveLength(4);
		});

		it("should accept high maxTokens values", () => {
			const now = new Date().toISOString();
			const metadata = {
				version: "1.0.0",
				created: now,
				updated: now,
				tags: [],
				maxTokens: 128000,
			};

			const result = Schema.decodeSync(PromptMetadataSchema)(metadata);
			expect(result.maxTokens).toBe(128000);
		});

		it("should reject missing required fields", () => {
			const now = new Date().toISOString();
			expect(() => {
				Schema.decodeSync(PromptMetadataSchema)({
					version: "1.0.0",
					created: now,
					// Missing updated and tags
				});
			}).toThrow();
		});

		it("should require dates to be valid ISO date strings", () => {
			expect(() => {
				Schema.decodeSync(PromptMetadataSchema)({
					version: "1.0.0",
					created: "invalid-date",
					updated: new Date().toISOString(),
					tags: [],
				});
			}).toThrow();
		});
	});

	describe("PromptTemplateSchema", () => {
		it("should validate complete prompt template", () => {
			const now = new Date().toISOString();
			const template = {
				id: "template-1",
				name: "System Prompt Template",
				description: "A template for system prompts",
				content: "You are a helpful assistant.",
				metadata: {
					version: "1.0.0",
					created: now,
					updated: now,
					tags: ["system"],
				},
			};

			const result = Schema.decodeSync(PromptTemplateSchema)(template);
			expect(result.id).toBe("template-1");
			expect(result.name).toBe("System Prompt Template");
			expect(result.content).toBe("You are a helpful assistant.");
		});

		it("should validate template with minimal fields", () => {
			const now = new Date().toISOString();
			const template = {
				id: "simple-template",
				name: "Simple",
				content: "Hello {{name}}!",
				metadata: {
					version: "1.0.0",
					created: now,
					updated: now,
					tags: [],
				},
			};

			const result = Schema.decodeSync(PromptTemplateSchema)(template);
			expect(result.description).toBeUndefined();
			expect(result.content).toBe("Hello {{name}}!");
		});

		it("should accept multiline template content", () => {
			const now = new Date().toISOString();
			const multilineContent = `You are a helpful assistant.
Your role is to provide accurate information.
Be concise and clear in your responses.`;

			const template = {
				id: "multiline",
				name: "Multiline Template",
				content: multilineContent,
				metadata: {
					version: "1.0.0",
					created: now,
					updated: now,
					tags: [],
				},
			};

			const result = Schema.decodeSync(PromptTemplateSchema)(template);
			expect(result.content).toContain("accurate information");
		});

		it("should reject missing required fields", () => {
			const now = new Date().toISOString();
			expect(() => {
				Schema.decodeSync(PromptTemplateSchema)({
					id: "template-1",
					// Missing name, content, metadata
				});
			}).toThrow();
		});

		it("should require metadata to be valid", () => {
			expect(() => {
				Schema.decodeSync(PromptTemplateSchema)({
					id: "template-1",
					name: "Test",
					content: "content",
					metadata: {
						version: "1.0.0",
						// Missing created, updated, tags
					},
				});
			}).toThrow();
		});
	});

	describe("ConversationMessageSchema", () => {
		it("should validate system message", () => {
			const message = {
				role: "system" as const,
				content: "You are a helpful assistant.",
			};

			const result = Schema.decodeSync(ConversationMessageSchema)(message);
			expect(result.role).toBe("system");
			expect(result.content).toBe("You are a helpful assistant.");
		});

		it("should validate user message", () => {
			const message = {
				role: "user" as const,
				content: "What is the capital of France?",
			};

			const result = Schema.decodeSync(ConversationMessageSchema)(message);
			expect(result.role).toBe("user");
		});

		it("should validate assistant message", () => {
			const message = {
				role: "assistant" as const,
				content: "Paris is the capital of France.",
			};

			const result = Schema.decodeSync(ConversationMessageSchema)(message);
			expect(result.role).toBe("assistant");
		});

		it("should validate function message with name", () => {
			const message = {
				role: "function" as const,
				content: '{"result": "success"}',
				name: "my_function",
			};

			const result = Schema.decodeSync(ConversationMessageSchema)(message);
			expect(result.role).toBe("function");
			expect(result.name).toBe("my_function");
		});

		it("should accept all message roles", () => {
			const roles = ["system", "user", "assistant", "function"] as const;

			for (const role of roles) {
				const message = {
					role,
					content: "Message content",
				};

				const result = Schema.decodeSync(ConversationMessageSchema)(message);
				expect(result.role).toBe(role);
			}
		});

		it("should reject invalid role", () => {
			expect(() => {
				Schema.decodeSync(ConversationMessageSchema)({
					role: "invalid",
					content: "Test",
				});
			}).toThrow();
		});

		it("should reject missing content", () => {
			expect(() => {
				Schema.decodeSync(ConversationMessageSchema)({
					role: "user",
				});
			}).toThrow();
		});

		it("should allow empty content", () => {
			const message = {
				role: "assistant" as const,
				content: "",
			};

			const result = Schema.decodeSync(ConversationMessageSchema)(message);
			expect(result.content).toBe("");
		});
	});

	describe("ConversationSchema", () => {
		it("should validate complete conversation", () => {
			const now = new Date().toISOString();
			const conversation = {
				id: "conv-1",
				messages: [
					{
						role: "system" as const,
						content: "You are helpful.",
					},
					{
						role: "user" as const,
						content: "Hello",
					},
					{
						role: "assistant" as const,
						content: "Hi there!",
					},
				],
				metadata: {
					created: now,
					updated: now,
					totalTokens: 100,
					model: "gpt-4",
				},
			};

			const result = Schema.decodeSync(ConversationSchema)(conversation);
			expect(result.id).toBe("conv-1");
			expect(result.messages).toHaveLength(3);
			expect(result.metadata.totalTokens).toBe(100);
		});

		it("should validate conversation with minimal messages", () => {
			const now = new Date().toISOString();
			const conversation = {
				id: "conv-2",
				messages: [
					{
						role: "user" as const,
						content: "Query",
					},
				],
				metadata: {
					created: now,
					updated: now,
				},
			};

			const result = Schema.decodeSync(ConversationSchema)(conversation);
			expect(result.messages).toHaveLength(1);
			expect(result.metadata.totalTokens).toBeUndefined();
		});

		it("should accept empty message array", () => {
			const now = new Date().toISOString();
			const conversation = {
				id: "conv-3",
				messages: [],
				metadata: {
					created: now,
					updated: now,
				},
			};

			const result = Schema.decodeSync(ConversationSchema)(conversation);
			expect(result.messages).toHaveLength(0);
		});

		it("should validate conversation with many messages", () => {
			const now = new Date().toISOString();
			const messages = [];
			for (let i = 0; i < 50; i++) {
				messages.push({
					role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
					content: `Message ${i}`,
				});
			}

			const conversation = {
				id: "conv-long",
				messages,
				metadata: {
					created: now,
					updated: now,
					totalTokens: 5000,
				},
			};

			const result = Schema.decodeSync(ConversationSchema)(conversation);
			expect(result.messages).toHaveLength(50);
		});

		it("should accept high token counts", () => {
			const now = new Date().toISOString();
			const conversation = {
				id: "conv-tokens",
				messages: [
					{
						role: "user" as const,
						content: "long message",
					},
				],
				metadata: {
					created: now,
					updated: now,
					totalTokens: 128000,
				},
			};

			const result = Schema.decodeSync(ConversationSchema)(conversation);
			expect(result.metadata.totalTokens).toBe(128000);
		});

		it("should reject missing id", () => {
			const now = new Date().toISOString();
			expect(() => {
				Schema.decodeSync(ConversationSchema)({
					messages: [],
					metadata: {
						created: now,
						updated: now,
					},
				});
			}).toThrow();
		});

		it("should reject missing messages", () => {
			const now = new Date().toISOString();
			expect(() => {
				Schema.decodeSync(ConversationSchema)({
					id: "conv-1",
					metadata: {
						created: now,
						updated: now,
					},
				});
			}).toThrow();
		});

		it("should reject missing metadata dates", () => {
			expect(() => {
				Schema.decodeSync(ConversationSchema)({
					id: "conv-1",
					messages: [],
					metadata: {
						// Missing created and updated
					},
				});
			}).toThrow();
		});
	});

	describe("CommonVariableSchemas", () => {
		describe("text schema", () => {
			it("should validate string values", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.text)(
					"Hello, world!",
				);
				expect(result).toBe("Hello, world!");
			});

			it("should accept empty strings", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.text)("");
				expect(result).toBe("");
			});

			it("should accept very long strings", () => {
				const longString = "a".repeat(10000);
				const result = Schema.decodeSync(CommonVariableSchemas.text)(
					longString,
				);
				expect(result).toHaveLength(10000);
			});

			it("should reject non-string values", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.text)(123);
				}).toThrow();
			});
		});

		describe("number schema", () => {
			it("should validate numbers without constraints", () => {
				const schema = CommonVariableSchemas.number();
				const result = Schema.decodeSync(schema)(42);
				expect(result).toBe(42);
			});

			it("should validate negative numbers", () => {
				const schema = CommonVariableSchemas.number();
				const result = Schema.decodeSync(schema)(-42);
				expect(result).toBe(-42);
			});

			it("should validate floats", () => {
				const schema = CommonVariableSchemas.number();
				const result = Schema.decodeSync(schema)(3.14);
				expect(result).toBe(3.14);
			});

			it("should enforce minimum constraint", () => {
				const schema = CommonVariableSchemas.number(0);
				const result = Schema.decodeSync(schema)(10);
				expect(result).toBe(10);

				expect(() => {
					Schema.decodeSync(schema)(-1);
				}).toThrow();
			});

			it("should enforce maximum constraint", () => {
				const schema = CommonVariableSchemas.number(undefined, 100);
				const result = Schema.decodeSync(schema)(50);
				expect(result).toBe(50);

				expect(() => {
					Schema.decodeSync(schema)(150);
				}).toThrow();
			});

			it("should enforce min and max constraints", () => {
				const schema = CommonVariableSchemas.number(0, 100);

				const validResult = Schema.decodeSync(schema)(50);
				expect(validResult).toBe(50);

				expect(() => {
					Schema.decodeSync(schema)(-10);
				}).toThrow();

				expect(() => {
					Schema.decodeSync(schema)(150);
				}).toThrow();
			});

			it("should accept boundary values", () => {
				const schema = CommonVariableSchemas.number(0, 100);

				expect(Schema.decodeSync(schema)(0)).toBe(0);
				expect(Schema.decodeSync(schema)(100)).toBe(100);
			});

			it("should reject non-numeric values", () => {
				const schema = CommonVariableSchemas.number();
				expect(() => {
					Schema.decodeSync(schema)("not a number");
				}).toThrow();
			});
		});

		describe("stringArray schema", () => {
			it("should validate string arrays", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.stringArray)([
					"apple",
					"banana",
					"cherry",
				]);
				expect(result).toEqual(["apple", "banana", "cherry"]);
			});

			it("should accept empty arrays", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.stringArray)([]);
				expect(result).toEqual([]);
			});

			it("should accept single element arrays", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.stringArray)([
					"single",
				]);
				expect(result).toEqual(["single"]);
			});

			it("should accept large arrays", () => {
				const largeArray = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
				const result = Schema.decodeSync(CommonVariableSchemas.stringArray)(
					largeArray,
				);
				expect(result).toHaveLength(1000);
			});

			it("should reject arrays with non-string elements", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.stringArray)([
						"valid",
						123,
						"invalid",
					]);
				}).toThrow();
			});

			it("should reject non-array values", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.stringArray)("not an array");
				}).toThrow();
			});
		});

		describe("url schema", () => {
			it("should validate http URLs", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.url)(
					"http://example.com",
				);
				expect(result).toBe("http://example.com");
			});

			it("should validate https URLs", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.url)(
					"https://example.com/path",
				);
				expect(result).toBe("https://example.com/path");
			});

			it("should validate complex URLs", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.url)(
					"https://example.com:8080/path?query=value#anchor",
				);
				expect(result).toContain("example.com");
			});

			it("should reject URLs without protocol", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.url)("example.com");
				}).toThrow();
			});

			it("should reject invalid URLs", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.url)("ftp://example.com");
				}).toThrow();
			});

			it("should reject non-URL strings", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.url)("not a url");
				}).toThrow();
			});
		});

		describe("email schema", () => {
			it("should validate standard email addresses", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.email)(
					"user@example.com",
				);
				expect(result).toBe("user@example.com");
			});

			it("should validate emails with dots in local part", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.email)(
					"first.last@example.com",
				);
				expect(result).toBe("first.last@example.com");
			});

			it("should validate emails with plus addressing", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.email)(
					"user+tag@example.com",
				);
				expect(result).toBe("user+tag@example.com");
			});

			it("should validate emails with subdomains", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.email)(
					"user@mail.example.co.uk",
				);
				expect(result).toBe("user@mail.example.co.uk");
			});

			it("should reject emails without @ symbol", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.email)("userexample.com");
				}).toThrow();
			});

			it("should reject emails with spaces", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.email)("user @example.com");
				}).toThrow();
			});

			it("should reject emails without domain", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.email)("user@");
				}).toThrow();
			});

			it("should reject invalid email formats", () => {
				expect(() => {
					Schema.decodeSync(CommonVariableSchemas.email)("@example.com");
				}).toThrow();
			});
		});

		describe("json schema", () => {
			it("should validate json objects", () => {
				const obj = { key: "value", count: 42 };
				const result = Schema.decodeSync(CommonVariableSchemas.json)(obj);
				expect(result).toEqual(obj);
			});

			it("should validate empty json objects", () => {
				const result = Schema.decodeSync(CommonVariableSchemas.json)({});
				expect(result).toEqual({});
			});

			it("should validate nested json objects", () => {
				const obj = {
					user: { name: "John", age: 30 },
					settings: { theme: "dark" },
				};
				const result = Schema.decodeSync(CommonVariableSchemas.json)(obj);
				expect(result.user?.name).toBe("John");
			});

			it("should validate json with arrays", () => {
				const obj = {
					items: [1, 2, 3],
					names: ["a", "b", "c"],
				};
				const result = Schema.decodeSync(CommonVariableSchemas.json)(obj);
				expect(result.items).toEqual([1, 2, 3]);
			});

			it("should accept any json-like object structure", () => {
				const obj = {
					string: "text",
					number: 42,
					boolean: true,
					null: null,
					array: [1, "two", { three: 3 }],
				};
				const result = Schema.decodeSync(CommonVariableSchemas.json)(obj);
				expect(result).toBeDefined();
			});
		});
	});
});
