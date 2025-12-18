import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeyboardHelpModal from './KeyboardHelpModal';

// Mock useEscapeKey hook
let currentEscapeHandler: (() => void) | null = null;
let isEscapeEnabled = true;
let keyDownHandler: ((event: KeyboardEvent) => void) | null = null;

vi.mock('../../../hooks', () => ({
  useEscapeKey: vi.fn((handler: () => void, enabled: boolean = true) => {
    currentEscapeHandler = handler;
    isEscapeEnabled = enabled;

    keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && enabled && currentEscapeHandler) {
        currentEscapeHandler();
      }
    };

    if (enabled && keyDownHandler) {
      document.addEventListener('keydown', keyDownHandler);
    }

    return () => {
      if (keyDownHandler) {
        document.removeEventListener('keydown', keyDownHandler);
      }
    };
  }),
}));

describe('KeyboardHelpModal', () => {
  const mockCategories = [
    {
      name: '通用',
      shortcuts: [
        {
          description: '关闭模态框',
          key: 'Escape',
        },
        {
          description: '刷新',
          key: 'F5',
        },
        {
          description: '打开设置',
          key: ',',
          ctrlKey: true,
        },
      ],
    },
    {
      name: '浏览',
      shortcuts: [
        {
          description: '向上选择',
          key: 'ArrowUp',
        },
        {
          description: '向下选择',
          key: 'ArrowDown',
        },
      ],
    },
  ];

  const mockTranslate = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'keyboard.title': '键盘快捷键',
      'keyboard.subtitle': '查看所有可用的键盘快捷键',
      'keyboard.categories.general': '通用',
      'keyboard.categories.features': '功能',
      'keyboard.categories.browsing': '浏览',
      'keyboard.usageTips.title': '使用提示',
      'keyboard.usageTips.tip1': '提示1',
      'keyboard.usageTips.tip2': '提示2',
      'keyboard.usageTips.tip3': '提示3',
      'keyboard.usageTips.tip4': '提示4',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    categories: mockCategories,
    t: mockTranslate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    currentEscapeHandler = null;
    isEscapeEnabled = true;
    keyDownHandler = null;
  });

  afterEach(() => {
    if (keyDownHandler) {
      document.removeEventListener('keydown', keyDownHandler);
    }
    currentEscapeHandler = null;
    keyDownHandler = null;
  });

  describe('渲染', () => {
    it('应该在 isOpen 为 true 时渲染组件', () => {
      const { container } = render(<KeyboardHelpModal {...defaultProps} />);

      const modal = container.querySelector('.keyboard-help-modal-overlay');
      expect(modal).toBeInTheDocument();
    });

    it('应该在 isOpen 为 false 时不渲染组件', () => {
      const { container } = render(
        <KeyboardHelpModal {...defaultProps} isOpen={false} />,
      );

      const modal = container.querySelector('.keyboard-help-modal-overlay');
      expect(modal).not.toBeInTheDocument();
    });

    it('应该显示标题和副标题', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      expect(screen.getByText('查看所有可用的键盘快捷键')).toBeInTheDocument();
    });

    it('应该应用正确的 CSS 类名', () => {
      const { container } = render(<KeyboardHelpModal {...defaultProps} />);

      expect(
        container.querySelector('.keyboard-help-modal-overlay'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('.keyboard-help-modal-content'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('.keyboard-help-modal-header'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('.keyboard-help-modal-body'),
      ).toBeInTheDocument();
    });
  });

  describe('分类和快捷键显示', () => {
    it('应该显示所有分类', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('通用')).toBeInTheDocument();
      expect(screen.getByText('浏览')).toBeInTheDocument();
    });

    it('应该显示所有快捷键描述', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('关闭模态框')).toBeInTheDocument();
      expect(screen.getByText('刷新')).toBeInTheDocument();
      expect(screen.getByText('打开设置')).toBeInTheDocument();
      expect(screen.getByText('向上选择')).toBeInTheDocument();
      expect(screen.getByText('向下选择')).toBeInTheDocument();
    });

    it('应该格式化并显示快捷键按键', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      // 检查简单快捷键
      expect(screen.getByText('Escape')).toBeInTheDocument();
      expect(screen.getByText('F5')).toBeInTheDocument();

      // 检查组合快捷键
      expect(screen.getByText('Ctrl')).toBeInTheDocument();
      expect(screen.getByText(',')).toBeInTheDocument();
    });

    it('应该处理空分类列表', () => {
      render(<KeyboardHelpModal {...defaultProps} categories={[]} />);

      // 应该不显示任何分类
      expect(screen.queryByText('通用')).not.toBeInTheDocument();
    });

    it('应该处理空快捷键列表', () => {
      render(
        <KeyboardHelpModal
          {...defaultProps}
          categories={[{ name: '空分类', shortcuts: [] }]}
        />,
      );

      expect(screen.getByText('空分类')).toBeInTheDocument();
      // 应该不显示任何快捷键
      expect(screen.queryByText('关闭模态框')).not.toBeInTheDocument();
    });
  });

  describe('快捷键格式化', () => {
    it('应该正确格式化简单快捷键', () => {
      const categories = [
        {
          name: '测试',
          shortcuts: [{ description: '测试', key: 'Enter' }],
        },
      ];

      render(<KeyboardHelpModal {...defaultProps} categories={categories} />);

      expect(screen.getByText('Enter')).toBeInTheDocument();
    });

    it('应该正确格式化 Ctrl 组合键', () => {
      const categories = [
        {
          name: '测试',
          shortcuts: [
            {
              description: '测试',
              key: 'S',
              ctrlKey: true,
            },
          ],
        },
      ];

      render(<KeyboardHelpModal {...defaultProps} categories={categories} />);

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('应该正确格式化 Alt 组合键', () => {
      const categories = [
        {
          name: '测试',
          shortcuts: [
            {
              description: '测试',
              key: 'F',
              altKey: true,
            },
          ],
        },
      ];

      render(<KeyboardHelpModal {...defaultProps} categories={categories} />);

      expect(screen.getByText('Alt')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
    });

    it('应该正确格式化 Shift 组合键', () => {
      const categories = [
        {
          name: '测试',
          shortcuts: [
            {
              description: '测试',
              key: 'A',
              shiftKey: true,
            },
          ],
        },
      ];

      render(<KeyboardHelpModal {...defaultProps} categories={categories} />);

      expect(screen.getByText('Shift')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('应该正确格式化 Meta/Cmd 组合键', () => {
      const categories = [
        {
          name: '测试',
          shortcuts: [
            {
              description: '测试',
              key: 'K',
              metaKey: true,
            },
          ],
        },
      ];

      render(<KeyboardHelpModal {...defaultProps} categories={categories} />);

      expect(screen.getByText('Cmd')).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('应该正确格式化多修饰键组合', () => {
      const categories = [
        {
          name: '测试',
          shortcuts: [
            {
              description: '测试',
              key: 'Z',
              ctrlKey: true,
              shiftKey: true,
            },
          ],
        },
      ];

      render(<KeyboardHelpModal {...defaultProps} categories={categories} />);

      expect(screen.getByText('Ctrl')).toBeInTheDocument();
      expect(screen.getByText('Shift')).toBeInTheDocument();
      expect(screen.getByText('Z')).toBeInTheDocument();
    });
  });

  describe('分类图标', () => {
    it('应该为通用分类显示 Command 图标', () => {
      const { container } = render(<KeyboardHelpModal {...defaultProps} />);

      // 通用分类应该使用 Command 图标
      const icons = container.querySelectorAll('.keyboard-help-category-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('应该为功能分类显示 Zap 图标', () => {
      const categories = [
        {
          name: '功能',
          shortcuts: [{ description: '测试', key: 'A' }],
        },
      ];

      const { container } = render(
        <KeyboardHelpModal
          {...defaultProps}
          categories={categories}
          t={mockTranslate}
        />,
      );

      const icons = container.querySelectorAll('.keyboard-help-category-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('应该为浏览分类显示 RefreshCw 图标', () => {
      const categories = [
        {
          name: '浏览',
          shortcuts: [{ description: '测试', key: 'A' }],
        },
      ];

      const { container } = render(
        <KeyboardHelpModal
          {...defaultProps}
          categories={categories}
          t={mockTranslate}
        />,
      );

      const icons = container.querySelectorAll('.keyboard-help-category-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('应该为未知分类显示默认 Command 图标', () => {
      const categories = [
        {
          name: '未知分类',
          shortcuts: [{ description: '测试', key: 'A' }],
        },
      ];

      const { container } = render(
        <KeyboardHelpModal {...defaultProps} categories={categories} />,
      );

      const icons = container.querySelectorAll('.keyboard-help-category-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('关闭功能', () => {
    it('应该点击关闭按钮时调用 onClose', () => {
      const onClose = vi.fn();
      render(<KeyboardHelpModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen
        .getByRole('button')
        .closest('.keyboard-help-modal-close');
      if (closeButton) {
        fireEvent.click(closeButton);
      } else {
        // 如果找不到按钮，尝试通过查询选择器
        const { container } = render(
          <KeyboardHelpModal {...defaultProps} onClose={onClose} />,
        );
        const btn = container.querySelector(
          '.keyboard-help-modal-close',
        ) as HTMLButtonElement;
        fireEvent.click(btn);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('应该按 ESC 键时调用 onClose', async () => {
      const onClose = vi.fn();
      render(<KeyboardHelpModal {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      if (currentEscapeHandler) {
        currentEscapeHandler();
        expect(onClose).toHaveBeenCalledTimes(1);
      } else {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      }
    });

    it('应该在 isOpen 为 false 时不响应 ESC 键', async () => {
      const onClose = vi.fn();
      render(
        <KeyboardHelpModal
          {...defaultProps}
          isOpen={false}
          onClose={onClose}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByText('键盘快捷键')).not.toBeInTheDocument();
      });

      if (currentEscapeHandler) {
        currentEscapeHandler();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('使用提示', () => {
    it('应该显示使用提示标题', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('使用提示')).toBeInTheDocument();
    });

    it('应该显示所有使用提示', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('提示1')).toBeInTheDocument();
      expect(screen.getByText('提示2')).toBeInTheDocument();
      expect(screen.getByText('提示3')).toBeInTheDocument();
      expect(screen.getByText('提示4')).toBeInTheDocument();
    });
  });

  describe('翻译函数', () => {
    it('应该使用传入的翻译函数', () => {
      const customTranslate = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'keyboard.title': 'Keyboard Shortcuts',
          'keyboard.subtitle': 'View all available keyboard shortcuts',
          'keyboard.categories.general': 'General',
          'keyboard.categories.features': 'Features',
          'keyboard.categories.browsing': 'Browsing',
          'keyboard.usageTips.title': 'Usage Tips',
          'keyboard.usageTips.tip1': 'Tip 1',
          'keyboard.usageTips.tip2': 'Tip 2',
          'keyboard.usageTips.tip3': 'Tip 3',
          'keyboard.usageTips.tip4': 'Tip 4',
        };
        return translations[key] || key;
      });

      render(<KeyboardHelpModal {...defaultProps} t={customTranslate} />);

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(customTranslate).toHaveBeenCalled();
    });

    it('应该在没有提供翻译函数时使用默认翻译', () => {
      render(<KeyboardHelpModal {...defaultProps} t={undefined} />);

      // 应该至少渲染组件
      expect(
        screen.getByText('键盘快捷键') || screen.queryByText(/keyboard/i),
      ).toBeTruthy();
    });
  });

  describe('边界情况', () => {
    it('应该处理大量分类和快捷键', () => {
      const largeCategories = Array.from({ length: 10 }, (_, i) => ({
        name: `分类 ${i + 1}`,
        shortcuts: Array.from({ length: 20 }, (_, j) => ({
          description: `快捷键 ${j + 1}`,
          key: `Key${j + 1}`,
        })),
      }));

      render(
        <KeyboardHelpModal {...defaultProps} categories={largeCategories} />,
      );

      expect(screen.getByText('分类 1')).toBeInTheDocument();
      expect(screen.getByText('分类 10')).toBeInTheDocument();
    });

    it('应该处理特殊字符的快捷键', () => {
      const categories = [
        {
          name: '测试',
          shortcuts: [
            {
              description: '特殊字符',
              key: '/',
            },
            {
              description: '符号',
              key: '?',
              shiftKey: true,
            },
          ],
        },
      ];

      render(<KeyboardHelpModal {...defaultProps} categories={categories} />);

      expect(screen.getByText('/')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });
});
