import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
// @ts-ignore - 使用 legacy API 以兼容 documentDirectory 和 EncodingType
const FileSystem = require('expo-file-system/legacy');
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { defaultTranslate } from '@pixuli/core/locales';
import { demoLocales } from '../locales';
import type { DemoConfig, DemoProps } from '../common/types';
import {
  createDemoGitHubConfig,
  createDemoGiteeConfig,
  checkEnvConfigured,
} from '../common/utils';
import { useDemoModeCore } from '../common/hooks';

// React Native 版本的 setDemoMode（使用 AsyncStorage）
async function setDemoMode(enabled: boolean): Promise<void> {
  if (enabled) {
    await AsyncStorage.setItem('pixuli-demo-mode', 'true');
  } else {
    await AsyncStorage.removeItem('pixuli-demo-mode');
  }
}

// React Native 版本的 isDemoEnvironment
function isDemoEnvironment(): boolean {
  // 检测环境变量（React Native 使用 process.env）
  // @ts-ignore - process.env 在 React Native 环境中可用
  const envDemoMode = process.env?.VITE_DEMO_MODE === 'true';
  // AsyncStorage 检测在组件内部进行（通过 useDemoMode Hook）
  return envDemoMode;
}

// React Native 版本的 getDemoGitHubConfig
function getDemoGitHubConfig(): DemoConfig {
  // @ts-ignore - process.env 在 React Native 环境中可用
  const env = process.env || {};
  return createDemoGitHubConfig(env, 'mobile');
}

// React Native 版本的 getDemoGiteeConfig
function getDemoGiteeConfig(): DemoConfig {
  // @ts-ignore - process.env 在 React Native 环境中可用
  const env = process.env || {};
  return createDemoGiteeConfig(env, 'mobile');
}

// React Native 版本的 isEnvConfigured
function isEnvConfigured(): boolean {
  // @ts-ignore - process.env 在 React Native 环境中可用
  const env = process.env || {};
  return checkEnvConfigured(env);
}

const DemoNative: React.FC<DemoProps> = ({ t, onExitDemo }) => {
  const translate =
    t || ((key: string) => defaultTranslate(key, demoLocales['zh-CN']));
  const [showDropdown, setShowDropdown] = useState(false);
  const envConfigured = isEnvConfigured();

  const handleDownloadConfig = useCallback(
    async (config: DemoConfig, filename: string) => {
      try {
        const configJson = JSON.stringify(config, null, 2);
        // @ts-ignore - legacy API
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        // @ts-ignore - legacy API
        await FileSystem.writeAsStringAsync(fileUri, configJson, {
          // @ts-ignore - legacy API
          encoding: FileSystem.EncodingType.UTF8,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: translate('app.demoMode.downloadDemo'),
          });
        } else {
          Alert.alert(
            translate('common.error'),
            translate('common.sharingNotAvailable'),
          );
        }

        setShowDropdown(false);
      } catch (error) {
        Alert.alert(
          translate('common.error'),
          error instanceof Error
            ? error.message
            : translate('common.unknownError'),
        );
      }
    },
    [translate],
  );

  const handleDownloadGitHub = useCallback(() => {
    const config = getDemoGitHubConfig();
    handleDownloadConfig(config, 'pixuli-github-config-demo.json');
  }, [handleDownloadConfig]);

  const handleDownloadGitee = useCallback(() => {
    const config = getDemoGiteeConfig();
    handleDownloadConfig(config, 'pixuli-gitee-config-demo.json');
  }, [handleDownloadConfig]);

  const handleExitDemoMode = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('pixuli-demo-mode');
      setDemoMode(false);
      onExitDemo();
    } catch (error) {
      console.error('Failed to exit demo mode:', error);
      onExitDemo();
    }
  }, [onExitDemo]);

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        {/* 头部：标题和说明 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>✨</Text>
            </View>
            <View style={styles.titleBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>
                  {translate('app.demoMode.title')}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Demo</Text>
                </View>
              </View>
              <Text style={styles.description}>
                {translate('app.demoMode.description')}
              </Text>
            </View>
          </View>
        </View>

        {!envConfigured && (
          <View style={styles.warning}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              {translate('app.demoMode.missingConfig')}
            </Text>
          </View>
        )}

        {/* 操作按钮区域 */}
        <View style={styles.actions}>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                !envConfigured && styles.buttonDisabled,
              ]}
              onPress={() => envConfigured && setShowDropdown(!showDropdown)}
              disabled={!envConfigured}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonIcon}>▶</Text>
              <Text style={styles.buttonText}>
                {translate('app.demoMode.downloadDemo')}
              </Text>
              <Text
                style={[styles.chevron, showDropdown && styles.chevronOpen]}
              >
                ▼
              </Text>
            </TouchableOpacity>

            {showDropdown && envConfigured && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDownloadGitHub}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIcon}>
                    <Text style={styles.menuIconText}>🐙</Text>
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>
                      {translate('app.demoMode.downloadGitHub')}
                    </Text>
                    <Text style={styles.menuDesc}>
                      {translate('app.demoMode.downloadGitHubDesc')}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDownloadGitee}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIcon}>
                    <Text style={styles.menuIconText}>码</Text>
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>
                      {translate('app.demoMode.downloadGitee')}
                    </Text>
                    <Text style={styles.menuDesc}>
                      {translate('app.demoMode.downloadGiteeDesc')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleExitDemoMode}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              {translate('app.demoMode.exitDemo')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(147, 112, 219, 0.4)',
    backgroundColor: '#f5f3ff',
    padding: 20,
    position: 'relative',
    overflow: 'visible',
  },
  header: {
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#ffffff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#111827',
  },
  chevron: {
    fontSize: 12,
    marginLeft: 8,
    color: '#ffffff',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
});

// Demo 状态 Hook（React Native 版本）
export function useDemoMode() {
  return useDemoModeCore(isDemoEnvironment, setDemoMode);
}

// 导出 React Native 版本的工具函数
export { getDemoGitHubConfig, getDemoGiteeConfig, isEnvConfigured };

export default DemoNative;
