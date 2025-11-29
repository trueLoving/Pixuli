import { Image } from 'expo-image';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { ImageItem } from '@packages/common/src/index.native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ImageGridProps {
  images: ImageItem[];
  onImagePress?: (image: ImageItem) => void;
  numColumns?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ImageGrid({
  images,
  onImagePress,
  numColumns = 2,
  onRefresh,
  refreshing = false,
}: ImageGridProps) {
  const renderItem = ({ item }: { item: ImageItem }) => {
    return (
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => onImagePress?.(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.imageOverlay}>
          <ThemedText style={styles.imageName} numberOfLines={1}>
            {item.name}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  if (images.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>暂无图片</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={images}
      renderItem={renderItem}
      numColumns={numColumns}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    minWidth: 0, // 允许 flex 收缩
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  imageName: {
    color: '#fff',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
