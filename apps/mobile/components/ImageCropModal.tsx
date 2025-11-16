import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { getImageDimensionsFromUri } from '@/utils/imageUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_AREA_SIZE = Math.min(SCREEN_WIDTH - 40, SCREEN_HEIGHT * 0.6);

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  onCropComplete: (crop: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  }) => void;
  onCancel: () => void;
  aspectRatio?: number; // 宽高比，如果设置则固定宽高比
}

export function ImageCropModal({
  visible,
  imageUri,
  onCropComplete,
  onCancel,
  aspectRatio,
}: ImageCropModalProps) {
  const { t } = useI18n();
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [imageDisplaySize, setImageDisplaySize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [cropArea, setCropArea] = useState({
    x: 20,
    y: 20,
    width: CROP_AREA_SIZE - 40,
    height: CROP_AREA_SIZE - 40,
  });
  const [loading, setLoading] = useState(false);
  const imageContainerRef = useRef<View>(null);
  const imageRef = useRef<Image>(null);
  const [containerLayout, setContainerLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [imageLayout, setImageLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [cropStartPosition, setCropStartPosition] = useState({ x: 0, y: 0 });
  const [cropStartSize, setCropStartSize] = useState({ width: 0, height: 0 });
  const [resizeMode, setResizeMode] = useState<'move' | 'resize' | 'none'>(
    'none'
  );
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  useEffect(() => {
    if (visible && imageUri) {
      setLoading(true);
      getImageDimensionsFromUri(imageUri)
        .then(dims => {
          setImageDimensions(dims);
          // 计算图片在容器中的显示尺寸
          const containerWidth = SCREEN_WIDTH - 40;
          const containerHeight = SCREEN_HEIGHT * 0.6;
          const scaleX = containerWidth / dims.width;
          const scaleY = containerHeight / dims.height;
          const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

          setImageDisplaySize({
            width: dims.width * scale,
            height: dims.height * scale,
          });

          // 初始化裁剪区域（居中，大小为图片的80%）
          const initialCropSize = Math.min(
            dims.width * scale * 0.8,
            dims.height * scale * 0.8,
            CROP_AREA_SIZE - 40
          );
          const initialCropWidth = aspectRatio
            ? initialCropSize
            : initialCropSize;
          const initialCropHeight = aspectRatio
            ? initialCropSize / aspectRatio
            : initialCropSize;

          setCropArea({
            x: (containerWidth - initialCropWidth) / 2,
            y: (containerHeight - initialCropHeight) / 2,
            width: initialCropWidth,
            height: initialCropHeight,
          });
        })
        .catch(error => {
          console.error('Failed to get image dimensions:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [visible, imageUri, aspectRatio]);

  // 当图片布局更新时，调整裁剪区域位置（仅在首次加载时）
  const [hasInitializedCrop, setHasInitializedCrop] = useState(false);
  useEffect(() => {
    if (
      imageLayout &&
      imageLayout.width > 0 &&
      visible &&
      !hasInitializedCrop
    ) {
      const cropSize = Math.min(
        imageLayout.width * 0.8,
        imageLayout.height * 0.8
      );
      const cropWidth = aspectRatio ? cropSize : cropSize;
      const cropHeight = aspectRatio ? cropSize / aspectRatio : cropSize;

      setCropArea({
        x: imageLayout.x + (imageLayout.width - cropWidth) / 2,
        y: imageLayout.y + (imageLayout.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
      setHasInitializedCrop(true);
    }
  }, [imageLayout, visible, aspectRatio, hasInitializedCrop]);

  // 重置时也重置初始化标志
  useEffect(() => {
    if (!visible) {
      setHasInitializedCrop(false);
    }
  }, [visible]);

  // 使用 useRef 存储最新的状态值，避免闭包问题
  const cropAreaRef = useRef(cropArea);
  const cropStartPositionRef = useRef(cropStartPosition);
  const cropStartSizeRef = useRef(cropStartSize);
  const imageLayoutRef = useRef(imageLayout);
  const resizeModeRef = useRef(resizeMode);
  const resizeHandleRef = useRef(resizeHandle);

  useEffect(() => {
    cropAreaRef.current = cropArea;
  }, [cropArea]);

  useEffect(() => {
    cropStartPositionRef.current = cropStartPosition;
  }, [cropStartPosition]);

  useEffect(() => {
    cropStartSizeRef.current = cropStartSize;
  }, [cropStartSize]);

  useEffect(() => {
    imageLayoutRef.current = imageLayout;
  }, [imageLayout]);

  useEffect(() => {
    resizeModeRef.current = resizeMode;
  }, [resizeMode]);

  useEffect(() => {
    resizeHandleRef.current = resizeHandle;
  }, [resizeHandle]);

  // 创建拖动手势处理器（用于移动裁剪框）
  const movePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: evt => {
        setResizeMode('move');
        const currentCropArea = cropAreaRef.current;
        cropStartPositionRef.current = {
          x: currentCropArea.x,
          y: currentCropArea.y,
        };
        setCropStartPosition({ x: currentCropArea.x, y: currentCropArea.y });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (resizeModeRef.current !== 'move') return;

        const currentImageLayout = imageLayoutRef.current;
        if (!currentImageLayout || currentImageLayout.width === 0) return;

        const { dx, dy } = gestureState;
        const currentCropArea = cropAreaRef.current;
        const startPos = cropStartPositionRef.current;

        // 计算边界（相对于图片的实际显示位置）
        const imageX = currentImageLayout.x;
        const imageY = currentImageLayout.y;
        const imageWidth = currentImageLayout.width;
        const imageHeight = currentImageLayout.height;

        const maxX = imageX + imageWidth - currentCropArea.width;
        const maxY = imageY + imageHeight - currentCropArea.height;

        const newX = Math.max(imageX, Math.min(startPos.x + dx, maxX));
        const newY = Math.max(imageY, Math.min(startPos.y + dy, maxY));

        setCropArea(prev => ({
          ...prev,
          x: newX,
          y: newY,
        }));
      },
      onPanResponderRelease: () => {
        setResizeMode('none');
        const currentCropArea = cropAreaRef.current;
        cropStartPositionRef.current = {
          x: currentCropArea.x,
          y: currentCropArea.y,
        };
        setCropStartPosition({ x: currentCropArea.x, y: currentCropArea.y });
      },
    })
  ).current;

  // 创建调整大小手势处理器
  const createResizePanResponder = (handle: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: evt => {
        setResizeMode('resize');
        setResizeHandle(handle);
        const currentCropArea = cropAreaRef.current;
        cropStartPositionRef.current = {
          x: currentCropArea.x,
          y: currentCropArea.y,
        };
        cropStartSizeRef.current = {
          width: currentCropArea.width,
          height: currentCropArea.height,
        };
        setCropStartPosition({ x: currentCropArea.x, y: currentCropArea.y });
        setCropStartSize({
          width: currentCropArea.width,
          height: currentCropArea.height,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (
          resizeModeRef.current !== 'resize' ||
          resizeHandleRef.current !== handle
        )
          return;

        const currentImageLayout = imageLayoutRef.current;
        if (!currentImageLayout || currentImageLayout.width === 0) return;

        const { dx, dy } = gestureState;
        const startPos = cropStartPositionRef.current;
        const startSize = cropStartSizeRef.current;

        const imageX = currentImageLayout.x;
        const imageY = currentImageLayout.y;
        const imageWidth = currentImageLayout.width;
        const imageHeight = currentImageLayout.height;
        const minSize = 50; // 最小裁剪尺寸

        let newX = startPos.x;
        let newY = startPos.y;
        let newWidth = startSize.width;
        let newHeight = startSize.height;

        // 根据不同的手柄调整大小
        if (handle === 'topLeft') {
          newX = Math.max(imageX, startPos.x + dx);
          newY = Math.max(imageY, startPos.y + dy);
          newWidth = Math.max(minSize, startSize.width - (newX - startPos.x));
          newHeight = Math.max(minSize, startSize.height - (newY - startPos.y));
        } else if (handle === 'topRight') {
          newY = Math.max(imageY, startPos.y + dy);
          newWidth = Math.max(
            minSize,
            Math.min(startSize.width + dx, imageX + imageWidth - startPos.x)
          );
          newHeight = Math.max(minSize, startSize.height - (newY - startPos.y));
        } else if (handle === 'bottomLeft') {
          newX = Math.max(imageX, startPos.x + dx);
          newWidth = Math.max(minSize, startSize.width - (newX - startPos.x));
          newHeight = Math.max(
            minSize,
            Math.min(startSize.height + dy, imageY + imageHeight - startPos.y)
          );
        } else if (handle === 'bottomRight') {
          newWidth = Math.max(
            minSize,
            Math.min(startSize.width + dx, imageX + imageWidth - startPos.x)
          );
          newHeight = Math.max(
            minSize,
            Math.min(startSize.height + dy, imageY + imageHeight - startPos.y)
          );
        }

        // 确保不超出图片边界
        if (newX + newWidth > imageX + imageWidth) {
          newWidth = imageX + imageWidth - newX;
        }
        if (newY + newHeight > imageY + imageHeight) {
          newHeight = imageY + imageHeight - newY;
        }

        setCropArea({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      },
      onPanResponderRelease: () => {
        setResizeMode('none');
        setResizeHandle(null);
      },
    });
  };

  const topLeftResizePanResponder = useRef(
    createResizePanResponder('topLeft')
  ).current;
  const topRightResizePanResponder = useRef(
    createResizePanResponder('topRight')
  ).current;
  const bottomLeftResizePanResponder = useRef(
    createResizePanResponder('bottomLeft')
  ).current;
  const bottomRightResizePanResponder = useRef(
    createResizePanResponder('bottomRight')
  ).current;

  // 处理裁剪完成
  const handleCropComplete = () => {
    if (!imageDimensions || !imageLayout || imageLayout.width === 0) return;

    // 计算裁剪区域相对于图片的位置（减去图片的偏移）
    const relativeX = cropArea.x - imageLayout.x;
    const relativeY = cropArea.y - imageLayout.y;

    // 计算裁剪区域在原始图片中的位置
    const scaleX = imageDimensions.width / imageLayout.width;
    const scaleY = imageDimensions.height / imageLayout.height;

    const crop = {
      originX: Math.round(Math.max(0, relativeX) * scaleX),
      originY: Math.round(Math.max(0, relativeY) * scaleY),
      width: Math.round(cropArea.width * scaleX),
      height: Math.round(cropArea.height * scaleY),
    };

    onCropComplete(crop);
  };

  // 重置裁剪区域
  const handleReset = () => {
    if (!imageLayout || imageLayout.width === 0) return;

    const initialCropSize = Math.min(
      imageLayout.width * 0.8,
      imageLayout.height * 0.8,
      CROP_AREA_SIZE - 40
    );
    const initialCropWidth = aspectRatio ? initialCropSize : initialCropSize;
    const initialCropHeight = aspectRatio
      ? initialCropSize / aspectRatio
      : initialCropSize;

    setCropArea({
      x: imageLayout.x + (imageLayout.width - initialCropWidth) / 2,
      y: imageLayout.y + (imageLayout.height - initialCropHeight) / 2,
      width: initialCropWidth,
      height: initialCropHeight,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
              <ThemedText style={styles.cancelText}>
                {t('common.cancel')}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>
              {t('image.cropImage')}
            </ThemedText>
            <TouchableOpacity style={styles.headerButton} onPress={handleReset}>
              <ThemedText style={styles.resetText}>
                {t('image.reset')}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Image Container */}
          <View
            style={styles.imageContainer}
            ref={imageContainerRef}
            onLayout={event => {
              const { x, y, width, height } = event.nativeEvent.layout;
              setContainerLayout({ x, y, width, height });
            }}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <>
                <Image
                  ref={imageRef}
                  source={{ uri: imageUri }}
                  style={[
                    styles.image,
                    imageDisplaySize && {
                      width: imageDisplaySize.width,
                      height: imageDisplaySize.height,
                    },
                  ]}
                  contentFit="contain"
                  onLayout={event => {
                    const { x, y, width, height } = event.nativeEvent.layout;
                    // 直接使用 onLayout 返回的位置和尺寸
                    setImageLayout({ x, y, width, height });
                  }}
                />
                {/* Crop Overlay - 将 PanResponder 附加到裁剪框本身用于移动 */}
                <View
                  style={[
                    styles.cropOverlay,
                    {
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    },
                  ]}
                  {...movePanResponder.panHandlers}
                >
                  {/* Corner Handles - 用于调整大小 */}
                  <View
                    style={[styles.cornerHandle, styles.topLeft]}
                    {...topLeftResizePanResponder.panHandlers}
                  />
                  <View
                    style={[styles.cornerHandle, styles.topRight]}
                    {...topRightResizePanResponder.panHandlers}
                  />
                  <View
                    style={[styles.cornerHandle, styles.bottomLeft]}
                    {...bottomLeftResizePanResponder.panHandlers}
                  />
                  <View
                    style={[styles.cornerHandle, styles.bottomRight]}
                    {...bottomRightResizePanResponder.panHandlers}
                  />
                </View>
              </>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <ThemedText style={styles.instructionText}>
              {t('image.cropInstruction')}
            </ThemedText>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cropButton}
              onPress={handleCropComplete}
              disabled={loading}
            >
              <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
              <ThemedText style={styles.cropButtonText}>
                {t('image.confirmCrop')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
  resetText: {
    fontSize: 16,
    color: '#007AFF',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    maxWidth: SCREEN_WIDTH - 40,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  cropOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    // 确保可以接收触摸事件
    zIndex: 10,
  },
  cornerHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
  },
  topLeft: {
    top: -10,
    left: -10,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: -10,
    right: -10,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: -10,
    left: -10,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: -10,
    right: -10,
    borderBottomRightRadius: 4,
  },
  instructions: {
    padding: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  cropButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
