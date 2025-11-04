import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ImageGrid } from '@/components/ImageGrid';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { useImageStore } from '@/stores/imageStore';
import { useI18n } from '@/i18n/useI18n';
import { ImageItem } from 'pixuli-ui/src';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { images, loading, error, loadImages, storageType, githubConfig } =
    useImageStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // 如果已配置存储，加载图片
    if (storageType && githubConfig) {
      loadImages();
    }
  }, [storageType, githubConfig, loadImages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
  };

  const handleImagePress = (image: ImageItem) => {
    // TODO: 实现图片详情页面
    console.log('Image pressed:', image);
  };

  const handleGoToSettings = () => {
    router.push('/(tabs)/settings');
  };

  // 如果没有配置，显示提示信息
  if (!storageType || !githubConfig) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol
            name="gear"
            size={64}
            color="#007AFF"
            style={styles.emptyIcon}
          />
          <ThemedText type="title" style={styles.emptyTitle}>
            {t('app.welcome') || '欢迎使用 Pixuli'}
          </ThemedText>
          <ThemedText style={styles.emptyDescription}>
            {t('app.description') ||
              '请先配置 GitHub 存储服务以开始使用图片管理功能'}
          </ThemedText>
          <TouchableOpacity
            style={styles.configButton}
            onPress={handleGoToSettings}
          >
            <ThemedText style={styles.configButtonText}>
              {t('app.configureGitHub') || '配置 GitHub'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {t('image.title')}
        </ThemedText>
        <View style={styles.headerActions}>
          {storageType && <ImageUploadButton onUploadComplete={loadImages} />}
        </View>
      </View>

      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            {t('common.loading')}
          </ThemedText>
        </View>
      ) : (
        <ImageGrid
          images={images}
          onImagePress={handleImagePress}
          numColumns={2}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </ThemedView>
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
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    padding: 8,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  configButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  configButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
