import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import { ConfirmDialog, ToastBanner } from '@/components/ui/confirm-dialog';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { TabHeader } from '@/components/ui/screen-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatIDR } from '@/data/mock-data';
import type { BookingItem, BookingStatus } from '@/types/kostly';

const BOOKING_FILTERS: { key: 'ALL' | BookingStatus; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'PENDING', label: 'Menunggu' },
  { key: 'APPROVED', label: 'Disetujui' },
  { key: 'CANCELLED', label: 'Dibatalkan' },
];

export default function BookingsScreen() {
  const router = useRouter();
  const { user, bookings, updateBookingStatus } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | BookingStatus>('ALL');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    booking: BookingItem;
    nextStatus: BookingStatus;
    title: string;
    message: string;
    destructive: boolean;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const openConfirm = (payload: NonNullable<typeof confirmState>) => {
    setConfirmState(payload);
    setConfirmOpen(true);
  };

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'ALL') return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  return (
    <View style={styles.screen}>
      <TabHeader title={user.role === 'OWNER' ? 'Kelola Booking' : 'Booking Saya'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ResponsiveContainer maxWidth={860}>
          {/* Manual Payment Boundary Notice (PRD §3.3 & Design.md §7) */}
          <View style={styles.noticeBanner}>
            <AppIcon name="info" size={18} color={Palette.primary[600]} />
            <Text style={styles.noticeText}>
              {user.role === 'OWNER'
                ? 'Menyetujui pengajuan akan mengunci jadwal kamar pada periode terkait. Pembayaran sewa dilakukan langsung di luar aplikasi.'
                : 'Setiap pengajuan membutuhkan persetujuan pemilik kost. Pembayaran dilakukan secara manual langsung dengan pemilik.'}
            </Text>
          </View>

          {/* Status Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {BOOKING_FILTERS.map((item) => {
              const active = statusFilter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setStatusFilter(item.key)}
                  style={[styles.filterPill, active && styles.filterPillActive]}>
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filteredBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon name="calendar-outline" size={34} color={Palette.neutral[400]} />
              <Text style={styles.emptyTitle}>Belum ada daftar booking</Text>
              <Text style={styles.emptySub}>
                Jelajahi pilihan kost dan ajukan sewa kamar bulanan dengan mudah.
              </Text>
              <Pressable
                onPress={() => router.push('/explore')}
                style={styles.exploreBtn}>
                <Text style={styles.exploreBtnText}>Cari Kost Sekarang</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredBookings.map((booking) => (
                <View key={booking.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Image
                      source={{ uri: booking.propertyImage }}
                      style={styles.thumb}
                      contentFit="cover"
                    />
                    <View style={styles.cardTopInfo}>
                      <StatusBadge domain="booking" status={booking.status} />
                      <Text style={styles.propName} numberOfLines={1}>
                        {booking.propertyName}
                      </Text>
                      <Text style={styles.roomName}>
                        {booking.roomName} • {booking.propertyCity}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaBox}>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Periode Sewa</Text>
                      <Text style={styles.metaValue}>
                        {booking.startDate} s/d {booking.endDate} ({booking.durationMonths} bln)
                      </Text>
                    </View>
                    {user.role === 'OWNER' && (
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Pemohon</Text>
                        <Text style={styles.metaValue}>{booking.tenantName}</Text>
                      </View>
                    )}
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Total Estimasi</Text>
                      <Text style={styles.priceValue}>{formatIDR(booking.totalPrice)}</Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/properties/[id]',
                          params: { id: booking.propertyId },
                        })
                      }
                      style={({ pressed }) => [styles.outlineBtn, pressed && styles.pressed]}>
                      <Text style={styles.outlineBtnText}>Lihat Properti</Text>
                    </Pressable>

                    {user.role === 'TENANT' &&
                      (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                        <Pressable
                          onPress={() =>
                            openConfirm({
                              booking,
                              nextStatus: 'CANCELLED',
                              title: 'Batalkan Pengajuan Sewa?',
                              message:
                                booking.status === 'APPROVED'
                                  ? 'Pembatalan booking yang disetujui hanya tersedia sebelum tanggal masuk dan akan melepaskan jadwal kamar.'
                                  : 'Pengajuan sewa yang masih menunggu persetujuan akan dibatalkan.',
                              destructive: true,
                            })
                          }
                          style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed]}>
                          <Text style={styles.dangerBtnText}>Batalkan</Text>
                        </Pressable>
                      )}

                    {user.role === 'OWNER' && booking.status === 'PENDING' && (
                      <>
                        <Pressable
                          onPress={() =>
                            openConfirm({
                              booking,
                              nextStatus: 'REJECTED',
                              title: 'Tolak Pengajuan?',
                              message: `Tolak permintaan sewa dari ${booking.tenantName} untuk ${booking.roomName}?`,
                              destructive: true,
                            })
                          }
                          style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed]}>
                          <Text style={styles.dangerBtnText}>Tolak</Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            openConfirm({
                              booking,
                              nextStatus: 'APPROVED',
                              title: 'Setujui Pengajuan Sewa?',
                              message: `Periode ${booking.startDate} hingga ${booking.endDate} pada ${booking.roomName} akan dikunci untuk ${booking.tenantName}.`,
                              destructive: false,
                            })
                          }
                          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                          <Text style={styles.primaryBtnText}>Setujui</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>

      <ConfirmDialog
        visible={confirmOpen}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        destructive={confirmState?.destructive}
        confirmLabel={confirmState?.nextStatus === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Lanjutkan'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (confirmState) {
            updateBookingStatus(confirmState.booking.id, confirmState.nextStatus);
            showToast(
              confirmState.nextStatus === 'APPROVED'
                ? 'Booking disetujui dan periode kamar dikunci.'
                : confirmState.nextStatus === 'REJECTED'
                  ? 'Pengajuan booking ditolak.'
                  : 'Pengajuan booking dibatalkan.'
            );
          }
          setConfirmOpen(false);
        }}
      />

      <ToastBanner visible={!!toastMsg} message={toastMsg ?? ''} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.neutral[50],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  noticeBanner: {
    backgroundColor: Palette.primary[50],
    borderWidth: 1,
    borderColor: Palette.primary[100],
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
    color: Palette.primary[900],
  },
  filterRow: {
    gap: 8,
    paddingBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: Palette.neutral[0],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
  },
  filterPillActive: {
    backgroundColor: Palette.primary[600],
    borderColor: Palette.primary[600],
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[700],
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 14,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 74,
    height: 74,
    borderRadius: 12,
    backgroundColor: Palette.neutral[100],
  },
  cardTopInfo: {
    flex: 1,
    gap: 4,
  },
  propName: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  roomName: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  metaBox: {
    backgroundColor: Palette.neutral[50],
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  metaValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[800],
    textAlign: 'right',
    flexShrink: 1,
  },
  priceValue: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.primary[600],
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  outlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    backgroundColor: Palette.neutral[0],
  },
  outlineBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[700],
  },
  dangerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Palette.semantic.danger50,
  },
  dangerBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.semantic.danger600,
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Palette.primary[600],
  },
  primaryBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[900],
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    textAlign: 'center',
  },
  exploreBtn: {
    marginTop: 8,
    backgroundColor: Palette.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  exploreBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.78,
  },
});
