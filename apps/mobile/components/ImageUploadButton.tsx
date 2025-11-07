import { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from './ui/IconSymbol';
import { ThemedText } from './ThemedText';
import { useImageStore } from '@/stores/imageStore';
import { useI18n } from '@/i18n/useI18n';

interface ImageUploadButtonProps {
  onUploadComplete?: () => void;
  compact?: boolean; // 紧凑模式：更小的内边距与字号，便于放置在标题栏
  fab?: boolean; // 悬浮圆形按钮，小球样式
}

export function ImageUploadButton({
  onUploadComplete,
  compact,
  fab,
}: ImageUploadButtonProps) {
  const { t } = useI18n();
  const uploadImage = useImageStore(state => state.uploadImage);
  const loading = useImageStore(state => state.loading);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      // 请求权限
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), '需要访问相册权限');
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        try {
          // 上传单张或多张图片
          for (const asset of result.assets) {
            if (asset.uri) {
              await uploadImage({
                uri: asset.uri,
                name: asset.fileName || undefined,
                description: undefined,
                tags: undefined,
              });
            }
          }
          onUploadComplete?.();
          Alert.alert(t('common.success'), t('image.uploadSuccess'));
        } catch (error) {
          Alert.alert(t('common.error'), t('image.uploadFailed'));
          console.error('Upload error:', error);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('common.error'), '选择图片失败');
    }
  };

  if (fab) {
    return (
      <TouchableOpacity
        style={[
          styles.fabLabelContainer,
          (loading || uploading) && styles.buttonDisabled,
        ]}
        onPress={pickImage}
        disabled={loading || uploading}
        accessibilityLabel={t('image.upload')}
        activeOpacity={0.8}
      >
        {loading || uploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ThemedText style={styles.fabLabel}>{t('image.upload')}</ThemedText>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact && styles.buttonCompact,
        (loading || uploading) && styles.buttonDisabled,
      ]}
      onPress={pickImage}
      disabled={loading || uploading}
      accessibilityLabel={t('image.upload')}
    >
      {loading || uploading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          {/* <IconSymbol name="plus" size={compact ? 18 : 20} color="#fff" /> */}
          <ThemedText
            style={[styles.buttonText, compact && styles.buttonTextCompact]}
          >
            {t('image.upload')}
          </ThemedText>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  fabLabelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextCompact: {
    fontSize: 14,
    fontWeight: '600',
  },
});
