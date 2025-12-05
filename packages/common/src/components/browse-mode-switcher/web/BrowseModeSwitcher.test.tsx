import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrowseModeSwitcher, { BrowseMode } from './BrowseModeSwitcher';

// Mock defaultTranslate
vi.mock('../../locales', () => ({
  defaultTranslate: (key: string) => {
    const translations: Record<string, string> = {
      'browseMode.file': '文件模式',
      'browseMode.slide': '幻灯片模式',
      'browseMode.wall': '照片墙模式',
      'browseMode.gallery3d': '3D画廊模式',
    };
    return translations[key] || key;
  },
}));

describe('BrowseModeSwitcher', () => {
  const defaultProps = {
    currentMode: 'file' as BrowseMode,
    onModeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 清理事件监听器
    document.removeEventListener('mousedown', vi.fn());
  });

  describe('渲染', () => {
    it('应该正确渲染组件', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const switcher = container.querySelector('.browse-mode-switcher');
      expect(switcher).toBeInTheDocument();
    });

    it('应该显示当前模式的标签', () => {
      render(<BrowseModeSwitcher {...defaultProps} currentMode="file" />);

      expect(screen.getByText('文件模式')).toBeInTheDocument();
    });

    it('应该显示幻灯片模式的标签', () => {
      render(<BrowseModeSwitcher {...defaultProps} currentMode="slide" />);

      expect(screen.getByText('幻灯片模式')).toBeInTheDocument();
    });

    it('应该应用自定义类名', () => {
      const { container } = render(
        <BrowseModeSwitcher {...defaultProps} className="custom-class" />,
      );

      const switcher = container.querySelector(
        '.browse-mode-switcher.custom-class',
      );
      expect(switcher).toBeInTheDocument();
    });

    it('应该为按钮设置正确的 title 属性', () => {
      const { container } = render(
        <BrowseModeSwitcher {...defaultProps} currentMode="file" />,
      );

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      expect(button).toHaveAttribute('title', '文件模式');
    });

    it('应该显示图标', () => {
      const { container } = render(
        <BrowseModeSwitcher {...defaultProps} currentMode="file" />,
      );

      const icon = container.querySelector('.browse-mode-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('下拉菜单交互', () => {
    it('应该默认不显示下拉菜单', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const dropdown = container.querySelector('.browse-mode-dropdown');
      expect(dropdown).not.toBeInTheDocument();
    });

    it('应该点击按钮后显示下拉菜单', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      const dropdown = container.querySelector('.browse-mode-dropdown');
      expect(dropdown).toBeInTheDocument();
    });

    it('应该再次点击按钮后隐藏下拉菜单', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;

      // 打开菜单
      fireEvent.click(button);
      expect(
        container.querySelector('.browse-mode-dropdown'),
      ).toBeInTheDocument();

      // 关闭菜单
      fireEvent.click(button);
      expect(
        container.querySelector('.browse-mode-dropdown'),
      ).not.toBeInTheDocument();
    });

    it('应该显示所有可用模式', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      // 在下拉菜单中查找
      const dropdown = container.querySelector('.browse-mode-dropdown');
      expect(dropdown).toBeInTheDocument();

      const dropdownLabels = dropdown?.querySelectorAll(
        '.browse-mode-dropdown-label',
      );
      expect(dropdownLabels).toHaveLength(2);
      expect(dropdownLabels?.[0]).toHaveTextContent('文件模式');
      expect(dropdownLabels?.[1]).toHaveTextContent('幻灯片模式');
    });

    it('应该高亮显示当前选中的模式', () => {
      const { container } = render(
        <BrowseModeSwitcher {...defaultProps} currentMode="file" />,
      );

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      // 在下拉菜单中查找激活的选项
      const dropdown = container.querySelector('.browse-mode-dropdown');
      const activeOption = dropdown?.querySelector(
        '.browse-mode-dropdown-item.active',
      );
      expect(activeOption).toBeInTheDocument();
      expect(
        activeOption?.querySelector('.browse-mode-dropdown-label'),
      ).toHaveTextContent('文件模式');
    });

    it('应该在下拉菜单打开时旋转 ChevronDown 图标', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const chevron = container.querySelector(
        '.browse-mode-chevron',
      ) as HTMLElement;
      expect(chevron).not.toHaveClass('open');

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      expect(chevron).toHaveClass('open');
    });
  });

  describe('模式切换', () => {
    it('应该在选择模式时调用 onModeChange', () => {
      const onModeChange = vi.fn();
      const { container } = render(
        <BrowseModeSwitcher
          {...defaultProps}
          currentMode="file"
          onModeChange={onModeChange}
        />,
      );

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      const slideOption = screen.getByText('幻灯片模式');
      fireEvent.click(slideOption);

      expect(onModeChange).toHaveBeenCalledTimes(1);
      expect(onModeChange).toHaveBeenCalledWith('slide');
    });

    it('应该在选择模式后关闭下拉菜单', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      const slideOption = screen.getByText('幻灯片模式');
      fireEvent.click(slideOption);

      expect(
        container.querySelector('.browse-mode-dropdown'),
      ).not.toBeInTheDocument();
    });

    it('应该在选择当前模式时也调用 onModeChange', () => {
      const onModeChange = vi.fn();
      const { container } = render(
        <BrowseModeSwitcher
          {...defaultProps}
          currentMode="file"
          onModeChange={onModeChange}
        />,
      );

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      // 在下拉菜单中找到文件模式选项
      const dropdown = container.querySelector('.browse-mode-dropdown');
      const fileOption = dropdown?.querySelector(
        '.browse-mode-dropdown-item.active',
      ) as HTMLButtonElement;
      fireEvent.click(fileOption);

      // 即使点击了当前模式，也会调用 onModeChange，但会关闭菜单
      expect(onModeChange).toHaveBeenCalledWith('file');
    });
  });

  describe('点击外部关闭', () => {
    it('应该点击外部区域后关闭下拉菜单', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      expect(
        container.querySelector('.browse-mode-dropdown'),
      ).toBeInTheDocument();

      // 模拟点击外部
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      fireEvent.mouseDown(outsideElement);

      waitFor(() => {
        expect(
          container.querySelector('.browse-mode-dropdown'),
        ).not.toBeInTheDocument();
      });

      document.body.removeChild(outsideElement);
    });

    it('应该点击组件内部时不关闭下拉菜单', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      expect(
        container.querySelector('.browse-mode-dropdown'),
      ).toBeInTheDocument();

      // 点击下拉菜单项
      const slideOption = screen.getByText('幻灯片模式');
      fireEvent.mouseDown(slideOption);

      // 菜单应该仍然打开（直到选择完成）
      expect(
        container.querySelector('.browse-mode-dropdown'),
      ).toBeInTheDocument();
    });
  });

  describe('自定义翻译函数', () => {
    it('应该使用自定义翻译函数', () => {
      const customTranslate = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'browseMode.file': 'File Mode',
          'browseMode.slide': 'Slide Show Mode',
        };
        return translations[key] || key;
      });

      render(
        <BrowseModeSwitcher
          {...defaultProps}
          currentMode="file"
          t={customTranslate}
        />,
      );

      expect(screen.getByText('File Mode')).toBeInTheDocument();
      expect(customTranslate).toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    it('应该处理当前模式不在可用模式列表中的情况', () => {
      render(
        <BrowseModeSwitcher
          {...defaultProps}
          currentMode={'wall' as BrowseMode}
        />,
      );

      // 应该回退到第一个可用模式（file）
      expect(screen.getByText('文件模式')).toBeInTheDocument();
    });

    it('应该正确处理模式切换的多次调用', () => {
      const onModeChange = vi.fn();
      const { container, rerender } = render(
        <BrowseModeSwitcher
          {...defaultProps}
          currentMode="file"
          onModeChange={onModeChange}
        />,
      );

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      const slideOption = screen.getByText('幻灯片模式');
      fireEvent.click(slideOption);

      expect(onModeChange).toHaveBeenCalledWith('slide');

      // 更新 currentMode
      rerender(
        <BrowseModeSwitcher
          {...defaultProps}
          currentMode="slide"
          onModeChange={onModeChange}
        />,
      );

      fireEvent.click(button);
      const fileOption = screen.getByText('文件模式');
      fireEvent.click(fileOption);

      expect(onModeChange).toHaveBeenCalledWith('file');
    });
  });

  describe('动画和样式', () => {
    it('应该为下拉菜单项设置动画延迟', () => {
      const { container } = render(<BrowseModeSwitcher {...defaultProps} />);

      const button = container.querySelector(
        '.browse-mode-select-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      const dropdownItems = container.querySelectorAll(
        '.browse-mode-dropdown-item',
      );

      dropdownItems.forEach((item, index) => {
        const element = item as HTMLElement;
        expect(element.style.animationDelay).toBe(`${index * 0.03}s`);
      });
    });
  });
});
