import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ImageItem, ImageEditData } from 'pixuli-ui/src';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';

interface ImageEditModalProps {
  visible: boolean;
  image: ImageItem | null;
  onClose: () => void;
  onSave: (editData: ImageEditData) => Promise<void>;
  loading?: boolean;
}

export function ImageEditModal({
  visible,
  image,
  onClose,
  onSave,
  loading = false,
}: ImageEditModalProps) {
  const { t } = useI18n();
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (image) {
      setDescription(image.description || '');
      setTags(image.tags || []);
      setTagInput('');
    }
  }, [image, visible]);

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

  const handleSave = async () => {
    if (!image) return;

    try {
      await onSave({
        id: image.id,
        description: description.trim() || undefined,
        tags,
      });
      onClose();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('image.editFailed')
      );
    }
  };

  if (!image) return null;

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
              {t('image.editMetadata')}
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
                  {t('common.save')}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Image Info */}
            <View style={styles.infoSection}>
              <ThemedText style={styles.infoLabel}>
                {t('image.imageName')}
              </ThemedText>
              <ThemedText style={styles.infoValue}>{image.name}</ThemedText>
            </View>

            {image.width > 0 && image.height > 0 && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoLabel}>
                  {t('image.dimensions')}
                </ThemedText>
                <ThemedText style={styles.infoValue}>
                  {image.width} × {image.height}
                </ThemedText>
              </View>
            )}

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
          </ScrollView>
        </View>
      </View>
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
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
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
});
