import { Effect, Schema, Stream } from "effect";
import { describe, expect, it } from "vitest";
import { parseStream, stringifyStream } from "../../src/CsvStream.js";

const SimpleUserSchema = Schema.Array(
  Schema.Struct({
    id: Schema.NumberFromString,
    name: Schema.String,
  })
);

const UserItemSchema = Schema.Struct({
  id: Schema.NumberFromString,
  name: Schema.String,
});

describe("CSV Streaming API", () => {
  describe("parseStream()", () => {
    it("should parse CSV stream row by row", async () => {
      const csvString = `id,name
1,Alice
2,Bob`;
      const inputStream = Stream.make(csvString);

      const result = await Effect.runPromise(
        Stream.runCollect(parseStream(UserItemSchema, inputStream))
      );

      expect(result.length).toBe(2);
    });
  });

  describe("stringifyStream()", () => {
    it("should stringify data stream to CSV", async () => {
      const data = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];
      const dataStream = Stream.fromIterable(data);

      const result = await Effect.runPromise(
        Stream.runCollect(stringifyStream(UserItemSchema, dataStream))
      );

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("streaming round-trip", () => {
    it("should handle stream processing", async () => {
      const data = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];
      const dataStream = Stream.fromIterable(data);

      const csvStream = stringifyStream(UserItemSchema, dataStream);
      const csvChunks = await Effect.runPromise(Stream.runCollect(csvStream));

      expect(csvChunks.length).toBeGreaterThan(0);
    });
  });
});
