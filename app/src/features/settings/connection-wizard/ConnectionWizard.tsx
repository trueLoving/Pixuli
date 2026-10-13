import type { StoragePluginManifest } from '@pixuli/core/plugins';
import type { StorageProviderDiscovery } from '@pixuli/core/plugins';
import { Github, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useConfigManagement } from '@/features/settings/useConfigManagement';
import {
  GitPatConnectionFields,
  type GitPatFieldValues,
} from '@/features/settings/git-connection/GitPatConnectionFields';
import {
  OneDriveConnectionFields,
  type OneDriveFieldValues,
} from '@/features/settings/connection-wizard/OneDriveConnectionFields';
import { useSourceStore } from '@/features/settings/sourceStore';
import type { ConnectionPurpose } from '@/features/source-type/connectionPurpose';
import { UPCOMING_CONNECTORS } from '@/features/source-type/upcomingConnectors';
import { showSuccess } from '@/ui/feedback/toast';
import { useUIStore } from '@/stores/uiStore';

type WizardStep = 'service' | 'auth' | 'location' | 'done';
type GitPluginId = 'github' | 'gitee';
type WizardPluginId = GitPluginId | 'onedrive';

const STEPS: WizardStep[] = ['service', 'auth', 'location', 'done'];
const EDIT_STEPS: WizardStep[] = ['auth', 'location', 'done'];

const FIELD_CLASSES = {
  sectionTitle: 'text-sm font-semibold text-gray-900',
  group: 'space-y-1',
  row: 'grid gap-3 sm:grid-cols-2',
  label: 'block text-xs font-medium text-gray-700',
  required: 'text-red-500',
  input:
    'mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm',
  description: 'text-xs text-gray-500',
};

const EMPTY_VALUES: GitPatFieldValues = {
  owner: '',
  repo: '',
  branch: 'main',
  token: '',
  path: 'images',
};

export interface ConnectionWizardProps {
  manifests: StoragePluginManifest[];
  t: (key: string) => string;
  onCancel: () => void;
  onComplete: () => void;
  discovery?: StorageProviderDiscovery;
  /** 传入时为编辑已有连接：跳过「选服务」，预填仓库与令牌 */
  editSourceId?: string | null;
  initialPluginId?: WizardPluginId | null;
  initialValues?: GitPatFieldValues | null;
  initialOneDrive?: OneDriveFieldValues | null;
}

function stepLabelKey(step: WizardStep): string {
  switch (step) {
    case 'service':
      return 'settings.wizardStepService';
    case 'auth':
      return 'settings.wizardStepAuth';
    case 'location':
      return 'settings.wizardStepLocation';
    default:
      return 'settings.wizardStepDone';
  }
}

function supportsPat(manifest: StoragePluginManifest | undefined): boolean {
  const modes = manifest?.auth?.modes ?? ['pat'];
  return modes.includes('pat');
}

function isGitPluginId(id: string | null | undefined): id is GitPluginId {
  return id === 'github' || id === 'gitee';
}

function isWizardPluginId(id: string | null | undefined): id is WizardPluginId {
  return id === 'github' || id === 'gitee' || id === 'onedrive';
}

const EMPTY_ONEDRIVE: OneDriveFieldValues = {
  clientId: '',
  accessToken: '',
  refreshToken: '',
  path: 'Pixuli',
};

