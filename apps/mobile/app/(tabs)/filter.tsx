import { ImageBrowser } from '@/components/image/ImageBrowser';
import { ImageGrid } from '@/components/image/ImageGrid';
import { SearchAndFilter } from '@/components/search/SearchAndFilter';
import { ThemedView } from '@/components/ui/ThemedView';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import { ImageItem } from '@packages/common/src/index.native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function FilterScreen() {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { filteredImages, images, refreshImageMetadata, deleteImage } =
    useImageStore();
  const [browserVisible, setBrowserVisible] = useState(false);
  const [browserIndex, setBrowserIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    const { loadImages } = useImageStore.getState();
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
    const currentImages = filteredImages.length > 0 ? filteredImages : images;
    if (currentImages.length <= 1) {
      setBrowserVisible(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
  });

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      <SearchAndFilter />
      <View style={styles.content}>
        <ImageGrid
          images={filteredImages.length > 0 ? filteredImages : images}
          onImagePress={handleImagePress}
          numColumns={2}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </View>

      <ImageBrowser
        visible={browserVisible}
        images={filteredImages.length > 0 ? filteredImages : images}
        initialIndex={browserIndex}
        onClose={() => setBrowserVisible(false)}
        onDelete={handleDeleteImage}
        onRefreshMetadata={refreshImageMetadata}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
