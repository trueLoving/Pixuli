import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import {
  getImageDimensionsFromUri,
  getFileSizeFromUri,
  formatImageFileSize,
  processImage,
  ImageFormat,
  ImageProcessOptions,
  ImageProcessResult,
} from '@/utils/imageUtils';
import { ImageCropModal } from './ImageCropModal';

interface ImageUploadEditModalProps {
  visible: boolean;
  imageUri: string;
  imageName?: string;
  onClose: () => void;
  onSave: (data: {
    name?: string;
    description?: string;
    tags?: string[];
    width?: number;
    height?: number;
    processOptions?: ImageProcessOptions;
  }) => Promise<void>;
  loading?: boolean;
}

export function ImageUploadEditModal({
  visible,
  imageUri,
  imageName,
  onClose,
  onSave,
  loading = false,
}: ImageUploadEditModalProps) {
  const { t } = useI18n();
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [loadingDimensions, setLoadingDimensions] = useState(false);

  // 图片处理选项
  const [enableProcessing, setEnableProcessing] = useState(false);
  const [compressQuality, setCompressQuality] = useState(0.8);
  const [targetFormat, setTargetFormat] = useState<ImageFormat | 'original'>(
    'original'
  );
  const [resizeWidth, setResizeWidth] = useState<string>('');
  const [resizeHeight, setResizeHeight] = useState<string>('');
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);

  // 处理效果预览
  const [previewResult, setPreviewResult] = useState<ImageProcessResult | null>(
    null
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [originalFileSize, setOriginalFileSize] = useState<number | null>(null);

  // 裁剪相关状态
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropArea, setCropArea] = useState<{
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (visible && imageUri) {
      // 重置表单
      setDescription('');
      setTags([]);
      setTagInput('');
      setDimensions(null);
      setEnableProcessing(false);
      setCompressQuality(0.8);
      setTargetFormat('original');
      setResizeWidth('');
      setResizeHeight('');
      setKeepAspectRatio(true);
      setCropArea(null);
      setPreviewResult(null);

      // 初始化文件名（从 imageName 中提取不含扩展名的部分）
      if (imageName) {
        const nameWithoutExt = imageName.replace(/\.[^/.]+$/, '');
        setFileName(nameWithoutExt);
      } else {
        setFileName('');
      }

      // 获取图片尺寸和文件大小
      setLoadingDimensions(true);
      Promise.all([
        getImageDimensionsFromUri(imageUri),
        getFileSizeFromUri(imageUri),
      ])
        .then(([dims, size]) => {
          setDimensions(dims);
          setOriginalFileSize(size);
        })
        .catch(error => {
          console.warn('Failed to get image info:', error);
        })
        .finally(() => {
          setLoadingDimensions(false);
        });

      // 重置预览结果
      setPreviewResult(null);
    }
  }, [visible, imageUri]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 处理裁剪完成
  const handleCropComplete = (crop: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  }) => {
    setCropArea(crop);
    setShowCropModal(false);
    // 如果启用了处理，自动触发预览
    if (enableProcessing) {
      setTimeout(() => {
        handlePreview();
      }, 100);
    }
  };

  // 构建处理选项（用于预览和保存）
  const buildProcessOptions = (): ImageProcessOptions | undefined => {
    // 如果有裁剪区域，即使未启用处理也要应用裁剪
    if (cropArea) {
      const processOptions: ImageProcessOptions = {
        crop: cropArea,
      };

      if (enableProcessing) {
        processOptions.compress = compressQuality;
        processOptions.format =
          targetFormat !== 'original' ? targetFormat : undefined;
      }

      // 添加尺寸调整
      if (resizeWidth || resizeHeight) {
        const width = resizeWidth ? parseInt(resizeWidth, 10) : undefined;
        const height = resizeHeight ? parseInt(resizeHeight, 10) : undefined;

        if (width || height) {
          // 如果保持宽高比，计算另一个维度
          if (keepAspectRatio && dimensions) {
            if (width && !height) {
              const aspectRatio = dimensions.width / dimensions.height;
              processOptions.height = Math.round(width / aspectRatio);
              processOptions.width = width;
            } else if (height && !width) {
              const aspectRatio = dimensions.width / dimensions.height;
              processOptions.width = Math.round(height * aspectRatio);
              processOptions.height = height;
            } else if (width && height) {
              // 两个都设置了，选择较小的缩放比例以保持宽高比
              const scaleX = width / dimensions.width;
              const scaleY = height / dimensions.height;
              const scale = Math.min(scaleX, scaleY);
              processOptions.width = Math.round(dimensions.width * scale);
              processOptions.height = Math.round(dimensions.height * scale);
            }
          } else {
            processOptions.width = width;
            processOptions.height = height;
          }
          processOptions.keepAspectRatio = keepAspectRatio;
        }
      }

      return processOptions;
    }

    if (!enableProcessing) return undefined;

    const processOptions: ImageProcessOptions = {
      compress: compressQuality,
      format: targetFormat !== 'original' ? targetFormat : undefined,
    };

    // 添加尺寸调整
    if (resizeWidth || resizeHeight) {
      const width = resizeWidth ? parseInt(resizeWidth, 10) : undefined;
      const height = resizeHeight ? parseInt(resizeHeight, 10) : undefined;

      if (width || height) {
        // 如果保持宽高比，计算另一个维度
        if (keepAspectRatio && dimensions) {
          if (width && !height) {
            const aspectRatio = dimensions.width / dimensions.height;
            processOptions.height = Math.round(width / aspectRatio);
            processOptions.width = width;
          } else if (height && !width) {
            const aspectRatio = dimensions.width / dimensions.height;
            processOptions.width = Math.round(height * aspectRatio);
            processOptions.height = height;
          } else if (width && height) {
            // 两个都设置了，选择较小的缩放比例以保持宽高比
            const scaleX = width / dimensions.width;
            const scaleY = height / dimensions.height;
            const scale = Math.min(scaleX, scaleY);
            processOptions.width = Math.round(dimensions.width * scale);
            processOptions.height = Math.round(dimensions.height * scale);
          }
        } else {
          processOptions.width = width;
          processOptions.height = height;
        }
        processOptions.keepAspectRatio = keepAspectRatio;
      }
    }

    return processOptions;
  };

  // 预览处理效果
  const handlePreview = async () => {
    if (!enableProcessing) return;

    const processOptions = buildProcessOptions();
    if (!processOptions) return;

    setPreviewLoading(true);
    setPreviewResult(null);

    try {
      const result = await processImage(imageUri, processOptions);
      setPreviewResult(result);
    } catch (error) {
      console.error('预览处理效果失败:', error);
      Alert.alert(
        t('common.error'),
        t('image.previewFailed') || '预览处理效果失败'
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    const processOptions = buildProcessOptions();

    // 构建最终文件名：如果有用户输入的文件名，则使用它；否则使用原始文件名
    let finalFileName: string | undefined;
    if (fileName.trim()) {
      const trimmedFileName = fileName.trim();
      // 检查用户输入的文件名是否已经包含扩展名
      const hasExtension = /\.\w+$/.test(trimmedFileName);

      if (hasExtension) {
        // 如果已经包含扩展名，直接使用
        finalFileName = trimmedFileName;
      } else {
        // 如果没有扩展名，从原始文件名中提取扩展名
        const originalExt = imageName ? imageName.split('.').pop() : 'jpg';
        finalFileName = `${trimmedFileName}.${originalExt}`;
      }
    } else if (imageName) {
      finalFileName = imageName;
    }

    await onSave({
      name: finalFileName,
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      width: dimensions?.width,
      height: dimensions?.height,
      processOptions,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onClose}
              disabled={loading}
            >
              <ThemedText style={styles.cancelText}>
                {t('common.cancel')}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>
              {t('image.editBeforeUpload')}
            </ThemedText>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <ThemedText style={styles.saveText}>
                  {t('image.upload')}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Image Preview */}
            <View style={styles.previewSection}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                contentFit="contain"
              />
              {imageName && (
                <ThemedText style={styles.imageName} numberOfLines={1}>
                  {imageName}
                </ThemedText>
              )}
              {loadingDimensions ? (
                <ThemedText style={styles.dimensionsText}>
                  {t('image.gettingDimensions')}
                </ThemedText>
              ) : dimensions ? (
                <ThemedText style={styles.dimensionsText}>
                  {t('image.dimensions')}: {dimensions.width} ×{' '}
                  {dimensions.height}
                </ThemedText>
              ) : null}
            </View>

            {/* File Name */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>
                {t('image.fileName')}
              </ThemedText>
              <TextInput
                style={styles.fileNameInput}
                value={fileName}
                onChangeText={setFileName}
                placeholder={t('image.fileNamePlaceholder')}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {imageName && (
                <ThemedText style={styles.fileNameHint}>
                  {t('image.renameImage')}: {imageName}
                </ThemedText>
              )}
            </View>

            {/* Description */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>
                {t('image.description')}
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder={t('image.descriptionPlaceholder')}
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>{t('image.tags')}</ThemedText>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder={t('image.tagPlaceholder')}
                  placeholderTextColor="#999"
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={handleAddTag}
                >
                  <IconSymbol name="plus" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.tag}
                      onPress={() => handleRemoveTag(tag)}
                    >
                      <ThemedText style={styles.tagText}>{tag}</ThemedText>
                      <IconSymbol name="xmark" size={14} color="#666" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 裁剪选项 */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>{t('image.crop')}</ThemedText>
              <View style={styles.cropContainer}>
                <TouchableOpacity
                  style={styles.cropButton}
                  onPress={() => setShowCropModal(true)}
                >
                  <IconSymbol name="crop" size={20} color="#007AFF" />
                  <ThemedText style={styles.cropButtonText}>
                    {cropArea ? t('image.editCrop') : t('image.selectCropArea')}
                  </ThemedText>
                </TouchableOpacity>
                {cropArea && (
                  <TouchableOpacity
                    style={styles.removeCropButton}
                    onPress={() => {
                      setCropArea(null);
                      setPreviewResult(null);
                    }}
                  >
                    <IconSymbol name="xmark" size={16} color="#ff3b30" />
                    <ThemedText style={styles.removeCropText}>
                      {t('image.removeCrop')}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
              {cropArea && (
                <View style={styles.cropInfo}>
                  <ThemedText style={styles.cropInfoText}>
                    {t('image.cropArea')}: {cropArea.width} × {cropArea.height}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* 图片处理选项 */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <ThemedText style={styles.label}>
                  {t('image.imageProcessing')}
                </ThemedText>
                <Switch
                  value={enableProcessing}
                  onValueChange={setEnableProcessing}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor="#fff"
                />
              </View>

              {enableProcessing && (
                <>
                  {/* 压缩质量 */}
                  <View style={styles.processingOption}>
                    <ThemedText style={styles.processingLabel}>
                      {t('image.compressQuality')}:{' '}
                      {Math.round(compressQuality * 100)}%
                    </ThemedText>
                    <View style={styles.sliderContainer}>
                      <TouchableOpacity
                        style={styles.sliderButton}
                        onPress={() =>
                          setCompressQuality(
                            Math.max(0.1, compressQuality - 0.1)
                          )
                        }
                      >
                        <ThemedText style={styles.sliderButtonText}>
                          -
                        </ThemedText>
                      </TouchableOpacity>
                      <View style={styles.sliderTrack}>
                        <View
                          style={[
                            styles.sliderFill,
                            { width: `${compressQuality * 100}%` },
                          ]}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.sliderButton}
                        onPress={() =>
                          setCompressQuality(Math.min(1, compressQuality + 0.1))
                        }
                      >
                        <ThemedText style={styles.sliderButtonText}>
                          +
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 格式选择 */}
                  <View style={styles.processingOption}>
                    <ThemedText style={styles.processingLabel}>
                      {t('image.targetFormat')}
                    </ThemedText>
                    <View style={styles.formatContainer}>
                      {(['original', 'jpeg', 'png', 'webp'] as const).map(
                        format => (
                          <TouchableOpacity
                            key={format}
                            style={[
                              styles.formatButton,
                              targetFormat === format &&
                                styles.formatButtonActive,
                            ]}
                            onPress={() => setTargetFormat(format)}
                          >
                            <ThemedText
                              style={[
                                styles.formatButtonText,
                                targetFormat === format &&
                                  styles.formatButtonTextActive,
                              ]}
                            >
                              {format === 'original'
                                ? t('image.originalFormat')
                                : format.toUpperCase()}
                            </ThemedText>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>

                  {/* 尺寸调整 */}
                  <View style={styles.processingOption}>
                    <ThemedText style={styles.processingLabel}>
                      {t('image.resize')}
                    </ThemedText>
                    <View style={styles.resizeContainer}>
                      <View style={styles.resizeInputRow}>
                        <View style={styles.resizeInputWrapper}>
                          <ThemedText style={styles.resizeLabel}>
                            {t('image.width')}
                          </ThemedText>
                          <TextInput
                            style={styles.resizeInput}
                            value={resizeWidth}
                            onChangeText={setResizeWidth}
                            placeholder={dimensions?.width.toString() || '0'}
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                          />
                        </View>
                        <ThemedText style={styles.resizeSeparator}>
                          ×
                        </ThemedText>
                        <View style={styles.resizeInputWrapper}>
                          <ThemedText style={styles.resizeLabel}>
                            {t('image.height')}
                          </ThemedText>
                          <TextInput
                            style={styles.resizeInput}
                            value={resizeHeight}
                            onChangeText={setResizeHeight}
                            placeholder={dimensions?.height.toString() || '0'}
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      <View style={styles.aspectRatioRow}>
                        <ThemedText style={styles.aspectRatioLabel}>
                          {t('image.keepAspectRatio')}
                        </ThemedText>
                        <Switch
                          value={keepAspectRatio}
                          onValueChange={setKeepAspectRatio}
                          trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                          thumbColor="#fff"
                        />
                      </View>
                    </View>
                  </View>

                  {/* 预览按钮 */}
                  <View style={styles.previewButtonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.previewButton,
                        previewLoading && styles.previewButtonDisabled,
                      ]}
                      onPress={handlePreview}
                      disabled={previewLoading}
                    >
                      {previewLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <IconSymbol name="eye" size={16} color="#fff" />
                          <ThemedText style={styles.previewButtonText}>
                            {t('image.previewEffect')}
                          </ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* 处理效果预览 */}
                  {previewResult && (
                    <View style={styles.previewResultContainer}>
                      <ThemedText style={styles.previewResultTitle}>
                        {t('image.processingEffect')}
                      </ThemedText>

                      {/* 图片对比预览 */}
                      <View style={styles.imageComparisonContainer}>
                        <View style={styles.imageComparisonItem}>
                          <ThemedText style={styles.imageComparisonLabel}>
                            {t('image.original')}
                          </ThemedText>
                          <Image
                            source={{ uri: imageUri }}
                            style={styles.previewImageSmall}
                            contentFit="contain"
                          />
                        </View>
                        <IconSymbol
                          name="arrow.right"
                          size={20}
                          color="#007AFF"
                          style={styles.comparisonArrow}
                        />
                        <View style={styles.imageComparisonItem}>
                          <ThemedText style={styles.imageComparisonLabel}>
                            {t('image.processed')}
                          </ThemedText>
                          <Image
                            source={{ uri: previewResult.uri }}
                            style={styles.previewImageSmall}
                            contentFit="contain"
                          />
                        </View>
                      </View>

                      {/* 文件大小对比 */}
                      {previewResult.originalSize !== undefined &&
                        previewResult.size !== undefined && (
                          <View style={styles.comparisonRow}>
                            <View style={styles.comparisonItem}>
                              <ThemedText style={styles.comparisonLabel}>
                                {t('image.originalSize')}
                              </ThemedText>
                              <ThemedText style={styles.comparisonValue}>
                                {formatImageFileSize(
                                  previewResult.originalSize
                                )}
                              </ThemedText>
                            </View>
                            <IconSymbol
                              name="arrow.right"
                              size={16}
                              color="#666"
                            />
                            <View style={styles.comparisonItem}>
                              <ThemedText style={styles.comparisonLabel}>
                                {t('image.processedSize')}
                              </ThemedText>
                              <ThemedText
                                style={[
                                  styles.comparisonValue,
                                  previewResult.sizeReductionPercent &&
                                    previewResult.sizeReductionPercent > 0 &&
                                    styles.comparisonValueSuccess,
                                ]}
                              >
                                {formatImageFileSize(previewResult.size)}
                              </ThemedText>
                            </View>
                          </View>
                        )}

                      {/* 压缩信息 */}
                      {previewResult.sizeReductionPercent !== undefined &&
                        previewResult.sizeReductionPercent > 0 && (
                          <View style={styles.compressionInfo}>
                            <ThemedText style={styles.compressionText}>
                              {t('image.sizeReduced')}:{' '}
                              {formatImageFileSize(
                                previewResult.sizeReduction || 0
                              )}{' '}
                              ({previewResult.sizeReductionPercent.toFixed(1)}%)
                            </ThemedText>
                          </View>
                        )}

                      {/* 尺寸对比 */}
                      {previewResult.originalWidth !== undefined &&
                        previewResult.originalHeight !== undefined && (
                          <View style={styles.comparisonRow}>
                            <View style={styles.comparisonItem}>
                              <ThemedText style={styles.comparisonLabel}>
                                {t('image.originalDimensions')}
                              </ThemedText>
                              <ThemedText style={styles.comparisonValue}>
                                {previewResult.originalWidth} ×{' '}
                                {previewResult.originalHeight}
                              </ThemedText>
                            </View>
                            <IconSymbol
                              name="arrow.right"
                              size={16}
                              color="#666"
                            />
                            <View style={styles.comparisonItem}>
                              <ThemedText style={styles.comparisonLabel}>
                                {t('image.processedDimensions')}
                              </ThemedText>
                              <ThemedText style={styles.comparisonValue}>
                                {previewResult.width} × {previewResult.height}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                    </View>
                  )}

                  {/* 原始文件大小显示 */}
                  {originalFileSize !== null && !previewResult && (
                    <View style={styles.originalSizeInfo}>
                      <ThemedText style={styles.originalSizeText}>
                        {t('image.originalFileSize')}:{' '}
                        {formatImageFileSize(originalFileSize)}
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* 裁剪模态框 */}
      <ImageCropModal
        visible={showCropModal}
        imageUri={imageUri}
        onCropComplete={handleCropComplete}
        onCancel={() => setShowCropModal(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  imageName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dimensionsText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  fileNameInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  fileNameHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  addTagButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingOption: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  processingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  sliderButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  formatContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formatButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  formatButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  formatButtonTextActive: {
    color: '#fff',
  },
  resizeContainer: {
    gap: 12,
  },
  resizeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resizeInputWrapper: {
    flex: 1,
  },
  resizeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resizeInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  resizeSeparator: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  aspectRatioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  aspectRatioLabel: {
    fontSize: 14,
    color: '#333',
  },
  previewButtonContainer: {
    marginTop: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  previewButtonDisabled: {
    opacity: 0.6,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewResultContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  previewResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  comparisonValueSuccess: {
    color: '#28a745',
  },
  compressionInfo: {
    marginTop: 8,
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#d4edda',
    borderRadius: 6,
  },
  compressionText: {
    fontSize: 13,
    color: '#155724',
    fontWeight: '500',
    textAlign: 'center',
  },
  originalSizeInfo: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  originalSizeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  cropContainer: {
    gap: 12,
  },
  cropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cropButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeCropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  removeCropText: {
    color: '#ff3b30',
    fontSize: 12,
    fontWeight: '500',
  },
  cropInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  cropInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  imageComparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    gap: 12,
  },
  imageComparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  imageComparisonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  previewImageSmall: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  comparisonArrow: {
    marginHorizontal: 8,
  },
});
