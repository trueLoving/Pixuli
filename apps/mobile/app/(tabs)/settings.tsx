import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';

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
  const { t } = useI18n();
  const router = useRouter();
  const { githubConfig, storageType } = useImageStore();

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
    // 可以添加更多设置项
    // {
    //   id: 'upyun',
    //   title: t('settings.upyun.title'),
    //   icon: 'cloud',
    //   route: '/(tabs)/settings/upyun',
    // },
  ];

  const handleSettingPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {t('settings.title')}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {t('settings.storage.title')}
        </ThemedText>

        {settingsItems.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.settingItem}
            onPress={() => handleSettingPress(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <View style={styles.iconContainer}>
                <IconSymbol name={item.icon} size={24} color="#007AFF" />
              </View>
              <View style={styles.settingItemContent}>
                <ThemedText style={styles.settingItemTitle}>
                  {item.title}
                </ThemedText>
                {item.description && (
                  <ThemedText style={styles.settingItemDescription}>
                    {item.description}
                  </ThemedText>
                )}
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingItemContent: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingItemDescription: {
    fontSize: 14,
    opacity: 0.6,
  },
});
