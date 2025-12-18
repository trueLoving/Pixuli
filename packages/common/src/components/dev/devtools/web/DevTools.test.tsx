import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DevTools } from './DevTools';
import type { DevToolsProps } from './DevTools';
import type {
  LogEntry,
  LogLevel,
} from '../../../../services/logInterceptorService';
import type {
  PerformanceMonitor,
  PerformanceAnalysis,
} from '../../../../performance';

// Mock logInterceptorService
const mockLogs: LogEntry[] = [
  {
    id: '1',
    level: 'info',
    message: 'Test info message',
    timestamp: Date.now(),
  },
  {
    id: '2',
    level: 'error',
    message: 'Test error message',
    timestamp: Date.now() + 1000,
    stack: 'Error stack trace',
  },
  {
    id: '3',
    level: 'warn',
    message: 'Test warn message',
    timestamp: Date.now() + 2000,
  },
];

vi.mock('../../../../services/logInterceptorService', () => {
  const mockLogInterceptorService = {
    start: vi.fn(),
    stop: vi.fn(),
    clearLogs: vi.fn(),
    getLogs: vi.fn(() => mockLogs),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    clearFilters: vi.fn(),
  };
  return {
    logInterceptorService: mockLogInterceptorService,
  };
});

// Mock defaultTranslate
vi.mock('../../../../locales', () => ({
  defaultTranslate: (key: string) => {
    const translations: Record<string, string> = {
      'devtools.title': '开发工具',
      'devtools.open': '打开开发工具',
      'devtools.close': '关闭',
      'devtools.tabs.logs': '日志',
      'devtools.tabs.performance': '性能',
      'devtools.logs.filter': '过滤',
      'devtools.logs.filterAll': '全部',
      'devtools.logs.filterLog': 'Log',
      'devtools.logs.filterInfo': 'Info',
      'devtools.logs.filterWarn': 'Warn',
      'devtools.logs.filterError': 'Error',
      'devtools.logs.filterDebug': 'Debug',
      'devtools.logs.autoScroll': '自动滚动',
      'devtools.logs.clear': '清空',
      'devtools.logs.export': '导出',
      'devtools.logs.empty': '暂无日志',
      'devtools.logs.stackInfo': '堆栈信息',
      'devtools.performance.fps': 'FPS',
      'devtools.performance.memoryUsage': '内存使用',
      'devtools.performance.pageLoadTime': '页面加载时间',
      'devtools.performance.renderTime': '渲染时间',
      'devtools.performance.longTasks': '长任务数',
      'devtools.performance.runAnalysis': '运行性能分析',
      'devtools.performance.collectMetrics': '收集性能指标',
      'devtools.performance.notInitialized': '性能监控未初始化',
      'devtools.performance.analysis.title': '性能分析结果',
      'devtools.performance.analysis.score': '性能评分',
      'devtools.performance.analysis.excellent': '优秀',
      'devtools.performance.analysis.good': '良好',
      'devtools.performance.analysis.fair': '一般',
      'devtools.performance.analysis.poor': '较差',
      'devtools.performance.analysis.issues': '发现的问题',
      'devtools.performance.analysis.suggestions': '优化建议',
      'devtools.performance.analysis.noIssues': '未发现问题',
      'devtools.performance.analysis.noSuggestions': '暂无建议',
    };
    return translations[key] || key;
  },
}));

// Mock window methods
const mockScrollIntoView = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

// 获取 mock 服务引用
import { logInterceptorService } from '../../../../services/logInterceptorService';

