import { X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import './SlideShowPlayer.css';
import { SlideShowConfig, TransitionEffect } from './types';

interface SlideShowSettingsProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 当前配置 */
  config: SlideShowConfig;
  /** 配置变更回调 */
  onConfigChange: (config: SlideShowConfig) => void;
  /** 翻译函数 */
  t?: (key: string) => string;
}

const SlideShowSettings: React.FC<SlideShowSettingsProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
  t,
}) => {
  const [localConfig, setLocalConfig] = useState<SlideShowConfig>(config);

  // 更新本地配置
  const updateConfig = useCallback((updates: Partial<SlideShowConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // 保存配置
  const handleSave = useCallback(() => {
    onConfigChange(localConfig);
    onClose();
  }, [localConfig, onConfigChange, onClose]);

  // 重置配置
  const handleReset = useCallback(() => {
    setLocalConfig(config);
  }, [config]);

  // 选择音乐文件
  const handleSelectMusicFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        updateConfig({ backgroundMusic: url });
      }
    };
    input.click();
  }, [updateConfig]);

  // 移除音乐文件
  const handleRemoveMusicFile = useCallback(() => {
    if (localConfig.backgroundMusic) {
      URL.revokeObjectURL(localConfig.backgroundMusic);
    }
    updateConfig({ backgroundMusic: undefined });
  }, [localConfig.backgroundMusic, updateConfig]);

  if (!isOpen) return null;

  const translate = (key: string, params?: Record<string, any>) => {
    if (!t) return key;
    let text = t(key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <div className="slide-show-settings-modal" onClick={onClose}>
      <div
        className="slide-show-settings-content"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="slide-show-settings-header">
          <h2 className="slide-show-settings-title">
            {translate('slideShow.settings.title')}
          </h2>
          <button
            onClick={onClose}
            className="slide-show-settings-close"
            title={translate('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 播放设置 */}
        <div className="slide-show-settings-section">
          <h3 className="slide-show-settings-section-title">
            {translate('slideShow.settings.playback.title')}
          </h3>

          <div className="slide-show-settings-field">
            <label className="slide-show-settings-label">
              {translate('slideShow.settings.playback.interval')}
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={localConfig.interval / 1000}
              onChange={e =>
                updateConfig({
                  interval: parseFloat(e.target.value) * 1000,
                })
              }
              className="slide-show-settings-input"
            />
          </div>

          <div className="slide-show-settings-field">
            <label className="slide-show-settings-label">
              {translate('slideShow.settings.playback.playMode')}
            </label>
            <select
              value={localConfig.playMode}
              onChange={e =>
                updateConfig({
                  playMode: e.target.value as SlideShowConfig['playMode'],
                })
              }
              className="slide-show-settings-select"
            >
              <option value="sequential">
                {translate('slideShow.settings.playback.playModeSequential')}
              </option>
              <option value="random">
                {translate('slideShow.settings.playback.playModeRandom')}
              </option>
              <option value="loop">
                {translate('slideShow.settings.playback.playModeLoop')}
              </option>
            </select>
          </div>

          <div className="slide-show-settings-field">
            <div className="slide-show-settings-checkbox">
              <input
                type="checkbox"
                id="autoPlay"
                checked={localConfig.autoPlay}
                onChange={e => updateConfig({ autoPlay: e.target.checked })}
              />
              <label htmlFor="autoPlay">
                {translate('slideShow.settings.playback.autoPlay')}
              </label>
            </div>
          </div>

          <div className="slide-show-settings-field">
            <div className="slide-show-settings-checkbox">
              <input
                type="checkbox"
                id="loop"
                checked={localConfig.loop}
                onChange={e => updateConfig({ loop: e.target.checked })}
              />
              <label htmlFor="loop">
                {translate('slideShow.settings.playback.loop')}
              </label>
            </div>
          </div>
        </div>

        {/* 过渡效果设置 */}
        <div className="slide-show-settings-section">
          <h3 className="slide-show-settings-section-title">
            {translate('slideShow.settings.transition.title')}
          </h3>

          <div className="slide-show-settings-field">
            <label className="slide-show-settings-label">
              {translate('slideShow.settings.transition.effect')}
            </label>
            <select
              value={localConfig.transitionEffect}
              onChange={e =>
                updateConfig({
                  transitionEffect: e.target.value as TransitionEffect,
                })
              }
              className="slide-show-settings-select"
            >
              <option value="fade">
                {translate('slideShow.settings.transition.effectFade')}
              </option>
              <option value="slide">
                {translate('slideShow.settings.transition.effectSlide')}
              </option>
              <option value="zoom">
                {translate('slideShow.settings.transition.effectZoom')}
              </option>
              <option value="blur">
                {translate('slideShow.settings.transition.effectBlur')}
              </option>
              <option value="rotate">
                {translate('slideShow.settings.transition.effectRotate')}
              </option>
              <option value="none">
                {translate('slideShow.settings.transition.effectNone')}
              </option>
            </select>
          </div>

          <div className="slide-show-settings-field">
            <label className="slide-show-settings-label">
              {translate('slideShow.settings.transition.duration')}
            </label>
            <input
              type="number"
              min="0"
              max="3000"
              step="100"
              value={localConfig.transitionDuration}
              onChange={e =>
                updateConfig({
                  transitionDuration: parseInt(e.target.value, 10),
                })
              }
              className="slide-show-settings-input"
            />
          </div>
        </div>

        {/* 背景音乐设置 */}
        <div className="slide-show-settings-section">
          <h3 className="slide-show-settings-section-title">
            {translate('slideShow.settings.music.title')}
          </h3>

          <div className="slide-show-settings-field">
            <div className="slide-show-settings-checkbox">
              <input
                type="checkbox"
                id="enableMusic"
                checked={!!localConfig.backgroundMusic}
                onChange={e => {
                  if (!e.target.checked) {
                    handleRemoveMusicFile();
                  } else {
                    handleSelectMusicFile();
                  }
                }}
              />
              <label htmlFor="enableMusic">
                {translate('slideShow.settings.music.enable')}
              </label>
            </div>
          </div>

          {localConfig.backgroundMusic && (
            <>
              <div className="slide-show-settings-field">
                <div className="slide-show-settings-file-input">
                  <button
                    onClick={handleSelectMusicFile}
                    className="slide-show-settings-file-button"
                  >
                    {translate('slideShow.settings.music.selectFile')}
                  </button>
                  <button
                    onClick={handleRemoveMusicFile}
                    className="slide-show-settings-button-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    移除
                  </button>
                  <div className="slide-show-settings-file-info">
                    {translate('slideShow.settings.music.fileSelected', {
                      fileName: '已选择',
                    })}
                  </div>
                </div>
              </div>

              <div className="slide-show-settings-field">
                <label className="slide-show-settings-label">
                  {translate('slideShow.settings.music.volume')}
                  <span className="slide-show-settings-range-value">
                    {Math.round(localConfig.musicVolume * 100)}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localConfig.musicVolume}
                  onChange={e =>
                    updateConfig({
                      musicVolume: parseFloat(e.target.value),
                    })
                  }
                  className="slide-show-settings-range"
                />
              </div>
            </>
          )}

          {!localConfig.backgroundMusic && (
            <div className="slide-show-settings-field">
              <button
                onClick={handleSelectMusicFile}
                className="slide-show-settings-file-button"
              >
                {translate('slideShow.settings.music.selectFile')}
              </button>
              <p className="slide-show-settings-file-info">
                {translate('slideShow.settings.music.supportedFormats')}
              </p>
            </div>
          )}
        </div>

        {/* 显示设置 */}
        <div className="slide-show-settings-section">
          <h3 className="slide-show-settings-section-title">
            {translate('slideShow.settings.display.title')}
          </h3>

          <div className="slide-show-settings-field">
            <div className="slide-show-settings-checkbox">
              <input
                type="checkbox"
                id="showImageInfo"
                checked={localConfig.showImageInfo}
                onChange={e =>
                  updateConfig({ showImageInfo: e.target.checked })
                }
              />
              <label htmlFor="showImageInfo">
                {translate('slideShow.settings.display.showImageInfo')}
              </label>
            </div>
          </div>

          <div className="slide-show-settings-field">
            <div className="slide-show-settings-checkbox">
              <input
                type="checkbox"
                id="fullscreen"
                checked={localConfig.fullscreen}
                onChange={e => updateConfig({ fullscreen: e.target.checked })}
              />
              <label htmlFor="fullscreen">
                {translate('slideShow.settings.display.fullscreen')}
              </label>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="slide-show-settings-actions">
          <button
            onClick={handleReset}
            className="slide-show-settings-button slide-show-settings-button-secondary"
          >
            {translate('slideShow.settings.reset')}
          </button>
          <button
            onClick={onClose}
            className="slide-show-settings-button slide-show-settings-button-secondary"
          >
            {translate('slideShow.settings.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="slide-show-settings-button slide-show-settings-button-primary"
          >
            {translate('slideShow.settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideShowSettings;
