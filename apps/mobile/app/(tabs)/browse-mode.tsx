import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';
import { useImageStore } from '@/stores/imageStore';
import { SlideShowPlayer } from '@/components/SlideShowPlayer';

type BrowseMode = 'file' | 'slide' | 'wall' | 'gallery3d';

export default function BrowseModeScreen() {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { filteredImages } = useImageStore();
  const [currentMode, setCurrentMode] = useState<BrowseMode>('file');
  const [slideShowVisible, setSlideShowVisible] = useState(false);

  const browseModes: Array<{
    mode: BrowseMode;
    icon: string;
    label: string;
    description: string;
    disabled?: boolean;
  }> = [
    {
      mode: 'file',
      icon: 'doc.text.fill',
      label: t('browseMode.file') || '文件模式',
      description: t('browseMode.fileDesc') || '以文件列表形式浏览图片',
    },
    {
      mode: 'slide',
      icon: 'play.fill',
      label: t('browseMode.slide') || '幻灯片模式',
      description: t('browseMode.slideDesc') || '自动播放幻灯片',
    },
    {
      mode: 'wall',
      icon: 'square.grid.2x2.fill',
      label: t('browseMode.wall') || '照片墙模式',
      description: t('browseMode.wallDesc') || '照片墙展示（开发中）',
      disabled: true,
    },
    {
      mode: 'gallery3d',
      icon: 'cube.fill',
      label: t('browseMode.gallery3d') || '3D画廊模式',
      description: t('browseMode.gallery3dDesc') || '3D画廊展示（开发中）',
      disabled: true,
    },
  ];

  const handleModeSelect = (mode: BrowseMode) => {
    if (mode === 'slide' && filteredImages.length > 0) {
      setSlideShowVisible(true);
    } else {
      setCurrentMode(mode);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    modeCard: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
    },
    modeCardSelected: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    modeTitle: {
      color: colors.text,
    },
    modeDescription: {
      color: colors.sectionTitle,
    },
    iconContainer: {
      backgroundColor: colors.primary + '20',
    },
  });

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            {t('browseMode.title') || '浏览模式'}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.sectionTitle }]}>
            {t('browseMode.subtitle') || '选择你喜欢的浏览方式'}
          </ThemedText>
        </View>

        <View style={styles.modesContainer}>
          {browseModes.map((mode, index) => {
            const isSelected = currentMode === mode.mode;
            const isDisabled = mode.disabled;
            return (
              <TouchableOpacity
                key={mode.mode}
                style={[
                  styles.modeCard,
                  dynamicStyles.modeCard,
                  isSelected && dynamicStyles.modeCardSelected,
                  index === browseModes.length - 1 && styles.modeCardLast,
                  isDisabled && styles.modeCardDisabled,
                ]}
                onPress={() => handleModeSelect(mode.mode)}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                <View style={styles.modeContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      dynamicStyles.iconContainer,
                      isSelected && {
                        backgroundColor: colors.primary + '30',
                      },
                    ]}
                  >
                    <IconSymbol
                      name={mode.icon as any}
                      size={32}
                      color={isSelected ? colors.primary : colors.sectionTitle}
                    />
                  </View>
                  <View style={styles.modeTextContainer}>
                    <ThemedText
                      style={[
                        styles.modeTitle,
                        dynamicStyles.modeTitle,
                        isDisabled && { opacity: 0.5 },
                      ]}
                    >
                      {mode.label}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.modeDescription,
                        dynamicStyles.modeDescription,
                        isDisabled && { opacity: 0.5 },
                      ]}
                    >
                      {mode.description}
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                  {isDisabled && (
                    <ThemedText
                      style={[
                        styles.comingSoon,
                        { color: colors.sectionTitle },
                      ]}
                    >
                      {t('common.comingSoon') || '即将推出'}
                    </ThemedText>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <SlideShowPlayer
        visible={slideShowVisible}
        images={filteredImages}
        initialIndex={0}
        onClose={() => setSlideShowVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  modesContainer: {
    gap: 12,
  },
  modeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  modeCardLast: {
    marginBottom: 0,
  },
  modeCardDisabled: {
    opacity: 0.6,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
  },
  comingSoon: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
