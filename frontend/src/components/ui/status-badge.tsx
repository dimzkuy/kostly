import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Palette, StatusPresentation } from '@/constants/theme';
import type {
  BookingStatus,
  KostGenderType,
  PropertyStatus,
  RoomStatus,
} from '@/types/kostly';

type StatusDomain = 'property' | 'room' | 'booking';

interface StatusBadgeProps {
  domain: StatusDomain;
  status: PropertyStatus | RoomStatus | BookingStatus;
}

export function StatusBadge({ domain, status }: StatusBadgeProps) {
  const meta =
    domain === 'property'
      ? StatusPresentation.property[status as PropertyStatus]
      : domain === 'room'
        ? StatusPresentation.room[status as RoomStatus]
        : StatusPresentation.booking[status as BookingStatus];

  return (
    <View style={[styles.pill, { backgroundColor: meta.bg }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export function GenderBadge({ genderType }: { genderType: KostGenderType }) {
  const config: Record<KostGenderType, { label: string; bg: string; text: string }> = {
    CAMPUR: { label: 'Campur', bg: 'rgba(15, 23, 42, 0.72)', text: '#FFFFFF' },
    PUTRI: { label: 'Putri', bg: '#D97706', text: '#FFFFFF' },
    PUTRA: { label: 'Putra', bg: '#1E40AF', text: '#FFFFFF' },
  };
  const item = config[genderType];
  return (
    <View style={[styles.floatingPill, { backgroundColor: item.bg }]}>
      <Text style={[styles.floatingText, { color: item.text }]}>{item.label}</Text>
    </View>
  );
}

export function VerifiedBadge() {
  return (
    <View style={[styles.floatingPill, styles.verifiedBg]}>
      <MaterialIcons name="verified" size={12} color="#FFFFFF" />
      <Text style={styles.floatingText}>Terverifikasi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  verifiedBg: {
    backgroundColor: Palette.primary[600],
  },
  floatingText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
