import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useI18n } from '@/i18n/useI18n';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/theme';
import { useImageStore } from '@/stores/imageStore';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { StorageConfigModal } from './StorageConfigModal';
import { GitHubConfig, GiteeConfig } from '@packages/common/src/index.native';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  onBrowseModeChange?: (mode: 'file' | 'slide' | 'wall' | 'gallery3d') => void;
  currentBrowseMode?: 'file' | 'slide' | 'wall' | 'gallery3d';
}

export function DrawerMenu({
  visible,
  onClose,
  onBrowseModeChange,
  currentBrowseMode = 'file',
}: DrawerMenuProps) {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    githubConfig,
    giteeConfig,
    storageType,
    setGitHubConfig,
    setGiteeConfig,
    clearGitHubConfig,
    clearGiteeConfig,
    loadImages,
  } = useImageStore();
  const [versionModalVisible, setVersionModalVisible] = React.useState(false);
  const [helpModalVisible, setHelpModalVisible] = React.useState(false);
  const [configModalVisible, setConfigModalVisible] = React.useState(false);
  const [configModalType, setConfigModalType] = React.useState<
    'github' | 'gitee' | undefined
  >(undefined);
  const [editingConfig, setEditingConfig] = React.useState<
    GitHubConfig | GiteeConfig | undefined
  >();
  const slideAnim = React.useRef(
    new Animated.Value(-Dimensions.get('window').width),
  ).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -Dimensions.get('window').width,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const browseModes: Array<{
    mode: 'file' | 'slide' | 'wall' | 'gallery3d';
    icon: string;
    label: string;
    disabled?: boolean;
  }> = [
    {
      mode: 'file',
      icon: 'folder.fill',
      label: t('browseMode.file') || '文件模式',
    },
    {
      mode: 'slide',
      icon: 'play.fill',
      label: t('browseMode.slide') || '幻灯片模式',
      disabled: true,
    },
    {
      mode: 'wall',
      icon: 'square.grid.3x3.fill',
      label: t('browseMode.wall') || '照片墙模式',
      disabled: true,
    },
    {
      mode: 'gallery3d',
      icon: 'cube.transparent.fill',
      label: t('browseMode.gallery3d') || '3D画廊模式',
      disabled: true,
    },
  ];

  const handleBrowseModeSelect = (
    mode: 'file' | 'slide' | 'wall' | 'gallery3d',
  ) => {
    if (
      onBrowseModeChange &&
      !browseModes.find(m => m.mode === mode)?.disabled
    ) {
      onBrowseModeChange(mode);
      onClose();
    }
  };

  const getCurrentSourceInfo = () => {
    if (storageType === 'github' && githubConfig) {
      return {
        type: 'github' as const,
        name: 'GitHub',
        display: `${githubConfig.owner}/${githubConfig.repo}`,
        config: githubConfig,
      };
    } else if (storageType === 'gitee' && giteeConfig) {
      return {
        type: 'gitee' as const,
        name: 'Gitee',
        display: `${giteeConfig.owner}/${giteeConfig.repo}`,
        config: giteeConfig,
      };
    }
    return null;
  };

  const getAllSources = () => {
    const sources = [];
    if (githubConfig) {
      sources.push({
        type: 'github' as const,
        name: 'GitHub',
        display: `${githubConfig.owner}/${githubConfig.repo}`,
        config: githubConfig,
        isActive: storageType === 'github',
      });
    }
    if (giteeConfig) {
      sources.push({
        type: 'gitee' as const,
        name: 'Gitee',
        display: `${giteeConfig.owner}/${giteeConfig.repo}`,
        config: giteeConfig,
        isActive: storageType === 'gitee',
      });
    }
    return sources;
  };

  const currentSource = getCurrentSourceInfo();
  const allSources = getAllSources();

  const handleAddSource = () => {
    setConfigModalType(undefined as any); // 不预设类型，让用户选择
    setEditingConfig(undefined);
    setConfigModalVisible(true);
  };

  const handleEditSource = (
    type: 'github' | 'gitee',
    config: GitHubConfig | GiteeConfig,
  ) => {
    setConfigModalType(type);
    setEditingConfig(config);
    setConfigModalVisible(true);
  };

  const handleDeleteSource = (type: 'github' | 'gitee') => {
    Alert.alert(
      t('common.confirm'),
      type === 'github'
        ? t('settings.github.clearConfirmMessage')
        : t('settings.gitee.clearConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'github') {
                await clearGitHubConfig();
              } else {
                await clearGiteeConfig();
              }
              onClose();
            } catch (error) {
              // Handle error
            }
          },
        },
      ],
    );
  };

  const handleSwitchSource = async (type: 'github' | 'gitee') => {
    if (storageType === type) {
      return; // Already active
    }
    try {
      if (type === 'github' && githubConfig) {
        await setGitHubConfig(githubConfig);
        await loadImages();
        onClose();
      } else if (type === 'gitee' && giteeConfig) {
        await setGiteeConfig(giteeConfig);
        await loadImages();
        onClose();
      }
    } catch (error) {
      // Handle error
    }
  };

  const handleClearAllSources = () => {
    Alert.alert(
      t('settings.storage.clearAllConfirm') || '确认清除所有配置',
      t('settings.storage.clearAllMessage') ||
        '确定要清除所有仓库源配置吗？此操作不可恢复。',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              // 清除所有配置
              if (githubConfig) {
                await clearGitHubConfig();
              }
              if (giteeConfig) {
                await clearGiteeConfig();
              }
              onClose();
            } catch (error) {
              // Handle error
            }
          },
        },
      ],
    );
  };

  const dynamicStyles = StyleSheet.create({
    drawerContent: {
      backgroundColor: colors.cardBackground,
    },
    menuItem: {
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.cardBorder,
    },
    menuItemText: {
      color: colors.text,
    },
    menuItemSubtext: {
      color: colors.sectionTitle,
    },
    sectionTitle: {
      color: colors.sectionTitle,
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
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.drawer,
            dynamicStyles.drawerContent,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                {t('app.name') || 'Pixuli'}
              </ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* 浏览模式切换 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText
                  style={[styles.sectionTitle, dynamicStyles.sectionTitle]}
                >
                  {t('browseMode.title') || '浏览模式'}
                </ThemedText>
                <View style={styles.sectionHeaderPlaceholder} />
              </View>
              {browseModes.map((mode, index) => {
                const isSelected = currentBrowseMode === mode.mode;
                const isDisabled = mode.disabled;
                return (
                  <TouchableOpacity
                    key={mode.mode}
                    style={[
                      styles.menuItem,
                      dynamicStyles.menuItem,
                      index === browseModes.length - 1 && styles.menuItemLast,
                      isSelected && { backgroundColor: colors.primary + '20' },
                    ]}
                    onPress={() => handleBrowseModeSelect(mode.mode)}
                    disabled={isDisabled}
                    activeOpacity={0.6}
                  >
                    <View style={styles.menuItemLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isSelected
                              ? colors.primary + '20'
                              : colorScheme === 'dark'
                                ? '#2C2C2E'
                                : '#E6F4FE',
                          },
                        ]}
                      >
                        <IconSymbol
                          name={mode.icon as any}
                          size={22}
                          color={
                            isSelected ? colors.primary : colors.sectionTitle
                          }
                        />
                      </View>
                      <View style={styles.menuItemContent}>
                        <ThemedText
                          style={[
                            styles.menuItemText,
                            dynamicStyles.menuItemText,
                            isDisabled && { opacity: 0.5 },
                          ]}
                        >
                          {mode.label}
                        </ThemedText>
                        {isDisabled && (
                          <ThemedText
                            style={[
                              styles.menuItemSubtext,
                              dynamicStyles.menuItemSubtext,
                            ]}
                          >
                            {t('common.comingSoon') || '即将推出'}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={22}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 仓库源管理 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText
                  style={[styles.sectionTitle, dynamicStyles.sectionTitle]}
                >
                  {t('settings.storage.title') || '存储配置'}
                </ThemedText>
                <View style={styles.sectionHeaderActions}>
                  {allSources.length > 0 && (
                    <TouchableOpacity
                      style={[styles.deleteAllButton, { marginRight: 8 }]}
                      onPress={handleClearAllSources}
                      activeOpacity={0.6}
                    >
                      <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddSource}
                    activeOpacity={0.6}
                  >
                    <IconSymbol
                      name="plus.circle.fill"
                      size={22}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {allSources.length > 0 ? (
                allSources.map((source, index) => {
                  const renderRightActions = () => (
                    <View style={styles.rightActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => {
                          handleEditSource(source.type, source.config);
                        }}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="pencil" size={20} color="#FFFFFF" />
                        <ThemedText style={styles.actionButtonText}>
                          {t('common.edit')}
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => {
                          handleDeleteSource(source.type);
                        }}
                        activeOpacity={0.7}
                      >
                        <IconSymbol
                          name="trash.fill"
                          size={20}
                          color="#FFFFFF"
                        />
                        <ThemedText style={styles.actionButtonText}>
                          {t('common.delete')}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  );

                  return (
                    <Swipeable
                      key={source.type}
                      renderRightActions={renderRightActions}
                      overshootRight={false}
                    >
                      <TouchableOpacity
                        style={[
                          styles.sourceItem,
                          dynamicStyles.sourceItem,
                          index === allSources.length - 1 &&
                            styles.sourceItemLast,
                          source.isActive && {
                            backgroundColor: colors.primary + '10',
                          },
                        ]}
                        onPress={() => handleSwitchSource(source.type)}
                        activeOpacity={0.6}
                      >
                        <View style={styles.menuItemLeft}>
                          <View
                            style={[
                              styles.iconContainer,
                              {
                                backgroundColor: source.isActive
                                  ? colors.primary + '20'
                                  : colorScheme === 'dark'
                                    ? '#2C2C2E'
                                    : '#E6F4FE',
                              },
                            ]}
                          >
                            <IconSymbol
                              name="link"
                              size={22}
                              color={
                                source.isActive
                                  ? colors.primary
                                  : colors.sectionTitle
                              }
                            />
                          </View>
                          <View style={styles.menuItemContent}>
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
                              numberOfLines={1}
                            >
                              {source.display}
                            </ThemedText>
                          </View>
                        </View>
                        {source.isActive && (
                          <IconSymbol
                            name="checkmark.circle.fill"
                            size={22}
                            color={colors.primary}
                          />
                        )}
                        {!source.isActive && (
                          <IconSymbol
                            name="chevron.right"
                            size={18}
                            color={colors.sectionTitle}
                          />
                        )}
                      </TouchableOpacity>
                    </Swipeable>
                  );
                })
              ) : (
                <TouchableOpacity
                  style={[
                    styles.sourceItem,
                    dynamicStyles.sourceItem,
                    styles.sourceItemLast,
                  ]}
                  activeOpacity={0.6}
                >
                  <View style={styles.menuItemLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: colors.primary + '20',
                        },
                      ]}
                    >
                      <IconSymbol
                        name="plus.circle.fill"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.menuItemContent}>
                      <ThemedText
                        style={[
                          styles.sourceItemText,
                          dynamicStyles.sourceItemText,
                        ]}
                      >
                        {t('settings.storage.add') || '添加存储配置'}
                      </ThemedText>
                    </View>
                  </View>
                  <IconSymbol
                    name="chevron.right"
                    size={18}
                    color={colors.sectionTitle}
                  />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>

      {/* 配置模态框（包含类型选择） */}
      <StorageConfigModal
        visible={configModalVisible}
        onClose={() => {
          setConfigModalVisible(false);
          setEditingConfig(undefined);
          // 不重置 configModalType，保持用户的选择
          // setConfigModalType(undefined as any);
        }}
        type={configModalType}
        config={editingConfig}
        onSave={() => {
          loadImages();
          // 保存成功后重置类型，以便下次打开时重新选择
          setConfigModalType(undefined as any);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: Math.min(320, Dimensions.get('window').width * 0.85),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderPlaceholder: {
    width: 26,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: 4,
  },
  deleteAllButton: {
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
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
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '400',
  },
  menuItemSubtext: {
    fontSize: 13,
    marginTop: 2,
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
  sourceItemText: {
    fontSize: 17,
    fontWeight: '400',
  },
  sourceItemSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 8,
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
