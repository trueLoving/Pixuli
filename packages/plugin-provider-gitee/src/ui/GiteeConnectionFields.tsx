import type {
  RemoteRepositoryRef,
  StorageProviderConfig,
  StorageProviderDiscovery,
} from '@pixuli/core/plugins';
import React, { useCallback, useState } from 'react';
import { giteeManifest } from '../manifest';
import {
  mergeFieldPatch,
  storageConfigToFields,
  type GiteeFieldValues,
} from './config';
import './ConnectionFields.css';

export type GiteeConnectionFieldsProps = {
  pluginId: string;
  labelPrefix: string;
  config: StorageProviderConfig;
  onChange: (config: StorageProviderConfig) => void;
  t: (key: string) => string;
  classes: Record<string, string>;
  discovery?: StorageProviderDiscovery;
  resolveDiscovery?: () => StorageProviderDiscovery;
  section: 'auth' | 'location';
  onValidatedChange?: (ok: boolean) => void;
};

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  );
}

export const GiteeConnectionFields: React.FC<GiteeConnectionFieldsProps> = ({
  labelPrefix,
  config,
  onChange,
  t,
  classes,
  discovery,
  resolveDiscovery,
  section,
  onValidatedChange,
}) => {
  const values = storageConfigToFields(config);
  const patch = (next: Partial<GiteeFieldValues>) =>
    onChange(mergeFieldPatch(config, next));

  const tokenCreateUrl = giteeManifest.auth?.tokenCreateUrl;
  const requiredScopes = giteeManifest.auth?.requiredScopes ?? [];

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

  const getDiscovery = useCallback((): StorageProviderDiscovery => {
    if (discovery) return discovery;
    if (resolveDiscovery) return resolveDiscovery();
    throw new Error('GiteeConnectionFields: discovery is required');
  }, [discovery, resolveDiscovery]);

  const handleTokenChange = (token: string) => {
    setStatus('idle');
    setLogin(null);
    setErrorMessage(null);
    setMissingScopes([]);
    setRepositories([]);
    setBranches([]);
    setRepoLoadError(null);
    onValidatedChange?.(false);
    patch({ token });
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
      const client = getDiscovery();
      const result = await client.validateToken(values.token);
      if (!result.ok) {
        setStatus('error');
        setLogin(null);
        onValidatedChange?.(false);
        setErrorMessage(result.message || t('settings.pat.validateFailed'));
        return;
      }
      setStatus('ok');
      onValidatedChange?.(true);
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
          patch({ private: current.private });
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
      onValidatedChange?.(false);
      setErrorMessage(t('settings.pat.validateFailed'));
    }
  };

  const handleSelectRepo = async (fullName: string) => {
    const selected = repositories.find(item => item.fullName === fullName);
    if (!selected) return;
    const nextBranch = selected.defaultBranch || values.branch;
    patch({
      owner: selected.owner,
      repo: selected.name,
      branch: nextBranch,
      private: selected.private,
    });
    try {
      const client = getDiscovery();
      await loadBranches(client, selected.owner, selected.name, values.token);
    } catch {
      setBranches([]);
    }
  };

  const selectedRepoValue =
    repositories.find(
      item => item.owner === values.owner && item.name === values.repo,
    )?.fullName ?? '';

  const showAuth = section === 'auth';
  const showLocation = section === 'location';

  return (
    <>
      {showAuth ? (
        <div className={classes.group}>
          <h3 className={classes.sectionTitle}>
            {t('settings.pat.authTitle')}
          </h3>
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
      ) : null}

      {showLocation ? (
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
              <label className={classes.label} htmlFor="gitee-conn-repo">
                {t('settings.pat.pickRepo')}
              </label>
              <select
                id="gitee-conn-repo"
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
                  patch({ owner: event.target.value, private: false })
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
                  patch({ repo: event.target.value, private: false })
                }
                placeholder={t(`${labelPrefix}.repositoryPlaceholder`)}
                className={classes.input}
                required
              />
            </div>
          </div>

          {branches.length > 0 ? (
            <div className={classes.group}>
              <label className={classes.label} htmlFor="gitee-conn-branch">
                {t('settings.pat.pickBranch')}
              </label>
              <select
                id="gitee-conn-branch"
                className={classes.input}
                value={branches.includes(values.branch) ? values.branch : ''}
                onChange={event => patch({ branch: event.target.value })}
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
                onChange={event => patch({ branch: event.target.value })}
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
                  onChange={event => patch({ path: event.target.value })}
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
      ) : null}
    </>
  );
};
