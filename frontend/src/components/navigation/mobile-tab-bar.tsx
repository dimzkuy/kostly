import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';

type ExpoTabBarFn = NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>;
export type MobileTabBarProps = Parameters<ExpoTabBarFn>[0];

interface TabMeta {
  name: string;
  label: string;
  activeIcon: keyof typeof MaterialIcons.glyphMap;
  inactiveIcon: keyof typeof MaterialIcons.glyphMap;
}

const TENANT_TABS: Record<string, TabMeta> = {
  index: {
    name: 'index',
    label: 'Beranda',
    activeIcon: 'home',
    inactiveIcon: 'home',
  },
  explore: {
    name: 'explore',
    label: 'Jelajah',
    activeIcon: 'explore',
    inactiveIcon: 'explore',
  },
  bookings: {
    name: 'bookings',
    label: 'Booking',
    activeIcon: 'calendar-today',
    inactiveIcon: 'calendar-today',
  },
  profile: {
    name: 'profile',
    label: 'Profil',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

export function MobileTabBar({ state, emitter, navigateToTab }: MobileTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useApp();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}>
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const meta = TENANT_TABS[route.name];
          if (!meta) return null;

          const isFocused = state.index === index;
          const label =
            user.role === 'OWNER' && route.name === 'explore'
              ? 'Properti'
              : meta.label;

          const iconName = isFocused ? meta.activeIcon : meta.inactiveIcon;
          const color = isFocused ? Palette.primary[600] : Palette.neutral[500];

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}>
              <MaterialIcons name={iconName} size={23} color={color} />
              <Text
                style={[
                  styles.tabLabel,
                  { color },
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: Palette.neutral[200],
    paddingTop: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  tabLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  tabLabelInactive: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
});
