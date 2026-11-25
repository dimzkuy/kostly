import { useSyncExternalStore } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { Breakpoints } from '@/constants/theme';

const emptySubscribe = () => () => {};

export function useResponsive() {
  const { width: rawWidth, height } = useWindowDimensions();

  // On web with SSR ("output": "server"), server renders with width=0.
  // Deferring the real window width until after hydration prevents React hydration mismatches.
  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => Platform.OS !== 'web'
  );

  const width = hasHydrated ? rawWidth : 0;

  const isMobile = width <= Breakpoints.mobileMax;
  const isTablet = width >= Breakpoints.tabletMin && width <= Breakpoints.tabletMax;
  const isDesktop = width >= Breakpoints.desktopMin;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWide: !isMobile,
    columns: isDesktop ? 3 : isTablet ? 2 : 1,
  };
}
