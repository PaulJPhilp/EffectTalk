import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import * as AIFilters from "../../src/filters/ai-filters.js";
import * as ConversationFilters from "../../src/filters/conversation-filters.js";
import type { ConversationMessage } from "../../src/types.js";

describe("AI Filters", () => {
	describe("tokenCount", () => {
		it("should count tokens approximately", async () => {
			const effect = AIFilters.tokenCount("hello world this is a test");
			const result = await Effect.runPromise(effect);
			expect(result).toBeGreaterThan(0);
			expect(result).toBeLessThan(20);
		});

		it("should handle empty string", async () => {
			const effect = AIFilters.tokenCount("");
			const result = await Effect.runPromise(effect);
			expect(result).toBe(0);
		});

		it("should handle numbers", async () => {
			const effect = AIFilters.tokenCount(42);
			const result = await Effect.runPromise(effect);
			expect(result).toBeGreaterThan(0);
		});

		it("should handle null/undefined", async () => {
			const effect1 = AIFilters.tokenCount(null);
			const result1 = await Effect.runPromise(effect1);
			expect(result1).toBe(0);

			const effect2 = AIFilters.tokenCount(undefined);
			const result2 = await Effect.runPromise(effect2);
			expect(result2).toBe(0);
		});

		it("should estimate tokens proportionally to length", async () => {
			const short = await Effect.runPromise(AIFilters.tokenCount("hello"));
			const long = await Effect.runPromise(
				AIFilters.tokenCount(
					"hello world this is a longer text with more words",
				),
			);
			expect(long).toBeGreaterThan(short);
		});

		it("should handle very long texts", async () => {
			const longText = "word ".repeat(1000);
			const result = await Effect.runPromise(AIFilters.tokenCount(longText));
			expect(result).toBeGreaterThan(500);
		});
	});

	describe("sanitize", () => {
		it("should remove control characters", async () => {
			const effect = AIFilters.sanitize("hello\x00world\x01test");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("helloworldtest");
		});

		it("should collapse multiple spaces", async () => {
			const effect = AIFilters.sanitize("hello    world    test");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("hello world test");
		});

		it("should trim whitespace", async () => {
			const effect = AIFilters.sanitize("  hello world  ");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("hello world");
		});

		it("should preserve newlines and tabs", async () => {
			const effect = AIFilters.sanitize("hello\nworld\ttest");
			const result = await Effect.runPromise(effect);
			expect(result).toContain("\n");
			expect(result).toContain("\t");
		});

		it("should handle unicode normalization", async () => {
			const effect = AIFilters.sanitize("café");
			const result = await Effect.runPromise(effect);
			expect(result).toBeDefined();
		});

		it("should handle empty string", async () => {
			const effect = AIFilters.sanitize("");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("");
		});
	});

	describe("truncateToTokens", () => {
		it("should not truncate when under limit", async () => {
			const effect = AIFilters.truncateToTokens("hello world", 100);
			const result = await Effect.runPromise(effect);
			expect(result).toBe("hello world");
		});

		it("should truncate when over limit", async () => {
			const longText = "word ".repeat(100);
			const effect = AIFilters.truncateToTokens(longText, 10);
			const result = await Effect.runPromise(effect);
			expect(result.length).toBeLessThan(longText.length);
			expect(result).toContain("...");
		});

		it("should use custom ellipsis", async () => {
			const longText = "word ".repeat(100);
			const effect = AIFilters.truncateToTokens(longText, 5, "***");
			const result = await Effect.runPromise(effect);
			expect(result).toContain("***");
			expect(result).not.toContain("...");
		});

		it("should handle default ellipsis", async () => {
			const longText = "word ".repeat(100);
			const effect = AIFilters.truncateToTokens(longText, 5);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("...");
		});

		it("should respect token limit", async () => {
			const longText = "word ".repeat(100);
			const effect = AIFilters.truncateToTokens(longText, 20);
			const result = await Effect.runPromise(effect);
			const resultTokens = await Effect.runPromise(
				AIFilters.tokenCount(result),
			);
			expect(resultTokens).toBeLessThanOrEqual(20);
		});
	});

	describe("stripMarkdown", () => {
		it("should remove markdown links", async () => {
			const effect = AIFilters.stripMarkdown("[link](https://example.com)");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("link");
		});

		it("should remove markdown bold/italic", async () => {
			const effect = AIFilters.stripMarkdown(
				"**bold** and *italic* and ***both***",
			);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("bold");
			expect(result).toContain("italic");
			expect(result).not.toContain("**");
			expect(result).not.toContain("*");
		});

		it("should remove inline code", async () => {
			const effect = AIFilters.stripMarkdown("Use `npm install` to start");
			const result = await Effect.runPromise(effect);
			expect(result).toContain("npm install");
			expect(result).not.toContain("`");
		});

		it("should remove code blocks", async () => {
			const markdown = "Here is code:\n```typescript\nconst x = 1;\n```\nDone";
			const effect = AIFilters.stripMarkdown(markdown);
			const result = await Effect.runPromise(effect);
			expect(result).not.toContain("```");
			expect(result).not.toContain("const x");
			expect(result).toContain("Here is code");
			expect(result).toContain("Done");
		});

		it("should remove headers", async () => {
			const effect = AIFilters.stripMarkdown("# Title\n## Subtitle\nContent");
			const result = await Effect.runPromise(effect);
			expect(result).not.toContain("#");
			expect(result).toContain("Content");
		});

		it("should remove images", async () => {
			const effect = AIFilters.stripMarkdown("![alt](image.jpg) and text");
			const result = await Effect.runPromise(effect);
			expect(result).not.toContain("![");
			expect(result).toContain("text");
		});

		it("should handle plain text", async () => {
			const effect = AIFilters.stripMarkdown("Just plain text");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("Just plain text");
		});
	});

	describe("jsonEscape", () => {
		it("should escape quotes", async () => {
			const effect = AIFilters.jsonEscape('hello "world"');
			const result = await Effect.runPromise(effect);
			expect(result).toBe('hello \\"world\\"');
		});

		it("should escape backslashes", async () => {
			const effect = AIFilters.jsonEscape("hello\\world");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("hello\\\\world");
		});

		it("should escape newlines", async () => {
			const effect = AIFilters.jsonEscape("hello\nworld");
			const result = await Effect.runPromise(effect);
			expect(result).toContain("\\n");
		});

		it("should escape tabs", async () => {
			const effect = AIFilters.jsonEscape("hello\tworld");
			const result = await Effect.runPromise(effect);
			expect(result).toContain("\\t");
		});

		it("should handle empty string", async () => {
			const effect = AIFilters.jsonEscape("");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("");
		});
	});

	describe("toNumberedList", () => {
		it("should convert array to numbered list", async () => {
			const effect = AIFilters.toNumberedList(["apple", "banana", "cherry"]);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("1. apple");
			expect(result).toContain("2. banana");
			expect(result).toContain("3. cherry");
		});

		it("should support custom start number", async () => {
			const effect = AIFilters.toNumberedList(["apple", "banana"], 5);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("5. apple");
			expect(result).toContain("6. banana");
			expect(result).not.toContain("1.");
		});

		it("should handle non-array input", async () => {
			const effect = AIFilters.toNumberedList("single item");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("single item");
		});

		it("should handle empty array", async () => {
			const effect = AIFilters.toNumberedList([]);
			const result = await Effect.runPromise(effect);
			expect(result).toBe("");
		});

		it("should handle mixed types in array", async () => {
			const effect = AIFilters.toNumberedList([1, "two", { three: 3 }]);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("1. 1");
			expect(result).toContain("2. two");
			expect(result).toContain("3.");
		});
	});

	describe("toBulletedList", () => {
		it("should convert array to bulleted list", async () => {
			const effect = AIFilters.toBulletedList(["apple", "banana", "cherry"]);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("- apple");
			expect(result).toContain("- banana");
			expect(result).toContain("- cherry");
		});

		it("should support custom bullet character", async () => {
			const effect = AIFilters.toBulletedList(["apple", "banana"], "*");
			const result = await Effect.runPromise(effect);
			expect(result).toContain("* apple");
			expect(result).toContain("* banana");
			expect(result).not.toContain("-");
		});

		it("should handle non-array input", async () => {
			const effect = AIFilters.toBulletedList("single item");
			const result = await Effect.runPromise(effect);
			expect(result).toBe("single item");
		});

		it("should handle empty array", async () => {
			const effect = AIFilters.toBulletedList([]);
			const result = await Effect.runPromise(effect);
			expect(result).toBe("");
		});

		it("should work with different bullet styles", async () => {
			const items = ["one", "two"];

			const dash = await Effect.runPromise(
				AIFilters.toBulletedList(items, "-"),
			);
			expect(dash).toContain("- one");

			const star = await Effect.runPromise(
				AIFilters.toBulletedList(items, "*"),
			);
			expect(star).toContain("* one");

			const plus = await Effect.runPromise(
				AIFilters.toBulletedList(items, "+"),
			);
			expect(plus).toContain("+ one");
		});
	});
});

