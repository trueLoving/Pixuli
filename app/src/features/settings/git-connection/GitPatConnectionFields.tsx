import type {
  RemoteRepositoryRef,
  StorageProviderDiscovery,
} from '@pixuli/core/plugins';
import React, { useCallback, useMemo, useState } from 'react';
import { listStoragePluginManifests } from '@/storage/registry';
import { createDiscoveryProvider } from '@/storage/createProvider';
import './GitPatConnectionFields.css';

export type GitPatFieldValues = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  path: string;
  /** 从仓库列表选择时写入；手工改 owner/repo 会清除 */
  private?: boolean;
};

export type GitPatFieldClasses = {
  sectionTitle: string;
  group: string;
  row: string;
  label: string;
  required: string;
  input: string;
  description: string;
};

interface GitPatConnectionFieldsProps {
  pluginId: 'github' | 'gitee';
  labelPrefix: 'github.config' | 'gitee.config';
  values: GitPatFieldValues;
  onChange: (patch: Partial<GitPatFieldValues>) => void;
  t: (key: string) => string;
  classes: GitPatFieldClasses;
  discovery?: StorageProviderDiscovery;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  );
}

export const GitPatConnectionFields: React.FC<GitPatConnectionFieldsProps> = ({
  pluginId,
  labelPrefix,
  values,
  onChange,
  t,
  classes,
  discovery,
}) => {
  const manifest = useMemo(
    () => listStoragePluginManifests().find(item => item.id === pluginId),
    [pluginId],
  );
  const tokenCreateUrl = manifest?.auth?.tokenCreateUrl;
  const requiredScopes = manifest?.auth?.requiredScopes ?? [];

  const [status, setStatus] = useState<'idle' | 'validating' | 'ok' | 'error'>(
    'idle',
  );
  const [login, setLogin] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingScopes, setMissingScopes] = useState<string[]>([]);
  const [repositories, setRepositories] = useState<RemoteRepositoryRef[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoLoadError, setRepoLoadError] = useState<string | null>(null);

  const resolveDiscovery = useCallback((): StorageProviderDiscovery => {
    if (discovery) {
      return discovery;
    }
    return createDiscoveryProvider(pluginId);
  }, [discovery, pluginId]);

  const handleTokenChange = (token: string) => {
    setStatus('idle');
    setLogin(null);
    setErrorMessage(null);
    setMissingScopes([]);
    setRepositories([]);
    setBranches([]);
    setRepoLoadError(null);
    onChange({ token });
  };

  const loadBranches = useCallback(
    async (
      client: StorageProviderDiscovery,
      owner: string,
      repo: string,
      token: string,
    ) => {
      if (!owner || !repo || !token) {
        setBranches([]);
        return;
      }
      try {
        const names = await client.listBranches(token, owner, repo);
        setBranches(names);
      } catch {
        setBranches([]);
      }
    },
    [],
  );

  const handleValidate = async () => {
    setStatus('validating');
    setErrorMessage(null);
    setRepoLoadError(null);
    try {
      const client = resolveDiscovery();
      const result = await client.validateToken(values.token);
      if (!result.ok) {
        setStatus('error');
        setLogin(null);
        setErrorMessage(result.message || t('settings.pat.validateFailed'));
        return;
      }
      setStatus('ok');
      setLogin(result.login ?? null);
      const scopes = result.scopes ?? [];
      setMissingScopes(
        scopes.length > 0
          ? requiredScopes.filter(scope => !scopes.includes(scope))
          : [],
      );

      setLoadingRepos(true);
      try {
        const repos = await client.listRepositories(values.token);
        setRepositories(repos);
        const current = repos.find(
          item => item.owner === values.owner && item.name === values.repo,
        );
        if (current) {
          onChange({ private: current.private });
          await loadBranches(client, current.owner, current.name, values.token);
        }
      } catch {
        setRepoLoadError(t('settings.pat.loadReposFailed'));
        setRepositories([]);
      } finally {
        setLoadingRepos(false);
      }
    } catch {
      setStatus('error');
      setLogin(null);
      setErrorMessage(t('settings.pat.validateFailed'));
    }
  };

  const handleSelectRepo = async (fullName: string) => {
    const selected = repositories.find(item => item.fullName === fullName);
    if (!selected) {
      return;
    }
    const nextBranch = selected.defaultBranch || values.branch;
    onChange({
      owner: selected.owner,
      repo: selected.name,
      branch: nextBranch,
      private: selected.private,
    });
    try {
      const client = resolveDiscovery();
      await loadBranches(client, selected.owner, selected.name, values.token);
    } catch {
      setBranches([]);
    }
  };

  const selectedRepoValue =
    repositories.find(
      item => item.owner === values.owner && item.name === values.repo,
    )?.fullName ?? '';

  return (
    <>
      <div className={classes.group}>
        <h3 className={classes.sectionTitle}>{t('settings.pat.authTitle')}</h3>
        <label className={classes.label}>
          {t(`${labelPrefix}.token`)}{' '}
          <span className={classes.required}>
            {t(`${labelPrefix}.required`)}
          </span>
        </label>
        <input
          type="password"
          value={values.token}
          onChange={event => handleTokenChange(event.target.value)}
          placeholder={t(`${labelPrefix}.tokenPlaceholder`)}
          className={classes.input}
          required
          autoComplete="off"
        />
        {requiredScopes.length > 0 ? (
          <p className={classes.description}>
            {interpolate(t('settings.pat.scopeHint'), {
              scopes: requiredScopes.join(', '),
            })}
          </p>
        ) : (
          <p className={classes.description}>
            {t(`${labelPrefix}.tokenDescription`)}
          </p>
        )}
        <div className="git-pat-actions">
          {tokenCreateUrl ? (
            <a
              className="git-pat-link"
              href={tokenCreateUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('settings.pat.createToken')}
            </a>
          ) : null}
          <button
            type="button"
            className="git-pat-validate"
            onClick={() => void handleValidate()}
            disabled={!values.token.trim() || status === 'validating'}
          >
            {status === 'validating'
              ? t('settings.pat.validating')
              : t('settings.pat.validateToken')}
          </button>
        </div>
        {status === 'ok' && login ? (
          <p className="git-pat-status git-pat-status--ok">
            {interpolate(t('settings.pat.validatedAs'), { login })}
          </p>
        ) : null}
        {status === 'error' ? (
          <p className="git-pat-status git-pat-status--error">
            {errorMessage || t('settings.pat.validateFailed')}
          </p>
        ) : null}
        {missingScopes.length > 0 ? (
          <p className="git-pat-status git-pat-status--error">
            {interpolate(t('settings.pat.scopeMissing'), {
              scopes: missingScopes.join(', '),
            })}
          </p>
        ) : null}
      </div>

      <div className={classes.group}>
        <h3 className={classes.sectionTitle}>
          {t('settings.pat.locationTitle')}
        </h3>
        {loadingRepos ? (
          <p className={classes.description}>
            {t('settings.pat.loadingRepos')}
          </p>
        ) : null}
        {repoLoadError ? (
          <p className="git-pat-status git-pat-status--error">
            {repoLoadError}
          </p>
        ) : null}
        {repositories.length > 0 ? (
          <div className={classes.group}>
            <label className={classes.label} htmlFor="git-pat-repo">
              {t('settings.pat.pickRepo')}
            </label>
            <select
              id="git-pat-repo"
              className={classes.input}
              value={selectedRepoValue}
              onChange={event => void handleSelectRepo(event.target.value)}
            >
              <option value="">{t('settings.pat.pickRepo')}</option>
              {repositories.map(item => (
                <option key={item.fullName} value={item.fullName}>
                  {item.fullName}
                  {item.private ? ` · ${t('settings.pat.privateRepo')}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className={classes.row}>
          <div className={classes.group}>
            <label className={classes.label}>
              {t(`${labelPrefix}.username`)}{' '}
              <span className={classes.required}>
                {t(`${labelPrefix}.required`)}
              </span>
            </label>
            <input
              type="text"
              value={values.owner}
              onChange={event =>
                onChange({ owner: event.target.value, private: false })
              }
              placeholder={t(`${labelPrefix}.usernamePlaceholder`)}
              className={classes.input}
              required
            />
          </div>
          <div className={classes.group}>
            <label className={classes.label}>
              {t(`${labelPrefix}.repository`)}{' '}
              <span className={classes.required}>
                {t(`${labelPrefix}.required`)}
              </span>
            </label>
            <input
              type="text"
              value={values.repo}
              onChange={event =>
                onChange({ repo: event.target.value, private: false })
              }
              placeholder={t(`${labelPrefix}.repositoryPlaceholder`)}
              className={classes.input}
              required
            />
          </div>
        </div>

        {branches.length > 0 ? (
          <div className={classes.group}>
            <label className={classes.label} htmlFor="git-pat-branch">
              {t('settings.pat.pickBranch')}
            </label>
            <select
              id="git-pat-branch"
              className={classes.input}
              value={branches.includes(values.branch) ? values.branch : ''}
              onChange={event => onChange({ branch: event.target.value })}
            >
              <option value="">{t('settings.pat.pickBranch')}</option>
              {branches.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className={classes.row}>
          <div className={classes.group}>
            <label className={classes.label}>
              {t(`${labelPrefix}.branch`)}{' '}
              <span className={classes.required}>
                {t(`${labelPrefix}.required`)}
              </span>
            </label>
            <input
              type="text"
              value={values.branch}
              onChange={event => onChange({ branch: event.target.value })}
              placeholder={t(`${labelPrefix}.branchPlaceholder`)}
              className={classes.input}
              required
            />
          </div>
        </div>

        <details className="git-pat-advanced">
          <summary>{t('settings.pat.advancedPath')}</summary>
          <div className="git-pat-advanced-body">
            <div className={classes.group}>
              <label className={classes.label}>
                {t(`${labelPrefix}.path`)}{' '}
                <span className={classes.required}>
                  {t(`${labelPrefix}.required`)}
                </span>
              </label>
              <input
                type="text"
                value={values.path}
                onChange={event => onChange({ path: event.target.value })}
                placeholder={t(`${labelPrefix}.pathPlaceholder`)}
                className={classes.input}
                required
              />
              <p className={classes.description}>
                {t('settings.pat.pathHint')}
              </p>
            </div>
          </div>
        </details>
      </div>
    </>
  );
};
