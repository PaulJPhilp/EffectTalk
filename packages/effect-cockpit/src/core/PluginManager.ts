import { Effect, Ref } from "effect";
import type { Plugin } from "../types/plugin.js";

export interface PluginManagerApi {
	readonly register: (plugin: Plugin) => Effect.Effect<void>;
	readonly getPlugins: Effect.Effect<ReadonlyArray<Plugin>>;
}

export class PluginManager extends Effect.Service<PluginManager>()(
	"effect-cockpit/PluginManager",
	{
		effect: Effect.fn(function* () {
			const plugins = yield* Ref.make<ReadonlyArray<Plugin>>([]);

			return {
				register: (plugin) =>
					Ref.update(plugins, (current) => [...current, plugin]),
				getPlugins: Ref.get(plugins),
			} satisfies PluginManagerApi;
		}),
	},
) {}
