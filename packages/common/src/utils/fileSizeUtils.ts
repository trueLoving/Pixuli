/**
 * 文件大小格式化工具函数
 */

/**
 * 将字节数转换为人类可读的文件大小字符串
 * @param bytes 字节数
 * @param decimals 小数位数，默认为2
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 将字节数转换为人类可读的文件大小字符串（中文单位）
 * @param bytes 字节数
 * @param decimals 小数位数，默认为2
 * @returns 格式化后的文件大小字符串（中文单位）
 */
export function formatFileSizeChinese(
  bytes: number,
  decimals: number = 2
): string {
  if (bytes === 0) return '0 字节';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    '字节',
    '千字节',
    '兆字节',
    '吉字节',
    '太字节',
    '拍字节',
    '艾字节',
    '泽字节',
    '尧字节',
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 获取文件大小的简短表示
 * @param bytes 字节数
 * @returns 简短的文件大小字符串
 */
export function getShortFileSize(bytes: number): string {
  if (bytes === 0) return '0B';

  const k = 1024;
  const sizes = ['B', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

/**
 * 比较两个文件大小
 * @param sizeA 文件大小A（字节）
 * @param sizeB 文件大小B（字节）
 * @returns 比较结果：-1表示A<B，0表示A=B，1表示A>B
 */
export function compareFileSize(sizeA: number, sizeB: number): number {
  if (sizeA < sizeB) return -1;
  if (sizeA > sizeB) return 1;
  return 0;
}

/**
 * 检查文件大小是否在指定范围内
 * @param fileSize 文件大小（字节）
 * @param minSize 最小大小（字节），可选
 * @param maxSize 最大大小（字节），可选
 * @returns 是否在范围内
 */
export function isFileSizeInRange(
  fileSize: number,
  minSize?: number,
  maxSize?: number
): boolean {
  if (minSize !== undefined && fileSize < minSize) return false;
  if (maxSize !== undefined && fileSize > maxSize) return false;
  return true;
}

/**
 * 获取文件大小的范围描述
 * @param minSize 最小大小（字节）
 * @param maxSize 最大大小（字节）
 * @returns 范围描述字符串
 */
export function getFileSizeRangeDescription(
  minSize: number,
  maxSize: number
): string {
  const minFormatted = formatFileSize(minSize);
  const maxFormatted = formatFileSize(maxSize);
  return `${minFormatted} - ${maxFormatted}`;
}

/**
 * 将文件大小转换为特定单位
 * @param bytes 字节数
 * @param unit 目标单位 ('B', 'KB', 'MB', 'GB', 'TB')
 * @param decimals 小数位数，默认为2
 * @returns 转换后的数值
 */
export function convertFileSize(
  bytes: number,
  unit: string,
  decimals: number = 2
): number {
  const units = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  const targetUnit = units[unit as keyof typeof units];
  if (!targetUnit) {
    throw new Error(`不支持的单位: ${unit}`);
  }

  return parseFloat((bytes / targetUnit).toFixed(decimals));
}

/**
 * 获取文件大小的进度条宽度百分比
 * @param currentSize 当前文件大小（字节）
 * @param maxSize 最大文件大小（字节）
 * @returns 百分比值（0-100）
 */
export function getFileSizeProgress(
  currentSize: number,
  maxSize: number
): number {
  if (maxSize === 0) return 0;
  return Math.min(Math.round((currentSize / maxSize) * 100), 100);
}

/**
 * 格式化文件大小用于显示（智能选择单位）
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSizeSmart(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else if (bytes < 1024 * 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`;
  }
}
