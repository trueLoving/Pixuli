import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  Text,
  useColorScheme,
} from 'react-native';
import Constants from 'expo-constants';
import { defaultTranslate } from '../../../locales';
import { versionInfoLocales } from '../locales';
import type { VersionInfoModalProps } from './types';

const VersionInfoModalNative: React.FC<VersionInfoModalProps> = ({
  visible,
  onClose,
  t,
  colorScheme: colorSchemeProp,
}) => {
  const translate =
    t || ((key: string) => defaultTranslate(key, versionInfoLocales['zh-CN']));

  // 如果传递了 colorScheme prop，使用传递的值；否则使用系统主题
  const systemColorScheme = useColorScheme() ?? 'light';
  const colorScheme = colorSchemeProp ?? systemColorScheme;

  // 从构建配置中获取版本信息
  const appVersion =
    Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';

  // 获取构建号（iOS 使用 buildNumber，Android 使用 versionCode）
  const buildNumber =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber ||
        Constants.manifest?.ios?.buildNumber ||
        '1'
      : String(
          Constants.expoConfig?.android?.versionCode ||
            Constants.manifest?.android?.versionCode ||
            1,
        );

  // 获取运行时版本（Expo SDK 版本）
  const runtimeVersion =
    Constants.expoConfig?.runtimeVersion ||
    Constants.manifest?.runtimeVersion ||
    Constants.expoConfig?.sdkVersion ||
    'Unknown';

  // 主题颜色定义
  const colors = {
    light: {
      text: '#11181C',
      textSecondary: '#8E8E93',
      background: '#FFFFFF',
      backgroundSecondary: '#F2F2F7',
      border: '#C6C6C8',
      primary: '#5AC8FA',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    dark: {
      text: '#ECEDEE',
      textSecondary: '#8E8E93',
      background: '#1C1C1E',
      backgroundSecondary: '#000000',
      border: '#38383A',
      primary: '#5AC8FA',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
  };

  const themeColors = colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View
            style={[styles.header, { borderBottomColor: themeColors.border }]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: themeColors.primary + '20' },
                ]}
              >
                <Text style={[styles.iconText, { color: themeColors.primary }]}>
                  ℹ️
                </Text>
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: themeColors.text }]}>
                  {translate('version.title') || '版本信息'}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {translate('version.subtitle') || '应用版本和构建信息'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text
                style={[styles.closeIcon, { color: themeColors.textSecondary }]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoSection}>
              <View
                style={[
                  styles.infoItem,
                  { borderBottomColor: themeColors.border },
                ]}
              >
                <Text
                  style={[
                    styles.infoLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {translate('version.appVersion') || '应用版本'}
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {appVersion}
                </Text>
              </View>
              <View
                style={[
                  styles.infoItem,
                  { borderBottomColor: themeColors.border },
                ]}
              >
                <Text
                  style={[
                    styles.infoLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {translate('version.buildNumber') || '构建号'}
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {buildNumber}
                </Text>
              </View>
              <View
                style={[
                  styles.infoItem,
                  { borderBottomColor: themeColors.border },
                ]}
              >
                <Text
                  style={[
                    styles.infoLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {translate('version.platform') || '平台'}
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {Platform.OS === 'ios' ? 'iOS' : 'Android'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {translate('version.runtimeVersion') || '运行时版本'}
                </Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {runtimeVersion}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
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
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
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
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    maxHeight: 400,
  },
  infoSection: {
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '400',
  },
});

export default VersionInfoModalNative;
