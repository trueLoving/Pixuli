import type { StoragePluginManifest } from '@pixuli/core/plugins';
import type {
  StorageProviderConfig,
  StorageProviderDiscovery,
} from '@pixuli/core/plugins';
import { X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useConfigManagement } from '@/features/settings/useConfigManagement';
import type { ConnectionPurpose } from '@/features/source-type/connectionPurpose';
import { requestWorkspaceSync } from '@/features/workspace/syncFeedback';
import { startPluginRuntime } from '@/plugins/runtime';
import { StorageSourceIcon } from '@/plugins/storageUi';
import { uiRegistry } from '@/plugins/uiRegistry';
import { createDiscoveryProvider } from '@/storage/createProvider';
import { showSuccess } from '@/ui/feedback/toast';
import { useUIStore } from '@/stores/uiStore';

type WizardStep = 'service' | 'auth' | 'location' | 'done';

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

const EMPTY_CONFIG: StorageProviderConfig = {};

export interface ConnectionWizardProps {
  manifests: StoragePluginManifest[];
  t: (key: string) => string;
  onCancel: () => void;
  onComplete: () => void;
  discovery?: StorageProviderDiscovery;
  /** 传入时为编辑已有连接：跳过「选服务」，预填仓库与令牌 */
  editSourceId?: string | null;
  initialPluginId?: string | null;
  /** 不透明插件配置；由 connectionFields 解释 */
  initialConfig?: StorageProviderConfig | null;
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

function hasConnectionUi(pluginId: string): boolean {
  startPluginRuntime();
  return Boolean(uiRegistry.resolveConnectionFields(pluginId));
}

function configRepoLabel(config: StorageProviderConfig): string {
  const owner = String(config.owner ?? '').trim();
  const repo = String(config.repo ?? '').trim();
  return [owner, repo].filter(Boolean).join('/');
}

function configSummaryLabel(config: StorageProviderConfig): string {
  const base = configRepoLabel(config);
  const branch = String(config.branch ?? '').trim();
  if (!base) return '';
  return branch ? `${base} · ${branch}` : base;
}

export const ConnectionWizard: React.FC<ConnectionWizardProps> = ({
  manifests,
  t,
  onCancel,
  onComplete,
  discovery,
  editSourceId = null,
  initialPluginId = null,
  initialConfig = null,
}) => {
  const canEdit =
    Boolean(editSourceId) &&
    Boolean(initialPluginId) &&
    hasConnectionUi(initialPluginId ?? '');
  const isEdit = canEdit;
  const startWithPlugin =
    !isEdit &&
    Boolean(initialPluginId) &&
    hasConnectionUi(initialPluginId ?? '');
  const prepareNewSource = useUIStore(state => state.prepareNewSource);
  const closeSettingsModal = useUIStore(state => state.closeSettingsModal);
  const { handleSaveConfig } = useConfigManagement();

  const steps = isEdit ? EDIT_STEPS : STEPS;
  const [step, setStep] = useState<WizardStep>(
    isEdit || startWithPlugin ? 'auth' : 'service',
  );
  const [pluginId, setPluginId] = useState<string | null>(
    initialPluginId && hasConnectionUi(initialPluginId)
      ? initialPluginId
      : null,
  );
  const [purpose, setPurpose] = useState<ConnectionPurpose>('defaultSync');
  const [config, setConfig] = useState<StorageProviderConfig>(
    initialConfig ?? EMPTY_CONFIG,
  );
  const [tokenOk, setTokenOk] = useState(
    isEdit && Boolean(String(initialConfig?.token ?? '').trim()),
  );
  const [patMounted, setPatMounted] = useState(isEdit || startWithPlugin);

  const selectableManifests = useMemo(
    () => manifests.filter(item => hasConnectionUi(item.id)),
    [manifests],
  );

  const manifest = useMemo(
    () => manifests.find(item => item.id === pluginId),
    [manifests, pluginId],
  );
  const connectionFields = pluginId
    ? uiRegistry.resolveConnectionFields(pluginId)
    : undefined;
  const Fields = connectionFields?.component;
  const labelPrefix =
    connectionFields?.labelPrefix ?? `${pluginId ?? 'storage'}.config`;

  const editTargetLabel = configRepoLabel(config);
  const doneSummaryLabel = configSummaryLabel(config);
  const patAvailable = supportsPat(manifest);
  const stepIndex = steps.indexOf(step);
  const locationReady = connectionFields?.isConfigComplete
    ? connectionFields.isConfigComplete(config)
    : false;

  const goAuth = () => {
    if (!pluginId || !patAvailable || !Fields) return;
    setPatMounted(true);
    setStep('auth');
  };

  const finish = (syncNow: boolean) => {
    if (!pluginId) return;
    if (isEdit && editSourceId) {
      handleSaveConfig(config, editSourceId);
    } else {
      prepareNewSource(pluginId, purpose);
      handleSaveConfig(config, null);
    }
    showSuccess(t('messages.configSaved'));
    onComplete();
    if (syncNow) {
      closeSettingsModal();
      requestWorkspaceSync();
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
          {editTargetLabel ? ` · ${editTargetLabel}` : ''}
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
          {selectableManifests.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setPluginId(item.id);
                setConfig(EMPTY_CONFIG);
                setTokenOk(false);
                setPatMounted(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg border bg-white p-3 text-left ${
                pluginId === item.id
                  ? 'border-[var(--pix-violet)]'
                  : 'border-gray-200'
              }`}
            >
              <StorageSourceIcon pluginId={item.id} size={18} />
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
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-md pix-btn-primary px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={!pluginId || !patAvailable || !Fields}
              onClick={goAuth}
            >
              {t('settings.wizardContinue')}
            </button>
          </div>
        </div>
      ) : null}

      {patMounted && pluginId && Fields ? (
        <div hidden={step !== 'auth' && step !== 'location'}>
          {step === 'auth' && !patAvailable ? (
            <p className="text-sm text-gray-600">
              {t('settings.wizardAuthUnavailable')}
            </p>
          ) : (
            <Fields
              pluginId={pluginId}
              labelPrefix={labelPrefix}
              config={config}
              onChange={setConfig}
              t={t}
              classes={FIELD_CLASSES}
              discovery={discovery}
              resolveDiscovery={() => createDiscoveryProvider(pluginId)}
              section={step === 'location' ? 'location' : 'auth'}
              onValidatedChange={setTokenOk}
            />
          )}
        </div>
      ) : null}

      {step === 'done' && pluginId ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-800">
            {`${manifest?.name}${doneSummaryLabel ? ` · ${doneSummaryLabel}` : ''}`}
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
