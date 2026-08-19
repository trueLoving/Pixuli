/** 资源库文件表行高，与 `.asset-library-row` 对齐（44px / 2.75rem）。 */
export const LIBRARY_ROW_HEIGHT = 44;

export interface VirtualWindow {
  start: number;
  end: number;
  offsetTop: number;
  offsetBottom: number;
}

export function getVirtualWindow(input: {
  total: number;
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  overscan?: number;
}): VirtualWindow {
  const rowHeight = Math.max(1, input.rowHeight);
  const overscan = input.overscan ?? 8;
  const total = Math.max(0, input.total);
  if (total === 0) {
    return { start: 0, end: 0, offsetTop: 0, offsetBottom: 0 };
  }
  const start = Math.max(
    0,
    Math.floor(Math.max(0, input.scrollTop) / rowHeight) - overscan,
  );
  const visible = Math.max(
    1,
    Math.ceil(Math.max(1, input.viewportHeight) / rowHeight),
  );
  const end = Math.min(total, start + visible + overscan * 2);
  return {
    start,
    end,
    offsetTop: start * rowHeight,
    offsetBottom: Math.max(0, (total - end) * rowHeight),
  };
}
