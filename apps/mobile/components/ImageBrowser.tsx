import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { ImageItem } from 'pixuli-ui/src';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THUMBNAIL_SIZE = 60;
const THUMBNAIL_MARGIN = 8;
const IMAGE_AREA_HEIGHT = SCREEN_HEIGHT - 200; // 减去 header 和 thumbnail 区域

interface ImageBrowserProps {
  visible: boolean;
  images: ImageItem[];
  initialIndex: number;
  onClose: () => void;
  onDelete: (image: ImageItem) => Promise<void>;
}

export function ImageBrowser({
  visible,
  images,
  initialIndex,
  onClose,
  onDelete,
}: ImageBrowserProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [deleting, setDeleting] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const thumbnailScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setShowMetadata(false); // 重置 metadata 显示状态
      // 延迟滚动，确保组件已渲染
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * SCREEN_WIDTH,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialIndex]);

  // 当当前图片改变时，滚动缩略图到对应位置
  useEffect(() => {
    if (
      visible &&
      thumbnailScrollRef.current &&
      images.length > 0 &&
      currentIndex < images.length
    ) {
      const thumbnailWidth = THUMBNAIL_SIZE + THUMBNAIL_MARGIN * 2;
      const scrollPosition =
        currentIndex * thumbnailWidth - SCREEN_WIDTH / 2 + thumbnailWidth / 2;

      thumbnailScrollRef.current.scrollTo({
        x: Math.max(0, scrollPosition),
        animated: true,
      });
    }
  }, [currentIndex, visible, images.length]);

  // 当图片列表变化时（删除后），调整当前索引
  useEffect(() => {
    if (visible && images.length > 0) {
      // 如果当前索引超出范围，调整到最后一个
      if (currentIndex >= images.length) {
        const newIndex = images.length - 1;
        setCurrentIndex(newIndex);
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: newIndex * SCREEN_WIDTH,
            animated: true,
          });
        }, 100);
      }
    }
  }, [images.length, visible, currentIndex]);

  const handleDelete = () => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;

    Alert.alert(
      t('common.confirm') || '确认',
      t('image.deleteConfirm') || '确定要删除这张图片吗？',
      [
        {
          text: t('common.cancel') || '取消',
          style: 'cancel',
        },
        {
          text: t('common.delete') || '删除',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await onDelete(currentImage);
              // 删除后，父组件的 images 会更新，这里等待一下让状态同步
              // 如果删除的是最后一张，关闭浏览器（由父组件处理）
              if (images.length <= 1) {
                onClose();
              } else {
                // 调整索引：如果删除的是最后一张，显示前一张
                const newIndex =
                  currentIndex >= images.length - 1
                    ? Math.max(0, images.length - 2)
                    : currentIndex;
                setCurrentIndex(newIndex);
                // 滚动到新位置
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({
                    x: newIndex * SCREEN_WIDTH,
                    animated: true,
                  });
                }, 100);
              }
            } catch (error) {
              Alert.alert(
                t('common.error') || '错误',
                t('image.deleteFailed') || '删除失败'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleThumbnailPress = (index: number) => {
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index >= 0 && index < images.length && index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  if (!visible || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 顶部工具栏 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            disabled={deleting}
          >
            <IconSymbol name="xmark" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            {currentIndex + 1} / {images.length}
          </ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setShowMetadata(prev => !prev);
              }}
              disabled={deleting}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <IconSymbol
                name={showMetadata ? 'info.circle.fill' : 'info.circle'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol name="trash" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 主图片区域 */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={[
            styles.imageScrollView,
            showMetadata && styles.imageScrollViewWithMetadata,
          ]}
        >
          {images.map((image, index) => (
            <TouchableOpacity
              key={image.id}
              style={styles.imageContainer}
              onPress={onClose}
              activeOpacity={1}
            >
              <Image
                source={{ uri: image.url }}
                style={styles.image}
                contentFit="contain"
                transition={200}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 元数据信息面板 */}
        {showMetadata && currentImage && (
          <View style={styles.metadataContainer}>
            <ScrollView
              style={styles.metadataContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.metadataRow}>
                <ThemedText style={styles.metadataLabel}>
                  {t('image.imageName')}:
                </ThemedText>
                <ThemedText style={styles.metadataValue}>
                  {currentImage.name}
                </ThemedText>
              </View>
              {currentImage.width > 0 && currentImage.height > 0 && (
                <View style={styles.metadataRow}>
                  <ThemedText style={styles.metadataLabel}>
                    {t('image.dimensions')}:
                  </ThemedText>
                  <ThemedText style={styles.metadataValue}>
                    {currentImage.width} × {currentImage.height}
                  </ThemedText>
                </View>
              )}
              {currentImage.description && (
                <View style={styles.metadataRow}>
                  <ThemedText style={styles.metadataLabel}>
                    {t('image.description')}:
                  </ThemedText>
                  <ThemedText style={styles.metadataValue}>
                    {currentImage.description}
                  </ThemedText>
                </View>
              )}
              {currentImage.tags && currentImage.tags.length > 0 && (
                <View style={styles.metadataRow}>
                  <ThemedText style={styles.metadataLabel}>
                    {t('image.tags')}:
                  </ThemedText>
                  <View style={styles.tagsContainer}>
                    {currentImage.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <ThemedText style={styles.tagText}>{tag}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* 底部缩略图滚动条 */}
        <View style={styles.thumbnailContainer}>
          <ScrollView
            ref={thumbnailScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailScrollContent}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={image.id}
                style={[
                  styles.thumbnail,
                  index === currentIndex && styles.thumbnailActive,
                ]}
                onPress={() => handleThumbnailPress(index)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: image.url }}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
                {index === currentIndex && (
                  <View style={styles.thumbnailOverlay} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollViewWithMetadata: {
    marginBottom: 0,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_AREA_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  thumbnailContainer: {
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 12,
  },
  thumbnailScrollContent: {
    paddingHorizontal: THUMBNAIL_MARGIN,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    marginHorizontal: THUMBNAIL_MARGIN,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#007AFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  metadataContainer: {
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  metadataContent: {
    flex: 1,
  },
  metadataRow: {
    marginBottom: 12,
  },
  metadataLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  metadataValue: {
    color: '#fff',
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
  },
});
