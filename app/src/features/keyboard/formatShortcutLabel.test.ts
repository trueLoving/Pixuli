import { describe, expect, it } from 'vitest';
import type { KeyboardShortcut } from '@/ui';
import {
  buildShortcutHelpRows,
  formatShortcutChord,
} from './formatShortcutLabel';

const base = (
  partial: Partial<KeyboardShortcut> & Pick<KeyboardShortcut, 'key'>,
): KeyboardShortcut => ({
  description: 'test',
  action: () => {},
  category: 'general',
  ...partial,
});

describe('formatShortcutChord', () => {
  it('formats mac and win chords', () => {
    expect(
      formatShortcutChord({ key: 'k', metaKey: true, shiftKey: true }, 'mac'),
    ).toBe('⇧⌘K');
    expect(
      formatShortcutChord({ key: 'k', ctrlKey: true, shiftKey: true }, 'win'),
    ).toBe('Ctrl+Shift+K');
  });
});

describe('buildShortcutHelpRows', () => {
  it('merges ctrl/meta variants into one row', () => {
    const rows = buildShortcutHelpRows([
      base({
        key: 'k',
        metaKey: true,
        description: 'Search',
        category: 'search',
      }),
      base({
        key: 'k',
        ctrlKey: true,
        description: 'Search',
        category: 'search',
      }),
      base({
        key: 'F5',
        description: 'Help',
        category: 'help',
      }),
    ]);

    expect(rows).toHaveLength(2);
    const search = rows.find(r => r.description === 'Search');
    expect(search?.chord).toBe('⌘K / Ctrl+K');
    expect(rows.find(r => r.description === 'Help')?.chord).toBe('F5');
  });
});
