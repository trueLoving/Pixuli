import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { StorageProviderDiscovery } from '@pixuli/core/plugins';
import { GitPatConnectionFields } from './GitPatConnectionFields';
import {
  githubConfigModalTranslations,
  makeModalTranslate,
} from '../__tests__/modalTestFixtures';

vi.mock('@/storage/registry', () => ({
  listStoragePluginManifests: () => [
    {
      id: 'github',
      name: 'GitHub',
      version: '1.0.0',
      capabilities: {
        list: true,
        upload: true,
        delete: true,
        updateMetadata: true,
      },
      auth: {
        modes: ['pat'],
        tokenCreateUrl:
          'https://github.com/settings/tokens/new?scopes=repo&description=Pixuli',
        requiredScopes: ['repo'],
      },
    },
  ],
}));

vi.mock('@/storage/createProvider', () => ({
  createDiscoveryProvider: vi.fn(),
}));

const classes = {
  sectionTitle: 'title',
  group: 'group',
  row: 'row',
  label: 'label',
  required: 'required',
  input: 'input',
  description: 'desc',
};

const emptyValues = {
  owner: '',
  repo: '',
  branch: 'main',
  token: '',
  path: 'images',
};

describe('GitPatConnectionFields', () => {
  const t = makeModalTranslate(githubConfigModalTranslations);
  let discovery: StorageProviderDiscovery;

  beforeEach(() => {
    discovery = {
      validateToken: vi.fn(),
      listRepositories: vi.fn(),
      listBranches: vi.fn(),
    };
  });

  it('shows create-token link and scope hint', () => {
    render(
      <GitPatConnectionFields
        pluginId="github"
        labelPrefix="github.config"
        values={emptyValues}
        onChange={vi.fn()}
        t={t}
        classes={classes}
        discovery={discovery}
      />,
    );

    const createLink = screen.getByRole('link', { name: '创建令牌' });
    expect(createLink).toHaveAttribute(
      'href',
      'https://github.com/settings/tokens/new?scopes=repo&description=Pixuli',
    );
    expect(screen.getByText('所需权限：repo（读写仓库）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '校验令牌' })).toBeDisabled();
  });

  it('validates token then fills owner/repo/branch from lists', async () => {
    vi.mocked(discovery.validateToken).mockResolvedValue({
      ok: true,
      login: 'octocat',
      scopes: ['repo'],
    });
    vi.mocked(discovery.listRepositories).mockResolvedValue([
      {
        owner: 'octocat',
        name: 'pixuli',
        fullName: 'octocat/pixuli',
        private: true,
        defaultBranch: 'main',
      },
    ]);
    vi.mocked(discovery.listBranches).mockResolvedValue(['main', 'develop']);

    const onChange = vi.fn();
    const { rerender } = render(
      <GitPatConnectionFields
        pluginId="github"
        labelPrefix="github.config"
        values={{ ...emptyValues, token: 'ghp_test' }}
        onChange={onChange}
        t={t}
        classes={classes}
        discovery={discovery}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '校验令牌' }));

    await waitFor(() => {
      expect(screen.getByText('已验证：octocat')).toBeInTheDocument();
    });
    expect(discovery.listRepositories).toHaveBeenCalledWith('ghp_test');

    fireEvent.change(screen.getByLabelText('从列表选择仓库'), {
      target: { value: 'octocat/pixuli' },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        owner: 'octocat',
        repo: 'pixuli',
        branch: 'main',
        private: true,
      });
    });

    rerender(
      <GitPatConnectionFields
        pluginId="github"
        labelPrefix="github.config"
        values={{
          owner: 'octocat',
          repo: 'pixuli',
          branch: 'main',
          token: 'ghp_test',
          path: 'images',
        }}
        onChange={onChange}
        t={t}
        classes={classes}
        discovery={discovery}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('octocat/pixuli · 私有')).toBeInTheDocument();
    });
  });

  it('shows API error when token is invalid', async () => {
    vi.mocked(discovery.validateToken).mockResolvedValue({
      ok: false,
      message: 'Bad credentials',
    });

    render(
      <GitPatConnectionFields
        pluginId="github"
        labelPrefix="github.config"
        values={{ ...emptyValues, token: 'bad' }}
        onChange={vi.fn()}
        t={t}
        classes={classes}
        discovery={discovery}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '校验令牌' }));

    await waitFor(() => {
      expect(screen.getByText('Bad credentials')).toBeInTheDocument();
    });
  });
});
