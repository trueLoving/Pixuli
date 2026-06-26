import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useI18n } from '@/i18n/useI18n';
import { listStoragePluginManifests } from '@/storage/registry';
import {
  getManifestDescription,
  isKnownBuiltinPluginId,
} from '@pixuli/core/plugins';
import React, { useMemo } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../../ui/IconSymbol';
import { ThemedText } from '../../ui/ThemedText';
import { ThemedView } from '../../ui/ThemedView';

interface AddSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (pluginId: string) => void;
}

export function AddSourceModal({
  visible,
  onClose,
  onSelect,
}: AddSourceModalProps) {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const pluginOptions = useMemo(() => {
    return listStoragePluginManifests().map(manifest => ({
      pluginId: manifest.id,
      name: manifest.name,
      description: getManifestDescription(manifest, key => t(key)),
      supported: isKnownBuiltinPluginId(manifest.id),
    }));
  }, [t]);

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
              {t('settings.storage.selectType') || '选择仓库源类型'}
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {pluginOptions.length === 0 ? (
              <ThemedText
                style={[styles.emptyText, { color: colors.sectionTitle }]}
              >
                {t('sidebar.noStoragePlugins')}
              </ThemedText>
            ) : (
              pluginOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.pluginId}
                  style={[
                    styles.sourceItem,
                    dynamicStyles.sourceItem,
                    index === pluginOptions.length - 1 && styles.sourceItemLast,
                    !option.supported && styles.sourceItemDisabled,
                  ]}
                  onPress={() => {
                    if (!option.supported) {
                      return;
                    }
                    onSelect(option.pluginId);
                    onClose();
                  }}
                  disabled={!option.supported}
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
                        name={
                          option.pluginId === 'gitee'
                            ? 'link'
                            : 'chevron.left.forwardslash.chevron.right'
                        }
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
                        {option.name}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.sourceItemSubtext,
                          dynamicStyles.sourceItemSubtext,
                        ]}
                      >
                        {option.description}
                      </ThemedText>
                    </View>
                  </View>
                  <IconSymbol
                    name="chevron.right"
                    size={18}
                    color={colors.sectionTitle}
                  />
                </TouchableOpacity>
              ))
            )}
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingVertical: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sourceItemLast: {
    borderBottomWidth: 0,
  },
  sourceItemDisabled: {
    opacity: 0.5,
  },
  sourceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceItemContent: {
    flex: 1,
  },
  sourceItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  sourceItemSubtext: {
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
    fontSize: 14,
  },
});
