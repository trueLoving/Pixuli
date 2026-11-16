import { afterEach, describe, expect, it } from 'vitest';
import {
  areLibraryShortcutsActive,
  hasOpenModalDialog,
  resumeLibraryShortcuts,
  suspendLibraryShortcuts,
} from '../libraryShortcutGate';

describe('libraryShortcutGate', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    // drain suspend counter
    for (let i = 0; i < 8; i += 1) resumeLibraryShortcuts();
  });

  it('suspends while count > 0', () => {
    expect(areLibraryShortcutsActive()).toBe(true);
    suspendLibraryShortcuts();
    expect(areLibraryShortcutsActive()).toBe(false);
    resumeLibraryShortcuts();
    expect(areLibraryShortcutsActive()).toBe(true);
  });

  it('treats aria-modal dialog as blocking', () => {
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.appendChild(dialog);

    expect(hasOpenModalDialog()).toBe(true);
    expect(areLibraryShortcutsActive()).toBe(false);
  });
});