export const ConnectionWizard: React.FC<ConnectionWizardProps> = ({
  manifests,
  t,
  onCancel,
  onComplete,
  discovery,
  editSourceId = null,
  initialPluginId = null,
  initialValues = null,
  initialOneDrive = null,
}) => {
  const isEdit = Boolean(editSourceId && isWizardPluginId(initialPluginId));
  const startWithPlugin = !isEdit && isWizardPluginId(initialPluginId);
  const prepareNewSource = useUIStore(state => state.prepareNewSource);
  const openSyncDirectionModal = useUIStore(
    state => state.openSyncDirectionModal,
  );
  const closeSettingsModal = useUIStore(state => state.closeSettingsModal);
  const { handleSaveConfig } = useConfigManagement();
  const addSource = useSourceStore(state => state.addSource);
  const updateSource = useSourceStore(state => state.updateSource);
  const setSelectedSourceId = useSourceStore(
    state => state.setSelectedSourceId,
  );

  const steps = isEdit ? EDIT_STEPS : STEPS;
  const [step, setStep] = useState<WizardStep>(
    isEdit || startWithPlugin ? 'auth' : 'service',
  );
  const [pluginId, setPluginId] = useState<WizardPluginId | null>(
    isWizardPluginId(initialPluginId) ? initialPluginId : null,
  );
  const [purpose, setPurpose] = useState<ConnectionPurpose>('defaultSync');
  const [values, setValues] = useState<GitPatFieldValues>(
    initialValues ?? EMPTY_VALUES,
  );
  const [oneDrive, setOneDrive] = useState<OneDriveFieldValues>(
    initialOneDrive ?? EMPTY_ONEDRIVE,
  );
  const [tokenOk, setTokenOk] = useState(
    (isEdit && Boolean(initialValues?.token?.trim())) ||
      (isEdit &&
        initialPluginId === 'onedrive' &&
        Boolean(initialOneDrive?.accessToken.trim())),
  );
  const [patMounted, setPatMounted] = useState(isEdit || startWithPlugin);

  const manifest = useMemo(
    () => manifests.find(item => item.id === pluginId),
    [manifests, pluginId],
  );
  const patAvailable = supportsPat(manifest);
  const stepIndex = steps.indexOf(step);
  const locationReady =
    pluginId === 'onedrive'
      ? Boolean(oneDrive.path.trim() && oneDrive.accessToken.trim())
      : Boolean(
          values.owner.trim() &&
            values.repo.trim() &&
            values.branch.trim() &&
            values.path.trim(),
        );

  const goAuth = () => {
    if (!pluginId) return;
    if (pluginId !== 'onedrive' && !patAvailable) return;
    setPatMounted(true);
    setStep('auth');
  };

  const finish = (syncNow: boolean) => {
    if (!pluginId) return;
    if (pluginId === 'onedrive') {
      const config = {
        accessToken: oneDrive.accessToken.trim(),
        path: oneDrive.path.trim() || 'Pixuli',
        ...(oneDrive.refreshToken.trim()
          ? { refreshToken: oneDrive.refreshToken.trim() }
          : {}),
        ...(oneDrive.clientId.trim()
          ? { clientId: oneDrive.clientId.trim() }
          : {}),
        ...(oneDrive.expiresAt ? { expiresAt: oneDrive.expiresAt } : {}),
        connectionPurpose: purpose,
      };
      if (isEdit && editSourceId) {
        updateSource(editSourceId, { pluginId: 'onedrive', config });
      } else {
        const entry = addSource({
          pluginId: 'onedrive',
          label: 'OneDrive',
          config,
        });
        if (purpose === 'defaultSync') {
          setSelectedSourceId(entry.id);
        }
      }
      showSuccess(t('messages.configSaved'));
      onComplete();
      if (syncNow) {
        closeSettingsModal();
        openSyncDirectionModal();
      }
      return;
    }
    if (isEdit && editSourceId) {
      handleSaveConfig(values, editSourceId);
    } else {
      prepareNewSource(pluginId, purpose);
      handleSaveConfig(values, null);
    }
    showSuccess(t('messages.configSaved'));
    onComplete();
    if (syncNow) {
      closeSettingsModal();
      openSyncDirectionModal();
    }
  };

  return (
    <div className="pix-panel-soft mt-4 rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">
          {isEdit
            ? t('settings.wizardEditTitle')
            : t('settings.wizardShellTitle')}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-gray-500 hover:bg-white hover:text-gray-800"
          aria-label={t('common.cancel')}
        >
          <X size={16} />
        </button>
      </div>

      {isEdit && pluginId ? (
        <p className="mb-3 text-xs text-gray-500">
          {manifest?.name ?? pluginId}
        </p>
      ) : null}

      <ol className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500">
        {steps.map((item, index) => (
          <li
            key={item}
            className={
              index === stepIndex ? 'font-semibold text-gray-900' : undefined
            }
            aria-current={index === stepIndex ? 'step' : undefined}
          >
            {index + 1}. {t(stepLabelKey(item))}
          </li>
        ))}
      </ol>

      {step === 'service' ? (
        <div className="space-y-3">
          {manifests.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!isWizardPluginId(item.id)) return;
                setPluginId(item.id);
                setValues(EMPTY_VALUES);
                setOneDrive(EMPTY_ONEDRIVE);
                setTokenOk(false);
                setPatMounted(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg border bg-white p-3 text-left ${
                pluginId === item.id
                  ? 'border-[var(--pix-violet)]'
                  : 'border-gray-200'
              }`}
            >
              {item.id === 'github' ? (
                <Github size={18} />
              ) : item.id === 'onedrive' ? (
                <span className="text-xs font-bold text-sky-700">云</span>
              ) : (
                <span className="text-xs font-bold text-red-600">码</span>
              )}
              <span className="text-sm font-semibold text-gray-900">
                {item.name}
              </span>
            </button>
          ))}
          {pluginId ? (
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="wizard-purpose"
                  checked={purpose === 'defaultSync'}
                  onChange={() => setPurpose('defaultSync')}
                />
                {t('settings.purposeDefaultSync')}
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="wizard-purpose"
                  checked={purpose === 'backup'}
                  onChange={() => setPurpose('backup')}
                />
                {t('settings.purposeBackup')}
              </label>
            </div>
          ) : null}
          <p className="pt-1 text-xs font-medium text-gray-500">
            {t('settings.upcomingTitle')}
          </p>
          {UPCOMING_CONNECTORS.map(item => (
            <div
              key={item.id}
              className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            >
              {item.name}
              <span className="ml-2 text-[10px]">
                {t('settings.comingSoon')}
              </span>
            </div>
          ))}
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-md pix-btn-primary px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={!pluginId || (pluginId !== 'onedrive' && !patAvailable)}
              onClick={goAuth}
            >
              {t('settings.wizardContinue')}
            </button>
          </div>
        </div>
      ) : null}

      {patMounted && pluginId === 'onedrive' && step === 'auth' ? (
        <OneDriveConnectionFields
          purpose={purpose}
          editSourceId={editSourceId}
          t={t}
        />
      ) : null}

      {patMounted && isGitPluginId(pluginId) ? (
        <div hidden={step !== 'auth' && step !== 'location'}>
          {step === 'auth' && !patAvailable ? (
            <p className="text-sm text-gray-600">
              {t('settings.wizardAuthUnavailable')}
            </p>
          ) : (
            <GitPatConnectionFields
              pluginId={pluginId}
              labelPrefix={
                pluginId === 'gitee' ? 'gitee.config' : 'github.config'
              }
              values={values}
              onChange={patch =>
                setValues(current => ({ ...current, ...patch }))
              }
              t={t}
              classes={FIELD_CLASSES}
              discovery={discovery}
              section={step === 'location' ? 'location' : 'auth'}
              onValidatedChange={setTokenOk}
            />
          )}
        </div>
      ) : null}

      {step === 'done' && pluginId ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-800">
            {pluginId === 'onedrive'
              ? `${manifest?.name} · ${oneDrive.path}`
              : `${manifest?.name} · ${values.owner}/${values.repo} · ${values.branch}`}
          </p>
          <p className="text-xs text-gray-500">
            {isEdit
              ? t('settings.wizardEditDoneHint')
              : t('settings.wizardDoneHint')}
          </p>
        </div>
      ) : null}

      {step !== 'service' ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-white"
            onClick={() => {
              if (step === 'auth' && isEdit) {
                onCancel();
                return;
              }
              const prev = steps[stepIndex - 1];
              if (prev) setStep(prev);
            }}
          >
            {t('settings.wizardBack')}
          </button>
          {step === 'auth' && pluginId !== 'onedrive' ? (
            <button
              type="button"
              className="rounded-md pix-btn-primary px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={!tokenOk}
              onClick={() => setStep('location')}
            >
              {t('settings.wizardContinue')}
            </button>
          ) : null}
          {step === 'location' ? (
            <button
              type="button"
              className="rounded-md pix-btn-primary px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={!locationReady}
              onClick={() => setStep('done')}
            >
              {t('settings.wizardContinue')}
            </button>
          ) : null}
          {step === 'done' ? (
            <>
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                onClick={() => finish(false)}
              >
                {t('settings.wizardFinish')}
              </button>
              <button
                type="button"
                className="rounded-md pix-btn-primary px-3 py-1.5 text-sm"
                onClick={() => finish(true)}
              >
                {t('settings.wizardFinishAndSync')}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
