import { Effect } from "effect";
import { SupermemoryLayer } from "../services/supermemory.js";
import { withSlashCommands } from "../tui-slash-commands.js";
import { SUPERMEMORY_SLASH_COMMANDS } from "./slash-commands.js";

/**
 * Effect that provides Supermemory functionality with slash commands
 */
export const withSupermemory = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> =>
  withSlashCommands(
    SUPERMEMORY_SLASH_COMMANDS,
    effect.pipe(Effect.provide(SupermemoryLayer)),
  );
