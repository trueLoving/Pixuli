import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useI18n } from '@/i18n/useI18n';
import { useImageStore } from '@/stores/imageStore';
import {
  getRepoConfigFromSource,
  pluginIdToLegacyType,
} from '@pixuli/core/sources';
import { useSourceStore } from '@/stores/sourceStore';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StorageConfigModal } from '../settings/modals/StorageConfigModal';
import { IconSymbol } from '../ui/IconSymbol';
import { ThemedText } from '../ui/ThemedText';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { storageType, loadImages, initializeStorage } = useImageStore();
  const { sources, selectedSourceId, setSelectedSourceId, removeSource } =
    useSourceStore();
  const [versionModalVisible, setVersionModalVisible] = React.useState(false);
  const [helpModalVisible, setHelpModalVisible] = React.useState(false);
  const [configModalVisible, setConfigModalVisible] = React.useState(false);
  const [configModalType, setConfigModalType] = React.useState<
    'github' | 'gitee' | undefined
  >(undefined);
  const [editingSourceId, setEditingSourceId] = React.useState<
    string | undefined
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

  const currentSource = selectedSourceId
    ? sources.find(s => s.id === selectedSourceId)
    : sources[0] || null;

  const allSources = sources.map(source => {
    const repo = getRepoConfigFromSource(source);
    return {
      id: source.id,
      label: source.label,
      pluginId: source.pluginId,
      owner: repo.owner,
      repo: repo.repo,
      isActive: selectedSourceId === source.id,
    };
  });

  const handleAddSource = () => {
    setConfigModalType(undefined);
    setEditingSourceId(undefined);
    setConfigModalVisible(true);
  };

  const handleEditSource = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (source) {
      setConfigModalType(pluginIdToLegacyType(source.pluginId));
      setEditingSourceId(sourceId);
      setConfigModalVisible(true);
    }
  };

  const handleDeleteSource = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    const deleteConfirmText = t('settings.storage.deleteConfirm');
    const confirmMessage = deleteConfirmText
      ? deleteConfirmText.replace('{name}', source.label)
      : `确定要删除仓库源 "${source.label}" 吗？`;

    Alert.alert(t('common.confirm'), confirmMessage, [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            // 先获取删除后的剩余源列表
            const remainingSources = sources.filter(s => s.id !== sourceId);

            // 删除源（等待保存完成）
            await removeSource(sourceId);

            // 如果删除的是最后一个源，清除旧配置（防止迁移逻辑重新创建）
            if (remainingSources.length === 0) {
              // 直接清除旧配置存储，避免迁移逻辑重新创建
              const AsyncStorage =
                require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.removeItem('pixuli-github-config');
              await AsyncStorage.removeItem('pixuli-gitee-config');
              // 确保迁移标记已设置，防止重新迁移
              await AsyncStorage.setItem('pixuli.migration.completed', 'true');
            }

            // 如果删除的是当前选中的源，切换到其他源或清空
            if (selectedSourceId === sourceId) {
              if (remainingSources.length > 0) {
                setSelectedSourceId(remainingSources[0].id);
                initializeStorage();
                await loadImages();
              } else {
                setSelectedSourceId(null);
                initializeStorage();
              }
            }
            onClose();
          } catch (error) {
            console.error('删除仓库源失败:', error);
            Alert.alert(
              t('common.error') || '错误',
              t('settings.storage.deleteFailed') || '删除仓库源失败，请重试',
            );
          }
        },
      },
    ]);
  };

  const handleSwitchSource = async (sourceId: string) => {
    if (selectedSourceId === sourceId) {
      return; // Already active
    }
    try {
      setSelectedSourceId(sourceId);
      initializeStorage();
      await loadImages();
      onClose();
    } catch (error) {
      // Handle error
    }
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

            {/* 仓库源管理 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText
                  style={[styles.sectionTitle, dynamicStyles.sectionTitle]}
                >
                  {t('settings.storage.title') || '存储配置'}
                </ThemedText>
                <View style={styles.sectionHeaderActions}>
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
                  return (
                    <TouchableOpacity
                      key={source.id}
                      style={[
                        styles.sourceItem,
                        dynamicStyles.sourceItem,
                        index === allSources.length - 1 &&
                          styles.sourceItemLast,
                        source.isActive && {
                          backgroundColor: colors.primary + '10',
                        },
                      ]}
                      onPress={() => handleSwitchSource(source.id)}
                      onLongPress={() => {
                        // 长按显示操作菜单
                        Alert.alert(
                          source.label,
                          `${source.owner}/${source.repo}`,
                          [
                            {
                              text: t('common.edit'),
                              onPress: () => handleEditSource(source.id),
                            },
                            {
                              text: t('common.delete'),
                              style: 'destructive',
                              onPress: () => handleDeleteSource(source.id),
                            },
                            {
                              text: t('common.cancel'),
                              style: 'cancel',
                            },
                          ],
                          { cancelable: true },
                        );
                      }}
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
                          {source.pluginId === 'github' ? (
                            <IconSymbol
                              name="chevron.left.forwardslash.chevron.right"
                              size={22}
                              color={
                                source.isActive
                                  ? colors.primary
                                  : colors.sectionTitle
                              }
                            />
                          ) : (
                            <ThemedText
                              style={[
                                styles.giteeIconText,
                                {
                                  color: source.isActive
                                    ? colors.primary
                                    : colors.sectionTitle,
                                },
                              ]}
                            >
                              码
                            </ThemedText>
                          )}
                        </View>
                        <View style={styles.menuItemContent}>
                          <ThemedText
                            style={[
                              styles.sourceItemText,
                              dynamicStyles.sourceItemText,
                            ]}
                          >
                            {source.label}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.sourceItemSubtext,
                              dynamicStyles.sourceItemSubtext,
                            ]}
                            numberOfLines={1}
                          >
                            {source.owner}/{source.repo}
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
          setEditingSourceId(undefined);
          setConfigModalType(undefined);
        }}
        type={configModalType}
        sourceId={editingSourceId}
        onSave={() => {
          initializeStorage();
          loadImages();
          setEditingSourceId(undefined);
          setConfigModalType(undefined);
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
  giteeIconText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
