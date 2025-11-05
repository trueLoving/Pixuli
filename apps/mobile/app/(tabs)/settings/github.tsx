import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { GitHubConfig } from 'pixuli-ui/src';
import { showSuccess, showError } from '@/utils/toast';

export default function GitHubSettingsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { githubConfig, setGitHubConfig, clearGitHubConfig } = useImageStore();

  const [formData, setFormData] = useState<GitHubConfig>({
    owner: githubConfig?.owner || '',
    repo: githubConfig?.repo || '',
    branch: githubConfig?.branch || 'main',
    token: githubConfig?.token || '',
    path: githubConfig?.path || 'images',
  });

  useEffect(() => {
    if (githubConfig) {
      setFormData({
        owner: githubConfig.owner || '',
        repo: githubConfig.repo || '',
        branch: githubConfig.branch || 'main',
        token: githubConfig.token || '',
        path: githubConfig.path || 'images',
      });
    }
  }, [githubConfig]);

  const handleInputChange = (field: keyof GitHubConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // 验证必填字段
    if (!formData.owner || !formData.repo || !formData.token) {
      Alert.alert(t('common.error'), t('settings.github.requiredFields'));
      return;
    }

    try {
      await setGitHubConfig(formData);
      showSuccess(t('settings.github.saveSuccess'));
      router.back();
    } catch (error) {
      showError(
        `${t('settings.github.saveFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  const handleClear = () => {
    Alert.alert(
      t('settings.github.clearConfirm'),
      t('settings.github.clearConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearGitHubConfig();
              showSuccess(t('settings.github.clearSuccess'));
              router.back();
            } catch (error) {
              showError(
                `${t('settings.github.clearFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          {t('settings.github.title')}
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.field}>
            <ThemedText style={styles.label}>
              {t('settings.github.owner')} *
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.owner}
              onChangeText={value => handleInputChange('owner', value)}
              placeholder={t('settings.github.ownerPlaceholder')}
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>
              {t('settings.github.repo')} *
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.repo}
              onChangeText={value => handleInputChange('repo', value)}
              placeholder={t('settings.github.repoPlaceholder')}
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>
              {t('settings.github.branch')}
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.branch}
              onChangeText={value => handleInputChange('branch', value)}
              placeholder={t('settings.github.branchPlaceholder')}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>
              {t('settings.github.token')} *
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.token}
              onChangeText={value => handleInputChange('token', value)}
              placeholder={t('settings.github.tokenPlaceholder')}
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <ThemedText style={styles.hint}>
              {t('settings.github.tokenHint')}
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>
              {t('settings.github.path')}
            </ThemedText>
            <TextInput
              style={styles.input}
              value={formData.path}
              onChangeText={value => handleInputChange('path', value)}
              placeholder={t('settings.github.pathPlaceholder')}
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
            onPress={handleClear}
          >
            <ThemedText style={styles.clearButtonText}>
              {t('settings.github.clear')}
            </ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>
            {t('common.save')}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
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
