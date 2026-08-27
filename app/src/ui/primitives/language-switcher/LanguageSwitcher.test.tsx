import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LanguageSwitcher, {
  Language,
  LanguageSwitcherProps,
} from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  const mockLanguages: Language[] = [
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  ];

  const defaultProps: LanguageSwitcherProps = {
    currentLanguage: 'zh-CN',
    availableLanguages: mockLanguages,
    onLanguageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('应该正确渲染组件', () => {
      const { container } = render(<LanguageSwitcher {...defaultProps} />);

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      expect(trigger).toBeInTheDocument();
    });

    it('应该显示当前语言的国旗', () => {
      render(<LanguageSwitcher {...defaultProps} currentLanguage="zh-CN" />);

      const flag = screen.getByText('🇨🇳');
      expect(flag).toBeInTheDocument();
    });

    it('应该应用自定义类名', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} className="custom-class" />,
      );

      const switcher = container.querySelector(
        '.language-switcher.custom-class',
      );
      expect(switcher).toBeInTheDocument();
    });

    it('应该使用自定义的 switchTitle', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} switchTitle="切换语言" />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      expect(trigger).toHaveAttribute('title', '切换语言');
    });
  });

  describe('下拉菜单交互', () => {
    it('应该默认不显示下拉菜单', () => {
      render(<LanguageSwitcher {...defaultProps} />);

      const dropdown = screen.queryByText('Current Language');
      expect(dropdown).not.toBeInTheDocument();
    });

    it('应该点击按钮后显示下拉菜单', () => {
      const { container } = render(<LanguageSwitcher {...defaultProps} />);

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const dropdown = screen.getByText('Current Language');
      expect(dropdown).toBeInTheDocument();
    });

    it('应该再次点击按钮后隐藏下拉菜单', () => {
      const { container } = render(<LanguageSwitcher {...defaultProps} />);

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;

      // 打开菜单
      fireEvent.click(trigger);
      expect(screen.getByText('Current Language')).toBeInTheDocument();

      // 关闭菜单
      fireEvent.click(trigger);
      expect(screen.queryByText('Current Language')).not.toBeInTheDocument();
    });

    it('应该显示所有可用语言', () => {
      const { container } = render(<LanguageSwitcher {...defaultProps} />);

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      expect(screen.getByText('简体中文')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('日本語')).toBeInTheDocument();
    });

    it('应该高亮显示当前选中的语言', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} currentLanguage="zh-CN" />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const currentOption = screen.getByText('简体中文').closest('button');
      expect(currentOption).toHaveClass('language-switcher__option--active');
    });

    it('应该使用自定义的 currentTitle', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} currentTitle="当前语言" />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      expect(screen.getByText('当前语言')).toBeInTheDocument();
    });
  });

  describe('语言切换', () => {
    it('应该在选择语言时调用 onLanguageChange', () => {
      const onLanguageChange = vi.fn();
      const { container } = render(
        <LanguageSwitcher
          {...defaultProps}
          onLanguageChange={onLanguageChange}
        />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const englishOption = screen.getByText('English');
      fireEvent.click(englishOption);

      expect(onLanguageChange).toHaveBeenCalledTimes(1);
      expect(onLanguageChange).toHaveBeenCalledWith('en-US');
    });

    it('应该在选择语言后关闭下拉菜单', () => {
      const { container } = render(<LanguageSwitcher {...defaultProps} />);

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const englishOption = screen.getByText('English');
      fireEvent.click(englishOption);

      expect(screen.queryByText('Current Language')).not.toBeInTheDocument();
    });

    it('应该在选择当前语言时也调用 onLanguageChange', () => {
      const onLanguageChange = vi.fn();
      const { container } = render(
        <LanguageSwitcher
          {...defaultProps}
          currentLanguage="zh-CN"
          onLanguageChange={onLanguageChange}
        />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const chineseOption = screen.getByText('简体中文');
      fireEvent.click(chineseOption);

      // 即使点击了当前语言，也会调用 onLanguageChange，但会关闭菜单
      expect(onLanguageChange).toHaveBeenCalledWith('zh-CN');
    });
  });

  describe('背景遮罩', () => {
    it('应该默认显示背景遮罩', () => {
      const { container } = render(<LanguageSwitcher {...defaultProps} />);

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const backdrop = container.querySelector('.language-switcher__backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    it('应该在 showBackdrop 为 false 时不显示背景遮罩', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} showBackdrop={false} />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const backdrop = container.querySelector('.language-switcher__backdrop');
      expect(backdrop).not.toBeInTheDocument();
    });

    it('应该点击背景遮罩后关闭下拉菜单', () => {
      const { container } = render(<LanguageSwitcher {...defaultProps} />);

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      expect(screen.getByText('Current Language')).toBeInTheDocument();

      const backdrop = container.querySelector(
        '.language-switcher__backdrop',
      ) as HTMLElement;
      fireEvent.click(backdrop);

      expect(screen.queryByText('Current Language')).not.toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理当前语言不在可用语言列表中的情况', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} currentLanguage="fr-FR" />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      expect(trigger).toBeInTheDocument();

      // 应该不显示国旗，因为找不到对应的语言
      const flag = screen.queryByText('🇨🇳');
      expect(flag).not.toBeInTheDocument();
    });

    it('应该处理空语言列表', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} availableLanguages={[]} />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      // 下拉菜单应该显示，但没有语言选项
      expect(screen.getByText('Current Language')).toBeInTheDocument();
      expect(screen.queryByText('简体中文')).not.toBeInTheDocument();
    });

    it('应该正确处理只有一个语言的情况', () => {
      const singleLanguage: Language[] = [
        { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
      ];

      const { container } = render(
        <LanguageSwitcher
          {...defaultProps}
          availableLanguages={singleLanguage}
          currentLanguage="zh-CN"
        />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      expect(screen.getByText('简体中文')).toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('应该为触发按钮设置正确的 title 属性', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} switchTitle="切换语言" />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      expect(trigger).toHaveAttribute('title', '切换语言');
    });

    it('应该为语言选项按钮设置正确的类型', () => {
      const { container } = render(<LanguageSwitcher {...defaultProps} />);

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const languageButtons = screen.getAllByRole('button');
      // 所有按钮都应该是 type="button"
      languageButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('图标显示', () => {
    it('应该显示 Globe 图标', () => {
      const { container } = render(<LanguageSwitcher {...defaultProps} />);

      const globeIcon = container.querySelector(
        '.language-switcher__globe-icon',
      );
      expect(globeIcon).toBeInTheDocument();
    });

    it('应该在选中语言时显示 Check 图标', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} currentLanguage="zh-CN" />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const checkIcon = screen
        .getByText('简体中文')
        .closest('button')
        ?.querySelector('.language-switcher__check-icon');
      expect(checkIcon).toBeInTheDocument();
    });

    it('应该不在未选中语言时显示 Check 图标', () => {
      const { container } = render(
        <LanguageSwitcher {...defaultProps} currentLanguage="zh-CN" />,
      );

      const trigger = container.querySelector(
        '.language-switcher__trigger',
      ) as HTMLButtonElement;
      fireEvent.click(trigger);

      const englishOption = screen.getByText('English').closest('button');
      const checkIcon = englishOption?.querySelector(
        '.language-switcher__check-icon',
      );
      expect(checkIcon).not.toBeInTheDocument();
    });
  });
});
