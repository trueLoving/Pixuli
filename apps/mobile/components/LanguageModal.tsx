import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
  currentLanguage: string;
  availableLanguages: Language[];
  onSelect: (languageCode: string) => void;
  t: (key: string) => string;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  visible,
  onClose,
  currentLanguage,
  availableLanguages,
  onSelect,
  t,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleSelect = (languageCode: string) => {
    onSelect(languageCode);
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
    languageItem: {
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.cardBorder,
    },
    languageItemSelected: {
      backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F9F9F9',
    },
    languageItemTitle: {
      color: colors.text,
    },
    languageItemDescription: {
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
                <ThemedText style={styles.flagText}>🌐</ThemedText>
              </View>
              <View style={styles.headerText}>
                <ThemedText style={[styles.title, dynamicStyles.title]}>
                  {t('settings.language.title')}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.subtitle,
                    dynamicStyles.languageItemDescription,
                  ]}
                >
                  {availableLanguages.find(
                    lang => lang.code === currentLanguage,
                  )?.name || t('settings.language.current')}
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
            {availableLanguages.map((lang, index) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    dynamicStyles.languageItem,
                    index === availableLanguages.length - 1 &&
                      styles.languageItemLast,
                    isSelected && dynamicStyles.languageItemSelected,
                  ]}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.6}
                >
                  <View style={styles.languageItemLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: colors.primary + '20' },
                      ]}
                    >
                      <ThemedText style={styles.flagText}>
                        {lang.flag}
                      </ThemedText>
                    </View>
                    <View style={styles.languageItemContent}>
                      <ThemedText
                        style={[
                          styles.languageItemTitle,
                          dynamicStyles.languageItemTitle,
                        ]}
                      >
                        {lang.name}
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
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  languageItemLast: {
    borderBottomWidth: 0,
  },
  languageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageItemContent: {
    flex: 1,
  },
  languageItemTitle: {
    fontSize: 17,
    fontWeight: '400',
  },
  flagText: {
    fontSize: 20,
  },
});
