import { HelpModal } from '@/components/settings/modals/HelpModal';
import { LanguageModal } from '@/components/settings/modals/LanguageModal';
import { OperationLogModal } from '@/components/settings/modals/OperationLogModal';
import { ThemeModal } from '@/components/settings/modals/ThemeModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { Colors } from '@/constants/theme';
import {
  setThemeMode,
  useColorScheme,
  useThemeMode,
} from '@/hooks/useColorScheme';
import { useI18n, useInitLanguage } from '@/i18n/useI18n';
import { VersionInfoModal } from '@packages/common/src/index.native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type IconName =
  | 'house.fill'
  | 'paperplane.fill'
  | 'chevron.right'
  | 'gear'
  | 'link'
  | 'chevron.left';

interface SettingItem {
  id: string;
  title: string;
  icon: IconName;
  route: string;
  description?: string;
}

export default function SettingsScreen() {
  const {
    t,
    getAvailableLanguages,
    getCurrentLanguage,
    changeLanguage,
    isReady,
  } = useI18n();
  useInitLanguage();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const currentThemeMode = useThemeMode();
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [operationLogModalVisible, setOperationLogModalVisible] =
    useState(false);

  // 切换主题
  const handleThemeChange = async (mode: 'light' | 'dark' | 'auto') => {
    await setThemeMode(mode);
  };

  // 获取当前主题的显示文本
  const getCurrentThemeLabel = () => {
    switch (currentThemeMode) {
      case 'light':
        return t('settings.theme.light');
      case 'dark':
        return t('settings.theme.dark');
      case 'auto':
        return t('settings.theme.auto');
      default:
        return t('settings.theme.auto');
    }
  };

  // 获取当前语言的显示文本
  const getCurrentLanguageLabel = () => {
    const currentLang = getAvailableLanguages().find(
      lang => lang.code === getCurrentLanguage(),
    );
    return currentLang?.name || '';
  };

  // 确保翻译已加载
  if (!isReady) {
    return null;
  }

  const dynamicStyles = StyleSheet.create({
    ...styles,
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    groupContainer: {
      ...styles.groupContainer,
      backgroundColor: colors.cardBackground,
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.05,
    },
    settingItem: {
      ...styles.settingItem,
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.cardBorder,
    },
    settingItemSelected: {
      ...styles.settingItemSelected,
      backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F9F9F9',
    },
    iconContainer: {
      ...styles.iconContainer,
      backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#E6F4FE',
    },
    settingItemTitle: {
      ...styles.settingItemTitle,
      color: colors.text,
    },
    settingItemDescription: {
      ...styles.settingItemDescription,
      color: colors.sectionTitle,
    },
    sectionTitle: {
      ...styles.sectionTitle,
      color: colors.sectionTitle,
    },
  });

  return (
    <ThemedView style={dynamicStyles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* 外观分组 */}
        <View style={styles.section}>
          <ThemedText style={dynamicStyles.sectionTitle}>
            {t('settings.theme.title')}
          </ThemedText>
          <View style={dynamicStyles.groupContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.settingItem,
                styles.settingItemFirst,
                styles.settingItemLast,
              ]}
              onPress={() => setThemeModalVisible(true)}
              activeOpacity={0.6}
            >
              <View style={styles.settingItemLeft}>
                <View style={dynamicStyles.iconContainer}>
                  <IconSymbol
                    name="circle.lefthalf.filled"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.settingItemContent}>
                  <ThemedText style={dynamicStyles.settingItemTitle}>
                    {getCurrentThemeLabel()}
                  </ThemedText>
                  <ThemedText style={dynamicStyles.settingItemDescription}>
                    {t('settings.theme.current')}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol
                name="chevron.right"
                size={18}
                color={colors.sectionTitle}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 语言分组 */}
        <View style={styles.section}>
          <ThemedText style={dynamicStyles.sectionTitle}>
            {t('settings.language.title')}
          </ThemedText>
          <View style={dynamicStyles.groupContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.settingItem,
                styles.settingItemFirst,
                styles.settingItemLast,
              ]}
              onPress={() => setLanguageModalVisible(true)}
              activeOpacity={0.6}
            >
              <View style={styles.settingItemLeft}>
                <View style={dynamicStyles.iconContainer}>
                  <ThemedText style={styles.flagText}>
                    {getAvailableLanguages().find(
                      lang => lang.code === getCurrentLanguage(),
                    )?.flag || '🌐'}
                  </ThemedText>
                </View>
                <View style={styles.settingItemContent}>
                  <ThemedText style={dynamicStyles.settingItemTitle}>
                    {getCurrentLanguageLabel()}
                  </ThemedText>
                  <ThemedText style={dynamicStyles.settingItemDescription}>
                    {t('settings.language.current')}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol
                name="chevron.right"
                size={18}
                color={colors.sectionTitle}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 关于和帮助分组 */}
        <View style={styles.section}>
          <ThemedText style={dynamicStyles.sectionTitle}>
            {t('settings.about.title') || '关于'}
          </ThemedText>
          <View style={dynamicStyles.groupContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.settingItem,
                styles.settingItemFirst,
                { borderBottomColor: colors.cardBorder },
              ]}
              onPress={() => setOperationLogModalVisible(true)}
              activeOpacity={0.6}
            >
              <View style={styles.settingItemLeft}>
                <View style={dynamicStyles.iconContainer}>
                  <IconSymbol
                    name="doc.text.fill"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.settingItemContent}>
                  <ThemedText style={dynamicStyles.settingItemTitle}>
                    {t('settings.operationLog.title') || '日志查看'}
                  </ThemedText>
                  <ThemedText style={dynamicStyles.settingItemDescription}>
                    {t('settings.operationLog.description') ||
                      '查看与导出操作日志'}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol
                name="chevron.right"
                size={18}
                color={colors.sectionTitle}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.settingItem,
                { borderBottomColor: colors.cardBorder },
              ]}
              onPress={() => setHelpModalVisible(true)}
              activeOpacity={0.6}
            >
              <View style={styles.settingItemLeft}>
                <View style={dynamicStyles.iconContainer}>
                  <IconSymbol
                    name="questionmark.circle.fill"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.settingItemContent}>
                  <ThemedText style={dynamicStyles.settingItemTitle}>
                    {t('settings.help.title') || '帮助和文档'}
                  </ThemedText>
                  <ThemedText style={dynamicStyles.settingItemDescription}>
                    {t('settings.help.description') || '查看使用文档和常见问题'}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol
                name="chevron.right"
                size={18}
                color={colors.sectionTitle}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.settingItem, styles.settingItemLast]}
              onPress={() => setVersionModalVisible(true)}
              activeOpacity={0.6}
            >
              <View style={styles.settingItemLeft}>
                <View style={dynamicStyles.iconContainer}>
                  <IconSymbol
                    name="info.circle.fill"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.settingItemContent}>
                  <ThemedText style={dynamicStyles.settingItemTitle}>
                    {t('settings.version.title') || '版本信息'}
                  </ThemedText>
                  <ThemedText style={dynamicStyles.settingItemDescription}>
                    {t('settings.version.description') ||
                      '查看应用版本和构建信息'}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol
                name="chevron.right"
                size={18}
                color={colors.sectionTitle}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 版本信息模态框 */}
      <VersionInfoModal
        visible={versionModalVisible}
        onClose={() => setVersionModalVisible(false)}
        t={t}
        colorScheme={colorScheme}
      />

      {/* 帮助模态框 */}
      <HelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        t={t}
      />

      {/* 外观选择模态框 */}
      <ThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
        currentMode={currentThemeMode}
        onSelect={handleThemeChange}
        t={t}
      />

      {/* 语言选择模态框 */}
      <LanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        currentLanguage={getCurrentLanguage()}
        availableLanguages={getAvailableLanguages()}
        onSelect={changeLanguage}
        t={t}
      />

      {/* 操作日志模态框 */}
      <OperationLogModal
        visible={operationLogModalVisible}
        onClose={() => setOperationLogModalVisible(false)}
        t={t}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: -0.08,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  groupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  settingItemFirst: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  settingItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  settingItemSelected: {
    backgroundColor: '#F9F9F9',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingItemContent: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 2,
  },
  settingItemDescription: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 2,
  },
  flagText: {
    fontSize: 20,
  },
});
