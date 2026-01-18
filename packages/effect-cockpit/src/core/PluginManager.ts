import { Context, Effect, Layer, Ref } from "effect";
import type { Plugin } from "../types/plugin.js";

export interface PluginManager {
  readonly register: (plugin: Plugin) => Effect.Effect<void>;
  readonly getPlugins: Effect.Effect<ReadonlyArray<Plugin>>;
}

export const PluginManager = Context.GenericTag<PluginManager>(
  "effect-cockpit/PluginManager"
);

export const PluginManagerLive = Layer.effect(
  PluginManager,
  Effect.gen(function* () {
    const plugins = yield* Ref.make<ReadonlyArray<Plugin>>([]);

    return PluginManager.of({
      register: (plugin) => Ref.update(plugins, (current) => [...current, plugin]),
      getPlugins: Ref.get(plugins),
    });
  })
);
