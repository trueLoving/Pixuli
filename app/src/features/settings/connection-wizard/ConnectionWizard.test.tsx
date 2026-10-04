import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { StoragePluginManifest } from '@pixuli/core/plugins';
import type { StorageProviderDiscovery } from '@pixuli/core/plugins';
import { ConnectionWizard } from './ConnectionWizard';
import {
  githubConfigModalTranslations,
  makeModalTranslate,
} from '../__tests__/modalTestFixtures';

const handleSaveConfig = vi.fn();
const prepareNewSource = vi.fn();
const openSyncDirectionModal = vi.fn();
const closeSettingsModal = vi.fn();
const onComplete = vi.fn();

vi.mock('@/features/settings/useConfigManagement', () => ({
  useConfigManagement: () => ({ handleSaveConfig }),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      prepareNewSource,
      openSyncDirectionModal,
      closeSettingsModal,
    }),
}));

vi.mock('@/ui/feedback/toast', () => ({
  showSuccess: vi.fn(),
}));

vi.mock('@/storage/registry', () => ({
  listStoragePluginManifests: () => [
    {
      id: 'github',
      name: 'GitHub',
      auth: {
        modes: ['pat'],
        tokenCreateUrl: 'https://github.com/settings/tokens/new',
        requiredScopes: ['repo'],
      },
    },
  ],
}));

vi.mock('@/storage/createProvider', () => ({
  createDiscoveryProvider: vi.fn(),
}));

const manifests: StoragePluginManifest[] = [
  {
    id: 'github',
    name: 'GitHub',
    version: '1.0.0',
    capabilities: {
      list: true,
      upload: true,
      delete: true,
      updateMetadata: true,
      sync: true,
      publicUrl: true,
    },
    auth: { modes: ['pat'], requiredScopes: ['repo'] },
  },
  {
    id: 'gitee',
    name: 'Gitee',
    version: '1.0.0',
    capabilities: {
      list: true,
      upload: true,
      delete: true,
      updateMetadata: true,
      sync: true,
      publicUrl: true,
    },
    auth: { modes: ['pat'] },
  },
];

const copy = {
  ...githubConfigModalTranslations,
  'settings.wizardShellTitle': '添加连接',
  'settings.wizardEditTitle': '编辑连接',
  'settings.wizardStepService': '选服务',
  'settings.wizardStepAuth': '授权',
  'settings.wizardStepLocation': '选位置',
  'settings.wizardStepDone': '完成',
  'settings.wizardContinue': '继续',
  'settings.wizardBack': '上一步',
  'settings.wizardFinish': '完成',
  'settings.wizardFinishAndSync': '完成并选择同步',
  'settings.wizardDoneHint': '保存后出现在连接列表。不会自动开始同步。',
  'settings.wizardEditDoneHint': '保存后更新当前连接。不会自动开始同步。',
  'settings.purposeDefaultSync': '默认同步',
  'settings.purposeBackup': '仅备份同步',
  'settings.upcomingTitle': '即将支持',
  'settings.comingSoon': '即将支持',
  'common.cancel': '取消',
};

describe('ConnectionWizard', () => {
  let discovery: StorageProviderDiscovery;

  beforeEach(() => {
    handleSaveConfig.mockReset();
    prepareNewSource.mockReset();
    openSyncDirectionModal.mockReset();
    closeSettingsModal.mockReset();
    onComplete.mockReset();
    discovery = {
      validateToken: vi.fn().mockResolvedValue({ ok: true, login: 'octo' }),
      listRepositories: vi.fn().mockResolvedValue([
        {
          owner: 'octo',
          name: 'pics',
          fullName: 'octo/pics',
          private: false,
          defaultBranch: 'main',
        },
      ]),
      listBranches: vi.fn().mockResolvedValue(['main']),
    };
  });

  it('uses one shell and only renders PAT when declared', async () => {
    render(
      <ConnectionWizard
        manifests={manifests}
        t={makeModalTranslate(copy)}
        onCancel={vi.fn()}
        onComplete={onComplete}
        discovery={discovery}
      />,
    );

    expect(screen.getByText('添加连接')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /oauth/i })).toBeNull();
    expect(screen.getByText('OneDrive')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'OneDrive' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /GitHub/ }));
    fireEvent.click(screen.getByRole('button', { name: '继续' }));

    expect(
      screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '选位置' }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx'), {
      target: { value: 'ghp_test' },
    });
    fireEvent.click(screen.getByRole('button', { name: '校验令牌' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '继续' })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole('button', { name: '继续' }));

    expect(screen.getByRole('heading', { name: '选位置' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'octo/pics' },
    });
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    fireEvent.click(screen.getByRole('button', { name: '完成' }));

    expect(prepareNewSource).toHaveBeenCalledWith('github', 'defaultSync');
    expect(handleSaveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'octo',
        repo: 'pics',
        token: 'ghp_test',
      }),
      null,
    );
    expect(onComplete).toHaveBeenCalled();
    expect(openSyncDirectionModal).not.toHaveBeenCalled();
  });

  it('opens add wizard on auth when a service is prefilled', () => {
    render(
      <ConnectionWizard
        manifests={manifests}
        t={makeModalTranslate(copy)}
        onCancel={vi.fn()}
        onComplete={onComplete}
        discovery={discovery}
        initialPluginId="github"
      />,
    );

    expect(screen.getByText('添加连接')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Gitee|码/ })).toBeNull();
  });

  it('edits an existing connection without recreating the source', async () => {
    render(
      <ConnectionWizard
        manifests={manifests}
        t={makeModalTranslate(copy)}
        onCancel={vi.fn()}
        onComplete={onComplete}
        discovery={discovery}
        editSourceId="src-1"
        initialPluginId="github"
        initialValues={{
          owner: 'octo',
          repo: 'pics',
          branch: 'main',
          token: 'ghp_existing',
          path: 'images',
        }}
      />,
    );

    expect(screen.getByText('编辑连接')).toBeInTheDocument();
    expect(screen.queryByText('选服务')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxx')).toHaveValue(
      'ghp_existing',
    );

    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    expect(screen.getByRole('heading', { name: '选位置' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    fireEvent.click(screen.getByRole('button', { name: '完成' }));

    expect(prepareNewSource).not.toHaveBeenCalled();
    expect(handleSaveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'octo',
        repo: 'pics',
        token: 'ghp_existing',
      }),
      'src-1',
    );
    expect(onComplete).toHaveBeenCalled();
  });
});
