import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GitHubConfigModal from './GitHubConfigModal';
import type { GitHubConfig } from '../../../types/github';

// Mock toast utilities
vi.mock('../../../utils/toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Mock defaultTranslate
vi.mock('../../../locales', () => ({
  defaultTranslate: (key: string) => {
    const translations: Record<string, string> = {
      'github.config.title': 'GitHub 仓库配置',
      'github.config.username': 'GitHub 用户名',
      'github.config.repository': '仓库名称',
      'github.config.branch': '分支名称',
      'github.config.path': '图片存储路径',
      'github.config.token': 'GitHub Token',
      'github.config.import': '↑ 导入',
      'github.config.export': '导出',
      'github.config.clearConfig': '清除配置',
      'github.config.saveConfig': '保存配置',
      'github.config.usernamePlaceholder': '您的 GitHub 用户名或组织名',
      'github.config.repositoryPlaceholder': '用于存储图片的仓库名称',
      'github.config.branchPlaceholder': '通常为 main 或 master',
      'github.config.pathPlaceholder': '仓库中存储图片的文件夹路径',
      'github.config.tokenPlaceholder': 'ghp_xxxxxxxxxxxxxxxxxxxx',
      'github.config.tokenDescription':
        '需要 repo 权限的 Personal Access Token',
      'github.help.title': '配置帮助',
      'storage.configuration': '配置',
      'common.cancel': '取消',
      'messages.configSaved': 'GitHub 配置已成功保存！',
      'messages.configCleared': 'GitHub 配置已成功清除！',
      'messages.configExported': 'GitHub 配置已成功导出！',
      'messages.configImported': 'GitHub 配置已成功导入！',
      'messages.saveFailed': '保存配置失败',
      'messages.clearFailed': '清除配置失败',
      'messages.exportFailed': '导出配置失败',
      'messages.importFailed': '导入配置失败',
      'messages.invalidFormat': '配置文件格式不正确',
      'messages.noConfigToExport': '没有可导出的配置',
    };
    return translations[key] || key;
  },
}));

describe('GitHubConfigModal', () => {
  const mockGitHubConfig: GitHubConfig = {
    owner: 'test-owner',
    repo: 'test-repo',
    branch: 'main',
    token: 'ghp_testtoken123456789',
    path: 'images',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSaveConfig: vi.fn(),
    onClearConfig: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 document.body.style
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // 清理事件监听器
    document.removeEventListener('keydown', vi.fn());
    document.body.style.overflow = '';
  });

  describe('渲染', () => {
    it('应该在 isOpen 为 true 时渲染组件', () => {
      const { container } = render(<GitHubConfigModal {...defaultProps} />);

      const modal = container.querySelector('.github-config-modal-overlay');
      expect(modal).toBeInTheDocument();
    });

    it('应该在 isOpen 为 false 时不渲染组件', () => {
      const { container } = render(
        <GitHubConfigModal {...defaultProps} isOpen={false} />,
      );

      const modal = container.querySelector('.github-config-modal-overlay');
      expect(modal).not.toBeInTheDocument();
    });

    it('应该显示标题', () => {
      render(<GitHubConfigModal {...defaultProps} />);

      expect(screen.getByText('GitHub 仓库配置')).toBeInTheDocument();
    });

    it('应该显示所有表单字段', () => {
      render(<GitHubConfigModal {...defaultProps} />);

      expect(
        screen.getByPlaceholderText('您的 GitHub 用户名或组织名'),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('用于存储图片的仓库名称'),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('通常为 main 或 master'),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('仓库中存储图片的文件夹路径'),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx'),
      ).toBeInTheDocument();
    });
  });

  describe('表单输入', () => {
    it('应该更新表单字段值', () => {
      render(<GitHubConfigModal {...defaultProps} />);

      const ownerInput =
        screen.getByPlaceholderText('您的 GitHub 用户名或组织名');
      fireEvent.change(ownerInput, { target: { value: 'new-owner' } });

      expect(ownerInput).toHaveValue('new-owner');
    });

    it('应该在打开时填充现有配置', () => {
      render(
        <GitHubConfigModal {...defaultProps} githubConfig={mockGitHubConfig} />,
      );

      expect(screen.getByDisplayValue('test-owner')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test-repo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('main')).toBeInTheDocument();
      expect(screen.getByDisplayValue('images')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('ghp_testtoken123456789'),
      ).toBeInTheDocument();
    });

    it('应该在配置被清除后重置表单', () => {
      const { rerender } = render(
        <GitHubConfigModal {...defaultProps} githubConfig={mockGitHubConfig} />,
      );

      expect(screen.getByDisplayValue('test-owner')).toBeInTheDocument();

      rerender(<GitHubConfigModal {...defaultProps} githubConfig={null} />);

      expect(screen.queryByDisplayValue('test-owner')).not.toBeInTheDocument();
    });
  });

  describe('保存配置', () => {
    it('应该在提交表单时调用 onSaveConfig', async () => {
      const onSaveConfig = vi.fn();
      render(
        <GitHubConfigModal {...defaultProps} onSaveConfig={onSaveConfig} />,
      );

      // 填写表单
      fireEvent.change(
        screen.getByPlaceholderText('您的 GitHub 用户名或组织名'),
        {
          target: { value: 'test-owner' },
        },
      );
      fireEvent.change(screen.getByPlaceholderText('用于存储图片的仓库名称'), {
        target: { value: 'test-repo' },
      });
      fireEvent.change(screen.getByPlaceholderText('通常为 main 或 master'), {
        target: { value: 'main' },
      });
      fireEvent.change(
        screen.getByPlaceholderText('仓库中存储图片的文件夹路径'),
        {
          target: { value: 'images' },
        },
      );
      fireEvent.change(
        screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx'),
        {
          target: { value: 'ghp_testtoken123456789' },
        },
      );

      // 提交表单
      const submitButton = screen.getByText('保存配置');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSaveConfig).toHaveBeenCalledWith({
          owner: 'test-owner',
          repo: 'test-repo',
          branch: 'main',
          token: 'ghp_testtoken123456789',
          path: 'images',
        });
      });
    });

    it('应该在保存成功后关闭模态框', async () => {
      const onClose = vi.fn();
      render(<GitHubConfigModal {...defaultProps} onClose={onClose} />);

      // 填写并提交表单
      fireEvent.change(
        screen.getByPlaceholderText('您的 GitHub 用户名或组织名'),
        {
          target: { value: 'test-owner' },
        },
      );
      fireEvent.change(screen.getByPlaceholderText('用于存储图片的仓库名称'), {
        target: { value: 'test-repo' },
      });
      fireEvent.change(screen.getByPlaceholderText('通常为 main 或 master'), {
        target: { value: 'main' },
      });
      fireEvent.change(
        screen.getByPlaceholderText('仓库中存储图片的文件夹路径'),
        {
          target: { value: 'images' },
        },
      );
      fireEvent.change(
        screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx'),
        {
          target: { value: 'ghp_testtoken123456789' },
        },
      );

      const submitButton = screen.getByText('保存配置');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('应该在保存失败时显示错误消息', async () => {
      const onSaveConfig = vi.fn(() => {
        throw new Error('保存失败');
      });
      const { showError } = await import('../../../utils/toast');

      render(
        <GitHubConfigModal {...defaultProps} onSaveConfig={onSaveConfig} />,
      );

      // 填写并提交表单
      fireEvent.change(
        screen.getByPlaceholderText('您的 GitHub 用户名或组织名'),
        {
          target: { value: 'test-owner' },
        },
      );
      fireEvent.change(screen.getByPlaceholderText('用于存储图片的仓库名称'), {
        target: { value: 'test-repo' },
      });
      fireEvent.change(screen.getByPlaceholderText('通常为 main 或 master'), {
        target: { value: 'main' },
      });
      fireEvent.change(
        screen.getByPlaceholderText('仓库中存储图片的文件夹路径'),
        {
          target: { value: 'images' },
        },
      );
      fireEvent.change(
        screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx'),
        {
          target: { value: 'ghp_testtoken123456789' },
        },
      );

      const submitButton = screen.getByText('保存配置');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
      });
    });
  });

  describe('清除配置', () => {
    it('应该在有配置时显示清除按钮', () => {
      render(
        <GitHubConfigModal {...defaultProps} githubConfig={mockGitHubConfig} />,
      );

      expect(screen.getByText('清除配置')).toBeInTheDocument();
    });

    it('应该在没有配置时不显示清除按钮', () => {
      render(<GitHubConfigModal {...defaultProps} githubConfig={null} />);

      expect(screen.queryByText('清除配置')).not.toBeInTheDocument();
    });

    it('应该在点击清除按钮时调用 onClearConfig', async () => {
      const onClearConfig = vi.fn();
      render(
        <GitHubConfigModal
          {...defaultProps}
          githubConfig={mockGitHubConfig}
          onClearConfig={onClearConfig}
        />,
      );

      const clearButton = screen.getByText('清除配置');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(onClearConfig).toHaveBeenCalled();
      });
    });

    it('应该在清除成功后关闭模态框', async () => {
      const onClose = vi.fn();
      render(
        <GitHubConfigModal
          {...defaultProps}
          githubConfig={mockGitHubConfig}
          onClose={onClose}
        />,
      );

      const clearButton = screen.getByText('清除配置');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('导入/导出配置', () => {
    it('应该在有配置时显示导出按钮', () => {
      render(
        <GitHubConfigModal {...defaultProps} githubConfig={mockGitHubConfig} />,
      );

      expect(screen.getByText('导出')).toBeInTheDocument();
    });

    it('应该在没有配置时不显示导出按钮', () => {
      render(<GitHubConfigModal {...defaultProps} githubConfig={null} />);

      expect(screen.queryByText('导出')).not.toBeInTheDocument();
    });

    it('应该显示导入按钮', () => {
      render(<GitHubConfigModal {...defaultProps} />);

      expect(screen.getByText('↑ 导入')).toBeInTheDocument();
    });

    it('应该在导出配置时创建下载链接', async () => {
      // Mock URL methods - 在测试环境中可能需要 mock window.URL
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
      const mockRevokeObjectURL = vi.fn();

      // 如果 URL.createObjectURL 不存在，则创建它
      if (!global.URL.createObjectURL) {
        global.URL.createObjectURL = mockCreateObjectURL;
        global.URL.revokeObjectURL = mockRevokeObjectURL;
      } else {
        vi.spyOn(global.URL, 'createObjectURL').mockReturnValue(
          'blob:test-url',
        );
        vi.spyOn(global.URL, 'revokeObjectURL');
      }

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      // Mock click method and createElement
      const mockClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockImplementation((tagName: string) => {
          const element = originalCreateElement(tagName);
          if (tagName === 'a') {
            element.click = mockClick;
          }
          return element;
        });

      render(
        <GitHubConfigModal {...defaultProps} githubConfig={mockGitHubConfig} />,
      );

      const exportButton = screen.getByText('导出');
      fireEvent.click(exportButton);

      await waitFor(() => {
        if (global.URL.createObjectURL) {
          expect(global.URL.createObjectURL).toHaveBeenCalled();
        } else {
          expect(mockCreateObjectURL).toHaveBeenCalled();
        }
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(mockClick).toHaveBeenCalled();
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
        if (global.URL.revokeObjectURL) {
          expect(global.URL.revokeObjectURL).toHaveBeenCalled();
        } else {
          expect(mockRevokeObjectURL).toHaveBeenCalled();
        }
      });

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('应该在导入配置时更新表单数据', async () => {
      const validConfig = {
        version: '1.0',
        platform: 'web',
        timestamp: new Date().toISOString(),
        config: mockGitHubConfig,
      };

      const file = new File([JSON.stringify(validConfig)], 'config.json', {
        type: 'application/json',
      });

      // Mock FileReader
      let onloadHandler: ((e: any) => void) | null = null;
      const mockFileReader = {
        readAsText: vi.fn(function (this: any, file: File) {
          // 模拟异步读取
          setTimeout(() => {
            if (onloadHandler) {
              onloadHandler({
                target: { result: JSON.stringify(validConfig) },
              });
            }
          }, 0);
        }),
        result: JSON.stringify(validConfig),
        onload: null as ((e: any) => void) | null,
      };

      Object.defineProperty(mockFileReader, 'onload', {
        get: () => onloadHandler,
        set: (handler: ((e: any) => void) | null) => {
          onloadHandler = handler;
        },
      });

      const FileReaderSpy = vi
        .spyOn(window, 'FileReader')
        .mockImplementation(() => mockFileReader as any);

      // Mock document.createElement to capture file input creation
      let fileInput: HTMLInputElement | null = null;
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockImplementation((tagName: string) => {
          const element = originalCreateElement(tagName);
          if (tagName === 'input') {
            const input = element as HTMLInputElement;
            input.type = 'file';
            fileInput = input;
            Object.defineProperty(fileInput, 'files', {
              value: [file],
              writable: false,
              configurable: true,
            });
          }
          return element;
        });

      render(<GitHubConfigModal {...defaultProps} />);

      const importButton = screen.getByText('↑ 导入');
      fireEvent.click(importButton);

      // 等待文件输入被创建并触发 change 事件
      await waitFor(
        () => {
          expect(fileInput).toBeTruthy();
          if (fileInput && fileInput.onchange) {
            fireEvent.change(fileInput, { target: { files: [file] } });
          }
        },
        { timeout: 1000 },
      );

      await waitFor(
        () => {
          expect(screen.getByDisplayValue('test-owner')).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      FileReaderSpy.mockRestore();
      createElementSpy.mockRestore();
    });

    it('应该在导入无效配置时显示错误', async () => {
      const invalidConfig = { invalid: 'config' };
      const { showError } = await import('../../../utils/toast');

      let onloadHandler: ((e: any) => void) | null = null;
      const mockFileReader = {
        readAsText: vi.fn(function (this: any, file: File) {
          setTimeout(() => {
            if (onloadHandler) {
              onloadHandler({
                target: { result: JSON.stringify(invalidConfig) },
              });
            }
          }, 0);
        }),
        result: JSON.stringify(invalidConfig),
        onload: null as ((e: any) => void) | null,
      };

      Object.defineProperty(mockFileReader, 'onload', {
        get: () => onloadHandler,
        set: (handler: ((e: any) => void) | null) => {
          onloadHandler = handler;
        },
      });

      const FileReaderSpy = vi
        .spyOn(window, 'FileReader')
        .mockImplementation(() => mockFileReader as any);

      // Mock document.createElement to capture file input creation
      let fileInput: HTMLInputElement | null = null;
      const file = new File([JSON.stringify(invalidConfig)], 'config.json', {
        type: 'application/json',
      });

      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockImplementation((tagName: string) => {
          const element = originalCreateElement(tagName);
          if (tagName === 'input') {
            const input = element as HTMLInputElement;
            input.type = 'file';
            fileInput = input;
            Object.defineProperty(fileInput, 'files', {
              value: [file],
              writable: false,
              configurable: true,
            });
          }
          return element;
        });

      render(<GitHubConfigModal {...defaultProps} />);

      const importButton = screen.getByText('↑ 导入');
      fireEvent.click(importButton);

      // 等待文件输入被创建并触发 change 事件
      await waitFor(
        () => {
          expect(fileInput).toBeTruthy();
          if (fileInput && fileInput.onchange) {
            fireEvent.change(fileInput, { target: { files: [file] } });
          }
        },
        { timeout: 1000 },
      );

      await waitFor(
        () => {
          expect(showError).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );

      FileReaderSpy.mockRestore();
      createElementSpy.mockRestore();
    });
  });

  describe('关闭功能', () => {
    it('应该点击关闭按钮时调用 onClose', () => {
      const onClose = vi.fn();
      const { container } = render(
        <GitHubConfigModal {...defaultProps} onClose={onClose} />,
      );

      const closeButton = container.querySelector('.github-config-modal-close');
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('应该点击背景遮罩时调用 onClose', () => {
      const onClose = vi.fn();
      const { container } = render(
        <GitHubConfigModal {...defaultProps} onClose={onClose} />,
      );

      const overlay = container.querySelector('.github-config-modal-overlay');
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('应该按 ESC 键时调用 onClose', async () => {
      const onClose = vi.fn();
      render(<GitHubConfigModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('应该点击取消按钮时调用 onClose', () => {
      const onClose = vi.fn();
      render(<GitHubConfigModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('背景滚动控制', () => {
    it('应该在打开时阻止背景滚动', () => {
      render(<GitHubConfigModal {...defaultProps} isOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('应该在关闭时恢复背景滚动', () => {
      const { rerender } = render(
        <GitHubConfigModal {...defaultProps} isOpen={true} />,
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<GitHubConfigModal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('翻译函数', () => {
    it('应该使用传入的翻译函数', () => {
      const customTranslate = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'github.config.title': 'GitHub Configuration',
          'github.config.saveConfig': 'Save Configuration',
        };
        return translations[key] || key;
      });

      render(<GitHubConfigModal {...defaultProps} t={customTranslate} />);

      expect(customTranslate).toHaveBeenCalled();
    });

    it('应该在没有提供翻译函数时使用默认翻译', () => {
      render(<GitHubConfigModal {...defaultProps} t={undefined} />);

      const title = screen.getAllByText('GitHub 仓库配置')[0];
      expect(title).toBeInTheDocument();
    });
  });

  describe('平台支持', () => {
    it('应该在 platform 为 web 时正常工作', () => {
      render(<GitHubConfigModal {...defaultProps} platform="web" />);

      const title = screen.getAllByText('GitHub 仓库配置')[0];
      expect(title).toBeInTheDocument();
    });

    it('应该在 platform 为 desktop 时正常工作', () => {
      render(<GitHubConfigModal {...defaultProps} platform="desktop" />);

      const title = screen.getAllByText('GitHub 仓库配置')[0];
      expect(title).toBeInTheDocument();
    });
  });
});
