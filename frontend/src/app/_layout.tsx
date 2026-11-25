import React, { useEffect } from 'react';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import {
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { Palette } from '@/constants/theme';
import { AppProvider, useApp } from '@/context/app-context';

SplashScreen.preventAutoHideAsync();

const KostlyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Palette.neutral[50],
    card: Palette.neutral[0],
    text: Palette.neutral[900],
    border: Palette.neutral[200],
    primary: Palette.primary[600],
  },
};

function AuthNavigatorGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const firstSegment = segments[0];
  const isAuthRoute =
    firstSegment === 'login' ||
    firstSegment === 'register' ||
    firstSegment === 'forgot-password';

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthRoute, rootNavigationState?.key, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProvider>
      <ThemeProvider value={KostlyLightTheme}>
        <StatusBar style="dark" />
        <AuthNavigatorGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Palette.neutral[50] },
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="properties/[id]" />
            <Stack.Screen name="owner/properties/index" />
            <Stack.Screen name="owner/properties/new" />
          </Stack>
        </AuthNavigatorGate>
      </ThemeProvider>
    </AppProvider>
  );
}
