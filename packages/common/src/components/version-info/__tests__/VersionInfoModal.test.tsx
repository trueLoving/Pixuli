import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VersionInfoModal from '../VersionInfoModal';
import type { VersionInfo } from '../types';

// Mock useEscapeKey hook
vi.mock('../../hooks', () => ({
  useEscapeKey: vi.fn((callback: () => void, enabled: boolean) => {
    if (enabled) {
      // 模拟 ESC 键按下
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          callback();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }),
}));

// Mock translation function
const mockTranslate = (key: string): string => {
  const translations: Record<string, string> = {
    'version.title': '版本信息',
    'version.subtitle': '查看应用和依赖版本详情',
    'version.tabs.basic': '基本信息',
    'version.tabs.frameworks': '开发框架',
    'version.tabs.dependencies': '依赖项',
    'version.basic.name': '应用名称',
    'version.basic.version': '版本号',
    'version.basic.buildTime': '构建时间',
    'version.basic.branch': 'Git 分支',
    'version.basic.description': '应用描述',
    'version.dependencies.note': '运行时依赖',
    'version.dependencies.description':
      '此处显示应用运行时所需的依赖包及其版本。',
    'version.footer.generated': '生成时间',
    'common.close': '关闭',
  };
  return translations[key] || key;
};

// Mock version info data
const mockVersionInfo: VersionInfo = {
  version: '1.0.0',
  name: 'Pixuli',
  description: 'Professional Image Management and Storage Solution',
  buildTime: '2024-01-01T00:00:00.000Z',
  buildTimestamp: 1704067200000,
  frameworks: {
    react: '^19.1.0',
    'react-dom': '^19.1.0',
    vite: '^5.0.0',
    typescript: '^5.0.0',
    tailwindcss: '^3.4.0',
    electron: '^28.0.0',
  },
  dependencies: {
    'lucide-react': '^0.263.1',
    'react-i18next': '^14.0.0',
    zustand: '^4.4.1',
    'react-dropzone': '^14.2.3',
    'react-hot-toast': '^2.6.0',
    octokit: '^3.0.0',
    'pixuli-wasm': '^1.0.0',
  },
  environment: {
    node: 'v20.0.0',
    platform: 'darwin',
    arch: 'x64',
  },
  git: {
    commit: 'abc123def456',
    branch: 'main',
  },
};

describe('VersionInfoModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    t: mockTranslate,
    versionInfo: mockVersionInfo,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('当 isOpen 为 false 时不应该渲染', () => {
      const { container } = render(
        <VersionInfoModal {...defaultProps} isOpen={false} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('当 isOpen 为 true 时应该渲染模态框', () => {
      const { container } = render(<VersionInfoModal {...defaultProps} />);
      const overlay = container.querySelector('.version-info-modal-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('应该显示标题和副标题', () => {
      render(<VersionInfoModal {...defaultProps} />);
      expect(screen.getByText('版本信息')).toBeInTheDocument();
      expect(screen.getByText('查看应用和依赖版本详情')).toBeInTheDocument();
    });

    it('应该显示三个标签页', () => {
      render(<VersionInfoModal {...defaultProps} />);
      expect(screen.getByText('基本信息')).toBeInTheDocument();
      expect(screen.getByText('开发框架')).toBeInTheDocument();
      expect(screen.getByText('依赖项')).toBeInTheDocument();
    });

    it('默认应该显示基本信息标签页', () => {
      render(<VersionInfoModal {...defaultProps} />);
      expect(screen.getByText('应用名称')).toBeInTheDocument();
      expect(screen.getByText('Pixuli')).toBeInTheDocument();
      expect(screen.getByText('版本号')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  describe('基本信息标签页', () => {
    it('应该显示所有基本信息字段', () => {
      render(<VersionInfoModal {...defaultProps} />);
      expect(screen.getByText('应用名称')).toBeInTheDocument();
      expect(screen.getByText('Pixuli')).toBeInTheDocument();
      expect(screen.getByText('版本号')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('构建时间')).toBeInTheDocument();
      expect(screen.getByText('Git 分支')).toBeInTheDocument();
      expect(screen.getByText('main')).toBeInTheDocument();
      expect(screen.getByText('Commit')).toBeInTheDocument();
      expect(screen.getByText('abc123def456')).toBeInTheDocument();
      expect(screen.getByText('应用描述')).toBeInTheDocument();
      expect(
        screen.getByText('Professional Image Management and Storage Solution'),
      ).toBeInTheDocument();
    });

    it('应该正确格式化构建时间', () => {
      render(<VersionInfoModal {...defaultProps} />);
      const buildTimeElement = screen
        .getByText('构建时间')
        .closest('.version-info-modal-card')
        ?.querySelector('.version-info-modal-card-value');
      expect(buildTimeElement).toBeInTheDocument();
      expect(buildTimeElement?.textContent).toContain('2024');
    });
  });

  describe('开发框架标签页', () => {
    it('应该能够切换到开发框架标签页', () => {
      render(<VersionInfoModal {...defaultProps} />);
      const frameworksTab = screen.getByText('开发框架');
      fireEvent.click(frameworksTab);

      // 应该显示框架信息
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('react-dom')).toBeInTheDocument();
      expect(screen.getByText('vite')).toBeInTheDocument();
      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(screen.getByText('tailwindcss')).toBeInTheDocument();
      expect(screen.getByText('electron')).toBeInTheDocument();
    });

    it('应该正确格式化版本号（移除 ^ 和 ~）', () => {
      render(<VersionInfoModal {...defaultProps} />);
      const frameworksTab = screen.getByText('开发框架');
      fireEvent.click(frameworksTab);

      // 检查版本号格式（应该移除 ^）
      const reactVersion = screen
        .getByText('react')
        .closest('.version-info-modal-framework-item')
        ?.querySelector('.version-info-modal-framework-version');
      expect(reactVersion?.textContent).toBe('19.1.0');
    });
  });

  describe('依赖项标签页', () => {
    it('应该能够切换到依赖项标签页', () => {
      render(<VersionInfoModal {...defaultProps} />);
      const dependenciesTab = screen.getByText('依赖项');
      fireEvent.click(dependenciesTab);

      // 应该显示依赖项信息
      expect(screen.getByText('lucide-react')).toBeInTheDocument();
      expect(screen.getByText('react-i18next')).toBeInTheDocument();
      expect(screen.getByText('zustand')).toBeInTheDocument();
      expect(screen.getByText('react-dropzone')).toBeInTheDocument();
      expect(screen.getByText('react-hot-toast')).toBeInTheDocument();
    });

    it('应该显示依赖项说明', () => {
      render(<VersionInfoModal {...defaultProps} />);
      const dependenciesTab = screen.getByText('依赖项');
      fireEvent.click(dependenciesTab);

      expect(screen.getByText('运行时依赖')).toBeInTheDocument();
      expect(
        screen.getByText('此处显示应用运行时所需的依赖包及其版本。'),
      ).toBeInTheDocument();
    });

    it('应该正确格式化依赖版本号', () => {
      render(<VersionInfoModal {...defaultProps} />);
      const dependenciesTab = screen.getByText('依赖项');
      fireEvent.click(dependenciesTab);

      // 检查版本号格式（应该移除 ^）
      const lucideVersion = screen
        .getByText('lucide-react')
        .closest('.version-info-modal-dependency-item')
        ?.querySelector('.version-info-modal-dependency-version');
      expect(lucideVersion?.textContent).toBe('0.263.1');
    });
  });

  describe('交互功能', () => {
    it('应该能够切换标签页', () => {
      render(<VersionInfoModal {...defaultProps} />);

      // 初始显示基本信息
      expect(screen.getByText('应用名称')).toBeInTheDocument();

      // 切换到开发框架
      const frameworksTab = screen.getByText('开发框架');
      fireEvent.click(frameworksTab);
      expect(screen.getByText('react')).toBeInTheDocument();

      // 切换到依赖项
      const dependenciesTab = screen.getByText('依赖项');
      fireEvent.click(dependenciesTab);
      expect(screen.getByText('lucide-react')).toBeInTheDocument();

      // 切换回基本信息
      const basicTab = screen.getByText('基本信息');
      fireEvent.click(basicTab);
      expect(screen.getByText('应用名称')).toBeInTheDocument();
    });

    it('点击关闭按钮应该调用 onClose', () => {
      const onClose = vi.fn();
      render(<VersionInfoModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getAllByText('关闭')[0];
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('点击遮罩层应该调用 onClose', () => {
      const onClose = vi.fn();
      const { container } = render(
        <VersionInfoModal {...defaultProps} onClose={onClose} />,
      );

      const overlay = container.querySelector('.version-info-modal-overlay');
      expect(overlay).toBeInTheDocument();

      // 点击遮罩层（但不是内容区域）
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('点击内容区域不应该调用 onClose', () => {
      const onClose = vi.fn();
      const { container } = render(
        <VersionInfoModal {...defaultProps} onClose={onClose} />,
      );

      const content = container.querySelector('.version-info-modal-content');
      expect(content).toBeInTheDocument();

      if (content) {
        fireEvent.click(content);
        expect(onClose).not.toHaveBeenCalled();
      }
    });

    it('按 ESC 键应该调用 onClose', async () => {
      const onClose = vi.fn();
      render(<VersionInfoModal {...defaultProps} onClose={onClose} />);

      // 模拟 ESC 键按下
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('可选字段处理', () => {
    it('应该能够处理没有 electron 框架的情况', () => {
      const versionInfoWithoutElectron: VersionInfo = {
        ...mockVersionInfo,
        frameworks: {
          react: '^19.1.0',
          'react-dom': '^19.1.0',
          vite: '^5.0.0',
          typescript: '^5.0.0',
          tailwindcss: '^3.4.0',
        },
      };

      render(
        <VersionInfoModal
          {...defaultProps}
          versionInfo={versionInfoWithoutElectron}
        />,
      );

      const frameworksTab = screen.getByText('开发框架');
      fireEvent.click(frameworksTab);

      // electron 不应该显示
      expect(screen.queryByText('electron')).not.toBeInTheDocument();
    });

    it('应该能够处理没有 environment 的情况', () => {
      const versionInfoWithoutEnv: VersionInfo = {
        ...mockVersionInfo,
        environment: undefined,
      };

      render(
        <VersionInfoModal
          {...defaultProps}
          versionInfo={versionInfoWithoutEnv}
        />,
      );

      // 组件应该正常渲染
      expect(screen.getByText('版本信息')).toBeInTheDocument();
    });

    it('应该能够处理没有可选依赖的情况', () => {
      const versionInfoWithoutOptionalDeps: VersionInfo = {
        ...mockVersionInfo,
        dependencies: {
          'lucide-react': '^0.263.1',
          'react-i18next': '^14.0.0',
          zustand: '^4.4.1',
          'react-dropzone': '^14.2.3',
          'react-hot-toast': '^2.6.0',
        },
      };

      render(
        <VersionInfoModal
          {...defaultProps}
          versionInfo={versionInfoWithoutOptionalDeps}
        />,
      );

      const dependenciesTab = screen.getByText('依赖项');
      fireEvent.click(dependenciesTab);

      // 可选依赖不应该显示
      expect(screen.queryByText('octokit')).not.toBeInTheDocument();
      expect(screen.queryByText('pixuli-wasm')).not.toBeInTheDocument();
    });
  });

  describe('版本号格式化', () => {
    it('应该移除版本号前缀的 ^ 符号', () => {
      const versionInfoWithCaret: VersionInfo = {
        ...mockVersionInfo,
        frameworks: {
          react: '^19.1.0',
          'react-dom': '^19.1.0',
          vite: '^5.0.0',
          typescript: '^5.0.0',
          tailwindcss: '^3.4.0',
        },
      };

      render(
        <VersionInfoModal
          {...defaultProps}
          versionInfo={versionInfoWithCaret}
        />,
      );

      const frameworksTab = screen.getByText('开发框架');
      fireEvent.click(frameworksTab);

      const reactVersion = screen
        .getByText('react')
        .closest('.version-info-modal-framework-item')
        ?.querySelector('.version-info-modal-framework-version');
      expect(reactVersion?.textContent).toBe('19.1.0');
    });

    it('应该移除版本号前缀的 ~ 符号', () => {
      const versionInfoWithTilde: VersionInfo = {
        ...mockVersionInfo,
        frameworks: {
          react: '~19.1.0',
          'react-dom': '~19.1.0',
          vite: '~5.0.0',
          typescript: '~5.0.0',
          tailwindcss: '~3.4.0',
        },
      };

      render(
        <VersionInfoModal
          {...defaultProps}
          versionInfo={versionInfoWithTilde}
        />,
      );

      const frameworksTab = screen.getByText('开发框架');
      fireEvent.click(frameworksTab);

      const reactVersion = screen
        .getByText('react')
        .closest('.version-info-modal-framework-item')
        ?.querySelector('.version-info-modal-framework-version');
      expect(reactVersion?.textContent).toBe('19.1.0');
    });
  });

  describe('可访问性', () => {
    it('关闭按钮应该有正确的 aria-label', () => {
      render(<VersionInfoModal {...defaultProps} />);
      const closeButton = screen.getAllByLabelText('关闭')[0];
      expect(closeButton).toBeInTheDocument();
    });
  });
});
