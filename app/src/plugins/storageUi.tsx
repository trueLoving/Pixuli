import React from 'react';
import { startPluginRuntime } from './runtime';
import { uiRegistry } from './uiRegistry';

/** 渲染已注册的源图标；未知插件返回 null */
export function StorageSourceIcon({
  pluginId,
  size = 16,
}: {
  pluginId: string;
  size?: number;
}) {
  startPluginRuntime();
  const contribution = uiRegistry.resolveSourceIcon(pluginId);
  if (!contribution) return null;
  return <>{contribution.render(size)}</>;
}
