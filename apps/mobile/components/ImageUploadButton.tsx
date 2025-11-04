import { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from './ui/icon-symbol';
import { ThemedText } from './themed-text';
import { useImageStore } from '@/stores/imageStore';
import { useI18n } from '@/i18n/useI18n';

interface ImageUploadButtonProps {
  onUploadComplete?: () => void;
}

export function ImageUploadButton({
  onUploadComplete,
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

  return (
    <TouchableOpacity
      style={[styles.button, (loading || uploading) && styles.buttonDisabled]}
      onPress={pickImage}
      disabled={loading || uploading}
    >
      {loading || uploading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <IconSymbol name="plus.circle.fill" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>{t('image.upload')}</ThemedText>
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
