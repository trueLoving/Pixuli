/**
 * 搜索历史记录管理工具
 * 使用 localStorage 存储搜索历史
 */

const SEARCH_HISTORY_KEY = 'pixuli_search_history';
const MAX_HISTORY_COUNT = 10; // 最多保存 10 条历史记录

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

/**
 * 获取搜索历史记录
 */
export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];
    const history = JSON.parse(stored) as SearchHistoryItem[];
    // 按时间戳倒序排列（最新的在前）
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to get search history:', error);
    return [];
  }
}

/**
 * 添加搜索历史记录
 */
export function addSearchHistory(query: string): void {
  if (!query || query.trim().length === 0) return;

  try {
    const history = getSearchHistory();
    const trimmedQuery = query.trim();

    // 移除重复项（不区分大小写）
    const filteredHistory = history.filter(
      item => item.query.toLowerCase() !== trimmedQuery.toLowerCase(),
    );

    // 添加新记录到开头
    const newHistory: SearchHistoryItem[] = [
      {
        query: trimmedQuery,
        timestamp: Date.now(),
      },
      ...filteredHistory,
    ].slice(0, MAX_HISTORY_COUNT); // 只保留最新的 N 条

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to add search history:', error);
  }
}

/**
 * 删除单条搜索历史记录
 */
export function removeSearchHistory(query: string): void {
  try {
    const history = getSearchHistory();
    const filteredHistory = history.filter(
      item => item.query.toLowerCase() !== query.toLowerCase(),
    );
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Failed to remove search history:', error);
  }
}

/**
 * 清空所有搜索历史记录
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}

/**
 * 根据关键词过滤历史记录（用于搜索建议）
 */
export function filterSearchHistory(keyword: string): SearchHistoryItem[] {
  if (!keyword || keyword.trim().length === 0) {
    return getSearchHistory();
  }

  const history = getSearchHistory();
  const lowerKeyword = keyword.toLowerCase();
  return history.filter(item =>
    item.query.toLowerCase().includes(lowerKeyword),
  );
}
