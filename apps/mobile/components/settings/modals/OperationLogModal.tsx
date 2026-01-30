import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLogStore } from '@/stores/logStore';
import { LogActionType, LogStatus, OperationLog } from '@/types/log';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconSymbol } from '../../ui/IconSymbol';
import { ThemedText } from '../../ui/ThemedText';
import { ThemedView } from '../../ui/ThemedView';

interface OperationLogModalProps {
  visible: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

const actionLabels: Record<LogActionType, string> = {
  [LogActionType.UPLOAD]: 'upload',
  [LogActionType.DELETE]: 'delete',
  [LogActionType.EDIT]: 'edit',
  [LogActionType.COMPRESS]: 'compress',
  [LogActionType.CONVERT]: 'convert',
  [LogActionType.ANALYZE]: 'analyze',
  [LogActionType.CONFIG_CHANGE]: 'configChange',
  [LogActionType.BATCH_UPLOAD]: 'batchUpload',
  [LogActionType.BATCH_DELETE]: 'batchDelete',
};

export const OperationLogModal: React.FC<OperationLogModalProps> = ({
  visible,
  onClose,
  t,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const {
    logs,
    statistics,
    loading,
    filter,
    loadLogs,
    exportToFile,
    refreshStatistics,
    clearLogs,
  } = useLogStore();

  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);

  const baseKey = 'settings.operationLog.';
  const LOG_DISPLAY_LIMIT = 10;

  useEffect(() => {
    if (visible) {
      void loadLogs({ limit: LOG_DISPLAY_LIMIT });
      refreshStatistics();
    }
  }, [visible, loadLogs, refreshStatistics]);

  const handleExport = useCallback(
    async (format: 'json' | 'csv') => {
      setExporting(format);
      try {
        await exportToFile(format, { filter: filter ?? undefined });
        Alert.alert(
          t(`${baseKey}exportSuccess`),
          t(`${baseKey}exportSuccess`),
          [{ text: t('common.confirm') }],
        );
      } catch (error) {
        Alert.alert(t('common.error'), t(`${baseKey}exportFailed`), [
          { text: t('common.confirm') },
        ]);
      } finally {
        setExporting(null);
      }
    },
    [exportToFile, filter, t],
  );

  const handleClearAll = useCallback(() => {
    Alert.alert(
      t(`${baseKey}confirmClear`),
      t(`${baseKey}confirmClearMessage`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            const removed = await clearLogs();
            if (removed > 0) {
              void loadLogs({ limit: LOG_DISPLAY_LIMIT });
              refreshStatistics();
              Alert.alert(
                t(`${baseKey}clearSuccess`),
                `${removed} ${t(`${baseKey}logs`)}`,
                [{ text: t('common.confirm') }],
              );
            }
          },
        },
      ],
    );
  }, [clearLogs, loadLogs, refreshStatistics, t]);

  const getActionLabel = (action: LogActionType) =>
    t(`${baseKey}${actionLabels[action]}`) || action;

  const getStatusLabel = (status: LogStatus) => {
    switch (status) {
      case LogStatus.SUCCESS:
        return t(`${baseKey}success`);
      case LogStatus.FAILED:
        return t(`${baseKey}failed`);
      case LogStatus.PENDING:
        return t(`${baseKey}pending`);
      default:
        return status;
    }
  };

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });

  const renderLogItem = useCallback(
    ({ item }: { item: OperationLog }) => (
      <View
        style={[
          styles.logRow,
          {
            borderBottomColor: colors.cardBorder,
            backgroundColor: colors.cardBackground,
          },
        ]}
      >
        <View style={styles.logRowMain}>
          <ThemedText style={[styles.logTime, { color: colors.sectionTitle }]}>
            {formatTime(item.timestamp)}
          </ThemedText>
          <View style={styles.logMeta}>
            <ThemedText style={[styles.logAction, { color: colors.text }]}>
              {getActionLabel(item.action)}
            </ThemedText>
            <ThemedText
              style={[
                styles.logStatus,
                {
                  color:
                    item.status === LogStatus.SUCCESS
                      ? '#34C759'
                      : item.status === LogStatus.FAILED
                        ? '#FF3B30'
                        : colors.sectionTitle,
                },
              ]}
            >
              {getStatusLabel(item.status)}
            </ThemedText>
          </View>
        </View>
        {(item.imageName || item.error) && (
          <ThemedText
            style={[styles.logDetail, { color: colors.sectionTitle }]}
            numberOfLines={2}
          >
            {item.imageName || item.error || ''}
          </ThemedText>
        )}
        {item.duration != null && (
          <ThemedText
            style={[styles.logDuration, { color: colors.sectionTitle }]}
          >
            {item.duration}ms
          </ThemedText>
        )}
      </View>
    ),
    [colors, getActionLabel, getStatusLabel],
  );

  const dynamicStyles = StyleSheet.create({
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
    },
    title: { color: colors.text },
    statValue: { color: colors.text },
    statLabel: { color: colors.sectionTitle },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <ThemedView
          style={[styles.modalContent, dynamicStyles.modalContent]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View
            style={[styles.header, { borderBottomColor: colors.cardBorder }]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <IconSymbol
                  name="doc.text.fill"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <ThemedText style={[styles.title, dynamicStyles.title]}>
                {t(`${baseKey}title`)}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol
                name="xmark.circle.fill"
                size={24}
                color={colors.sectionTitle}
              />
            </TouchableOpacity>
          </View>

          {/* Statistics */}
          {statistics && (
            <View
              style={[
                styles.statsRow,
                {
                  borderBottomColor: colors.cardBorder,
                  backgroundColor:
                    colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
                },
              ]}
            >
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, dynamicStyles.statValue]}>
                  {statistics.total}
                </ThemedText>
                <ThemedText style={[styles.statLabel, dynamicStyles.statLabel]}>
                  {t(`${baseKey}total`)}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, dynamicStyles.statValue]}>
                  {statistics.todayCount}
                </ThemedText>
                <ThemedText style={[styles.statLabel, dynamicStyles.statLabel]}>
                  {t(`${baseKey}today`)}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, dynamicStyles.statValue]}>
                  {statistics.successRate.toFixed(1)}%
                </ThemedText>
                <ThemedText style={[styles.statLabel, dynamicStyles.statLabel]}>
                  {t(`${baseKey}successRate`)}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Actions: Export & Clear */}
          <View
            style={[
              styles.actionsRow,
              { borderBottomColor: colors.cardBorder },
            ]}
          >
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.primary }]}
              onPress={() => handleExport('json')}
              disabled={!!exporting}
            >
              {exporting === 'json' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.exportButtonText}>
                  {t(`${baseKey}exportJSON`)}
                </ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.primary }]}
              onPress={() => handleExport('csv')}
              disabled={!!exporting}
            >
              {exporting === 'csv' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.exportButtonText}>
                  {t(`${baseKey}exportCSV`)}
                </ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: '#FF3B30' }]}
              onPress={handleClearAll}
            >
              <ThemedText style={styles.clearButtonText}>
                {t(`${baseKey}clearAll`)}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Log list */}
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText
                  style={[styles.emptyText, { color: colors.sectionTitle }]}
                >
                  {t('common.loading')}
                </ThemedText>
              </View>
            ) : logs.length === 0 ? (
              <View style={styles.centered}>
                <ThemedText
                  style={[styles.emptyText, { color: colors.sectionTitle }]}
                >
                  {t(`${baseKey}noLogs`)}
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={logs.slice(0, LOG_DISPLAY_LIMIT)}
                keyExtractor={item => item.id}
                renderItem={renderLogItem}
                style={styles.flatList}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator
              />
            )}
          </View>
        </ThemedView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: Dimensions.get('window').height * 0.85,
    maxHeight: '85%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exportButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    minHeight: 220,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 24,
  },
  logRow: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logTime: {
    fontSize: 12,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logAction: {
    fontSize: 15,
    fontWeight: '600',
  },
  logStatus: {
    fontSize: 13,
  },
  logDetail: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 0,
  },
  logDuration: {
    fontSize: 12,
    marginTop: 2,
  },
});
