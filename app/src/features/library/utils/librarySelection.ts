export function pruneSelectedIds(
  selectedIds: string[],
  visibleIds: string[],
): string[] {
  if (selectedIds.length === 0) return selectedIds;
  const visible = new Set(visibleIds);
  const next = selectedIds.filter(id => visible.has(id));
  return next.length === selectedIds.length ? selectedIds : next;
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
