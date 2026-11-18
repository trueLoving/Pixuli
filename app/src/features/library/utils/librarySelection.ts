export function pruneSelectedIds(
  selectedIds: string[],
  visibleIds: string[],
): string[] {
  if (selectedIds.length === 0) return selectedIds;
  const visible = new Set(visibleIds);
  const next = selectedIds.filter(id => visible.has(id));
  return next.length === selectedIds.length ? selectedIds : next;
}

/**
 * 多选模式键盘焦点：↑↓ 只移动焦点，不改选区。
 * focusId 不在列表中时，按 delta 落在首项或末项。
 */
export function nextFocusId(options: {
  visibleIds: string[];
  focusId: string | null;
  delta: number;
}): string | null {
  const { visibleIds, focusId, delta } = options;
  if (visibleIds.length === 0 || delta === 0) return null;

  const index = focusId ? visibleIds.indexOf(focusId) : -1;
  if (index < 0) {
    return delta > 0 ? visibleIds[0] : visibleIds[visibleIds.length - 1];
  }

  const next = Math.min(visibleIds.length - 1, Math.max(0, index + delta));
  return visibleIds[next] ?? null;
}

export function nextSelectedIds(options: {
  visibleIds: string[];
  selectedIds: string[];
  clickedId: string;
  additive: boolean;
  range: boolean;
  anchorId: string | null;
  multiMode: boolean;
}): { selectedIds: string[]; anchorId: string | null } {
  const {
    visibleIds,
    selectedIds,
    clickedId,
    additive,
    range,
    anchorId,
    multiMode,
  } = options;

  if (range && anchorId) {
    const start = visibleIds.indexOf(anchorId);
    const end = visibleIds.indexOf(clickedId);
    if (start >= 0 && end >= 0) {
      const from = Math.min(start, end);
      const to = Math.max(start, end);
      return {
        selectedIds: visibleIds.slice(from, to + 1),
        anchorId,
      };
    }
  }

  if (additive || multiMode) {
    const set = new Set(selectedIds);
    if (set.has(clickedId)) {
      set.delete(clickedId);
    } else {
      set.add(clickedId);
    }
    return {
      selectedIds: visibleIds.filter(id => set.has(id)),
      anchorId: clickedId,
    };
  }

  return { selectedIds: [clickedId], anchorId: clickedId };
}
