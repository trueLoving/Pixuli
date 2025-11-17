import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ImageGrid } from '@/components/ImageGrid';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { ImageBrowser } from '@/components/ImageBrowser';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { useImageStore } from '@/stores/imageStore';
import { useI18n } from '@/i18n/useI18n';
import { ImageItem } from 'pixuli-ui/src';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';

export default function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const {
    images,
    filteredImages,
    loading,
    error,
    loadImages,
    storageType,
    githubConfig,
    giteeConfig,
    deleteImage,
    searchQuery,
    filterOptions,
    refreshImageMetadata,
  } = useImageStore();
  const [refreshing, setRefreshing] = useState(false);
  const [browserVisible, setBrowserVisible] = useState(false);
  const [browserIndex, setBrowserIndex] = useState(0);
  const [sourceSwitchVisible, setSourceSwitchVisible] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    // 如果已配置存储，加载图片
    if (storageType && (githubConfig || giteeConfig)) {
      loadImages();
    }
  }, [storageType, githubConfig, giteeConfig, loadImages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
  };

  const handleImagePress = (image: ImageItem) => {
    const index = filteredImages.findIndex(img => img.id === image.id);
    if (index !== -1) {
      setBrowserIndex(index);
      setBrowserVisible(true);
    }
  };

  const handleDeleteImage = async (image: ImageItem) => {
    await deleteImage(image.id, image.name);
    // 如果删除后没有图片了，关闭浏览器
    if (filteredImages.length <= 1) {
      setBrowserVisible(false);
    }
  };

  const handleGoToSettings = () => {
    router.push('/(tabs)/settings');
  };

  // 获取当前仓库源信息
  const getCurrentSourceInfo = () => {
    if (storageType === 'github' && githubConfig) {
      return {
        type: 'github',
        name: 'GitHub',
        config: githubConfig,
        display: `${githubConfig.owner}/${githubConfig.repo}`,
      };
    } else if (storageType === 'gitee' && giteeConfig) {
      return {
        type: 'gitee',
        name: 'Gitee',
        config: giteeConfig,
        display: `${giteeConfig.owner}/${giteeConfig.repo}`,
      };
    }
    return null;
  };

  const currentSource = getCurrentSourceInfo();

  // 如果没有配置，显示提示信息
  if (!storageType || !currentSource) {
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
            {t('app.description') || '请先配置存储服务以开始使用图片管理功能'}
          </ThemedText>
          <TouchableOpacity
            style={styles.configButton}
            onPress={handleGoToSettings}
          >
            <ThemedText style={styles.configButtonText}>
              {t('app.configureStorage') || '配置存储服务'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  const displayImages =
    filteredImages.length > 0 ||
    searchQuery ||
    Object.keys(filterOptions).length > 0
      ? filteredImages
      : images;
  const hasActiveSearchOrFilter =
    searchQuery.trim().length > 0 ||
    (filterOptions.tags && filterOptions.tags.length > 0) ||
    filterOptions.minWidth !== undefined ||
    filterOptions.minHeight !== undefined ||
    filterOptions.maxWidth !== undefined ||
    filterOptions.maxHeight !== undefined;

  return (
    <ThemedView style={styles.container}>
      {/* 搜索和筛选栏 */}
      <SearchAndFilter />

      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <ThemedText style={styles.subtitle}>
            {hasActiveSearchOrFilter
              ? `${displayImages.length} / ${images.length} 张`
              : images?.length
                ? `${images.length} 张`
                : ''}
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.sourceButton}
            onPress={() => setSourceSwitchVisible(true)}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="link"
              size={18}
              color={colors.primary}
              style={styles.sourceIcon}
            />
            <ThemedText style={styles.sourceText} numberOfLines={1}>
              {currentSource?.display || '未配置'}
            </ThemedText>
            <IconSymbol
              name="chevron.down"
              size={14}
              color={colors.sectionTitle}
            />
          </TouchableOpacity>
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
          images={displayImages}
          onImagePress={handleImagePress}
          numColumns={2}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}

      {storageType && (
        <View style={styles.fabContainer}>
          <ImageUploadButton fab onUploadComplete={loadImages} />
        </View>
      )}

      <ImageBrowser
        visible={browserVisible}
        images={displayImages}
        initialIndex={browserIndex}
        onClose={() => setBrowserVisible(false)}
        onDelete={handleDeleteImage}
        onRefreshMetadata={refreshImageMetadata}
      />

      {/* 仓库源切换模态框 */}
      <Modal
        visible={sourceSwitchVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSourceSwitchVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSourceSwitchVisible(false)}
        >
          <ThemedView
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              切换仓库源
            </ThemedText>

            <TouchableOpacity
              style={[
                styles.sourceOption,
                storageType === 'github' && styles.sourceOptionActive,
                { borderBottomColor: colors.cardBorder },
              ]}
              onPress={() => {
                if (storageType !== 'github') {
                  if (githubConfig) {
                    // 切换到 GitHub（通过设置 GitHub 配置来切换）
                    const { setGitHubConfig } = useImageStore.getState();
                    setGitHubConfig(githubConfig);
                    loadImages();
                  } else {
                    Alert.alert('提示', '请先在设置中配置 GitHub 仓库', [
                      {
                        text: '取消',
                        style: 'cancel',
                      },
                      {
                        text: '去配置',
                        onPress: () => {
                          router.push('/(tabs)/settings/github');
                        },
                      },
                    ]);
                  }
                }
                setSourceSwitchVisible(false);
              }}
            >
              <View style={styles.sourceOptionLeft}>
                <IconSymbol
                  name="link"
                  size={20}
                  color={
                    storageType === 'github' ? '#007AFF' : colors.sectionTitle
                  }
                />
                <View style={styles.sourceOptionInfo}>
                  <ThemedText
                    style={[styles.sourceOptionName, { color: colors.text }]}
                  >
                    GitHub
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.sourceOptionDesc,
                      { color: colors.sectionTitle },
                    ]}
                    numberOfLines={1}
                  >
                    {githubConfig
                      ? `${githubConfig.owner}/${githubConfig.repo}`
                      : '未配置'}
                  </ThemedText>
                </View>
              </View>
              {storageType === 'github' && (
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={22}
                  color="#34C759"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sourceOption,
                storageType === 'gitee' && styles.sourceOptionActive,
              ]}
              onPress={() => {
                if (storageType !== 'gitee') {
                  if (giteeConfig) {
                    // 切换到 Gitee（通过设置 Gitee 配置来切换）
                    const { setGiteeConfig } = useImageStore.getState();
                    setGiteeConfig(giteeConfig);
                    loadImages();
                  } else {
                    Alert.alert('提示', '请先在设置中配置 Gitee 仓库', [
                      {
                        text: '取消',
                        style: 'cancel',
                      },
                      {
                        text: '去配置',
                        onPress: () => {
                          router.push('/(tabs)/settings/gitee');
                        },
                      },
                    ]);
                  }
                }
                setSourceSwitchVisible(false);
              }}
            >
              <View style={styles.sourceOptionLeft}>
                <IconSymbol
                  name="link"
                  size={20}
                  color={
                    storageType === 'gitee' ? '#007AFF' : colors.sectionTitle
                  }
                />
                <View style={styles.sourceOptionInfo}>
                  <ThemedText
                    style={[styles.sourceOptionName, { color: colors.text }]}
                  >
                    Gitee
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.sourceOptionDesc,
                      { color: colors.sectionTitle },
                    ]}
                    numberOfLines={1}
                  >
                    {giteeConfig
                      ? `${giteeConfig.owner}/${giteeConfig.repo}`
                      : '未配置'}
                  </ThemedText>
                </View>
              </View>
              {storageType === 'gitee' && (
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={22}
                  color="#34C759"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSourceSwitchVisible(false)}
            >
              <ThemedText style={styles.modalCloseText}>取消</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </TouchableOpacity>
      </Modal>
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
  titleBlock: {
    flexDirection: 'column',
    flex: 1,
  },
  title: {
    flex: 1,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.6,
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    gap: 6,
    maxWidth: 150,
  },
  sourceIcon: {
    marginRight: 2,
  },
  sourceText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  sourceOptionActive: {
    backgroundColor: '#F0F8FF',
  },
  sourceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sourceOptionInfo: {
    flex: 1,
  },
  sourceOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sourceOptionDesc: {
    fontSize: 13,
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
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
