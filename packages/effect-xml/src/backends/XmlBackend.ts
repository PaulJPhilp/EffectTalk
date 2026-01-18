import { Effect } from "effect";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { XmlParseError } from "../errors.js";
import type { XmlDocument, XmlElement } from "../types.js";

type ParsedNode = unknown;

const normalizeToElement = (name: string, node: ParsedNode): XmlElement => {
  if (node === null || node === undefined) {
    return {
      name,
      attributes: {},
      children: [],
    };
  }

  if (typeof node === "string") {
    return {
      name,
      attributes: {},
      children: node.length > 0 ? [node] : [],
    };
  }

  if (typeof node === "number" || typeof node === "boolean") {
    return {
      name,
      attributes: {},
      children: [String(node)],
    };
  }

  if (typeof node !== "object") {
    return {
      name,
      attributes: {},
      children: [],
    };
  }

  const record = node as Record<string, unknown>;
  const attributesRaw = record[":@"];

  const attributes: Record<string, string> =
    attributesRaw && typeof attributesRaw === "object"
      ? Object.fromEntries(
          Object.entries(attributesRaw as Record<string, unknown>).map(
            ([k, v]) => [k, typeof v === "string" ? v : String(v)]
          )
        )
      : {};

  const children: Array<XmlElement | string> = [];

  const text = record["#text"];
  if (typeof text === "string" && text.length > 0) {
    children.push(text);
  }

  for (const [k, v] of Object.entries(record)) {
    if (k === ":@" || k === "#text") continue;

    if (Array.isArray(v)) {
      for (const item of v) {
        children.push(normalizeToElement(k, item));
      }
      continue;
    }

    children.push(normalizeToElement(k, v));
  }

  return {
    name,
    attributes,
    children,
  };
};

const normalizeParsed = (parsed: unknown): XmlDocument => {
  if (parsed === null || typeof parsed !== "object") {
    throw new Error("XML did not parse into an object");
  }

  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length !== 1) {
    throw new Error("XML must have exactly one root element");
  }

  const rootName = keys[0]!;
  const rootNode = record[rootName];

  return {
    root: normalizeToElement(rootName, rootNode),
  };
};

export class XmlBackend extends Effect.Service<XmlBackend>()("XmlBackend", {
  succeed: {
    parseString: (text: string): Effect.Effect<XmlDocument, XmlParseError> =>
      Effect.try({
        try: () => {
          const validation = XMLValidator.validate(text);
          if (validation !== true) {
            throw new Error(validation.err.msg);
          }

          const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            attributesGroupName: ":@",
            textNodeName: "#text",
            trimValues: false,
            parseTagValue: false,
            parseAttributeValue: false,
          });

          const parsed = parser.parse(text);
          return normalizeParsed(parsed);
        },
        catch: (error) =>
          new XmlParseError({
            message: error instanceof Error ? error.message : "Unknown error",
          }),
      }),
  },
}) {}

export const XmlBackendLayer = XmlBackend.Default;
