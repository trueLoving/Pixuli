/**
 * 日期时间格式化工具函数
 */

/**
 * 格式化 ISO 8601 时间戳为易读的日期时间字符串
 *
 * 示例：
 * - 2025-11-10T01:07:00.879Z -> "2025-11-10 09:07:00" (UTC+8)
 * - 2025-11-10T01:07:00.879Z -> "2025-11-10 09:07" (简短格式)
 *
 * @param dateString ISO 8601 格式的时间戳字符串
 * @param options 格式化选项
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(
  dateString: string,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    includeTime = true,
    includeSeconds = false,
    locale = 'zh-CN',
  } = options;

  try {
    const date = new Date(dateString);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateString; // 如果日期无效，返回原始字符串
    }

    if (includeTime) {
      // 包含时间的格式：YYYY-MM-DD HH:mm:ss 或 YYYY-MM-DD HH:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      if (includeSeconds) {
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } else {
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      }
    } else {
      // 只包含日期的格式：YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.warn('Failed to format date:', error);
    return dateString; // 出错时返回原始字符串
  }
}

/**
 * 格式化日期为简短格式（仅日期，不包含时间）
 *
 * @param dateString ISO 8601 格式的时间戳字符串
 * @param locale 语言环境，默认为 'zh-CN'
 * @returns 格式化后的日期字符串，例如 "2025-11-10"
 */
export function formatDate(
  dateString: string,
  locale: string = 'zh-CN'
): string {
  return formatDateTime(dateString, { includeTime: false, locale });
}

/**
 * 格式化日期时间为完整格式（包含秒）
 *
 * @param dateString ISO 8601 格式的时间戳字符串
 * @returns 格式化后的日期时间字符串，例如 "2025-11-10 09:07:00"
 */
export function formatDateTimeFull(dateString: string): string {
  return formatDateTime(dateString, {
    includeTime: true,
    includeSeconds: true,
  });
}

/**
 * 格式化日期时间为简短格式（不包含秒）
 *
 * @param dateString ISO 8601 格式的时间戳字符串
 * @returns 格式化后的日期时间字符串，例如 "2025-11-10 09:07"
 */
export function formatDateTimeShort(dateString: string): string {
  return formatDateTime(dateString, {
    includeTime: true,
    includeSeconds: false,
  });
}

/**
 * 格式化相对时间（例如：刚刚、1分钟前、2小时前等）
 *
 * @param dateString ISO 8601 格式的时间戳字符串
 * @param locale 语言环境，默认为 'zh-CN'
 * @returns 相对时间字符串
 */
export function formatRelativeTime(
  dateString: string,
  locale: string = 'zh-CN'
): string {
  try {
    const date = new Date(dateString);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      // 如果日期无效，返回当前日期的格式化字符串
      return formatDate(new Date().toISOString(), locale);
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (locale === 'zh-CN') {
      if (diffSeconds < 60) {
        return '刚刚';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return formatDate(dateString, locale);
      }
    } else {
      // 英文格式
      if (diffSeconds < 60) {
        return 'just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        return formatDate(dateString, locale);
      }
    }
  } catch (error) {
    console.warn('Failed to format relative time:', error);
    // 如果出错，尝试返回当前日期，如果还是失败则返回默认格式
    try {
      return formatDate(new Date().toISOString(), locale);
    } catch {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
}
