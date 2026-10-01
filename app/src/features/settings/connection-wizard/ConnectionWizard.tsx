import type { StoragePluginManifest } from '@pixuli/core/plugins';
import type { StorageProviderDiscovery } from '@pixuli/core/plugins';
import { Github, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useConfigManagement } from '@/features/settings/useConfigManagement';
import {
  GitPatConnectionFields,
  type GitPatFieldValues,
} from '@/features/settings/git-connection/GitPatConnectionFields';
import type { ConnectionPurpose } from '@/features/source-type/connectionPurpose';
import { UPCOMING_CONNECTORS } from '@/features/source-type/upcomingConnectors';
import { showSuccess } from '@/ui/feedback/toast';
import { useUIStore } from '@/stores/uiStore';

type WizardStep = 'service' | 'auth' | 'location' | 'done';

const STEPS: WizardStep[] = ['service', 'auth', 'location', 'done'];

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

interface ConnectionWizardProps {
  manifests: StoragePluginManifest[];
  t: (key: string) => string;
  onCancel: () => void;
  onComplete: () => void;
  discovery?: StorageProviderDiscovery;
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

export const ConnectionWizard: React.FC<ConnectionWizardProps> = ({
  manifests,
  t,
  onCancel,
  onComplete,
  discovery,
}) => {
  const prepareNewSource = useUIStore(state => state.prepareNewSource);
  const openSyncDirectionModal = useUIStore(
    state => state.openSyncDirectionModal,
  );
  const closeSettingsModal = useUIStore(state => state.closeSettingsModal);
  const { handleSaveConfig } = useConfigManagement();

  const [step, setStep] = useState<WizardStep>('service');
  const [pluginId, setPluginId] = useState<'github' | 'gitee' | null>(null);
  const [purpose, setPurpose] = useState<ConnectionPurpose>('defaultSync');
  const [values, setValues] = useState<GitPatFieldValues>(EMPTY_VALUES);
  const [tokenOk, setTokenOk] = useState(false);
  const [patMounted, setPatMounted] = useState(false);

  const manifest = useMemo(
    () => manifests.find(item => item.id === pluginId),
    [manifests, pluginId],
  );
  const patAvailable = supportsPat(manifest);
  const stepIndex = STEPS.indexOf(step);
  const locationReady = Boolean(
    values.owner.trim() &&
      values.repo.trim() &&
      values.branch.trim() &&
      values.path.trim(),
  );

  const goAuth = () => {
    if (!pluginId || !patAvailable) return;
    setPatMounted(true);
    setStep('auth');
  };

  const finish = (syncNow: boolean) => {
    if (!pluginId) return;
    prepareNewSource(pluginId, purpose);
    handleSaveConfig(values, null);
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
          {t('settings.wizardShellTitle')}
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

      <ol className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500">
        {STEPS.map((item, index) => (
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
                if (item.id !== 'github' && item.id !== 'gitee') return;
                setPluginId(item.id);
                setValues(EMPTY_VALUES);
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
              disabled={!pluginId || !patAvailable}
              onClick={goAuth}
            >
              {t('settings.wizardContinue')}
            </button>
          </div>
        </div>
      ) : null}

      {patMounted && pluginId ? (
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
            {manifest?.name} · {values.owner}/{values.repo} · {values.branch}
          </p>
          <p className="text-xs text-gray-500">
            {t('settings.wizardDoneHint')}
          </p>
        </div>
      ) : null}

      {step !== 'service' ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-white"
            onClick={() => {
              const prev = STEPS[stepIndex - 1];
              if (prev) setStep(prev);
            }}
          >
            {t('settings.wizardBack')}
          </button>
          {step === 'auth' ? (
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
