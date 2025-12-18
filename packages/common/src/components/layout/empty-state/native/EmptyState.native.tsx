import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { defaultTranslate } from '../../../../locales';
import { emptyStateLocales } from '../locales';
import type { EmptyStateProps } from '../common/types';

const EmptyStateNative: React.FC<EmptyStateProps> = ({
  onAddGitHub,
  onAddGitee,
  onTryDemo,
  t,
  colorScheme: colorSchemeProp,
}) => {
  const translate =
    t || ((key: string) => defaultTranslate(key, emptyStateLocales['zh-CN']));

  // 如果传递了 colorScheme prop，使用传递的值；否则使用系统主题
  const systemColorScheme = useColorScheme() ?? 'light';
  const colorScheme = colorSchemeProp ?? systemColorScheme;

  const handleOpenDocs = () => {
    Linking.openURL('https://pixuli-docs.vercel.app/');
  };

  // 主题颜色定义
  const colors = {
    light: {
      text: '#111827',
      textSecondary: '#6b7280',
      background: '#FFFFFF',
      backgroundSecondary: '#F2F2F7',
      border: '#e5e7eb',
      primary: '#3b82f6',
      primaryText: '#ffffff',
      secondaryBackground: '#f3f4f6',
      secondaryText: '#111827',
    },
    dark: {
      text: '#ECEDEE',
      textSecondary: '#9BA1A6',
      background: '#1C1C1E',
      backgroundSecondary: '#000000',
      border: '#38383A',
      primary: '#5AC8FA',
      primaryText: '#ffffff',
      secondaryBackground: '#2C2C2E',
      secondaryText: '#ECEDEE',
    },
  };

  const themeColors = colors[colorScheme];

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: themeColors.backgroundSecondary },
      ]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* 图标 */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🖼️</Text>
        </View>

        {/* 标题 */}
        <Text style={[styles.title, { color: themeColors.text }]}>
          {translate('emptyState.title')}
        </Text>

        {/* 描述 */}
        <Text
          style={[styles.description, { color: themeColors.textSecondary }]}
        >
          {translate('emptyState.description')}
        </Text>

        {/* 主要操作按钮 */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.primary }]}
            onPress={onAddGitHub}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.buttonText, { color: themeColors.primaryText }]}
            >
              {translate('emptyState.addGitHub')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.primary }]}
            onPress={onAddGitee}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.buttonText, { color: themeColors.primaryText }]}
            >
              {translate('emptyState.addGitee')}
            </Text>
          </TouchableOpacity>
          {onTryDemo && (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: themeColors.secondaryBackground,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={onTryDemo}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: themeColors.secondaryText },
                ]}
              >
                {translate('emptyState.tryDemo')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 快速开始指南 */}
        <View
          style={[
            styles.guide,
            {
              backgroundColor: themeColors.background,
              borderWidth: 1,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text style={[styles.guideTitle, { color: themeColors.text }]}>
            {translate('emptyState.quickStart')}
          </Text>
          <View style={styles.steps}>
            <View style={styles.step}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: themeColors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    { color: themeColors.primaryText },
                  ]}
                >
                  1
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: themeColors.text }]}>
                  {translate('emptyState.step1.title')}
                </Text>
                <Text
                  style={[
                    styles.stepDescription,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {translate('emptyState.step1.description')}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: themeColors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    { color: themeColors.primaryText },
                  ]}
                >
                  2
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: themeColors.text }]}>
                  {translate('emptyState.step2.title')}
                </Text>
                <Text
                  style={[
                    styles.stepDescription,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {translate('emptyState.step2.description')}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: themeColors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    { color: themeColors.primaryText },
                  ]}
                >
                  3
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: themeColors.text }]}>
                  {translate('emptyState.step3.title')}
                </Text>
                <Text
                  style={[
                    styles.stepDescription,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {translate('emptyState.step3.description')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 帮助链接 */}
        <View style={styles.help}>
          <Text style={[styles.helpText, { color: themeColors.textSecondary }]}>
            {translate('emptyState.needHelp')}{' '}
            <Text
              style={[styles.helpLink, { color: themeColors.primary }]}
              onPress={handleOpenDocs}
            >
              {translate('emptyState.viewDocs')}
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    maxWidth: 600,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconText: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  guide: {
    width: '100%',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  steps: {
    gap: 20,
  },
  step: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontWeight: '600',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  help: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
  },
  helpLink: {
    fontWeight: '500',
  },
});

export default EmptyStateNative;
