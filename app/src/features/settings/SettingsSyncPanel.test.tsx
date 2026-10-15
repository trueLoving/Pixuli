import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsSyncPanel } from './SettingsSyncPanel';
import { useSourceStore } from '@/features/settings/sourceStore';
import { useUIStore } from '@/stores/uiStore';

const githubSource = {
  id: 'gh-1',
  label: 'alpha/repo',
  pluginId: 'github' as const,
  config: {
    owner: 'alpha',
    repo: 'repo',
    branch: 'main',
    token: 'token-alpha',
    path: 'images',
  },
  createdAt: 1,
  updatedAt: 1,
};

const giteeSource = {
  id: 'gt-1',
  label: 'beta/repo',
  pluginId: 'gitee' as const,
  config: {
    owner: 'beta',
    repo: 'repo',
    branch: 'master',
    token: 'token-beta',
    path: 'images',
  },
  createdAt: 2,
  updatedAt: 2,
};

function tokenInput(): HTMLInputElement {
  const input = document.querySelector('input[type="password"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('token input missing');
  }
  return input;
}

function sourceCard(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { name });
  const card = heading.closest('article');
  if (!card) {
    throw new Error(`missing card for ${name}`);
  }
  return card;
}

describe('SettingsSyncPanel edit', () => {
  beforeEach(() => {
    useSourceStore.setState({
      sources: [githubSource, giteeSource],
      selectedSourceId: 'gh-1',
    });
    useUIStore.setState({
      editingSourceId: null,
      editingSourcePluginId: null,
      editingSourceRepoConfig: null,
      showConfigModal: false,
      settingsSyncAddOpen: false,
    });
  });

  it('opens another source when its edit icon is clicked during an edit', () => {
    render(<SettingsSyncPanel t={key => key} />);

    const editButtons = screen.getAllByRole('button', {
      name: 'sidebar.editSource',
    });
    expect(editButtons).toHaveLength(2);

    fireEvent.click(editButtons[0]);
    expect(tokenInput().value).toBe('token-alpha');

    const stillThere = screen.getAllByRole('button', {
      name: 'sidebar.editSource',
    });
    expect(stillThere[1]).toBeEnabled();
    fireEvent.click(stillThere[1]);

    expect(useUIStore.getState().editingSourceId).toBe('gt-1');
    expect(tokenInput().value).toBe('token-beta');
    expect(screen.getByText('Gitee · beta/repo')).toBeInTheDocument();

    const editingCard = sourceCard('beta/repo');
    const syncCard = sourceCard('alpha/repo');
    expect(editingCard).toHaveAttribute('aria-current', 'true');
    expect(editingCard.className).toContain('border-[var(--pix-violet)]');
    expect(editingCard).toHaveTextContent('settings.editingSource');
    expect(syncCard).not.toHaveAttribute('aria-current');
    expect(syncCard.className).not.toContain('border-[var(--pix-violet)]');
    expect(syncCard).toHaveTextContent('settings.currentSyncTarget');
  });
});
