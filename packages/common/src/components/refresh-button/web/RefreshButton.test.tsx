import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RefreshButton from './RefreshButton.web';

describe('RefreshButton', () => {
  const mockOnRefresh = vi.fn();
  const mockTranslate = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'navigation.refresh': '刷新',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    onRefresh: mockOnRefresh,
    t: mockTranslate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('应该正确渲染按钮', () => {
      const { container } = render(<RefreshButton {...defaultProps} />);

      const button = container.querySelector('.refresh-button');
      expect(button).toBeInTheDocument();
    });

    it('应该显示刷新图标', () => {
      const { container } = render(<RefreshButton {...defaultProps} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('应该应用正确的 CSS 类名', () => {
      const { container } = render(<RefreshButton {...defaultProps} />);

      const button = container.querySelector('.refresh-button.icon-only');
      expect(button).toBeInTheDocument();
    });

    it('应该应用自定义类名', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} className="custom-class" />,
      );

      const button = container.querySelector('.refresh-button.custom-class');
      expect(button).toBeInTheDocument();
    });

    it('应该设置正确的按钮属性', () => {
      const { container } = render(<RefreshButton {...defaultProps} />);

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('title', '刷新 (F5)');
    });
  });

  describe('点击功能', () => {
    it('应该点击按钮时调用 onRefresh', () => {
      const onRefresh = vi.fn();
      const { container } = render(
        <RefreshButton {...defaultProps} onRefresh={onRefresh} />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('应该在 disabled 为 true 时不调用 onRefresh', () => {
      const onRefresh = vi.fn();
      const { container } = render(
        <RefreshButton
          {...defaultProps}
          onRefresh={onRefresh}
          disabled={true}
        />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('应该在 loading 为 true 时不调用 onRefresh', () => {
      const onRefresh = vi.fn();
      const { container } = render(
        <RefreshButton
          {...defaultProps}
          onRefresh={onRefresh}
          loading={true}
        />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      fireEvent.click(button);

      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('loading 状态', () => {
    it('应该在 loading 为 true 时禁用按钮', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} loading={true} />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      expect(button).toBeDisabled();
    });

    it('应该在 loading 为 true 时显示旋转动画', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} loading={true} />,
      );

      const icon = container.querySelector('svg.animate-spin');
      expect(icon).toBeInTheDocument();
    });

    it('应该在 loading 为 false 时不显示旋转动画', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} loading={false} />,
      );

      const icon = container.querySelector('svg.animate-spin');
      expect(icon).not.toBeInTheDocument();
    });

    it('应该在 loading 为 false 时启用按钮', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} loading={false} />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      expect(button).not.toBeDisabled();
    });
  });

  describe('disabled 状态', () => {
    it('应该在 disabled 为 true 时禁用按钮', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} disabled={true} />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      expect(button).toBeDisabled();
    });

    it('应该在 disabled 为 false 时启用按钮', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} disabled={false} />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      expect(button).not.toBeDisabled();
    });

    it('应该在 loading 和 disabled 都为 true 时禁用按钮', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} loading={true} disabled={true} />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      expect(button).toBeDisabled();
    });
  });

  describe('翻译函数', () => {
    it('应该使用传入的翻译函数', () => {
      const customTranslate = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'navigation.refresh': 'Refresh',
        };
        return translations[key] || key;
      });

      const { container } = render(
        <RefreshButton {...defaultProps} t={customTranslate} />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      expect(button).toHaveAttribute('title', 'Refresh (F5)');
      expect(customTranslate).toHaveBeenCalled();
    });

    it('应该在没有提供翻译函数时使用默认翻译', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} t={undefined} />,
      );

      const button = container.querySelector('.refresh-button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('组合场景', () => {
    it('应该在 loading 状态变化时正确更新按钮状态', () => {
      const { container, rerender } = render(
        <RefreshButton {...defaultProps} loading={false} />,
      );

      let button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      expect(button).not.toBeDisabled();

      rerender(<RefreshButton {...defaultProps} loading={true} />);

      button = container.querySelector('.refresh-button') as HTMLButtonElement;
      expect(button).toBeDisabled();

      const icon = container.querySelector('svg.animate-spin');
      expect(icon).toBeInTheDocument();
    });

    it('应该在 disabled 状态变化时正确更新按钮状态', () => {
      const { container, rerender } = render(
        <RefreshButton {...defaultProps} disabled={false} />,
      );

      let button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;
      expect(button).not.toBeDisabled();

      rerender(<RefreshButton {...defaultProps} disabled={true} />);

      button = container.querySelector('.refresh-button') as HTMLButtonElement;
      expect(button).toBeDisabled();
    });
  });

  describe('边界情况', () => {
    it('应该处理快速连续点击', () => {
      const onRefresh = vi.fn();
      const { container } = render(
        <RefreshButton {...defaultProps} onRefresh={onRefresh} />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;

      // 快速连续点击
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onRefresh).toHaveBeenCalledTimes(3);
    });

    it('应该在 loading 状态下忽略点击', () => {
      const onRefresh = vi.fn();
      const { container } = render(
        <RefreshButton
          {...defaultProps}
          onRefresh={onRefresh}
          loading={true}
        />,
      );

      const button = container.querySelector(
        '.refresh-button',
      ) as HTMLButtonElement;

      // 即使点击，也不应该调用 onRefresh（因为按钮被禁用）
      fireEvent.click(button);

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('应该处理空的 className', () => {
      const { container } = render(
        <RefreshButton {...defaultProps} className="" />,
      );

      const button = container.querySelector('.refresh-button.icon-only');
      expect(button).toBeInTheDocument();
    });
  });
});
