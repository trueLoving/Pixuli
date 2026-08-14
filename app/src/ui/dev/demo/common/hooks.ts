// Demo 组件公共 Hooks

import { useCallback, useState } from 'react';

/**
 * Demo 模式状态 Hook（通用版本）
 * @param isDemoEnvironmentFn 检测是否为演示环境的函数
 * @param setDemoModeFn 设置演示模式的函数
 */
export function useDemoModeCore(
  isDemoEnvironmentFn: () => boolean,
  setDemoModeFn: (enabled: boolean) => Promise<void>,
) {
  const [isDemoMode, setIsDemoMode] = useState(isDemoEnvironmentFn());

  const exitDemoMode = useCallback(async () => {
    await setDemoModeFn(false);
    setIsDemoMode(false);
  }, [setDemoModeFn]);

  const enterDemoMode = useCallback(async () => {
    await setDemoModeFn(true);
    setIsDemoMode(true);
  }, [setDemoModeFn]);

  return {
    isDemoMode,
    exitDemoMode,
    enterDemoMode,
  };
}
