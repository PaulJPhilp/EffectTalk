import { Effect } from "effect";
import { XmlBackend, XmlBackendLayer } from "./backends/XmlBackend.js";
import { XmlParseError } from "./errors.js";
import type { XmlDocument } from "./types.js";

export const parseString = (
  text: string
): Effect.Effect<XmlDocument, XmlParseError, XmlBackend> =>
  XmlBackend.pipe(Effect.flatMap((backend) => backend.parseString(text)));

export const parseStringDefault = (
  text: string
): Effect.Effect<XmlDocument, XmlParseError> =>
  parseString(text).pipe(Effect.provide(XmlBackendLayer));
