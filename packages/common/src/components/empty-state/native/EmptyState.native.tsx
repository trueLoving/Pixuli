import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { defaultTranslate } from '../../../locales';
import { emptyStateLocales } from '../locales';
import type { EmptyStateProps } from '../common/types';

const EmptyStateNative: React.FC<EmptyStateProps> = ({
  onAddGitHub,
  onAddGitee,
  onTryDemo,
  t,
}) => {
  const translate =
    t || ((key: string) => defaultTranslate(key, emptyStateLocales['zh-CN']));

  const handleOpenDocs = () => {
    Linking.openURL('https://pixuli-docs.vercel.app/');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* 图标 */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🖼️</Text>
        </View>

        {/* 标题 */}
        <Text style={styles.title}>{translate('emptyState.title')}</Text>

        {/* 描述 */}
        <Text style={styles.description}>
          {translate('emptyState.description')}
        </Text>

        {/* 主要操作按钮 */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onAddGitHub}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {translate('emptyState.addGitHub')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onAddGitee}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {translate('emptyState.addGitee')}
            </Text>
          </TouchableOpacity>
          {onTryDemo && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onTryDemo}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {translate('emptyState.tryDemo')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 快速开始指南 */}
        <View style={styles.guide}>
          <Text style={styles.guideTitle}>
            {translate('emptyState.quickStart')}
          </Text>
          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  {translate('emptyState.step1.title')}
                </Text>
                <Text style={styles.stepDescription}>
                  {translate('emptyState.step1.description')}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  {translate('emptyState.step2.title')}
                </Text>
                <Text style={styles.stepDescription}>
                  {translate('emptyState.step2.description')}
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  {translate('emptyState.step3.title')}
                </Text>
                <Text style={styles.stepDescription}>
                  {translate('emptyState.step3.description')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 帮助链接 */}
        <View style={styles.help}>
          <Text style={styles.helpText}>
            {translate('emptyState.needHelp')}{' '}
            <Text style={styles.helpLink} onPress={handleOpenDocs}>
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
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
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
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#111827',
  },
  guide: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    color: '#111827',
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
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#ffffff',
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
    color: '#111827',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  help: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  helpLink: {
    color: '#3b82f6',
    fontWeight: '500',
  },
});

export default EmptyStateNative;
