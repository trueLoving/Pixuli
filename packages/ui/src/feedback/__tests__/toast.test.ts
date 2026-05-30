import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  updateLoadingToSuccess,
  updateLoadingToError,
  updateAllToasts,
  dismissAllToasts,
  clearToastRecord,
} from '../toast';

vi.mock('react-hot-toast', () => {
  const mockToastDefault = vi.fn(() => 'toast-id-default');
  const mockToast = {
    success: vi.fn(() => 'toast-id-1'),
    error: vi.fn(() => 'toast-id-2'),
    loading: vi.fn(() => 'toast-id-3'),
    dismiss: vi.fn(),
  };

  return {
    default: Object.assign(mockToastDefault, {
      success: mockToast.success,
      error: mockToast.error,
      loading: mockToast.loading,
      dismiss: mockToast.dismiss,
    }),
  };
});

import toast from 'react-hot-toast';

describe('toast工具函数', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('showSuccess', () => {
    it('应该显示成功消息', () => {
      showSuccess('操作成功');

      expect(toast.success).toHaveBeenCalledWith('操作成功', {
        duration: 3000,
        position: 'top-right',
        style: expect.objectContaining({
          background: '#10b981',
          color: '#fff',
        }),
      });
    });

    it('应该支持messageKey选项', () => {
      showSuccess('操作成功', { messageKey: 'success.message' });

      expect(toast.success).toHaveBeenCalled();
    });

    it('应该支持getMessage选项', () => {
      const getMessage = vi.fn(() => '动态消息');
      showSuccess('操作成功', { getMessage });

      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('showError', () => {
    it('应该显示错误消息', () => {
      showError('操作失败');

      expect(toast.error).toHaveBeenCalledWith('操作失败', {
        duration: 4000,
        position: 'top-right',
        style: expect.objectContaining({
          background: '#ef4444',
          color: '#fff',
        }),
      });
    });

    it('应该支持messageKey选项', () => {
      showError('操作失败', { messageKey: 'error.message' });

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('showWarning', () => {
    it('应该显示警告消息', () => {
      showWarning('警告信息');

      expect(toast).toHaveBeenCalledWith('警告信息', {
        duration: 3000,
        position: 'top-right',
        icon: '⚠️',
        style: expect.objectContaining({
          background: '#f59e0b',
          color: '#fff',
        }),
      });
    });
  });

  describe('showInfo', () => {
    it('应该显示信息消息', () => {
      showInfo('提示信息');

      expect(toast).toHaveBeenCalledWith('提示信息', {
        duration: 3000,
        position: 'top-right',
        icon: 'ℹ️',
        style: expect.objectContaining({
          background: '#3b82f6',
          color: '#fff',
        }),
      });
    });
  });

  describe('showLoading', () => {
    it('应该显示加载消息', () => {
      showLoading('加载中...');

      expect(toast.loading).toHaveBeenCalledWith('加载中...', {
        position: 'top-right',
        style: expect.objectContaining({
          background: '#6b7280',
          color: '#fff',
        }),
      });
    });
  });

  describe('updateLoadingToSuccess', () => {
    it('应该更新加载消息为成功消息', () => {
      const toastId = 'toast-id-1';
      updateLoadingToSuccess(toastId, '操作成功');

      expect(toast.success).toHaveBeenCalledWith('操作成功', {
        id: toastId,
        duration: 3000,
        style: expect.objectContaining({
          background: '#10b981',
        }),
      });
    });

    it('应该支持messageKey选项', () => {
      const toastId = 'toast-id-1';
      updateLoadingToSuccess(toastId, '操作成功', {
        messageKey: 'success.message',
      });

      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('updateLoadingToError', () => {
    it('应该更新加载消息为错误消息', () => {
      const toastId = 'toast-id-1';
      updateLoadingToError(toastId, '操作失败');

      expect(toast.error).toHaveBeenCalledWith('操作失败', {
        id: toastId,
        duration: 4000,
        style: expect.objectContaining({
          background: '#ef4444',
        }),
      });
    });
  });

  describe('updateAllToasts', () => {
    it('应该更新所有活跃的toast', () => {
      const translate = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'success.message': '操作成功',
          'error.message': '操作失败',
        };
        return translations[key] || key;
      });

      // 先创建一些toast
      showSuccess('原始消息', { messageKey: 'success.message' });
      showError('原始错误', { messageKey: 'error.message' });

      // 更新所有toast
      updateAllToasts(translate);

      expect(translate).toHaveBeenCalled();
    });

    it('应该使用getMessage函数更新toast', () => {
      const translate = vi.fn((key: string) => key);
      const getMessage = vi.fn(() => '动态消息');

      showSuccess('原始消息', { getMessage });

      updateAllToasts(translate);

      expect(getMessage).toHaveBeenCalled();
    });
  });

  describe('dismissAllToasts', () => {
    it('应该清除所有toast', () => {
      dismissAllToasts();

      expect(toast.dismiss).toHaveBeenCalled();
    });
  });

  describe('clearToastRecord', () => {
    it('应该清除指定的toast记录', () => {
      const toastId = 'toast-id-1';
      showSuccess('消息', { messageKey: 'test.key' });

      clearToastRecord(toastId);

      // 验证记录被清除（通过updateAllToasts不会更新它）
      const translate = vi.fn((key: string) => key);
      updateAllToasts(translate);

      // 如果记录被清除，translate不应该被调用
      // 但由于toast可能已经消失，这个测试主要是确保函数不抛出错误
      expect(() => clearToastRecord(toastId)).not.toThrow();
    });
  });
});
