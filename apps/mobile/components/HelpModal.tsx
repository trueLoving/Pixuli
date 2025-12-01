import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Linking,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  visible,
  onClose,
  t,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const helpItems = [
    {
      id: 'docs',
      title: t('help.documentation') || '使用文档',
      icon: 'book.fill',
      url: 'https://pixuli-docs.vercel.app/',
    },
    {
      id: 'faq',
      title: t('help.faq') || '常见问题',
      icon: 'questionmark.circle.fill',
      url: 'https://pixuli-docs.vercel.app/',
    },
    {
      id: 'github',
      title: t('help.github') || 'GitHub 仓库',
      icon: 'link',
      url: 'https://github.com/trueLoving/Pixuli',
    },
  ];

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
    subtitle: {
      color: colors.sectionTitle,
    },
    helpItem: {
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.cardBorder,
    },
    helpItemTitle: {
      color: colors.text,
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
                  name="questionmark.circle.fill"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.headerText}>
                <ThemedText style={[styles.title, dynamicStyles.title]}>
                  {t('help.title') || '帮助和文档'}
                </ThemedText>
                <ThemedText style={[styles.subtitle, dynamicStyles.subtitle]}>
                  {t('help.subtitle') || '获取使用帮助和文档'}
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
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.helpSection}>
              {helpItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.helpItem,
                    dynamicStyles.helpItem,
                    index === helpItems.length - 1 && styles.helpItemLast,
                  ]}
                  onPress={() => handleOpenLink(item.url)}
                  activeOpacity={0.6}
                >
                  <View style={styles.helpItemLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: colors.primary + '20' },
                      ]}
                    >
                      <IconSymbol
                        name={item.icon as any}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.helpItemTitle,
                        dynamicStyles.helpItemTitle,
                      ]}
                    >
                      {item.title}
                    </ThemedText>
                  </View>
                  <IconSymbol
                    name="chevron.right"
                    size={18}
                    color={colors.sectionTitle}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
    maxHeight: '80%',
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
    maxHeight: 400,
  },
  helpSection: {
    padding: 20,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  helpItemLast: {
    borderBottomWidth: 0,
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 17,
    fontWeight: '400',
  },
});
