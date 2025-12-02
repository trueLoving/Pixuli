import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { ImageGrid } from '@/components/ImageGrid';
import { useI18n } from '@/i18n/useI18n';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';
import { useImageStore } from '@/stores/imageStore';
import { useState } from 'react';
import { ImageItem } from '@packages/common/src/index.native';
import { ImageBrowser } from '@/components/ImageBrowser';

export default function FilterScreen() {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { filteredImages, images, refreshImageMetadata } = useImageStore();
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
