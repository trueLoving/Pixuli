import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ImageGrid } from '@/components/ImageGrid';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { ImageBrowser } from '@/components/ImageBrowser';
import { SlideShowPlayer } from '@/components/SlideShowPlayer';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { DrawerMenu } from '@/components/DrawerMenu';
import { useImageStore } from '@/stores/imageStore';
import { useI18n } from '@/i18n/useI18n';
import { ImageItem, EmptyState } from '@packages/common/src/index.native';
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
  const [refreshing, setRefreshing] = useState(false);
  const [browserVisible, setBrowserVisible] = useState(false);
  const [browserIndex, setBrowserIndex] = useState(0);
  const [slideShowVisible, setSlideShowVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [browseMode, setBrowseMode] = useState<
    'file' | 'slide' | 'wall' | 'gallery3d'
  >('file');
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

  // 如果没有配置，显示提示信息
  if (!storageType || !currentSource) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          onAddGitHub={() => router.push('/(tabs)/settings/github')}
          onAddGitee={() => router.push('/(tabs)/settings/gitee')}
          t={t}
          colorScheme={colorScheme}
        />
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

  // 处理浏览模式切换
  const handleBrowseModeChange = (
    mode: 'file' | 'slide' | 'wall' | 'gallery3d',
  ) => {
    setBrowseMode(mode);
    // 暂时禁用幻灯片模式
    // if (mode === 'slide' && filteredImages.length > 0) {
    //   setSlideShowVisible(true);
    // }
  };

  return (
    <ThemedView style={styles.container}>
      {/* 搜索和筛选栏 */}
      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <SearchAndFilter
            currentBrowseMode={browseMode}
            onBrowseModeChange={handleBrowseModeChange}
          />
        </View>
      </View>

      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <View style={styles.titleBlock}>
          <ThemedText style={styles.subtitle}>
            {hasActiveSearchOrFilter
              ? `${displayImages.length} / ${images.length} ${t('app.imageCount')}`
              : images?.length
                ? `${images.length} ${t('app.imageCount')}`
                : ''}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={[
            styles.slideShowButton,
            {
              backgroundColor: colors.inputBackground,
            },
          ]}
          onPress={() => setDrawerVisible(true)}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="line.3.horizontal"
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
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

      {/* 幻灯片播放器 - 暂时禁用 */}
      {/* <SlideShowPlayer
        visible={slideShowVisible}
        images={displayImages}
        initialIndex={0}
        onClose={() => setSlideShowVisible(false)}
      /> */}

      {/* 抽屉菜单 */}
      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onBrowseModeChange={handleBrowseModeChange}
        currentBrowseMode={browseMode}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  drawerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchContainer: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
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
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  sourceIcon: {
    marginRight: 2,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  slideShowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
