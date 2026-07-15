import { hasPermission } from "@/shared/auth/permissions";

import type { PluginContext, PluginDefinition, PluginHostName, PluginRuntime } from "./types";

export function hasPluginPermissions(plugin: PluginDefinition, context: PluginContext) {
  return plugin.manifest.requiredPermissions.every((permission) => hasPermission(context.role, permission));
}

export function canActivatePlugin(
  plugin: PluginDefinition,
  context: PluginContext,
  host: PluginHostName,
  runtime: PluginRuntime,
) {
  return plugin.isReady
    && plugin.manifest.allowedHosts.includes(host)
    && runtime.enabledFlags.has(plugin.manifest.featureFlag)
    && hasPluginPermissions(plugin, context)
    && plugin.isAllowed(context);
}