describe("Conversation Filters", () => {
	const sampleMessages: ConversationMessage[] = [
		{ role: "system", content: "You are a helpful assistant" },
		{ role: "user", content: "Hello!" },
		{ role: "assistant", content: "Hi there! How can I help?" },
	];

	describe("formatConversation", () => {
		it("should format as OpenAI format by default", async () => {
			const effect = ConversationFilters.formatConversation(sampleMessages);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("You are a helpful assistant");
			expect(result).toContain("system");
			expect(result).toContain("user");
			expect(result).toContain("assistant");
		});

		it("should be valid JSON in OpenAI format", async () => {
			const effect = ConversationFilters.formatConversation(
				sampleMessages,
				"openai",
			);
			const result = await Effect.runPromise(effect);
			const parsed = JSON.parse(result);
			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed[0].role).toBe("system");
		});

		it("should format as Anthropic format", async () => {
			const effect = ConversationFilters.formatConversation(
				sampleMessages,
				"anthropic",
			);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("Human:");
			expect(result).toContain("Assistant:");
		});

		it("should format as plain format", async () => {
			const effect = ConversationFilters.formatConversation(
				sampleMessages,
				"plain",
			);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("[SYSTEM]");
			expect(result).toContain("[USER]");
			expect(result).toContain("[ASSISTANT]");
		});

		it("should handle function role", async () => {
			const messages: ConversationMessage[] = [
				{ role: "function", name: "calculator", content: "Result: 42" },
			];
			const effect = ConversationFilters.formatConversation(messages, "openai");
			const result = await Effect.runPromise(effect);
			expect(result).toContain("function");
			expect(result).toContain("calculator");
		});

		it("should handle non-array input gracefully", async () => {
			const effect = ConversationFilters.formatConversation(
				"not an array",
			).pipe(Effect.catchAll(() => Effect.succeed("error handled")));
			const result = await Effect.runPromise(effect);
			expect(result).toBeDefined();
		});

		it("should handle empty message array", async () => {
			const effect = ConversationFilters.formatConversation([]);
			const result = await Effect.runPromise(effect);
			expect(result).toContain("[]");
		});
	});

	describe("filterByRole", () => {
		it("should extract system messages", async () => {
			const effect = ConversationFilters.filterByRole(sampleMessages, "system");
			const result = await Effect.runPromise(effect);
			expect(result).toHaveLength(1);
			expect(result[0].role).toBe("system");
			expect(result[0].content).toBe("You are a helpful assistant");
		});

		it("should extract user messages", async () => {
			const effect = ConversationFilters.filterByRole(sampleMessages, "user");
			const result = await Effect.runPromise(effect);
			expect(result).toHaveLength(1);
			expect(result[0].role).toBe("user");
		});

		it("should extract assistant messages", async () => {
			const effect = ConversationFilters.filterByRole(
				sampleMessages,
				"assistant",
			);
			const result = await Effect.runPromise(effect);
			expect(result).toHaveLength(1);
			expect(result[0].role).toBe("assistant");
		});

		it("should return empty array for non-existent role", async () => {
			const effect = ConversationFilters.filterByRole(
				sampleMessages,
				"nonexistent",
			);
			const result = await Effect.runPromise(effect);
			expect(result).toHaveLength(0);
		});

		it("should handle non-array input", async () => {
			const effect = ConversationFilters.filterByRole("not an array", "system");
			const result = await Effect.runPromise(effect);
			expect(result).toHaveLength(0);
		});
	});

	describe("conversationTokens", () => {
		it("should count tokens in conversation", async () => {
			const effect = ConversationFilters.conversationTokens(sampleMessages);
			const result = await Effect.runPromise(effect);
			expect(result).toBeGreaterThan(0);
			expect(result).toBeLessThan(100);
		});

		it("should handle empty array", async () => {
			const effect = ConversationFilters.conversationTokens([]);
			const result = await Effect.runPromise(effect);
			expect(result).toBe(0);
		});

		it("should handle non-array input", async () => {
			const effect = ConversationFilters.conversationTokens("not an array");
			const result = await Effect.runPromise(effect);
			expect(result).toBe(0);
		});

		it("should increase with more messages", async () => {
			const short = await Effect.runPromise(
				ConversationFilters.conversationTokens([
					{ role: "user", content: "Hi" },
				]),
			);

			const long = await Effect.runPromise(
				ConversationFilters.conversationTokens(sampleMessages),
			);

			expect(long).toBeGreaterThan(short);
		});

		it("should include role overhead tokens", async () => {
			const messages: ConversationMessage[] = [{ role: "user", content: "" }];
			const result = await Effect.runPromise(
				ConversationFilters.conversationTokens(messages),
			);
			// Should at least have overhead for role
			expect(result).toBeGreaterThan(0);
		});
	});
});
