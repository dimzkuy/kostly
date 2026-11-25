import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';

import { AppSidebar } from '@/components/navigation/app-sidebar';
import { MobileTabBar } from '@/components/navigation/mobile-tab-bar';
import { Palette } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

export default function TabsLayout() {
  const { isMobile } = useResponsive();

  return (
    <View style={styles.root}>
      {!isMobile && <AppSidebar />}
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: Palette.neutral[50] },
          }}
          tabBar={(props) => (isMobile ? <MobileTabBar {...props} /> : null)}>
          <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
          <Tabs.Screen name="explore" options={{ title: 'Jelajah' }} />
          <Tabs.Screen name="bookings" options={{ title: 'Booking' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Palette.neutral[50],
  },
  content: {
    flex: 1,
  },
});
