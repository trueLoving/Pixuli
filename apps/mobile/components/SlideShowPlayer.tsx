import { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { ImageItem } from 'pixuli-ui/src';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = 120; // 侧边栏宽度
const THUMBNAIL_SIZE = 100; // 缩略图大小

interface SlideShowPlayerProps {
  visible: boolean;
  images: ImageItem[];
  initialIndex?: number;
  onClose: () => void;
}

type PlayMode = 'sequential' | 'random';
type TransitionEffect = 'fade' | 'slide' | 'zoom' | 'none';

interface SlideShowConfig {
  interval: number; // 播放间隔（毫秒）
  playMode: PlayMode;
  autoPlay: boolean;
  loop: boolean;
  transitionEffect: TransitionEffect;
  transitionDuration: number;
  showImageInfo: boolean;
}

const DEFAULT_CONFIG: SlideShowConfig = {
  interval: 3000,
  playMode: 'sequential',
  autoPlay: false,
  loop: true,
  transitionEffect: 'fade',
  transitionDuration: 500,
  showImageInfo: true,
};

export function SlideShowPlayer({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: SlideShowPlayerProps) {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [config, setConfig] = useState<SlideShowConfig>(DEFAULT_CONFIG);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showImageInfo, setShowImageInfo] = useState(config.showImageInfo);
  const [showControls, setShowControls] = useState(true);
  const [showImageList, setShowImageList] = useState(true); // 默认显示图片列表

  const imageListScrollRef = useRef<ScrollView>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(1)).current;

  // 过滤后的图片列表（根据播放模式）
  const getFilteredImages = useCallback(() => {
    if (images.length === 0) return [];
    if (config.playMode === 'random') {
      // 随机模式：打乱顺序
      const shuffled = [...images].sort(() => Math.random() - 0.5);
      return shuffled;
    }
    return images;
  }, [images, config.playMode]);

  const filteredImages = getFilteredImages();
  const currentImage = filteredImages[currentIndex];

  // 应用过渡效果
  const applyTransition = useCallback(
    (callback: () => void) => {
      switch (config.transitionEffect) {
        case 'fade':
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: config.transitionDuration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: config.transitionDuration / 2,
              useNativeDriver: true,
            }),
          ]).start();
          callback();
          break;
        case 'slide':
          slideAnim.setValue(SCREEN_WIDTH);
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: config.transitionDuration,
            useNativeDriver: true,
          }).start();
          callback();
          break;
        case 'zoom':
          zoomAnim.setValue(0.8);
          Animated.timing(zoomAnim, {
            toValue: 1,
            duration: config.transitionDuration,
            useNativeDriver: true,
          }).start();
          callback();
          break;
        default:
          callback();
          break;
      }
    },
    [
      config.transitionEffect,
      config.transitionDuration,
      fadeAnim,
      slideAnim,
      zoomAnim,
    ]
  );

  // 播放下一张
  const playNext = useCallback(() => {
    if (filteredImages.length === 0) return;

    let nextIndex = currentIndex + 1;
    if (nextIndex >= filteredImages.length) {
      if (config.loop) {
        nextIndex = 0;
      } else {
        // 不循环，停止播放
        setIsPlaying(false);
        setIsPaused(false);
        return;
      }
    }

    // 应用过渡效果
    applyTransition(() => {
      setCurrentIndex(nextIndex);
    });
  }, [currentIndex, filteredImages.length, config.loop, applyTransition]);

  // 播放上一张
  const playPrevious = useCallback(() => {
    if (filteredImages.length === 0) return;

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (config.loop) {
        prevIndex = filteredImages.length - 1;
      } else {
        return;
      }
    }

    // 应用过渡效果
    applyTransition(() => {
      setCurrentIndex(prevIndex);
    });
  }, [currentIndex, filteredImages.length, config.loop, applyTransition]);

  // 开始播放
  const handlePlay = useCallback(() => {
    if (filteredImages.length === 0) return;
    setIsPlaying(true);
    setIsPaused(false);
  }, [filteredImages.length]);

  // 暂停播放
  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 停止播放
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 自动播放逻辑
  useEffect(() => {
    if (isPlaying && !isPaused && filteredImages.length > 0) {
      intervalRef.current = setInterval(() => {
        playNext();
      }, config.interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, isPaused, config.interval, playNext, filteredImages.length]);

  // 初始化时如果启用自动播放，则开始播放
  useEffect(() => {
    if (visible && config.autoPlay && filteredImages.length > 0) {
      setIsPlaying(true);
    } else if (!visible) {
      handleStop();
      setCurrentIndex(initialIndex);
    }
  }, [visible, config.autoPlay, filteredImages.length, initialIndex]);

  // 切换显示控制栏
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // 切换显示图片列表
  const toggleImageList = () => {
    setShowImageList(!showImageList);
  };

  // 点击列表中的图片
  const handleImageItemClick = (index: number) => {
    if (index !== currentIndex) {
      applyTransition(() => {
        setCurrentIndex(index);
      });
    }
  };

  // 滚动到当前图片
  useEffect(() => {
    if (
      showImageList &&
      imageListScrollRef.current &&
      filteredImages.length > 0
    ) {
      const scrollPosition = currentIndex * (THUMBNAIL_SIZE + 8); // 8 是间距
      imageListScrollRef.current.scrollTo({
        y: Math.max(0, scrollPosition - THUMBNAIL_SIZE),
        animated: true,
      });
    }
  }, [currentIndex, showImageList, filteredImages.length]);

  if (!visible || images.length === 0 || !currentImage) {
    return null;
  }

  const animatedStyle: any = {};
  if (config.transitionEffect === 'fade') {
    animatedStyle.opacity = fadeAnim;
  } else if (config.transitionEffect === 'slide') {
    animatedStyle.transform = [{ translateX: slideAnim }];
  } else if (config.transitionEffect === 'zoom') {
    animatedStyle.transform = [{ scale: zoomAnim }];
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        {/* 横向布局：左侧图片列表，右侧主图片 */}
        <View style={styles.mainContent}>
          {/* 左侧图片列表侧边栏 */}
          {showImageList && (
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <ThemedText style={styles.sidebarTitle}>
                  {t('image.slideShowImageList') || '图片列表'}
                </ThemedText>
                <TouchableOpacity
                  style={styles.sidebarCloseButton}
                  onPress={toggleImageList}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="xmark" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView
                ref={imageListScrollRef}
                style={styles.imageListScroll}
                contentContainerStyle={styles.imageListContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredImages.map((image, index) => (
                  <TouchableOpacity
                    key={`${image.id}-${index}`}
                    style={[
                      styles.imageListItem,
                      index === currentIndex && styles.imageListItemActive,
                    ]}
                    onPress={() => handleImageItemClick(index)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: image.url }}
                      style={styles.imageListThumbnail}
                      contentFit="cover"
                    />
                    <View style={styles.imageListItemOverlay}>
                      <View style={styles.imageListItemNumber}>
                        <ThemedText style={styles.imageListItemNumberText}>
                          {index + 1}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 右侧主图片显示区域 */}
          <View style={styles.mainImageArea}>
            {/* 顶部控制栏 */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.topBarButton}
                onPress={toggleImageList}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name="line.3.horizontal"
                  size={24}
                  color={showImageList ? '#007AFF' : '#fff'}
                />
              </TouchableOpacity>
              <ThemedText style={styles.imageCounter}>
                {currentIndex + 1} / {filteredImages.length}
              </ThemedText>
              <TouchableOpacity
                style={styles.topBarButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <IconSymbol name="xmark" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* 主图片显示 */}
            <TouchableOpacity
              style={styles.imageContainer}
              activeOpacity={1}
              onPress={toggleControls}
            >
              <Animated.View style={[styles.imageWrapper, animatedStyle]}>
                <Image
                  source={{ uri: currentImage?.url }}
                  style={styles.image}
                  contentFit="contain"
                  transition={200}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* 底部控制栏 */}
            {showControls && (
              <View style={styles.bottomControls}>
                <View style={styles.controlsRow}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={playPrevious}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.controlButtonText}>
                      {'< '}
                      {t('image.slideShowPrevious') || '上一张'}
                    </ThemedText>
                  </TouchableOpacity>

                  <View style={styles.playControls}>
                    {isPlaying && !isPaused ? (
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={handlePause}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.playButtonText}>
                          {t('image.slideShowPause') || '暂停'}
                        </ThemedText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={handlePlay}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.playButtonText}>
                          {t('image.slideShowPlay') || '播放'}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                    {isPlaying && (
                      <TouchableOpacity
                        style={styles.stopButton}
                        onPress={handleStop}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.stopButtonText}>
                          {t('image.slideShowStop') || '停止'}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={playNext}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.controlButtonText}>
                      {t('image.slideShowNext') || '下一张'}
                      {' >'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
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
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  // 左侧图片列表侧边栏
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  sidebarCloseButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageListScroll: {
    flex: 1,
  },
  imageListContent: {
    padding: 8,
    gap: 8,
  },
  imageListItem: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  imageListItemActive: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  imageListThumbnail: {
    width: '100%',
    height: '100%',
  },
  imageListItemOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  imageListItemNumber: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageListItemNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // 右侧主图片区域
  mainImageArea: {
    flex: 1,
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  topBarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  playControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    minWidth: 80,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stopButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    minWidth: 60,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
