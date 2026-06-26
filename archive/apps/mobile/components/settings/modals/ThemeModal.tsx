import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../../ui/IconSymbol';
import { ThemedText } from '../../ui/ThemedText';
import { ThemedView } from '../../ui/ThemedView';

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
  currentMode: 'light' | 'dark' | 'auto';
  onSelect: (mode: 'light' | 'dark' | 'auto') => void;
  t: (key: string) => string;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  visible,
  onClose,
  currentMode,
  onSelect,
  t,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const themes = [
    {
      mode: 'light' as const,
      label: t('settings.theme.light'),
      icon: 'sun.max.fill',
    },
    {
      mode: 'dark' as const,
      label: t('settings.theme.dark'),
      icon: 'moon.fill',
    },
    {
      mode: 'auto' as const,
      label: t('settings.theme.auto'),
      icon: 'circle.lefthalf.filled',
    },
  ];

  const handleSelect = (mode: 'light' | 'dark' | 'auto') => {
    onSelect(mode);
    onClose();
  };

  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
    },
    title: {
      color: colors.text,
    },
    themeItem: {
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.cardBorder,
    },
    themeItemSelected: {
      backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F9F9F9',
    },
    themeItemTitle: {
      color: colors.text,
    },
    themeItemDescription: {
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <IconSymbol
                  name="circle.lefthalf.filled"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.headerText}>
                <ThemedText style={[styles.title, dynamicStyles.title]}>
                  {t('settings.theme.title')}
                </ThemedText>
                <ThemedText
                  style={[styles.subtitle, dynamicStyles.themeItemDescription]}
                >
                  {themes.find(t => t.mode === currentMode)?.label ||
                    t('settings.theme.current')}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                name="xmark.circle.fill"
                size={24}
                color={colors.sectionTitle}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {themes.map((theme, index) => {
              const isSelected = currentMode === theme.mode;
              return (
                <TouchableOpacity
                  key={theme.mode}
                  style={[
                    styles.themeItem,
                    dynamicStyles.themeItem,
                    index === themes.length - 1 && styles.themeItemLast,
                    isSelected && dynamicStyles.themeItemSelected,
                  ]}
                  onPress={() => handleSelect(theme.mode)}
                  activeOpacity={0.6}
                >
                  <View style={styles.themeItemLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: colors.primary + '20' },
                      ]}
                    >
                      <IconSymbol
                        name={theme.icon as any}
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.themeItemContent}>
                      <ThemedText
                        style={[
                          styles.themeItemTitle,
                          dynamicStyles.themeItemTitle,
                        ]}
                      >
                        {theme.label}
                      </ThemedText>
                    </View>
                  </View>
                  {isSelected ? (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={22}
                      color="#34C759"
                    />
                  ) : (
                    <IconSymbol
                      name="chevron.right"
                      size={18}
                      color={colors.sectionTitle}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ThemedView>
      </TouchableOpacity>
    </Modal>
  );
};

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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
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
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 8,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeItemLast: {
    borderBottomWidth: 0,
  },
  themeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeItemContent: {
    flex: 1,
  },
  themeItemTitle: {
    fontSize: 17,
    fontWeight: '400',
  },
});
