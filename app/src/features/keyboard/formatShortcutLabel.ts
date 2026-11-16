import type { KeyboardShortcut } from '@/ui';

const KEY_LABELS: Record<string, string> = {
  Escape: 'Esc',
  ' ': 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ',': ',',
  '/': '/',
};

function keyLabel(key: string): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  if (key.length === 1) return key.toUpperCase();
  return key;
}

/** mac 风格：⌘⇧K；其它：Ctrl+Shift+K */
export function formatShortcutChord(
  shortcut: Pick<
    KeyboardShortcut,
    'key' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'
  >,
  style: 'mac' | 'win',
): string {
  const key = keyLabel(shortcut.key);
  if (style === 'mac') {
    const mods: string[] = [];
    if (shortcut.ctrlKey && !shortcut.metaKey) mods.push('⌃');
    if (shortcut.altKey) mods.push('⌥');
    if (shortcut.shiftKey) mods.push('⇧');
    if (shortcut.metaKey) mods.push('⌘');
    return `${mods.join('')}${key}`;
  }
  const mods: string[] = [];
  if (shortcut.ctrlKey || shortcut.metaKey) mods.push('Ctrl');
  if (shortcut.altKey) mods.push('Alt');
  if (shortcut.shiftKey) mods.push('Shift');
  return [...mods, key].join('+');
}

export interface ShortcutHelpRow {
  description: string;
  category: string;
  /** 展示用组合键，如「⌘K / Ctrl+K」或「F5」 */
  chord: string;
}

/**
 * 将已注册快捷键整理为帮助列表：合并同一动作的 Ctrl/Meta 变体。
 */
export function buildShortcutHelpRows(
  shortcuts: KeyboardShortcut[],
): ShortcutHelpRow[] {
  const groups = new Map<
    string,
    {
      description: string;
      category: string;
      variants: KeyboardShortcut[];
    }
  >();

  for (const shortcut of shortcuts) {
    if (shortcut.enabled === false) continue;
    const baseKey = [
      shortcut.category,
      shortcut.description,
      shortcut.key.toLowerCase(),
      shortcut.altKey ? '1' : '0',
      shortcut.shiftKey ? '1' : '0',
      shortcut.ctrlKey || shortcut.metaKey ? 'mod' : '0',
    ].join('|');

    const existing = groups.get(baseKey);
    if (existing) {
      existing.variants.push(shortcut);
    } else {
      groups.set(baseKey, {
        description: shortcut.description,
        category: shortcut.category,
        variants: [shortcut],
      });
    }
  }

  const rows: ShortcutHelpRow[] = [];
  for (const group of groups.values()) {
    const hasMeta = group.variants.some(v => v.metaKey);
    const hasCtrl = group.variants.some(v => v.ctrlKey);
    const sample = group.variants[0];
    let chord: string;
    if (hasMeta && hasCtrl) {
      const mac = formatShortcutChord(
        { ...sample, metaKey: true, ctrlKey: false },
        'mac',
      );
      const win = formatShortcutChord(
        { ...sample, metaKey: false, ctrlKey: true },
        'win',
      );
      chord = `${mac} / ${win}`;
    } else if (hasMeta) {
      chord = formatShortcutChord(sample, 'mac');
    } else {
      chord = formatShortcutChord(sample, 'win');
    }
    rows.push({
      description: group.description,
      category: group.category,
      chord,
    });
  }

  return rows;
}
