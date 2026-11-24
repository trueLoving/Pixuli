import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { StorageProviderDiscovery } from '@pixuli/core/plugins';
import { GitHubConnectionFields } from './GitHubConnectionFields';

const translations: Record<string, string> = {
  'github.config.username': 'GitHub 用户名',
  'github.config.repository': '仓库名称',
  'github.config.branch': '分支名称',
  'github.config.path': '图片存储路径',
  'github.config.token': 'GitHub Token',
  'github.config.usernamePlaceholder': '您的 GitHub 用户名或组织名',
  'github.config.repositoryPlaceholder': '用于存储图片的仓库名称',
  'github.config.branchPlaceholder': '通常为 main 或 master',
  'github.config.pathPlaceholder': '仓库中存储图片的文件夹路径',
  'github.config.tokenPlaceholder': 'ghp_xxxxxxxxxxxxxxxxxxxx',
  'github.config.tokenDescription': '需要 repo 权限的 Personal Access Token',
  'github.config.required': '*',
  'settings.pat.authTitle': '授权',
  'settings.pat.locationTitle': '选位置',
  'settings.pat.createToken': '创建令牌',
  'settings.pat.validateToken': '校验令牌',
  'settings.pat.validating': '正在校验…',
  'settings.pat.validatedAs': '已验证：{login}',
  'settings.pat.validateFailed': '令牌无效，请检查后重试',
  'settings.pat.scopeHint': '所需权限：{scopes}（读写仓库）',
  'settings.pat.scopeMissing': '当前令牌可能缺少权限：{scopes}',
  'settings.pat.pickRepo': '从列表选择仓库',
  'settings.pat.privateRepo': '私有',
  'settings.pat.loadingRepos': '正在加载仓库列表…',
  'settings.pat.loadReposFailed': '无法加载仓库列表，请手动填写',
  'settings.pat.pickBranch': '选择分支',
  'settings.pat.advancedPath': '挂载路径（高级）',
  'settings.pat.pathHint': '仓库内同步根目录，一般保持默认即可。',
};

const t = (key: string) => translations[key] || key;

const classes = {
  sectionTitle: 'title',
  group: 'group',
  row: 'row',
  label: 'label',
  required: 'required',
  input: 'input',
  description: 'desc',
};

describe('GitHubConnectionFields', () => {
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
      <GitHubConnectionFields
        pluginId="github"
        labelPrefix="github.config"
        config={{}}
        onChange={vi.fn()}
        t={t}
        classes={classes}
        discovery={discovery}
        section="auth"
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
      <GitHubConnectionFields
        pluginId="github"
        labelPrefix="github.config"
        config={{ token: 'ghp_test' }}
        onChange={onChange}
        t={t}
        classes={classes}
        discovery={discovery}
        section="auth"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '校验令牌' }));

    await waitFor(() => {
      expect(screen.getByText('已验证：octocat')).toBeInTheDocument();
    });
    expect(discovery.listRepositories).toHaveBeenCalledWith('ghp_test');

    rerender(
      <GitHubConnectionFields
        pluginId="github"
        labelPrefix="github.config"
        config={{ token: 'ghp_test' }}
        onChange={onChange}
        t={t}
        classes={classes}
        discovery={discovery}
        section="location"
      />,
    );

    fireEvent.change(screen.getByLabelText('从列表选择仓库'), {
      target: { value: 'octocat/pixuli' },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'octocat',
          repo: 'pixuli',
          branch: 'main',
          private: true,
          token: 'ghp_test',
        }),
      );
    });

    rerender(
      <GitHubConnectionFields
        pluginId="github"
        labelPrefix="github.config"
        config={{
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
        section="location"
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
      <GitHubConnectionFields
        pluginId="github"
        labelPrefix="github.config"
        config={{ token: 'bad' }}
        onChange={vi.fn()}
        t={t}
        classes={classes}
        discovery={discovery}
        section="auth"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '校验令牌' }));

    await waitFor(() => {
      expect(screen.getByText('Bad credentials')).toBeInTheDocument();
    });
  });
});
