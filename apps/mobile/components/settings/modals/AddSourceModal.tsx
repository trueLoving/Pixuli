import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useI18n } from '@/i18n/useI18n';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../../ui/IconSymbol';
import { ThemedText } from '../../ui/ThemedText';
import { ThemedView } from '../../ui/ThemedView';

interface AddSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'github' | 'gitee') => void;
}

export function AddSourceModal({
  visible,
  onClose,
  onSelect,
}: AddSourceModalProps) {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const sources = [
    {
      type: 'github' as const,
      name: 'GitHub',
      icon: 'link',
      description: t('settings.github.title') || 'GitHub 配置',
    },
    {
      type: 'gitee' as const,
      name: 'Gitee',
      icon: 'link',
      description: t('settings.gitee.title') || 'Gitee 配置',
    },
  ];

  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
    },
    sourceItem: {
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.cardBorder,
    },
    sourceItemText: {
      color: colors.text,
    },
    sourceItemSubtext: {
      color: colors.sectionTitle,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, dynamicStyles.modalOverlay]}
        activeOpacity={1}
        onPress={onClose}
      >
        <ThemedView
          style={[styles.modalContent, dynamicStyles.modalContent]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {t('settings.storage.add') || '添加存储配置'}
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {sources.map((source, index) => (
              <TouchableOpacity
                key={source.type}
                style={[
                  styles.sourceItem,
                  dynamicStyles.sourceItem,
                  index === sources.length - 1 && styles.sourceItemLast,
                ]}
                onPress={() => {
                  onSelect(source.type);
                  onClose();
                }}
                activeOpacity={0.6}
              >
                <View style={styles.sourceItemLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: colors.primary + '20',
                      },
                    ]}
                  >
                    <IconSymbol
                      name={source.icon as any}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.sourceItemContent}>
                    <ThemedText
                      style={[
                        styles.sourceItemText,
                        dynamicStyles.sourceItemText,
                      ]}
                    >
                      {source.name}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.sourceItemSubtext,
                        dynamicStyles.sourceItemSubtext,
                      ]}
                    >
                      {source.description}
                    </ThemedText>
                  </View>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={colors.sectionTitle}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sourceItemLast: {
    borderBottomWidth: 0,
  },
  sourceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceItemContent: {
    flex: 1,
  },
  sourceItemText: {
    fontSize: 17,
    fontWeight: '400',
  },
  sourceItemSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
});
