import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useResponsive } from '@/hooks/use-responsive';

interface ResponsiveContainerProps extends ViewProps {
  maxWidth?: number;
}

export function ResponsiveContainer({
  children,
  style,
  maxWidth = 1120,
  ...rest
}: ResponsiveContainerProps) {
  const { isMobile } = useResponsive();

  return (
    <View
      style={[
        styles.outer,
        !isMobile && styles.outerWide,
      ]}>
      <View style={[styles.inner, { maxWidth }, style]} {...rest}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  outerWide: {
    paddingHorizontal: 16,
  },
  inner: {
    width: '100%',
  },
});
