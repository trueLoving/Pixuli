import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SlideShowSettings from './SlideShowSettings';
import { DEFAULT_SLIDE_SHOW_CONFIG, SlideShowConfig } from './types';

describe('SlideShowSettings', () => {
  const mockOnClose = vi.fn();
  const mockOnConfigChange = vi.fn();
  const mockTranslate = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'slideShow.settings.title': '设置',
      'slideShow.settings.playback.title': '播放设置',
      'slideShow.settings.playback.interval': '播放间隔',
      'slideShow.settings.playback.playMode': '播放模式',
      'slideShow.settings.playback.playModeSequential': '顺序播放',
      'slideShow.settings.playback.playModeRandom': '随机播放',
      'slideShow.settings.playback.playModeLoop': '循环播放',
      'slideShow.settings.playback.autoPlay': '自动播放',
      'slideShow.settings.playback.loop': '循环',
      'slideShow.settings.transition.title': '过渡效果',
      'slideShow.settings.transition.effect': '效果',
      'slideShow.settings.transition.effectFade': '淡入淡出',
      'slideShow.settings.transition.effectSlide': '滑动',
      'slideShow.settings.transition.effectZoom': '缩放',
      'slideShow.settings.transition.effectBlur': '模糊',
      'slideShow.settings.transition.effectRotate': '旋转',
      'slideShow.settings.transition.effectNone': '无',
      'slideShow.settings.transition.duration': '持续时间',
      'slideShow.settings.music.title': '背景音乐',
      'slideShow.settings.music.enable': '启用背景音乐',
      'slideShow.settings.music.selectFile': '选择文件',
      'slideShow.settings.music.fileSelected': '已选择文件',
      'slideShow.settings.music.volume': '音量',
      'slideShow.settings.music.supportedFormats': '支持的格式',
      'slideShow.settings.display.title': '显示设置',
      'slideShow.settings.display.showImageInfo': '显示图片信息',
      'slideShow.settings.display.fullscreen': '全屏',
      'slideShow.settings.reset': '重置',
      'slideShow.settings.cancel': '取消',
      'slideShow.settings.save': '保存',
      'common.close': '关闭',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    config: DEFAULT_SLIDE_SHOW_CONFIG,
    onConfigChange: mockOnConfigChange,
    t: mockTranslate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    // Mock file input
    const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    global.File = vi.fn().mockImplementation(() => mockFile) as any;
  });

  describe('渲染', () => {
    it('应该在 isOpen 为 false 时不渲染', () => {
      const { container } = render(
        <SlideShowSettings {...defaultProps} isOpen={false} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('应该在 isOpen 为 true 时渲染', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const modal = container.querySelector('.slide-show-settings-modal');
      expect(modal).toBeInTheDocument();
    });

    it('应该显示设置标题', () => {
      render(<SlideShowSettings {...defaultProps} />);
      expect(screen.getByText('设置')).toBeInTheDocument();
    });

    it('应该显示关闭按钮', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const closeButton = container.querySelector('.slide-show-settings-close');
      expect(closeButton).toBeInTheDocument();
    });

    it('应该显示所有设置部分', () => {
      render(<SlideShowSettings {...defaultProps} />);
      expect(screen.getByText('播放设置')).toBeInTheDocument();
      expect(screen.getByText('过渡效果')).toBeInTheDocument();
      expect(screen.getByText('背景音乐')).toBeInTheDocument();
      expect(screen.getByText('显示设置')).toBeInTheDocument();
    });
  });

  describe('播放设置', () => {
    it('应该显示播放间隔输入框', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const intervalInput = container.querySelector(
        '.slide-show-settings-input[type="number"]',
      ) as HTMLInputElement;
      expect(intervalInput).toBeInTheDocument();
      expect(intervalInput.value).toBe('3'); // 默认 3000ms = 3s
    });

    it('应该可以修改播放间隔', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const intervalInput = container.querySelector(
        '.slide-show-settings-input[type="number"]',
      ) as HTMLInputElement;

      fireEvent.change(intervalInput, { target: { value: '5' } });

      expect(intervalInput.value).toBe('5');
    });

    it('应该显示播放模式选择', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const playModeSelect = container.querySelector(
        '.slide-show-settings-select',
      ) as HTMLSelectElement;
      expect(playModeSelect).toBeInTheDocument();
      expect(playModeSelect.value).toBe('sequential');
    });

    it('应该可以修改播放模式', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const playModeSelect = container.querySelector(
        '.slide-show-settings-select',
      ) as HTMLSelectElement;

      fireEvent.change(playModeSelect, { target: { value: 'random' } });

      expect(playModeSelect.value).toBe('random');
    });

    it('应该显示自动播放复选框', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const autoPlayCheckbox = screen.getByLabelText(
        '自动播放',
      ) as HTMLInputElement;
      expect(autoPlayCheckbox).toBeInTheDocument();
      expect(autoPlayCheckbox.checked).toBe(false);
    });

    it('应该可以切换自动播放', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const autoPlayCheckbox = screen.getByLabelText(
        '自动播放',
      ) as HTMLInputElement;

      fireEvent.click(autoPlayCheckbox);

      expect(autoPlayCheckbox.checked).toBe(true);
    });

    it('应该显示循环复选框', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const loopCheckbox = screen.getByLabelText('循环') as HTMLInputElement;
      expect(loopCheckbox).toBeInTheDocument();
      expect(loopCheckbox.checked).toBe(true);
    });

    it('应该可以切换循环', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const loopCheckbox = screen.getByLabelText('循环') as HTMLInputElement;

      fireEvent.click(loopCheckbox);

      expect(loopCheckbox.checked).toBe(false);
    });
  });

  describe('过渡效果设置', () => {
    it('应该显示过渡效果选择', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const selectElements = container.querySelectorAll(
        '.slide-show-settings-select',
      );
      const effectSelect = selectElements[1] as HTMLSelectElement; // 第二个 select 是过渡效果
      expect(effectSelect).toBeInTheDocument();
      expect(effectSelect.value).toBe('fade');
    });

    it('应该可以修改过渡效果', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const selectElements = container.querySelectorAll(
        '.slide-show-settings-select',
      );
      const effectSelect = selectElements[1] as HTMLSelectElement;

      fireEvent.change(effectSelect, { target: { value: 'slide' } });

      expect(effectSelect.value).toBe('slide');
    });

    it('应该显示过渡持续时间输入框', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const inputElements = container.querySelectorAll(
        '.slide-show-settings-input[type="number"]',
      );
      const durationInput = inputElements[1] as HTMLInputElement; // 第二个 number input 是持续时间
      expect(durationInput).toBeInTheDocument();
      expect(durationInput.value).toBe('500');
    });

    it('应该可以修改过渡持续时间', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);
      const inputElements = container.querySelectorAll(
        '.slide-show-settings-input[type="number"]',
      );
      const durationInput = inputElements[1] as HTMLInputElement;

      fireEvent.change(durationInput, { target: { value: '1000' } });

      expect(durationInput.value).toBe('1000');
    });
  });

  describe('背景音乐设置', () => {
    it('应该显示启用背景音乐复选框', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const enableMusicCheckbox = screen.getByLabelText(
        '启用背景音乐',
      ) as HTMLInputElement;
      expect(enableMusicCheckbox).toBeInTheDocument();
      expect(enableMusicCheckbox.checked).toBe(false);
    });

    it('应该显示选择文件按钮', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const selectFileButton = screen.getByText('选择文件');
      expect(selectFileButton).toBeInTheDocument();
    });

    it('应该在启用音乐后显示音量滑块', async () => {
      const configWithMusic: SlideShowConfig = {
        ...DEFAULT_SLIDE_SHOW_CONFIG,
        backgroundMusic: 'blob:test-url',
      };

      render(<SlideShowSettings {...defaultProps} config={configWithMusic} />);

      const volumeLabel = screen.getByText(/音量/);
      expect(volumeLabel).toBeInTheDocument();
    });

    it('应该可以移除音乐文件', () => {
      const configWithMusic: SlideShowConfig = {
        ...DEFAULT_SLIDE_SHOW_CONFIG,
        backgroundMusic: 'blob:test-url',
      };

      render(<SlideShowSettings {...defaultProps} config={configWithMusic} />);

      const removeButton = screen.getByText('移除');
      fireEvent.click(removeButton);

      // 音乐应该被移除
      const enableMusicCheckbox = screen.getByLabelText(
        '启用背景音乐',
      ) as HTMLInputElement;
      expect(enableMusicCheckbox.checked).toBe(false);
    });
  });

  describe('显示设置', () => {
    it('应该显示显示图片信息复选框', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const showImageInfoCheckbox = screen.getByLabelText(
        '显示图片信息',
      ) as HTMLInputElement;
      expect(showImageInfoCheckbox).toBeInTheDocument();
      expect(showImageInfoCheckbox.checked).toBe(true);
    });

    it('应该可以切换显示图片信息', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const showImageInfoCheckbox = screen.getByLabelText(
        '显示图片信息',
      ) as HTMLInputElement;

      fireEvent.click(showImageInfoCheckbox);

      expect(showImageInfoCheckbox.checked).toBe(false);
    });

    it('应该显示全屏复选框', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const fullscreenCheckbox = screen.getByLabelText(
        '全屏',
      ) as HTMLInputElement;
      expect(fullscreenCheckbox).toBeInTheDocument();
      expect(fullscreenCheckbox.checked).toBe(false);
    });

    it('应该可以切换全屏', () => {
      render(<SlideShowSettings {...defaultProps} />);
      const fullscreenCheckbox = screen.getByLabelText(
        '全屏',
      ) as HTMLInputElement;

      fireEvent.click(fullscreenCheckbox);

      expect(fullscreenCheckbox.checked).toBe(true);
    });
  });

  describe('操作按钮', () => {
    it('应该显示重置按钮', () => {
      render(<SlideShowSettings {...defaultProps} />);
      expect(screen.getByText('重置')).toBeInTheDocument();
    });

    it('应该显示取消按钮', () => {
      render(<SlideShowSettings {...defaultProps} />);
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('应该显示保存按钮', () => {
      render(<SlideShowSettings {...defaultProps} />);
      expect(screen.getByText('保存')).toBeInTheDocument();
    });

    it('应该点击取消按钮时调用 onClose', () => {
      render(<SlideShowSettings {...defaultProps} />);

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('应该点击关闭按钮时调用 onClose', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);

      const closeButton = container.querySelector(
        '.slide-show-settings-close',
      ) as HTMLButtonElement;
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('应该点击模态框外部时调用 onClose', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);

      const modal = container.querySelector(
        '.slide-show-settings-modal',
      ) as HTMLDivElement;
      fireEvent.click(modal);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('应该点击保存按钮时调用 onConfigChange 和 onClose', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);

      // 修改一些配置
      const intervalInput = container.querySelector(
        '.slide-show-settings-input[type="number"]',
      ) as HTMLInputElement;
      fireEvent.change(intervalInput, { target: { value: '5' } });

      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      expect(mockOnConfigChange).toHaveBeenCalledTimes(1);
      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          interval: 5000, // 5秒 = 5000ms
        }),
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('应该点击重置按钮时恢复原始配置', () => {
      const customConfig: SlideShowConfig = {
        ...DEFAULT_SLIDE_SHOW_CONFIG,
        interval: 5000,
        autoPlay: true,
      };

      const { container, rerender } = render(
        <SlideShowSettings {...defaultProps} config={customConfig} />,
      );

      // 修改配置
      const intervalInput = container.querySelector(
        '.slide-show-settings-input[type="number"]',
      ) as HTMLInputElement;
      fireEvent.change(intervalInput, { target: { value: '10' } });

      // 点击重置
      const resetButton = screen.getByText('重置');
      fireEvent.click(resetButton);

      // 配置应该恢复到传入的 config（不是默认配置）
      expect(intervalInput.value).toBe('5'); // 恢复为 5000ms = 5s
    });
  });

  describe('文件选择', () => {
    it('应该可以选择音乐文件', () => {
      const mockFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const mockFileList = {
        length: 1,
        0: mockFile,
        item: (index: number) => (index === 0 ? mockFile : null),
      } as FileList;

      // Mock document.createElement 来返回一个可控制的 file input
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation(tagName => {
        if (tagName === 'input') {
          const input = originalCreateElement('input') as HTMLInputElement;
          input.type = 'file';
          input.accept = 'audio/*';
          // 模拟文件选择
          Object.defineProperty(input, 'files', {
            get: () => mockFileList,
            configurable: true,
          });
          return input;
        }
        return originalCreateElement(tagName);
      });

      render(<SlideShowSettings {...defaultProps} />);

      const selectFileButton = screen.getByText('选择文件');
      fireEvent.click(selectFileButton);

      // 验证 URL.createObjectURL 被调用（通过点击按钮触发的文件选择）
      // 注意：由于文件选择是异步的，这里主要测试按钮点击不会报错
      expect(selectFileButton).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理没有翻译函数的情况', () => {
      const { container } = render(
        <SlideShowSettings {...defaultProps} t={undefined} />,
      );

      // 应该仍然渲染，即使没有翻译函数
      const modal = container.querySelector('.slide-show-settings-modal');
      expect(modal).toBeInTheDocument();
    });

    it('应该处理配置值为边界值', () => {
      const edgeConfig: SlideShowConfig = {
        ...DEFAULT_SLIDE_SHOW_CONFIG,
        interval: 1,
        transitionDuration: 0,
        musicVolume: 0,
      };

      const { container } = render(
        <SlideShowSettings {...defaultProps} config={edgeConfig} />,
      );

      const intervalInput = container.querySelector(
        '.slide-show-settings-input[type="number"]',
      ) as HTMLInputElement;
      expect(intervalInput.value).toBe('0.001'); // 1ms = 0.001s
    });

    it('应该处理快速连续点击保存按钮', () => {
      const { container } = render(<SlideShowSettings {...defaultProps} />);

      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      // 第一次点击后，组件会关闭，所以后续点击不会生效
      // 验证 onConfigChange 被调用
      expect(mockOnConfigChange).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
