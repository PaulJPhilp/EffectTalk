import { Effect } from "effect";
import { XmlBackend, XmlBackendLayer } from "@/effect-xml/backends/XmlBackend.js";
import { XmlParseError } from "@/effect-xml/errors.js";
import type { XmlDocument } from "@/effect-xml/types.js";

export const parseString = (
  text: string
): Effect.Effect<XmlDocument, XmlParseError, XmlBackend> =>
  XmlBackend.pipe(Effect.flatMap((backend) => backend.parseString(text)));

export const parseStringDefault = (
  text: string
): Effect.Effect<XmlDocument, XmlParseError> =>
  parseString(text).pipe(Effect.provide(XmlBackendLayer));
