import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useI18n, useInitLanguage } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import {
  useColorScheme,
  useThemeMode,
  setThemeMode,
} from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';

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
  const { githubConfig, giteeConfig, storageType } = useImageStore();
  const currentThemeMode = useThemeMode();

  // 切换主题
  const handleThemeChange = async (mode: 'light' | 'dark' | 'auto') => {
    await setThemeMode(mode);
  };

  // 确保翻译已加载
  if (!isReady) {
    return null;
  }

  const settingsItems: SettingItem[] = [
    {
      id: 'github',
      title: t('settings.github.title'),
      icon: 'link',
      route: '/(tabs)/settings/github',
      description: githubConfig
        ? `${githubConfig.owner}/${githubConfig.repo}`
        : t('settings.github.notConfigured'),
    },
    {
      id: 'gitee',
      title: t('settings.gitee.title'),
      icon: 'link',
      route: '/(tabs)/settings/gitee',
      description: giteeConfig
        ? `${giteeConfig.owner}/${giteeConfig.repo}`
        : t('settings.gitee.notConfigured'),
    },
  ];

  const handleSettingPress = (route: string) => {
    router.push(route as any);
  };

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
      <View style={styles.content}>
        {/* 存储配置分组 */}
        <View style={styles.section}>
          <ThemedText style={dynamicStyles.sectionTitle}>
            {t('settings.storage.title')}
          </ThemedText>
          <View style={dynamicStyles.groupContainer}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  dynamicStyles.settingItem,
                  index === 0 && styles.settingItemFirst,
                  index === settingsItems.length - 1 && styles.settingItemLast,
                ]}
                onPress={() => handleSettingPress(item.route)}
                activeOpacity={0.6}
              >
                <View style={styles.settingItemLeft}>
                  <View style={dynamicStyles.iconContainer}>
                    <IconSymbol
                      name={item.icon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.settingItemContent}>
                    <ThemedText style={dynamicStyles.settingItemTitle}>
                      {item.title}
                    </ThemedText>
                    {item.description && (
                      <ThemedText style={dynamicStyles.settingItemDescription}>
                        {item.description}
                      </ThemedText>
                    )}
                  </View>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={colors.sectionTitle}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 外观分组 */}
        <View style={styles.section}>
          <ThemedText style={dynamicStyles.sectionTitle}>
            {t('settings.theme.title')}
          </ThemedText>
          <View style={dynamicStyles.groupContainer}>
            {[
              {
                mode: 'light' as const,
                label: t('settings.theme.light'),
                icon: 'sun.max.fill',
              },
              {
                mode: 'dark' as const,
                label: t('settings.theme.dark'),
                icon: 'moon.fill',
              },
              {
                mode: 'auto' as const,
                label: t('settings.theme.auto'),
                icon: 'circle.lefthalf.filled',
              },
            ].map((theme, index) => {
              const isSelected = currentThemeMode === theme.mode;
              return (
                <TouchableOpacity
                  key={theme.mode}
                  style={[
                    dynamicStyles.settingItem,
                    index === 0 && styles.settingItemFirst,
                    index === 2 && styles.settingItemLast,
                    isSelected && dynamicStyles.settingItemSelected,
                  ]}
                  onPress={() => handleThemeChange(theme.mode)}
                  activeOpacity={0.6}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={dynamicStyles.iconContainer}>
                      <IconSymbol
                        name={theme.icon as any}
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.settingItemContent}>
                      <ThemedText style={dynamicStyles.settingItemTitle}>
                        {theme.label}
                      </ThemedText>
                      {isSelected && (
                        <ThemedText
                          style={dynamicStyles.settingItemDescription}
                        >
                          {t('settings.theme.current')}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  {isSelected ? (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={22}
                      color="#34C759"
                    />
                  ) : (
                    <IconSymbol
                      name="chevron.right"
                      size={18}
                      color={colors.sectionTitle}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 语言分组 */}
        <View style={styles.section}>
          <ThemedText style={dynamicStyles.sectionTitle}>
            {t('settings.language.title')}
          </ThemedText>
          <View style={dynamicStyles.groupContainer}>
            {getAvailableLanguages().map((lang, index) => {
              const isSelected = getCurrentLanguage() === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    dynamicStyles.settingItem,
                    index === 0 && styles.settingItemFirst,
                    index === getAvailableLanguages().length - 1 &&
                      styles.settingItemLast,
                    isSelected && dynamicStyles.settingItemSelected,
                  ]}
                  onPress={() => changeLanguage(lang.code)}
                  activeOpacity={0.6}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={dynamicStyles.iconContainer}>
                      <ThemedText style={styles.flagText}>
                        {lang.flag}
                      </ThemedText>
                    </View>
                    <View style={styles.settingItemContent}>
                      <ThemedText style={dynamicStyles.settingItemTitle}>
                        {lang.name}
                      </ThemedText>
                      {isSelected && (
                        <ThemedText
                          style={dynamicStyles.settingItemDescription}
                        >
                          {t('settings.language.current')}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  {isSelected ? (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={22}
                      color="#34C759"
                    />
                  ) : (
                    <IconSymbol
                      name="chevron.right"
                      size={18}
                      color={colors.sectionTitle}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
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
    paddingTop: 8,
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
