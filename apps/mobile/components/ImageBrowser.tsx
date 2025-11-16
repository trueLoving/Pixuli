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
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
// 动态加载 legacy API（运行时可用）
// @ts-ignore
const FileSystem = require('expo-file-system/legacy');
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { showSuccess, showError } from '@/utils/toast';
import { formatImageFileSize } from '@/utils/imageUtils';

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
  onRefreshMetadata?: (image: ImageItem) => Promise<ImageItem | null>;
}

export function ImageBrowser({
  visible,
  images,
  initialIndex,
  onClose,
  onDelete,
  onRefreshMetadata,
}: ImageBrowserProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [sharing, setSharing] = useState(false);
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

  const handleRefreshMetadata = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage || !onRefreshMetadata) return;

    setRefreshing(true);
    try {
      const updatedImage = await onRefreshMetadata(currentImage);
      if (updatedImage) {
        // 刷新成功，显示提示
        showSuccess(t('image.refreshMetadataSuccess') || '元数据刷新成功');
        // 如果元数据面板是打开的，保持打开状态以显示新数据
        // 父组件会更新 images prop，组件会自动重新渲染显示新数据
      } else {
        showError(t('image.refreshMetadataFailed') || '刷新元数据失败');
      }
    } catch (error) {
      showError(t('image.refreshMetadataFailed') || '刷新元数据失败');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await Clipboard.setStringAsync(url);
      showSuccess(t('image.copyUrlSuccess') || '链接已复制到剪贴板');
    } catch (error) {
      showError(t('image.copyUrlFailed') || '复制链接失败');
    }
  };

  const handleShareImageLink = async () => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;

    setSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          t('common.error') || '错误',
          t('image.shareFailed') || '分享功能不可用'
        );
        return;
      }

      // expo-sharing 需要本地文件路径，不能直接分享远程 URL
      // 使用 FileSystem.downloadAsync 下载图片，添加超时处理
      const fileExtension = currentImage.name.split('.').pop() || 'jpg';
      const fileName = `${currentImage.id || 'image'}.${fileExtension}`;
      const localUri = `${FileSystem.cacheDirectory}${fileName}`;

      // 使用 Promise.race 实现超时控制
      const downloadPromise = FileSystem.downloadAsync(
        currentImage.url,
        localUri
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('下载超时，请检查网络连接'));
        }, 30000); // 30秒超时
      });

      // 等待下载完成或超时
      const downloadResult = await Promise.race([
        downloadPromise,
        timeoutPromise,
      ]);

      if (!downloadResult.uri) {
        throw new Error('下载图片失败');
      }

      // 分享本地文件
      await Sharing.shareAsync(downloadResult.uri, {
        dialogTitle: currentImage.name,
        mimeType: currentImage.type || 'image/*',
        UTI: currentImage.type || 'public.image',
      });
    } catch (error) {
      console.error('分享图片失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      // 如果是用户取消分享或超时，不显示错误
      if (
        errorMessage.includes('cancel') ||
        errorMessage.includes('dismissed') ||
        errorMessage.includes('User') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('aborted')
      ) {
        return;
      }

      showError(`${t('image.shareFailed') || '分享失败'}: ${errorMessage}`);
    } finally {
      setSharing(false);
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
            {onRefreshMetadata && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleRefreshMetadata}
                disabled={deleting || refreshing}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name="arrow.clockwise" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setShowMetadata(prev => !prev);
              }}
              disabled={deleting || refreshing || sharing}
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
              onPress={handleShareImageLink}
              disabled={deleting || refreshing || sharing}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol name="paperplane.fill" size={24} color="#fff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDelete}
              disabled={deleting || refreshing || sharing}
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
              {/* 基本信息 */}
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

              {currentImage.size > 0 && (
                <View style={styles.metadataRow}>
                  <ThemedText style={styles.metadataLabel}>
                    {t('image.fileSize')}:
                  </ThemedText>
                  <ThemedText style={styles.metadataValue}>
                    {formatImageFileSize(currentImage.size)}
                  </ThemedText>
                </View>
              )}

              <View style={styles.metadataRow}>
                <ThemedText style={styles.metadataLabel}>
                  {t('image.uploadTime')}:
                </ThemedText>
                <ThemedText style={styles.metadataValue}>
                  {formatDate(currentImage.createdAt)}
                </ThemedText>
              </View>

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

              {/* ID、创建时间、更新时间 */}
              <View style={styles.metadataRow}>
                <ThemedText style={styles.metadataLabel}>
                  {t('image.id')}:
                </ThemedText>
                <ThemedText style={styles.metadataValue}>
                  {currentImage.id}
                </ThemedText>
              </View>

              <View style={styles.metadataRow}>
                <ThemedText style={styles.metadataLabel}>
                  {t('image.createdAt')}:
                </ThemedText>
                <ThemedText style={styles.metadataValue}>
                  {formatDate(currentImage.createdAt)}
                </ThemedText>
              </View>

              {currentImage.updatedAt && (
                <View style={styles.metadataRow}>
                  <ThemedText style={styles.metadataLabel}>
                    {t('image.updatedAt')}:
                  </ThemedText>
                  <ThemedText style={styles.metadataValue}>
                    {formatDate(currentImage.updatedAt)}
                  </ThemedText>
                </View>
              )}

              {currentImage.type && (
                <View style={styles.metadataRow}>
                  <ThemedText style={styles.metadataLabel}>
                    {t('image.type')}:
                  </ThemedText>
                  <ThemedText style={styles.metadataValue}>
                    {currentImage.type}
                  </ThemedText>
                </View>
              )}

              {/* URL 信息 */}
              <View style={styles.metadataRow}>
                <ThemedText style={styles.metadataLabel}>
                  {t('image.imageUrl')}:
                </ThemedText>
                <View style={styles.urlContainer}>
                  <ThemedText style={styles.urlText} numberOfLines={1}>
                    {currentImage.url}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.urlActionButton}
                    onPress={() => handleCopyUrl(currentImage.url)}
                  >
                    <IconSymbol name="link" size={16} color="#007AFF" />
                    <ThemedText style={styles.urlActionText}>
                      {t('image.copyUrl')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
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
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  urlText: {
    flex: 1,
    color: '#007AFF',
    fontSize: 14,
  },
  urlActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urlActionText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
