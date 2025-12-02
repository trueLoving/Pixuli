import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
// @ts-ignore
const FileSystem = require('expo-file-system/legacy');
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { GitHubConfig, GiteeConfig } from '@packages/common/src/index.native';
import { showSuccess, showError } from '@/utils/toast';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';

interface StorageConfigModalProps {
  visible: boolean;
  onClose: () => void;
  type?: 'github' | 'gitee' | undefined;
  config?: GitHubConfig | GiteeConfig;
  onSave: () => void;
}

export function StorageConfigModal({
  visible,
  onClose,
  type: initialType,
  config,
  onSave,
}: StorageConfigModalProps) {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { setGitHubConfig, setGiteeConfig } = useImageStore();

  const [selectedType, setSelectedType] = useState<'github' | 'gitee' | null>(
    null,
  );
  const [formData, setFormData] = useState<GitHubConfig | GiteeConfig>({
    owner: '',
    repo: '',
    branch: 'main',
    token: '',
    path: 'images',
  });
  const prevVisibleRef = useRef(false);

  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = visible;

    if (visible) {
      // 弹窗刚打开时（从关闭变为打开），初始化状态
      if (!wasVisible) {
        if (initialType) {
          setSelectedType(initialType);
        } else {
          setSelectedType(null);
        }
      }

      if (config) {
        setFormData({
          owner: config.owner || '',
          repo: config.repo || '',
          branch:
            config.branch || (initialType === 'github' ? 'main' : 'master'),
          token: config.token || '',
          path: config.path || 'images',
        });
      } else if (selectedType || initialType) {
        // 只有在有类型时才重置表单数据
        const type = selectedType || initialType;
        setFormData({
          owner: '',
          repo: '',
          branch: type === 'github' ? 'main' : 'master',
          token: '',
          path: 'images',
        });
      }
    } else {
      // 弹窗关闭时，重置状态
      if (wasVisible) {
        setSelectedType(null);
        setFormData({
          owner: '',
          repo: '',
          branch: 'main',
          token: '',
          path: 'images',
        });
      }
    }
  }, [config, initialType, visible, selectedType]);

  const currentType = selectedType || initialType;

  const handleInputChange = (
    field: keyof (GitHubConfig | GiteeConfig),
    value: string,
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImportConfig = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      const configData = JSON.parse(fileContent);

      if (
        !configData.config ||
        !configData.config.owner ||
        !configData.config.repo ||
        !configData.config.token
      ) {
        showError(
          currentType === 'github'
            ? t('settings.github.invalidFormat')
            : t('settings.gitee.invalidFormat'),
        );
        return;
      }

      setFormData({
        owner: configData.config.owner || '',
        repo: configData.config.repo || '',
        branch:
          configData.config.branch ||
          (currentType === 'github' ? 'main' : 'master'),
        token: configData.config.token || '',
        path: configData.config.path || 'images',
      });

      showSuccess(
        currentType === 'github'
          ? t('settings.github.importSuccess')
          : t('settings.gitee.importSuccess'),
      );
    } catch (error) {
      showError(
        `${
          currentType === 'github'
            ? t('settings.github.importFailed')
            : t('settings.gitee.importFailed')
        }: ${error instanceof Error ? error.message : '文件格式错误'}`,
      );
    }
  };

  const handleSave = async () => {
    if (!currentType) {
      Alert.alert(t('common.error'), '请先选择仓库源类型');
      return;
    }

    if (!formData.owner || !formData.repo || !formData.token) {
      Alert.alert(
        t('common.error'),
        currentType === 'github'
          ? t('settings.github.requiredFields')
          : t('settings.gitee.requiredFields'),
      );
      return;
    }

    try {
      if (currentType === 'github') {
        await setGitHubConfig(formData as GitHubConfig);
      } else {
        await setGiteeConfig(formData as GiteeConfig);
      }
      showSuccess(
        currentType === 'github'
          ? t('settings.github.saveSuccess')
          : t('settings.gitee.saveSuccess'),
      );
      onSave();
      onClose();
    } catch (error) {
      showError(
        `${
          currentType === 'github'
            ? t('settings.github.saveFailed')
            : t('settings.gitee.saveFailed')
        }: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  };

  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
    },
    header: {
      borderBottomColor: colors.cardBorder,
    },
    title: {
      color: colors.text,
    },
    input: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      color: colors.text,
      borderColor: colorScheme === 'dark' ? '#38383A' : '#DDDDDD',
    },
    label: {
      color: colorScheme === 'dark' ? '#FFFFFF' : '#333333',
    },
    hint: {
      color: colorScheme === 'dark' ? '#8E8E93' : '#666666',
    },
    field: {
      borderBottomColor: colorScheme === 'dark' ? '#38383A' : '#E5E5E5',
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
    },
    groupContainer: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: colorScheme === 'dark' ? 0.2 : 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    saveButton: {
      backgroundColor: '#007AFF',
    },
    saveButtonText: {
      color: '#FFFFFF',
    },
    cancelButton: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      borderColor: colors.cardBorder,
    },
    cancelButtonText: {
      color: colors.text,
    },
    importButton: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      borderColor: '#007AFF',
      borderWidth: 1,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, dynamicStyles.modalOverlay]}>
        <ThemedView
          style={[
            styles.modalContent,
            dynamicStyles.modalContent,
            {
              paddingTop: Math.max(insets.top + 8, 16),
              maxHeight: '90%',
              flex: 1,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, dynamicStyles.header]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.title, dynamicStyles.title]}>
              {selectedType || initialType
                ? (selectedType || initialType) === 'github'
                  ? t('settings.github.title')
                  : t('settings.gitee.title')
                : t('settings.storage.add') || '添加存储配置'}
            </ThemedText>
            <View style={styles.placeholder} />
          </View>

          {/* 类型选择（如果没有指定类型） */}
          {!selectedType && !initialType && (
            <View style={styles.typeSelector}>
              <View style={styles.typeSelectorHeader}>
                <ThemedText
                  style={[styles.typeSelectorTitle, { color: colors.text }]}
                >
                  {t('settings.storage.selectType') || '选择仓库源类型'}
                </ThemedText>
              </View>
              <View style={styles.typeOptions}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                    },
                    selectedType === 'github' && {
                      backgroundColor: colors.primary + '10',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setSelectedType('github');
                    setFormData({
                      owner: '',
                      repo: '',
                      branch: 'main',
                      token: '',
                      path: 'images',
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.typeOptionIcon,
                      {
                        backgroundColor: colors.primary + '20',
                      },
                    ]}
                  >
                    <IconSymbol name="link" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.typeOptionContent}>
                    <ThemedText
                      style={[styles.typeOptionTitle, { color: colors.text }]}
                    >
                      GitHub
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.typeOptionDesc,
                        { color: colors.sectionTitle },
                      ]}
                    >
                      {t('settings.github.title') || 'GitHub 配置'}
                    </ThemedText>
                  </View>
                  {selectedType === 'github' && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                    },
                    selectedType === 'gitee' && {
                      backgroundColor: colors.primary + '10',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setSelectedType('gitee');
                    setFormData({
                      owner: '',
                      repo: '',
                      branch: 'master',
                      token: '',
                      path: 'images',
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.typeOptionIcon,
                      {
                        backgroundColor: colors.primary + '20',
                      },
                    ]}
                  >
                    <IconSymbol name="link" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.typeOptionContent}>
                    <ThemedText
                      style={[styles.typeOptionTitle, { color: colors.text }]}
                    >
                      Gitee
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.typeOptionDesc,
                        { color: colors.sectionTitle },
                      ]}
                    >
                      {t('settings.gitee.title') || 'Gitee 配置'}
                    </ThemedText>
                  </View>
                  {selectedType === 'gitee' && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Content */}
          {currentType && (
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.form}>
                <View
                  style={[styles.groupContainer, dynamicStyles.groupContainer]}
                >
                  {/* Owner */}
                  <View
                    style={[
                      styles.field,
                      dynamicStyles.field,
                      styles.fieldFirst,
                    ]}
                  >
                    <ThemedText style={[styles.label, dynamicStyles.label]}>
                      {currentType === 'github'
                        ? t('settings.github.owner')
                        : t('settings.gitee.owner')}{' '}
                      *
                    </ThemedText>
                    <TextInput
                      style={[styles.input, dynamicStyles.input]}
                      value={formData.owner}
                      onChangeText={value => handleInputChange('owner', value)}
                      placeholder={
                        currentType === 'github'
                          ? t('settings.github.ownerPlaceholder')
                          : t('settings.gitee.ownerPlaceholder')
                      }
                      placeholderTextColor="#999999"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Repo */}
                  <View style={[styles.field, dynamicStyles.field]}>
                    <ThemedText style={[styles.label, dynamicStyles.label]}>
                      {currentType === 'github'
                        ? t('settings.github.repo')
                        : t('settings.gitee.repo')}{' '}
                      *
                    </ThemedText>
                    <TextInput
                      style={[styles.input, dynamicStyles.input]}
                      value={formData.repo}
                      onChangeText={value => handleInputChange('repo', value)}
                      placeholder={
                        currentType === 'github'
                          ? t('settings.github.repoPlaceholder')
                          : t('settings.gitee.repoPlaceholder')
                      }
                      placeholderTextColor="#999999"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Branch */}
                  <View style={[styles.field, dynamicStyles.field]}>
                    <ThemedText style={[styles.label, dynamicStyles.label]}>
                      {currentType === 'github'
                        ? t('settings.github.branch')
                        : t('settings.gitee.branch')}
                    </ThemedText>
                    <TextInput
                      style={[styles.input, dynamicStyles.input]}
                      value={formData.branch}
                      onChangeText={value => handleInputChange('branch', value)}
                      placeholder={
                        currentType === 'github'
                          ? t('settings.github.branchPlaceholder')
                          : t('settings.gitee.branchPlaceholder')
                      }
                      placeholderTextColor="#999999"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Token */}
                  <View style={[styles.field, dynamicStyles.field]}>
                    <ThemedText style={[styles.label, dynamicStyles.label]}>
                      {currentType === 'github'
                        ? t('settings.github.token')
                        : t('settings.gitee.token')}{' '}
                      *
                    </ThemedText>
                    <TextInput
                      style={[styles.input, dynamicStyles.input]}
                      value={formData.token}
                      onChangeText={value => handleInputChange('token', value)}
                      placeholder={
                        currentType === 'github'
                          ? t('settings.github.tokenPlaceholder')
                          : t('settings.gitee.tokenPlaceholder')
                      }
                      placeholderTextColor="#999999"
                      secureTextEntry={true}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <ThemedText style={[styles.hint, dynamicStyles.hint]}>
                      {currentType === 'github'
                        ? t('settings.github.tokenHint')
                        : t('settings.gitee.tokenHint')}
                    </ThemedText>
                  </View>

                  {/* Path */}
                  <View
                    style={[
                      styles.field,
                      dynamicStyles.field,
                      styles.fieldLast,
                    ]}
                  >
                    <ThemedText style={[styles.label, dynamicStyles.label]}>
                      {currentType === 'github'
                        ? t('settings.github.path')
                        : t('settings.gitee.path')}
                    </ThemedText>
                    <TextInput
                      style={[styles.input, dynamicStyles.input]}
                      value={formData.path}
                      onChangeText={value => handleInputChange('path', value)}
                      placeholder={
                        currentType === 'github'
                          ? t('settings.github.pathPlaceholder')
                          : t('settings.gitee.pathPlaceholder')
                      }
                      placeholderTextColor="#999999"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* 空状态提示 */}
          {!selectedType && !initialType && (
            <View style={styles.emptyState}>
              <ThemedText
                style={[styles.emptyStateText, { color: colors.sectionTitle }]}
              >
                {t('settings.storage.selectTypeHint')}
              </ThemedText>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, dynamicStyles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[styles.buttonText, dynamicStyles.cancelButtonText]}
              >
                {t('common.cancel')}
              </ThemedText>
            </TouchableOpacity>
            {(selectedType || initialType) && (
              <TouchableOpacity
                style={[styles.button, dynamicStyles.importButton]}
                onPress={handleImportConfig}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.buttonText,
                    {
                      color: '#007AFF',
                    },
                  ]}
                >
                  {(selectedType || initialType) === 'github'
                    ? t('settings.github.import')
                    : t('settings.gitee.import')}
                </ThemedText>
              </TouchableOpacity>
            )}
            {(selectedType || initialType) && (
              <TouchableOpacity
                style={[styles.button, dynamicStyles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <ThemedText
                  style={[styles.buttonText, dynamicStyles.saveButtonText]}
                >
                  {t('common.save')}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    minHeight: 200,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  form: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  groupContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  field: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  fieldFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  fieldLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333333',
  },
  input: {
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    borderColor: '#DDDDDD',
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelector: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  typeSelectorHeader: {
    marginBottom: 12,
  },
  typeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeOptions: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeOptionContent: {
    flex: 1,
  },
  typeOptionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeOptionDesc: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
  },
});
