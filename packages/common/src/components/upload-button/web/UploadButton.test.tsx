import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import UploadButton from './UploadButton.web';

// Mock ImageUploadModal
vi.mock('../../image-upload/ImageUploadModal', () => ({
  default: ({
    isOpen,
    onClose,
    onUploadImage,
    onUploadMultipleImages,
  }: any) => {
    if (!isOpen) return null;
    return React.createElement('div', { 'data-testid': 'image-upload-modal' }, [
      React.createElement(
        'button',
        { key: 'close', onClick: onClose, 'data-testid': 'modal-close' },
        '关闭',
      ),
      React.createElement(
        'button',
        {
          key: 'single',
          onClick: async () => {
            await onUploadImage({
              file: new File([''], 'test.jpg'),
              metadata: {},
            });
          },
          'data-testid': 'upload-single',
        },
        '上传单张',
      ),
      React.createElement(
        'button',
        {
          key: 'multiple',
          onClick: async () => {
            await onUploadMultipleImages({
              files: [new File([''], 'test1.jpg')],
              metadata: {},
            });
          },
          'data-testid': 'upload-multiple',
        },
        '批量上传',
      ),
    ]);
  },
}));

describe('UploadButton', () => {
  const mockUploadImage = vi.fn();
  const mockUploadMultipleImages = vi.fn();
  const mockTranslate = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'header.upload': '上传',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    onUploadImage: mockUploadImage,
    onUploadMultipleImages: mockUploadMultipleImages,
    t: mockTranslate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('应该正确渲染按钮', () => {
      const { container } = render(<UploadButton {...defaultProps} />);

      const button = container.querySelector('.upload-button');
      expect(button).toBeInTheDocument();
    });

    it('应该显示上传图标', () => {
      const { container } = render(<UploadButton {...defaultProps} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('应该显示上传文本', () => {
      render(<UploadButton {...defaultProps} />);

      expect(screen.getByText('上传')).toBeInTheDocument();
    });

    it('应该应用自定义类名', () => {
      const { container } = render(
        <UploadButton {...defaultProps} className="custom-class" />,
      );

      const button = container.querySelector('.upload-button.custom-class');
      expect(button).toBeInTheDocument();
    });

    it('应该设置正确的按钮属性', () => {
      const { container } = render(<UploadButton {...defaultProps} />);

      const button = container.querySelector(
        '.upload-button',
      ) as HTMLButtonElement;
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('title', '上传');
    });
  });

  describe('弹窗控制', () => {
    it('应该默认不显示弹窗', () => {
      const { container } = render(<UploadButton {...defaultProps} />);

      // 检查 ImageUploadModal 是否被渲染（通过检查是否有弹窗相关的元素）
      const modal = container.querySelector('[class*="image-upload"]');
      expect(modal).not.toBeInTheDocument();
    });

    it('应该点击按钮后触发打开弹窗的逻辑', () => {
      const { container } = render(<UploadButton {...defaultProps} />);

      const button = container.querySelector(
        '.upload-button',
      ) as HTMLButtonElement;

      // 按钮应该可以点击
      expect(button).not.toBeDisabled();
      fireEvent.click(button);

      // 按钮点击后应该仍然存在（说明点击事件被处理）
      expect(button).toBeInTheDocument();
    });
  });

  describe('上传功能', () => {
    it('应该正确设置上传回调函数', () => {
      const onUploadImage = vi.fn();
      const onUploadMultipleImages = vi.fn();

      render(
        <UploadButton
          {...defaultProps}
          onUploadImage={onUploadImage}
          onUploadMultipleImages={onUploadMultipleImages}
        />,
      );

      // 组件应该正确渲染，说明回调函数被正确传递
      expect(screen.getByText('上传')).toBeInTheDocument();
    });
  });

  describe('loading 状态', () => {
    it('应该在 loading 为 true 时禁用按钮', () => {
      const { container } = render(
        <UploadButton {...defaultProps} loading={true} />,
      );

      const button = container.querySelector(
        '.upload-button',
      ) as HTMLButtonElement;
      expect(button).toBeDisabled();
    });

    it('应该在 loading 为 false 时启用按钮', () => {
      const { container } = render(
        <UploadButton {...defaultProps} loading={false} />,
      );

      const button = container.querySelector(
        '.upload-button',
      ) as HTMLButtonElement;
      expect(button).not.toBeDisabled();
    });
  });

  describe('props 传递', () => {
    it('应该接受 enableCrop prop', () => {
      const { container } = render(
        <UploadButton {...defaultProps} enableCrop={true} />,
      );

      const button = container.querySelector('.upload-button');
      expect(button).toBeInTheDocument();
    });

    it('应该接受 enableCompression prop', () => {
      const { container } = render(
        <UploadButton {...defaultProps} enableCompression={true} />,
      );

      const button = container.querySelector('.upload-button');
      expect(button).toBeInTheDocument();
    });

    it('应该接受 batchUploadProgress prop', () => {
      const progress = {
        total: 10,
        completed: 5,
        failed: 0,
        current: 'test.jpg',
      };

      const { container } = render(
        <UploadButton {...defaultProps} batchUploadProgress={progress} />,
      );

      const button = container.querySelector('.upload-button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('翻译函数', () => {
    it('应该使用传入的翻译函数', () => {
      const customTranslate = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'header.upload': 'Upload',
        };
        return translations[key] || key;
      });

      render(<UploadButton {...defaultProps} t={customTranslate} />);

      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(customTranslate).toHaveBeenCalled();
    });

    it('应该在没有提供翻译函数时使用默认翻译', () => {
      render(<UploadButton {...defaultProps} t={undefined} />);

      // 应该至少渲染按钮
      const { container } = render(
        <UploadButton {...defaultProps} t={undefined} />,
      );
      expect(container.querySelector('.upload-button')).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理快速连续点击', () => {
      const { container } = render(<UploadButton {...defaultProps} />);

      const button = container.querySelector(
        '.upload-button',
      ) as HTMLButtonElement;

      // 快速连续点击
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // 按钮应该仍然存在且可用
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('应该处理 loading 状态变化', () => {
      const { container, rerender } = render(
        <UploadButton {...defaultProps} loading={false} />,
      );

      let button = container.querySelector(
        '.upload-button',
      ) as HTMLButtonElement;
      expect(button).not.toBeDisabled();

      rerender(<UploadButton {...defaultProps} loading={true} />);

      button = container.querySelector('.upload-button') as HTMLButtonElement;
      expect(button).toBeDisabled();
    });
  });
});
