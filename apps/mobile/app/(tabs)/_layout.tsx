import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useI18n } from '@/i18n/useI18n';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse-mode"
        options={{
          href: null, // 隐藏此路由，不显示在底部导航栏
        }}
      />
      <Tabs.Screen
        name="filter"
        options={{
          href: null, // 隐藏此路由，不显示在底部导航栏
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gear" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/github"
        options={{
          href: null, // 隐藏此路由，不显示在底部导航栏
        }}
      />

      <Tabs.Screen
        name="settings/gitee"
        options={{
          href: null, // 隐藏此路由，不显示在底部导航栏
        }}
      />
    </Tabs>
  );
}
