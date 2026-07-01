export interface ViteModeFlags {
  isWeb: boolean;
  isDesktop: boolean;
  isServe: boolean;
  isBuild: boolean;
  isAndroidDev: boolean;
  isCapacitorNativeBuild: boolean;
  androidDevPort: number;
}

/** 由 Vite `mode`、环境变量与 command 解析三端构建分轨（REF-514） */
export function resolveViteModeFlags(
  mode: string,
  env: Record<string, string>,
  command: 'serve' | 'build',
): ViteModeFlags {
  const isWeb = mode === 'web';
  const isDesktop = mode === 'desktop' || (!mode && !env.ELECTRON);
  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const isAndroidDev = isServe && isWeb && !!process.env.CAPACITOR_ANDROID_DEV;
  const androidDevPort = Number(process.env.CAPACITOR_DEV_PORT || 5500);
  const isCapacitorNativeBuild =
    isWeb && isBuild && !!process.env.CAPACITOR_NATIVE;

  return {
    isWeb,
    isDesktop,
    isServe,
    isBuild,
    isAndroidDev,
    isCapacitorNativeBuild,
    androidDevPort,
  };
}
