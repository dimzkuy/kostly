/**
 * Kostly Design System Tokens
 * Source: docs/Design.md (Version 1.2)
 *
 * Implements the color palette, typography tokens, spacing, radius,
 * and semantic status presentations.
 */

import '@/global.css';
import { Platform } from 'react-native';

// 1. Raw Palette Tokens
export const Palette = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB', // Main brand primary
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC', // Default app background
    100: '#F1F5F9',
    200: '#E2E8F0', // Border & divider
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A', // Highest emphasis text
  },
  semantic: {
    success50: '#F0FDF4',
    success600: '#16A34A',
    warning50: '#FFFBEB',
    warning600: '#D97706',
    danger50: '#FEF2F2',
    danger600: '#DC2626',
    info50: '#EFF6FF',
    info600: '#2563EB',
  },
} as const;

// 2. Semantic Theme Mapping (Light mode baseline per Design.md §4)
export const Colors = {
  light: {
    background: Palette.neutral[50],
    surface: Palette.neutral[0],
    surfaceSubtle: Palette.neutral[100],
    text: Palette.neutral[900],
    textPrimary: Palette.neutral[900],
    textSecondary: Palette.neutral[600],
    textMuted: Palette.neutral[500],
    border: Palette.neutral[200],
    borderStrong: Palette.neutral[300],
    primary: Palette.primary[600],
    primaryHover: Palette.primary[700],
    primaryPressed: Palette.primary[800],
    primarySubtle: Palette.primary[50],
    focusRing: Palette.primary[500],

    // Fallbacks for starter components
    backgroundElement: Palette.neutral[100],
    backgroundSelected: Palette.primary[100],
  },
  dark: {
    background: Palette.neutral[900],
    surface: Palette.neutral[800],
    surfaceSubtle: Palette.neutral[700],
    text: Palette.neutral[0],
    textPrimary: Palette.neutral[0],
    textSecondary: Palette.neutral[400],
    textMuted: Palette.neutral[500],
    border: Palette.neutral[700],
    borderStrong: Palette.neutral[600],
    primary: Palette.primary[500],
    primaryHover: Palette.primary[400],
    primaryPressed: Palette.primary[600],
    primarySubtle: Palette.primary[900],
    focusRing: Palette.primary[400],

    backgroundElement: Palette.neutral[800],
    backgroundSelected: Palette.neutral[700],
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

// 3. Typography Tokens (Design.md §3)
export const Fonts = {
  mono: Platform.select({
    ios: 'ui-monospace',
    default: 'monospace',
    web: 'var(--font-mono)',
  }) as string,
  headingFamily: 'Manrope',
  bodyFamily: 'Inter',
  scale: {
    headingXl: {
      fontSize: 32,
      lineHeight: 40,
      fontFamily: 'Manrope_700Bold',
      fontWeight: '700' as const,
    },
    headingLg: {
      fontSize: 24,
      lineHeight: 32,
      fontFamily: 'Manrope_700Bold',
      fontWeight: '700' as const,
    },
    headingMd: {
      fontSize: 20,
      lineHeight: 28,
      fontFamily: 'Manrope_600SemiBold',
      fontWeight: '600' as const,
    },
    headingSm: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'Manrope_600SemiBold',
      fontWeight: '600' as const,
    },
    subheading: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Inter_600SemiBold',
      fontWeight: '600' as const,
    },
    bodyLg: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'Inter_400Regular',
      fontWeight: '400' as const,
    },
    bodyMd: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
      fontWeight: '400' as const,
    },
    bodySm: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'Inter_400Regular',
      fontWeight: '400' as const,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'Inter_500Medium',
      fontWeight: '500' as const,
    },
  },
} as const;

// 4. Spacing Scale (Design.md §8)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  // Backwards compatibility with template
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// 5. Border Radius Tokens
export const Radius = {
  xs: 4,
  sm: 6,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// 6. Responsive Breakpoints (Design.md §5)
export const Breakpoints = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1023,
  desktopMin: 1024,
} as const;

// 7. Status Presentation Metadata (Design.md §9)
export const StatusPresentation = {
  property: {
    DRAFT: { label: 'Draft', color: Palette.neutral[600], bg: Palette.neutral[100] },
    PUBLISHED: { label: 'Published', color: Palette.semantic.success600, bg: Palette.semantic.success50 },
    ARCHIVED: { label: 'Archived', color: Palette.neutral[500], bg: Palette.neutral[200] },
  },
  room: {
    ACTIVE: { label: 'Active', color: Palette.semantic.success600, bg: Palette.semantic.success50 },
    INACTIVE: { label: 'Inactive', color: Palette.neutral[500], bg: Palette.neutral[100] },
    MAINTENANCE: { label: 'Maintenance', color: Palette.semantic.warning600, bg: Palette.semantic.warning50 },
  },
  booking: {
    PENDING: { label: 'Waiting for owner', color: Palette.semantic.warning600, bg: Palette.semantic.warning50 },
    APPROVED: { label: 'Approved', color: Palette.semantic.success600, bg: Palette.semantic.success50 },
    REJECTED: { label: 'Rejected', color: Palette.semantic.danger600, bg: Palette.semantic.danger50 },
    CANCELLED: { label: 'Cancelled', color: Palette.neutral[500], bg: Palette.neutral[100] },
    EXPIRED: { label: 'Expired', color: Palette.neutral[400], bg: Palette.neutral[100] },
  },
  report: {
    SUBMITTED: { label: 'Submitted', color: Palette.semantic.info600, bg: Palette.semantic.info50 },
    UNDER_REVIEW: { label: 'Under review', color: Palette.semantic.warning600, bg: Palette.semantic.warning50 },
    RESOLVED: { label: 'Resolved', color: Palette.semantic.success600, bg: Palette.semantic.success50 },
    DISMISSED: { label: 'Dismissed', color: Palette.neutral[500], bg: Palette.neutral[100] },
    CANCELLED: { label: 'Cancelled', color: Palette.neutral[400], bg: Palette.neutral[100] },
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1200;
