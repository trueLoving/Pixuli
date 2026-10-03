import { beforeEach, describe, expect, it } from 'vitest';
import {
  isUtilityToolsEnabled,
  useUtilityToolsStore,
} from './utilityToolsConfig';

describe('useUtilityToolsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useUtilityToolsStore.setState({ enabled: false });
  });

  it('defaults to off', () => {
    expect(isUtilityToolsEnabled()).toBe(false);
  });

  it('persists enable to localStorage', () => {
    useUtilityToolsStore.getState().setEnabled(true);
    expect(isUtilityToolsEnabled()).toBe(true);
    expect(localStorage.getItem('pixuli.utilityTools.enabled')).toBe('1');

    useUtilityToolsStore.getState().setEnabled(false);
    expect(isUtilityToolsEnabled()).toBe(false);
    expect(localStorage.getItem('pixuli.utilityTools.enabled')).toBe('0');
  });
});
