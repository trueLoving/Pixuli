import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    placeholder: 'Search...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 清除所有事件监听器
    document.removeEventListener('keydown', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('渲染', () => {
    it('应该正确渲染搜索框', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const searchBar = container.querySelector('.search-bar');
      expect(searchBar).toBeInTheDocument();
    });

    it('应该显示搜索图标', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const icon = container.querySelector('.search-icon');
      expect(icon).toBeInTheDocument();
    });

    it('应该显示输入框', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('应该显示占位符', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('Search...');
    });

    it('应该显示快捷键提示', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const shortcutHint = container.querySelector('.search-shortcut-hint');
      expect(shortcutHint).toBeInTheDocument();
      expect(shortcutHint).toHaveTextContent('/');
    });

    it('应该在聚焦时隐藏快捷键提示', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.focus(input);

      const shortcutHint = container.querySelector('.search-shortcut-hint');
      expect(shortcutHint).not.toBeInTheDocument();
    });

    it('应该在有值时显示清除按钮', () => {
      const { container } = render(
        <SearchBar {...defaultProps} value="test" />,
      );
      const clearButton = container.querySelector('.search-clear');
      expect(clearButton).toBeInTheDocument();
    });

    it('应该在值为空时不显示清除按钮', () => {
      const { container } = render(<SearchBar {...defaultProps} value="" />);
      const clearButton = container.querySelector('.search-clear');
      expect(clearButton).not.toBeInTheDocument();
    });

    it('应该在禁用时不显示清除按钮', () => {
      const { container } = render(
        <SearchBar {...defaultProps} value="test" disabled={true} />,
      );
      const clearButton = container.querySelector('.search-clear');
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('输入功能', () => {
    it('应该调用 onChange 当输入值改变时', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'test' } });

      expect(mockOnChange).toHaveBeenCalledWith('test');
    });

    it('应该显示当前值', () => {
      const { container } = render(
        <SearchBar {...defaultProps} value="current value" />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('current value');
    });

    it('应该在禁用时禁用输入框', () => {
      const { container } = render(
        <SearchBar {...defaultProps} disabled={true} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeDisabled();
    });
  });

  describe('清除功能', () => {
    it('应该点击清除按钮时调用 onChange 并清空值', () => {
      const { container } = render(
        <SearchBar {...defaultProps} value="test" />,
      );
      const clearButton = container.querySelector(
        '.search-clear',
      ) as HTMLButtonElement;

      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('应该点击清除按钮后聚焦输入框', () => {
      const { container } = render(
        <SearchBar {...defaultProps} value="test" />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      const clearButton = container.querySelector(
        '.search-clear',
      ) as HTMLButtonElement;

      // Mock focus
      const focusSpy = vi.spyOn(input, 'focus');

      fireEvent.click(clearButton);

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('焦点事件', () => {
    it('应该调用 onFocus 当输入框聚焦时', () => {
      const onFocus = vi.fn();
      const { container } = render(
        <SearchBar {...defaultProps} onFocus={onFocus} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.focus(input);

      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('应该调用 onBlur 当输入框失焦时', () => {
      const onBlur = vi.fn();
      const { container } = render(
        <SearchBar {...defaultProps} onBlur={onBlur} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('应该在聚焦时添加 focused 类名', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const searchBar = container.querySelector('.search-bar');
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.focus(input);

      expect(searchBar).toHaveClass('focused');
    });

    it('应该在失焦时移除 focused 类名', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const searchBar = container.querySelector('.search-bar');
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.focus(input);
      expect(searchBar).toHaveClass('focused');

      fireEvent.blur(input);
      expect(searchBar).not.toHaveClass('focused');
    });
  });

  describe('快捷键功能', () => {
    it('应该按 "/" 键时聚焦输入框', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const input = container.querySelector('input') as HTMLInputElement;

      // Mock focus
      const focusSpy = vi.spyOn(input, 'focus');

      fireEvent.keyDown(document, { key: '/' });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('应该在输入框已聚焦时不响应 "/" 键', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const input = container.querySelector('input') as HTMLInputElement;

      // 先聚焦输入框
      fireEvent.focus(input);

      const focusSpy = vi.spyOn(input, 'focus');

      // 在输入框中按 "/" 键
      fireEvent.keyDown(input, { key: '/' });

      // 不应该再次聚焦
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('应该在禁用时不响应 "/" 键', () => {
      const { container } = render(
        <SearchBar {...defaultProps} disabled={true} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;

      const focusSpy = vi.spyOn(input, 'focus');

      fireEvent.keyDown(document, { key: '/' });

      expect(focusSpy).not.toHaveBeenCalled();
    });

    it('应该在 textarea 聚焦时不响应 "/" 键', () => {
      // 创建一个 textarea 并聚焦
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const { container } = render(<SearchBar {...defaultProps} />);
      const input = container.querySelector('input') as HTMLInputElement;

      const focusSpy = vi.spyOn(input, 'focus');

      fireEvent.keyDown(document, { key: '/' });

      expect(focusSpy).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('应该阻止默认行为当按 "/" 键时', async () => {
      render(<SearchBar {...defaultProps} />);

      const preventDefault = vi.fn();
      const event = new KeyboardEvent('keydown', {
        key: '/',
        bubbles: true,
        cancelable: true,
      });
      event.preventDefault = preventDefault;

      await waitFor(() => {
        document.dispatchEvent(event);
      });

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('禁用状态', () => {
    it('应该在禁用时添加 disabled 类名', () => {
      const { container } = render(
        <SearchBar {...defaultProps} disabled={true} />,
      );
      const searchBar = container.querySelector('.search-bar');
      expect(searchBar).toHaveClass('disabled');
    });

    it('应该在禁用时不显示快捷键提示', () => {
      const { container } = render(
        <SearchBar {...defaultProps} disabled={true} />,
      );
      const shortcutHint = container.querySelector('.search-shortcut-hint');
      expect(shortcutHint).not.toBeInTheDocument();
    });

    it('应该在禁用时禁用输入框', () => {
      const { container } = render(
        <SearchBar {...defaultProps} disabled={true} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeDisabled();
    });
  });

  describe('边界情况', () => {
    it('应该处理空字符串值', () => {
      const { container } = render(<SearchBar {...defaultProps} value="" />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('应该处理长文本值', () => {
      const longText = 'a'.repeat(1000);
      const { container } = render(
        <SearchBar {...defaultProps} value={longText} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe(longText);
    });

    it('应该处理特殊字符', () => {
      const specialChars = '!@#$%^&*()';
      const { container } = render(
        <SearchBar {...defaultProps} value={specialChars} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe(specialChars);
    });

    it('应该处理快速连续输入', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 't' } });
      fireEvent.change(input, { target: { value: 'te' } });
      fireEvent.change(input, { target: { value: 'tes' } });
      fireEvent.change(input, { target: { value: 'test' } });

      expect(mockOnChange).toHaveBeenCalledTimes(4);
      expect(mockOnChange).toHaveBeenLastCalledWith('test');
    });

    it('应该处理快速连续点击清除按钮', () => {
      const { container } = render(
        <SearchBar {...defaultProps} value="test" />,
      );
      const clearButton = container.querySelector(
        '.search-clear',
      ) as HTMLButtonElement;

      fireEvent.click(clearButton);
      fireEvent.click(clearButton);
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('应该处理没有 onFocus 和 onBlur 的情况', () => {
      const { container } = render(
        <SearchBar {...defaultProps} onFocus={undefined} onBlur={undefined} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;

      // 应该不会报错
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(input).toBeInTheDocument();
    });
  });

  describe('可访问性', () => {
    it('应该为清除按钮设置 aria-label', () => {
      const { container } = render(
        <SearchBar {...defaultProps} value="test" />,
      );
      const clearButton = container.querySelector(
        '.search-clear',
      ) as HTMLButtonElement;
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
    });

    it('应该为清除按钮设置 type="button"', () => {
      const { container } = render(
        <SearchBar {...defaultProps} value="test" />,
      );
      const clearButton = container.querySelector(
        '.search-clear',
      ) as HTMLButtonElement;
      expect(clearButton).toHaveAttribute('type', 'button');
    });
  });
});
