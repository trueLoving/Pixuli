import {
  COMMON_SHORTCUTS,
  keyboardManager,
  SHORTCUT_CATEGORIES,
} from '@packages/ui/src';
import { useEffect, useState } from 'react';
import './App.css';
import { useI18n } from './i18n/useI18n';
import {
  CompressionWindowPage,
  ConversionWindowPage,
  HomePage,
  ProjectPage,
} from './pages';

function App() {
  // 检查是否在压缩窗口模式
  const [isCompressionMode] = useState(window.location.hash === '#compression');
  // 检查是否在转换窗口模式
  const [isConversionMode] = useState(window.location.hash === '#conversion');
  // 项目窗口判断与参数解析
  const [projectSourceId] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#project')) {
      const idx = hash.indexOf('?');
      const query = idx >= 0 ? new URLSearchParams(hash.slice(idx + 1)) : null;
      const id = query?.get('id');
      return id || null;
    }
    return null;
  });
  const { t } = useI18n();

  // 注册键盘快捷键（全局通用快捷键）
  useEffect(() => {
    const shortcuts = [
      // 通用快捷键
      {
        key: COMMON_SHORTCUTS.F1,
        description: t('keyboard.shortcuts.showHelp'),
        action: () => {
          // 触发键盘帮助事件
          const event = new CustomEvent('openKeyboardHelp');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.HELP,
      },

      // 功能快捷键
      {
        key: COMMON_SHORTCUTS.C,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openCompression'),
        action: () => {
          const event = new CustomEvent('openCompression');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.F,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openFormatConversion'),
        action: () => {
          const event = new CustomEvent('openFormatConversion');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.GENERAL,
      },
      {
        key: COMMON_SHORTCUTS.A,
        ctrlKey: true,
        description: t('keyboard.shortcuts.openAIAnalysis'),
        action: () => {
          const event = new CustomEvent('openAIAnalysis');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.GENERAL,
      },

      // 搜索快捷键
      {
        key: COMMON_SHORTCUTS.SLASH,
        description: t('keyboard.shortcuts.focusSearch'),
        action: () => {
          const searchInput = document.querySelector(
            'input[placeholder*="' + t('image.search.placeholder') + '"]'
          ) as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        },
        category: SHORTCUT_CATEGORIES.SEARCH,
      },
      {
        key: COMMON_SHORTCUTS.V,
        ctrlKey: true,
        description: t('keyboard.shortcuts.toggleView'),
        action: () => {
          // 触发图片浏览器的视图切换
          const event = new CustomEvent('toggleViewMode');
          window.dispatchEvent(event);
        },
        category: SHORTCUT_CATEGORIES.IMAGE_BROWSER,
      },
    ];

    keyboardManager.registerBatch(shortcuts);

    return () => {
      shortcuts.forEach(shortcut => keyboardManager.unregister(shortcut));
    };
  }, [t]);

  // 如果是转换窗口模式，只显示转换组件
  if (isConversionMode) {
    return <ConversionWindowPage />;
  }

  // 如果是压缩窗口模式，只显示压缩组件
  if (isCompressionMode) {
    return <CompressionWindowPage />;
  }

  // 主窗口：显示源管理
  if (!projectSourceId) {
    return <HomePage />;
  }

  // 项目窗口：显示图片浏览
  return <ProjectPage />;
}

export default App;
