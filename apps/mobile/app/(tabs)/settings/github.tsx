import { useRouter, useNavigation } from 'expo-router';
import { useState, useEffect, useLayoutEffect } from 'react';
import {
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
import * as Sharing from 'expo-sharing';

// 动态加载 legacy API（运行时可用）
// @ts-ignore
const FileSystem = require('expo-file-system/legacy');
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { GitHubConfig } from 'pixuli-common/src';
import { showSuccess, showError } from '@/utils/toast';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';

export default function GitHubSettingsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { githubConfig, setGitHubConfig, clearGitHubConfig } = useImageStore();

  // 隐藏底部 tab 栏
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' },
    });
    return () => {
      // 恢复 tab 栏（当离开页面时）
      navigation.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, [navigation]);

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
    } else {
      // 当配置被清除时，清空表单
      setFormData({
        owner: '',
        repo: '',
        branch: 'main',
        token: '',
        path: 'images',
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
      router.push('/(tabs)/settings');
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
              router.push('/(tabs)/settings');
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

  // 导入配置
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

      // 读取文件内容
      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      const configData = JSON.parse(fileContent);

      // 验证配置格式（与 web/桌面端保持一致）
      if (
        !configData.config ||
        !configData.config.owner ||
        !configData.config.repo ||
        !configData.config.token
      ) {
        showError(t('settings.github.invalidFormat'));
        return;
      }

      // 更新表单数据
      setFormData({
        owner: configData.config.owner || '',
        repo: configData.config.repo || '',
        branch: configData.config.branch || 'main',
        token: configData.config.token || '',
        path: configData.config.path || 'images',
      });

      showSuccess(t('settings.github.importSuccess'));
    } catch (error) {
      showError(
        `${t('settings.github.importFailed')}: ${error instanceof Error ? error.message : '文件格式错误'}`
      );
    }
  };

  // 导出配置
  const handleExportConfig = async () => {
    try {
      if (!githubConfig) {
        showError(t('settings.github.noConfigToExport'));
        return;
      }

      const configData = {
        version: '1.0',
        platform: 'mobile',
        timestamp: new Date().toISOString(),
        config: githubConfig,
      };

      const fileName = `pixuli-github-config-${new Date().toISOString().split('T')[0]}.json`;
      const fileContent = JSON.stringify(configData, null, 2);

      // 根据平台选择保存方式
      if (Platform.OS === 'android') {
        // Android: 尝试直接保存到 Downloads 目录
        try {
          // Android 10+ 需要使用 MediaStore API，这里使用分享功能但引导用户保存
          const tempUri = `${FileSystem.cacheDirectory}${fileName}`;
          await FileSystem.writeAsStringAsync(tempUri, fileContent);

          // 使用分享功能，但设置合适的标题引导用户保存到 Downloads
          await Sharing.shareAsync(tempUri, {
            mimeType: 'application/json',
            dialogTitle: t('settings.github.export'),
            UTI: 'public.json',
          });

          showSuccess(t('settings.github.exportSuccess'));
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
            `${t('settings.github.exportFailed')}: ${shareError instanceof Error ? shareError.message : '未知错误'}`
          );
        }
      } else {
        // iOS: 使用分享功能保存到文件应用
        const tempUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(tempUri, fileContent);

        try {
          await Sharing.shareAsync(tempUri, {
            mimeType: 'application/json',
            dialogTitle: t('settings.github.export'),
            UTI: 'public.json',
          });

          showSuccess(t('settings.github.exportSuccess'));
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
            `${t('settings.github.exportFailed')}: ${shareError instanceof Error ? shareError.message : '未知错误'}`
          );
        }
      }
    } catch (error) {
      showError(
        `${t('settings.github.exportFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Math.max(insets.top + 8, 16),
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.cardBorder,
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      flex: 1,
      textAlign: 'center',
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    form: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
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
    field: {
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colorScheme === 'dark' ? '#38383A' : '#E5E5E5',
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
      color: colorScheme === 'dark' ? '#FFFFFF' : '#333333',
      marginBottom: 10,
    },
    input: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.text,
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? '#38383A' : '#DDDDDD',
      borderRadius: 8,
      minHeight: 44,
    },
    hint: {
      fontSize: 12,
      color: colorScheme === 'dark' ? '#8E8E93' : '#666666',
      marginTop: 6,
      lineHeight: 16,
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      gap: 10,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.cardBorder,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    importButton: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      borderWidth: 1,
      borderColor: '#007AFF',
    },
    importButtonText: {
      color: '#007AFF',
      fontSize: 16,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: '#007AFF',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    clearButton: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      borderWidth: 1,
      borderColor: '#FF3B30',
    },
    clearButtonText: {
      color: '#FF3B30',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const fields = [
    {
      key: 'owner' as const,
      label: t('settings.github.owner'),
      required: true,
    },
    { key: 'repo' as const, label: t('settings.github.repo'), required: true },
    {
      key: 'branch' as const,
      label: t('settings.github.branch'),
      required: false,
    },
    {
      key: 'token' as const,
      label: t('settings.github.token'),
      required: true,
      secure: true,
      hint: t('settings.github.tokenHint'),
    },
    { key: 'path' as const, label: t('settings.github.path'), required: false },
  ];

  return (
    <ThemedView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => {
            // 直接导航到设置页面
            router.push('/(tabs)/settings');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={dynamicStyles.title}>
          {t('settings.github.title')}
        </ThemedText>
        <View style={dynamicStyles.placeholder} />
      </View>

      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View style={dynamicStyles.form}>
          <View style={dynamicStyles.groupContainer}>
            {fields.map((field, index) => (
              <View
                key={field.key}
                style={[
                  dynamicStyles.field,
                  index === 0 && dynamicStyles.fieldFirst,
                  index === fields.length - 1 && dynamicStyles.fieldLast,
                ]}
              >
                <ThemedText style={dynamicStyles.label}>
                  {field.label} {field.required && '*'}
                </ThemedText>
                <TextInput
                  style={dynamicStyles.input}
                  value={formData[field.key]}
                  onChangeText={value => handleInputChange(field.key, value)}
                  placeholder={
                    field.key === 'owner'
                      ? t('settings.github.ownerPlaceholder')
                      : field.key === 'repo'
                        ? t('settings.github.repoPlaceholder')
                        : field.key === 'branch'
                          ? t('settings.github.branchPlaceholder')
                          : field.key === 'token'
                            ? t('settings.github.tokenPlaceholder')
                            : t('settings.github.pathPlaceholder')
                  }
                  placeholderTextColor="#999999"
                  secureTextEntry={field.secure}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {field.hint && (
                  <ThemedText style={dynamicStyles.hint}>
                    {field.hint}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 底部操作按钮组 */}
      <View style={dynamicStyles.footer}>
        <TouchableOpacity
          style={[dynamicStyles.button, dynamicStyles.importButton]}
          onPress={handleImportConfig}
          activeOpacity={0.7}
        >
          <ThemedText style={dynamicStyles.importButtonText}>
            {t('settings.github.import')}
          </ThemedText>
        </TouchableOpacity>
        {githubConfig && (
          <TouchableOpacity
            style={[dynamicStyles.button, dynamicStyles.clearButton]}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <ThemedText style={dynamicStyles.clearButtonText}>
              {t('settings.github.clear')}
            </ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[dynamicStyles.button, dynamicStyles.saveButton]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <ThemedText style={dynamicStyles.saveButtonText}>
            {t('common.save')}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
