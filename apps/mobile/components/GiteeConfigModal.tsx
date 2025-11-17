import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

// 动态加载 legacy API（运行时可用）
// @ts-ignore
const FileSystem = require('expo-file-system/legacy');
import { GiteeConfig } from 'pixuli-ui/src';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { showSuccess, showError } from '@/utils/toast';

interface GiteeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  giteeConfig?: GiteeConfig | null;
  onSaveConfig: (config: GiteeConfig) => void;
  onClearConfig: () => void;
}

export function GiteeConfigModal({
  isOpen,
  onClose,
  giteeConfig,
  onSaveConfig,
  onClearConfig,
}: GiteeConfigModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<GiteeConfig>({
    owner: giteeConfig?.owner || '',
    repo: giteeConfig?.repo || '',
    branch: giteeConfig?.branch || 'master',
    token: giteeConfig?.token || '',
    path: giteeConfig?.path || 'images',
  });

  // 当模态框打开时，更新表单数据
  useEffect(() => {
    if (isOpen) {
      if (giteeConfig) {
        setFormData({
          owner: giteeConfig.owner || '',
          repo: giteeConfig.repo || '',
          branch: giteeConfig.branch || 'master',
          token: giteeConfig.token || '',
          path: giteeConfig.path || 'images',
        });
      } else {
        // 重置表单（当配置被清除时）
        setFormData({
          owner: '',
          repo: '',
          branch: 'master',
          token: '',
          path: 'images',
        });
      }
    }
  }, [isOpen, giteeConfig]);

  const handleInputChange = (field: keyof GiteeConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // 验证必填字段
    if (!formData.owner || !formData.repo || !formData.token) {
      Alert.alert(t('common.error'), t('settings.gitee.requiredFields'));
      return;
    }

    try {
      onSaveConfig(formData);
      showSuccess(t('settings.gitee.saveSuccess'));
      onClose();
    } catch (error) {
      showError(
        `${t('settings.gitee.saveFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  const handleClearConfig = () => {
    Alert.alert(
      t('settings.gitee.clearConfirm'),
      t('settings.gitee.clearConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            try {
              onClearConfig();
              showSuccess(t('settings.gitee.clearSuccess'));
              onClose();
            } catch (error) {
              showError(
                `${t('settings.gitee.clearFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
              );
            }
          },
        },
      ]
    );
  };

  // 导入配置
  const handleImportConfig = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      console.log('import finished and analyze config file');

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        return;
      }

      // 读取文件内容
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      const configData = JSON.parse(fileContent);

      // 验证配置格式
      if (
        !configData.config ||
        !configData.config.owner ||
        !configData.config.repo ||
        !configData.config.token
      ) {
        showError(t('settings.gitee.invalidFormat'));
        return;
      }

      // 更新表单数据
      setFormData({
        owner: configData.config.owner || '',
        repo: configData.config.repo || '',
        branch: configData.config.branch || 'master',
        token: configData.config.token || '',
        path: configData.config.path || 'images',
      });

      showSuccess(t('settings.gitee.importSuccess'));
    } catch (error) {
      showError(
        `${t('settings.gitee.importFailed')}: ${error instanceof Error ? error.message : '文件格式错误'}`
      );
    }
  };

  // 导出配置
  const handleExportConfig = async () => {
    try {
      if (!giteeConfig) {
        showError(t('settings.gitee.noConfigToExport'));
        return;
      }

      const configData = {
        version: '1.0',
        platform: 'mobile',
        timestamp: new Date().toISOString(),
        config: giteeConfig,
      };

      const fileName = `pixuli-gitee-config-${new Date().toISOString().split('T')[0]}.json`;
      const fileContent = JSON.stringify(configData, null, 2);

      // 根据平台选择保存方式
      if (Platform.OS === 'android') {
        try {
          const tempUri = `${FileSystem.cacheDirectory}${fileName}`;
          await FileSystem.writeAsStringAsync(tempUri, fileContent);

          await Sharing.shareAsync(tempUri, {
            mimeType: 'application/json',
            dialogTitle: t('settings.gitee.export'),
            UTI: 'public.json',
          });

          showSuccess(t('settings.gitee.exportSuccess'));
        } catch (shareError) {
          if (
            shareError instanceof Error &&
            (shareError.message.includes('cancel') ||
              shareError.message.includes('dismissed') ||
              shareError.message.includes('User'))
          ) {
            return;
          }
          showError(
            `${t('settings.gitee.exportFailed')}: ${shareError instanceof Error ? shareError.message : '未知错误'}`
          );
        }
      } else {
        // iOS: 使用分享功能保存到文件应用
        const tempUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(tempUri, fileContent);

        try {
          await Sharing.shareAsync(tempUri, {
            mimeType: 'application/json',
            dialogTitle: t('settings.gitee.export'),
            UTI: 'public.json',
          });

          showSuccess(t('settings.gitee.exportSuccess'));
        } catch (shareError) {
          if (
            shareError instanceof Error &&
            (shareError.message.includes('cancel') ||
              shareError.message.includes('dismissed') ||
              shareError.message.includes('User'))
          ) {
            return;
          }
          showError(
            `${t('settings.gitee.exportFailed')}: ${shareError instanceof Error ? shareError.message : '未知错误'}`
          );
        }
      }
    } catch (error) {
      showError(
        `${t('settings.gitee.exportFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {t('settings.gitee.title')}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 导入导出按钮 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.importButton]}
              onPress={handleImportConfig}
            >
              <IconSymbol name="arrow.up.circle" size={20} color="#007AFF" />
              <ThemedText style={styles.actionButtonText}>
                {t('settings.gitee.import')}
              </ThemedText>
            </TouchableOpacity>
            {giteeConfig && (
              <TouchableOpacity
                style={[styles.actionButton, styles.exportButton]}
                onPress={handleExportConfig}
              >
                <IconSymbol
                  name="arrow.down.circle"
                  size={20}
                  color="#007AFF"
                />
                <ThemedText style={styles.actionButtonText}>
                  {t('settings.gitee.export')}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('settings.gitee.owner')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.owner}
                onChangeText={value => handleInputChange('owner', value)}
                placeholder={t('settings.gitee.ownerPlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('settings.gitee.repo')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.repo}
                onChangeText={value => handleInputChange('repo', value)}
                placeholder={t('settings.gitee.repoPlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('settings.gitee.branch')}
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.branch}
                onChangeText={value => handleInputChange('branch', value)}
                placeholder={t('settings.gitee.branchPlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('settings.gitee.token')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.token}
                onChangeText={value => handleInputChange('token', value)}
                placeholder={t('settings.gitee.tokenPlaceholder')}
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ThemedText style={styles.hint}>
                {t('settings.gitee.tokenHint')}
              </ThemedText>
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('settings.gitee.path')}
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.path}
                onChangeText={value => handleInputChange('path', value)}
                placeholder={t('settings.gitee.pathPlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {giteeConfig && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearConfig}
            >
              <ThemedText style={styles.clearButtonText}>
                {t('settings.gitee.clear')}
              </ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSubmit}
          >
            <ThemedText style={styles.saveButtonText}>
              {t('common.save')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  importButton: {
    backgroundColor: '#fff',
  },
  exportButton: {
    backgroundColor: '#fff',
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '600',
  },
});
