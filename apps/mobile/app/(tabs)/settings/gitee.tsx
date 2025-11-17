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
import { GiteeConfig } from 'pixuli-ui/src';
import { showSuccess, showError } from '@/utils/toast';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';

export default function GiteeSettingsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { giteeConfig, setGiteeConfig, clearGiteeConfig } = useImageStore();

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

  const [formData, setFormData] = useState<GiteeConfig>({
    owner: giteeConfig?.owner || '',
    repo: giteeConfig?.repo || '',
    branch: giteeConfig?.branch || 'main',
    token: giteeConfig?.token || '',
    path: giteeConfig?.path || 'images',
  });

  useEffect(() => {
    if (giteeConfig) {
      setFormData({
        owner: giteeConfig.owner || '',
        repo: giteeConfig.repo || '',
        branch: giteeConfig.branch || 'master',
        token: giteeConfig.token || '',
        path: giteeConfig.path || 'images',
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
  }, [giteeConfig]);

  const handleInputChange = (field: keyof GiteeConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // 验证必填字段
    if (!formData.owner || !formData.repo || !formData.token) {
      Alert.alert(t('common.error'), t('settings.gitee.requiredFields'));
      return;
    }

    try {
      await setGiteeConfig(formData);
      showSuccess(t('settings.gitee.saveSuccess'));
      router.push('/(tabs)/settings');
    } catch (error) {
      showError(
        `${t('settings.gitee.saveFailed')}: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  };

  const handleClear = () => {
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
          onPress: async () => {
            try {
              await clearGiteeConfig();
              showSuccess(t('settings.gitee.clearSuccess'));
              router.push('/(tabs)/settings');
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

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 50 : 16,
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
      label: t('settings.gitee.owner'),
      required: true,
    },
    { key: 'repo' as const, label: t('settings.gitee.repo'), required: true },
    {
      key: 'branch' as const,
      label: t('settings.gitee.branch'),
      required: false,
    },
    {
      key: 'token' as const,
      label: t('settings.gitee.token'),
      required: true,
      secure: true,
      hint: t('settings.gitee.tokenHint'),
    },
    { key: 'path' as const, label: t('settings.gitee.path'), required: false },
  ];

  return (
    <ThemedView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => {
            router.push('/(tabs)/settings');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={dynamicStyles.title}>
          {t('settings.gitee.title')}
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
                      ? t('settings.gitee.ownerPlaceholder')
                      : field.key === 'repo'
                        ? t('settings.gitee.repoPlaceholder')
                        : field.key === 'branch'
                          ? t('settings.gitee.branchPlaceholder')
                          : field.key === 'token'
                            ? t('settings.gitee.tokenPlaceholder')
                            : t('settings.gitee.pathPlaceholder')
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
          <ThemedText style={dynamicStyles.importButtonText}>导入</ThemedText>
        </TouchableOpacity>
        {giteeConfig && (
          <TouchableOpacity
            style={[dynamicStyles.button, dynamicStyles.clearButton]}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <ThemedText style={dynamicStyles.clearButtonText}>清除</ThemedText>
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
