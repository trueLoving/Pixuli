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
} from 'react-native';
import { GitHubConfig } from 'pixuli-ui/src';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useI18n } from '@/i18n/useI18n';
import { showSuccess, showError } from '@/utils/toast';

interface GitHubConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubConfig?: GitHubConfig | null;
  onSaveConfig: (config: GitHubConfig) => void;
  onClearConfig: () => void;
}

export function GitHubConfigModal({
  isOpen,
  onClose,
  githubConfig,
  onSaveConfig,
  onClearConfig,
}: GitHubConfigModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<GitHubConfig>({
    owner: githubConfig?.owner || '',
    repo: githubConfig?.repo || '',
    branch: githubConfig?.branch || 'main',
    token: githubConfig?.token || '',
    path: githubConfig?.path || 'images',
  });

  // 当模态框打开时，更新表单数据
  useEffect(() => {
    if (isOpen && githubConfig) {
      setFormData({
        owner: githubConfig.owner || '',
        repo: githubConfig.repo || '',
        branch: githubConfig.branch || 'main',
        token: githubConfig.token || '',
        path: githubConfig.path || 'images',
      });
    } else if (isOpen) {
      // 重置表单
      setFormData({
        owner: '',
        repo: '',
        branch: 'main',
        token: '',
        path: 'images',
      });
    }
  }, [isOpen, githubConfig]);

  const handleInputChange = (field: keyof GitHubConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // 验证必填字段
    if (!formData.owner || !formData.repo || !formData.token) {
      Alert.alert(t('common.error'), t('github.config.requiredFields'));
      return;
    }

    try {
      onSaveConfig(formData);
      showSuccess(t('github.config.saveSuccess'));
      onClose();
    } catch (error) {
      showError(
        `${t('github.config.saveFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  const handleClearConfig = () => {
    Alert.alert(
      t('github.config.clearConfirm'),
      t('github.config.clearConfirmMessage'),
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
              showSuccess(t('github.config.clearSuccess'));
              onClose();
            } catch (error) {
              showError(
                `${t('github.config.clearFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
              );
            }
          },
        },
      ]
    );
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
            {t('github.config.title')}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('github.config.owner')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.owner}
                onChangeText={value => handleInputChange('owner', value)}
                placeholder={t('github.config.ownerPlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('github.config.repo')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.repo}
                onChangeText={value => handleInputChange('repo', value)}
                placeholder={t('github.config.repoPlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('github.config.branch')}
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.branch}
                onChangeText={value => handleInputChange('branch', value)}
                placeholder={t('github.config.branchPlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('github.config.token')} *
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.token}
                onChangeText={value => handleInputChange('token', value)}
                placeholder={t('github.config.tokenPlaceholder')}
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ThemedText style={styles.hint}>
                {t('github.config.tokenHint')}
              </ThemedText>
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>
                {t('github.config.path')}
              </ThemedText>
              <TextInput
                style={styles.input}
                value={formData.path}
                onChangeText={value => handleInputChange('path', value)}
                placeholder={t('github.config.pathPlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {githubConfig && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearConfig}
            >
              <ThemedText style={styles.clearButtonText}>
                {t('github.config.clear')}
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
