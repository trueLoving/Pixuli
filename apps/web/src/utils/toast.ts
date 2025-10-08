/**
 * Toast 通知工具
 */

import toast from 'react-hot-toast'

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  info: (message: string) => toast(message),
  custom: (message: string, options?: any) => toast.custom(message, options),
  dismiss: (toastId?: string) => toast.dismiss(toastId),
  remove: (toastId?: string) => toast.remove(toastId),
}

export const TOAST_MESSAGES = {
  UPLOAD_SUCCESS: '图片上传成功',
  UPLOAD_ERROR: '图片上传失败',
  DELETE_SUCCESS: '图片删除成功',
  DELETE_ERROR: '图片删除失败',
  UPDATE_SUCCESS: '图片信息更新成功',
  UPDATE_ERROR: '图片信息更新失败',
  CONFIG_SAVED: '配置保存成功',
  CONFIG_ERROR: '配置保存失败',
  COMPRESSION_SUCCESS: '图片压缩完成',
  COMPRESSION_ERROR: '图片压缩失败',
  CONVERSION_SUCCESS: '格式转换完成',
  CONVERSION_ERROR: '格式转换失败',
  LOADING_IMAGES: '正在加载图片...',
  LOADING_ERROR: '加载图片失败',
} as const