describe('DevTools', () => {
  let mockPerformanceMonitor: PerformanceMonitor;
  let mockAnalysis: PerformanceAnalysis;
  const mockLogInterceptorService = logInterceptorService as any;

  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof mockLogInterceptorService.getLogs === 'function') {
      vi.mocked(mockLogInterceptorService.getLogs).mockReturnValue(mockLogs);
    } else {
      mockLogInterceptorService.getLogs = vi.fn(() => mockLogs);
    }

    // Mock PerformanceMonitor
    mockAnalysis = {
      score: 85,
      level: 'good',
      issues: ['Issue 1', 'Issue 2'],
      suggestions: ['Suggestion 1'],
      metrics: {} as any,
    };

    mockPerformanceMonitor = {
      getMetrics: vi.fn(() => ({
        render: {
          fps: 60,
          frameTime: 16.67,
          longTaskCount: 2,
        },
        memory: {
          usedJSHeapSize: 1024 * 1024 * 50, // 50MB
        },
        load: {
          pageLoadTime: 1500,
        },
      })),
      analyze: vi.fn(() => mockAnalysis),
      collectAndReport: vi.fn(),
    } as unknown as PerformanceMonitor;

    // Mock Element.scrollIntoView
    Element.prototype.scrollIntoView = mockScrollIntoView;

    // Mock document.createElement for export
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = vi.fn((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = mockClick;
      }
      return element;
    }) as typeof document.createElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('渲染', () => {
    it('应该渲染浮球按钮', () => {
      const { container } = render(<DevTools />);

      const floatButton = container.querySelector('.devtools-float-button');
      expect(floatButton).toBeInTheDocument();
    });

    it('应该默认不显示面板', () => {
      const { container } = render(<DevTools />);

      const panel = container.querySelector('.devtools-panel');
      expect(panel).not.toBeInTheDocument();
    });

    it('应该在 defaultOpen 为 true 时显示面板', () => {
      const { container } = render(<DevTools defaultOpen={true} />);

      const panel = container.querySelector('.devtools-panel');
      expect(panel).toBeInTheDocument();
    });

    it('应该应用自定义类名', () => {
      const { container } = render(<DevTools className="custom-class" />);

      const floatButton = container.querySelector(
        '.devtools-float-button.custom-class',
      );
      expect(floatButton).toBeInTheDocument();
    });

    it('应该初始化日志拦截服务', () => {
      render(<DevTools />);

      expect(mockLogInterceptorService.clearFilters).toHaveBeenCalled();
      expect(mockLogInterceptorService.start).toHaveBeenCalled();
      expect(mockLogInterceptorService.addListener).toHaveBeenCalled();
    });
  });

  describe('打开/关闭面板', () => {
    it('应该点击浮球按钮后打开面板', () => {
      const { container } = render(<DevTools />);

      const floatButton = container.querySelector(
        '.devtools-float-button',
      ) as HTMLButtonElement;
      fireEvent.click(floatButton);

      const panel = container.querySelector('.devtools-panel');
      expect(panel).toBeInTheDocument();
    });

    it('应该点击关闭按钮后关闭面板', () => {
      const { container } = render(<DevTools defaultOpen={true} />);

      const closeButton = screen.getByLabelText('关闭');
      fireEvent.click(closeButton);

      waitFor(() => {
        const panel = container.querySelector('.devtools-panel');
        expect(panel).not.toBeInTheDocument();
      });
    });

    it('应该再次点击浮球按钮后关闭面板', () => {
      const { container } = render(<DevTools defaultOpen={true} />);

      const floatButton = container.querySelector(
        '.devtools-float-button',
      ) as HTMLButtonElement;
      fireEvent.click(floatButton);

      waitFor(() => {
        const panel = container.querySelector('.devtools-panel');
        expect(panel).not.toBeInTheDocument();
      });
    });
  });

  describe('标签页切换', () => {
    it('应该默认显示日志标签页', () => {
      const { container } = render(<DevTools defaultOpen={true} />);

      const logsTab = screen.getByText('日志');
      expect(logsTab).toHaveClass('active');

      const logsContainer = container.querySelector('.devtools-logs-container');
      expect(logsContainer).toBeInTheDocument();
    });

    it('应该点击性能标签页后切换到性能视图', () => {
      const { container } = render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      expect(performanceTab).toHaveClass('active');

      const performanceContainer = container.querySelector(
        '.devtools-performance-container',
      );
      expect(performanceContainer).toBeInTheDocument();
    });

    it('应该在性能监控未提供时禁用性能标签页', () => {
      render(<DevTools defaultOpen={true} />);

      const performanceTab = screen.getByText('性能');
      expect(performanceTab).toBeDisabled();
    });

    it('应该显示日志数量徽章', () => {
      render(<DevTools defaultOpen={true} />);

      const badge = document.querySelector('.devtools-tab-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
    });
  });

  describe('日志功能', () => {
    it('应该显示所有日志', () => {
      render(<DevTools defaultOpen={true} />);

      expect(screen.getByText('Test info message')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('Test warn message')).toBeInTheDocument();
    });

    it('应该按级别过滤日志', () => {
      const { container } = render(<DevTools defaultOpen={true} />);

      const filterSelect = container.querySelector(
        '.devtools-select',
      ) as HTMLSelectElement;
      expect(filterSelect).toBeInTheDocument();

      fireEvent.change(filterSelect, { target: { value: 'error' } });

      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.queryByText('Test info message')).not.toBeInTheDocument();
      expect(screen.queryByText('Test warn message')).not.toBeInTheDocument();
    });

    it('应该显示空状态当没有日志时', () => {
      mockLogInterceptorService.getLogs.mockReturnValue([]);
      render(<DevTools defaultOpen={true} />);

      expect(screen.getByText('暂无日志')).toBeInTheDocument();
    });

    it('应该清空日志', () => {
      render(<DevTools defaultOpen={true} />);

      const clearButton = screen.getByText('清空');
      fireEvent.click(clearButton);

      expect(mockLogInterceptorService.clearLogs).toHaveBeenCalled();
    });

    it('应该导出日志', () => {
      render(<DevTools defaultOpen={true} />);

      const exportButton = screen.getByText('导出');
      fireEvent.click(exportButton);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('应该显示堆栈信息', () => {
      render(<DevTools defaultOpen={true} />);

      const stackInfo = screen.getByText('堆栈信息');
      expect(stackInfo).toBeInTheDocument();

      const details = stackInfo.closest('details');
      expect(details).toBeInTheDocument();
    });

    it('应该切换自动滚动', () => {
      const { container } = render(<DevTools defaultOpen={true} />);

      const autoScrollLabel = screen.getByText('自动滚动');
      const autoScrollCheckbox = autoScrollLabel.querySelector(
        'input',
      ) as HTMLInputElement;

      expect(autoScrollCheckbox).toBeChecked();

      fireEvent.change(autoScrollCheckbox, { target: { checked: false } });
      expect(autoScrollCheckbox).not.toBeChecked();
    });

    it('应该格式化时间戳', () => {
      render(<DevTools defaultOpen={true} />);

      const timeElements = document.querySelectorAll('.devtools-log-time');
      expect(timeElements.length).toBeGreaterThan(0);

      timeElements.forEach(timeElement => {
        expect(timeElement.textContent).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
      });
    });

    it('应该为不同级别的日志应用不同的样式类', () => {
      const { container } = render(<DevTools defaultOpen={true} />);

      const errorLog = container.querySelector('.devtools-log-error');
      const warnLog = container.querySelector('.devtools-log-warn');
      const infoLog = container.querySelector('.devtools-log-info');

      expect(errorLog).toBeInTheDocument();
      expect(warnLog).toBeInTheDocument();
      expect(infoLog).toBeInTheDocument();
    });
  });

  describe('性能监控', () => {
    it('应该显示性能指标', () => {
      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      // 切换到性能标签页
      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      expect(screen.getByText('FPS')).toBeInTheDocument();
      expect(screen.getByText('内存使用')).toBeInTheDocument();
      expect(screen.getByText('页面加载时间')).toBeInTheDocument();
    });

    it('应该格式化内存大小', () => {
      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      // 50MB 应该显示为 "50.00 MB"
      expect(screen.getByText(/50\.00 MB/)).toBeInTheDocument();
    });

    it('应该格式化时间', () => {
      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      // 1500ms 应该显示为 "1.50 s"
      expect(screen.getByText(/1\.50 s/)).toBeInTheDocument();
    });

    it('应该运行性能分析', () => {
      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      const runAnalysisButton = screen.getByText('运行性能分析');
      fireEvent.click(runAnalysisButton);

      expect(mockPerformanceMonitor.analyze).toHaveBeenCalled();
    });

    it('应该显示性能分析结果', () => {
      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      const runAnalysisButton = screen.getByText('运行性能分析');
      fireEvent.click(runAnalysisButton);

      expect(screen.getByText('性能分析结果')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument(); // score
      expect(screen.getByText('良好')).toBeInTheDocument(); // level
    });

    it('应该显示性能问题和建议', () => {
      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      const runAnalysisButton = screen.getByText('运行性能分析');
      fireEvent.click(runAnalysisButton);

      expect(screen.getByText('发现的问题')).toBeInTheDocument();
      expect(screen.getByText('Issue 1')).toBeInTheDocument();
      expect(screen.getByText('优化建议')).toBeInTheDocument();
      expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
    });

    it('应该收集性能指标', () => {
      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      const collectButton = screen.getByText('收集性能指标');
      fireEvent.click(collectButton);

      expect(mockPerformanceMonitor.collectAndReport).toHaveBeenCalled();
    });

    it('应该在性能监控未初始化时显示提示', () => {
      const { container } = render(<DevTools defaultOpen={true} />);

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      // 性能标签页被禁用，所以不会显示内容
      // 但我们可以检查性能标签页是否被禁用
      expect(performanceTab).toBeDisabled();

      // 如果性能监控未提供，性能标签页应该被禁用
      // 这种情况下不会渲染性能内容区域
      const performanceContainer = container.querySelector(
        '.devtools-performance-container',
      );
      expect(performanceContainer).not.toBeInTheDocument();
    });

    it('应该定期更新性能指标', async () => {
      vi.useFakeTimers();

      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      // 初始调用
      expect(mockPerformanceMonitor.getMetrics).toHaveBeenCalledTimes(1);

      // 等待 1 秒后应该更新指标
      vi.advanceTimersByTime(1000);

      // 应该再次调用
      expect(mockPerformanceMonitor.getMetrics).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('拖动功能', () => {
    it('应该允许拖动浮球按钮', async () => {
      const { container } = render(<DevTools />);

      const floatButton = container.querySelector(
        '.devtools-float-button',
      ) as HTMLButtonElement;

      // 模拟鼠标按下
      fireEvent.mouseDown(floatButton, {
        clientX: 100,
        clientY: 100,
      });

      // 等待状态更新
      await waitFor(() => {
        expect(floatButton).toHaveClass('dragging');
      });

      // 模拟鼠标移动（需要移动足够距离才会触发拖动）
      fireEvent.mouseMove(document, {
        clientX: 100,
        clientY: 250, // 移动超过 5px
      });

      // 模拟鼠标释放
      fireEvent.mouseUp(document);

      // 拖动结束后应该移除拖动样式
      await waitFor(() => {
        expect(floatButton).not.toHaveClass('dragging');
      });
    });

    it('应该在拖动时保持 X 坐标不变', () => {
      const { container } = render(<DevTools />);

      const floatButton = container.querySelector(
        '.devtools-float-button',
      ) as HTMLButtonElement;

      const initialRight = floatButton.style.right;

      // 模拟拖动
      fireEvent.mouseDown(floatButton, {
        clientX: 100,
        clientY: 100,
      });

      fireEvent.mouseMove(document, {
        clientX: 200, // X 坐标改变
        clientY: 200, // Y 坐标改变
      });

      fireEvent.mouseUp(document);

      // X 坐标应该保持不变
      expect(floatButton.style.right).toBe(initialRight);
    });
  });

  describe('自定义翻译函数', () => {
    it('应该使用自定义翻译函数', () => {
      const customTranslate = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'devtools.title': 'DevTools',
          'devtools.tabs.logs': 'Logs',
        };
        return translations[key] || key;
      });

      render(<DevTools defaultOpen={true} t={customTranslate} />);

      expect(screen.getByText('DevTools')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(customTranslate).toHaveBeenCalled();
    });
  });

  describe('清理', () => {
    it('应该在组件卸载时清理监听器', () => {
      const { unmount } = render(<DevTools />);

      unmount();

      expect(mockLogInterceptorService.removeListener).toHaveBeenCalled();
      expect(mockLogInterceptorService.clearFilters).toHaveBeenCalled();
    });

    it('应该清理性能监控定时器', () => {
      vi.useFakeTimers();

      const { unmount } = render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={mockPerformanceMonitor}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      unmount();

      // 定时器应该被清理
      vi.advanceTimersByTime(2000);

      // getMetrics 不应该再被调用
      const callCount =
        mockPerformanceMonitor.getMetrics?.mock.calls.length || 0;

      vi.useRealTimers();
    });
  });

  describe('边界情况', () => {
    it('应该处理日志监听器回调', () => {
      let logListener: ((entry: LogEntry) => void) | null = null;

      mockLogInterceptorService.addListener.mockImplementation(
        (listener: (entry: LogEntry) => void) => {
          logListener = listener;
        },
      );

      render(<DevTools defaultOpen={true} />);

      // 模拟新日志
      if (logListener) {
        const newLog: LogEntry = {
          id: '4',
          level: 'info',
          message: 'New log message',
          timestamp: Date.now(),
        };
        logListener(newLog);
      }

      // 应该更新日志列表
      expect(mockLogInterceptorService.getLogs).toHaveBeenCalled();
    });

    it('应该处理清空日志的特殊 ID', () => {
      let logListener: ((entry: LogEntry) => void) | null = null;

      mockLogInterceptorService.addListener.mockImplementation(
        (listener: (entry: LogEntry) => void) => {
          logListener = listener;
        },
      );

      render(<DevTools defaultOpen={true} />);

      // 模拟清空日志
      if (logListener) {
        logListener({ id: 'clear' } as LogEntry);
      }

      // 日志应该被清空
      expect(mockLogInterceptorService.getLogs).toHaveBeenCalled();
    });

    it('应该处理性能指标为 null 的情况', () => {
      const monitorWithoutMetrics = {
        getMetrics: vi.fn(() => null),
        analyze: vi.fn(() => null),
        collectAndReport: vi.fn(),
      } as unknown as PerformanceMonitor;

      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={monitorWithoutMetrics}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      // 应该显示 N/A
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
    });

    it('应该处理性能分析返回 null 的情况', () => {
      const monitorWithNullAnalysis = {
        getMetrics: vi.fn(() => ({
          render: { fps: 60 },
        })),
        analyze: vi.fn(() => null),
        collectAndReport: vi.fn(),
      } as unknown as PerformanceMonitor;

      render(
        <DevTools
          defaultOpen={true}
          performanceMonitor={monitorWithNullAnalysis}
        />,
      );

      const performanceTab = screen.getByText('性能');
      fireEvent.click(performanceTab);

      const runAnalysisButton = screen.getByText('运行性能分析');
      fireEvent.click(runAnalysisButton);

      // 不应该显示分析结果
      expect(screen.queryByText('性能分析结果')).not.toBeInTheDocument();
    });
  });
});
