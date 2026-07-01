import type { ViteModeFlags } from './modes';

export function createManualChunks(isWeb: boolean) {
  return (id: string) => {
    if (isWeb) {
      if (
        id.includes('/node_modules/react/') ||
        id.includes('/node_modules/react-dom/') ||
        id.includes('/node_modules/scheduler/') ||
        (id.includes('react') &&
          !id.includes('react-hot-toast') &&
          !id.includes('react-dropzone') &&
          !id.includes('react-image-crop') &&
          !id.includes('react-i18next'))
      ) {
        return 'react';
      }
    } else if (id.includes('react') || id.includes('react-dom')) {
      if (
        !id.includes('react-hot-toast') &&
        !id.includes('react-dropzone') &&
        !id.includes('react-image-crop') &&
        !id.includes('react-i18next')
      ) {
        return 'react';
      }
    }
    if (id.includes('lucide-react')) {
      return 'icons';
    }
    if (
      id.includes('react-hot-toast') ||
      id.includes('react-dropzone') ||
      id.includes('react-image-crop')
    ) {
      return 'ui';
    }
    if (id.includes('zustand')) {
      return 'state';
    }
    if (id.includes('i18next') || id.includes('react-i18next')) {
      return 'i18n';
    }
    if (id.includes('octokit')) {
      return 'github';
    }
    if (id.includes('node_modules')) {
      return 'vendor';
    }
  };
}

export function createBuildOptions(flags: ViteModeFlags) {
  return {
    target: 'esnext' as const,
    minify: 'esbuild' as const,
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: createManualChunks(flags.isWeb),
      },
    },
  };
}
