import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { ROUTES } from '@/constants/routes';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useResponsive } from '@/hooks/use-responsive';

interface TabHeaderProps {
  title: string;
}

export function TabHeader({ title }: TabHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isMobile } = useResponsive();
  const { user, unreadNotifications, clearUnreadNotifications } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <View
        style={[
          styles.tabHeader,
          { paddingTop: isMobile ? Math.max(insets.top, 8) : 12 },
        ]}>
        <View style={[styles.tabHeaderInner, !isMobile && styles.tabHeaderWide]}>
          <View style={styles.titleRow}>
            <Text style={styles.tabTitle} numberOfLines={1}>
              {title}
            </Text>

          </View>

          <View style={styles.rightActions}>
            <Pressable
              accessibilityLabel="Notifikasi"
              onPress={() => {
                setNotifOpen(true);
                clearUnreadNotifications();
              }}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
              <AppIcon name="notifications-outline" size={22} color={Palette.neutral[700]} />
              {unreadNotifications > 0 && <View style={styles.unreadDot} />}
            </Pressable>

            <Pressable
              accessibilityLabel="Profil Pengguna"
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [styles.avatarCircle, pressed && styles.pressed]}>
              <Text style={styles.avatarInitials}>{user.initials}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        transparent
        visible={notifOpen}
        animationType="fade"
        onRequestClose={() => setNotifOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setNotifOpen(false)}>
          <Pressable style={styles.notifCard} onPress={() => {}}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifikasi Terbaru</Text>
              <Pressable onPress={() => setNotifOpen(false)}>
                <AppIcon name="close" size={20} color={Palette.neutral[500]} />
              </Pressable>
            </View>
            <View style={styles.notifItem}>
              <View style={[styles.notifIcon, { backgroundColor: Palette.semantic.success50 }]}>
                <AppIcon name="check-circle" size={18} color={Palette.semantic.success600} />
              </View>
              <View style={styles.notifTextWrap}>
                <Text style={styles.notifItemTitle}>Booking Disetujui</Text>
                <Text style={styles.notifItemBody}>
                  Kost Senopati Living Suites menyetujui pengajuan kamar Tipe Deluxe Queen.
                </Text>
              </View>
            </View>
            <View style={styles.notifItem}>
              <View style={[styles.notifIcon, { backgroundColor: Palette.primary[50] }]}>
                <AppIcon name="clock" size={18} color={Palette.primary[600]} />
              </View>
              <View style={styles.notifTextWrap}>
                <Text style={styles.notifItemTitle}>Pengingat Konfirmasi</Text>
                <Text style={styles.notifItemBody}>
                  Pengajuan booking pending otomatis kedaluwarsa dalam 72 jam jika belum diproses pemilik.
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

interface StackHeaderProps {
  title?: string;
  showBrandLogo?: boolean;
  hideBack?: boolean;
  onBack?: () => void;
}

export function StackHeader({
  title,
  showBrandLogo = false,
  hideBack = false,
  onBack,
}: StackHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isMobile } = useResponsive();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.home);
    }
  };

  return (
    <View
      style={[
        styles.stackHeader,
        { paddingTop: isMobile ? Math.max(insets.top, 8) : 10 },
      ]}>
      <View style={[styles.stackHeaderInner, !isMobile && styles.tabHeaderWide]}>
        {hideBack ? (
          <View style={styles.headerSpacer} />
        ) : (
          <Pressable
            accessibilityLabel="Kembali"
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <AppIcon name="arrow-back" size={21} color={Palette.neutral[700]} />
          </Pressable>
        )}

        {showBrandLogo ? (
          <View style={styles.brandRow}>
            <Image
              source={require('@/assets/images/kostly-icon.png')}
              style={styles.brandLogo}
              contentFit="contain"
            />
            <Text style={styles.brandTitle}>Kostly</Text>
          </View>
        ) : (
          <Text style={styles.stackTitle} numberOfLines={1}>
            {title ?? ''}
          </Text>
        )}

        <View style={styles.headerSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral[200],
    zIndex: 20,
  },
  tabHeaderInner: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
  },
  tabHeaderWide: {
    maxWidth: 1120,
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  tabTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 9999,
    backgroundColor: Palette.semantic.danger600,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: Palette.primary[100],
    borderWidth: 1,
    borderColor: Palette.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '700',
    color: Palette.primary[700],
  },
  stackHeader: {
    backgroundColor: 'rgba(248, 250, 252, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral[200],
    zIndex: 20,
  },
  stackHeaderInner: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 24,
    height: 24,
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  stackTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Manrope_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[900],
    marginLeft: 6,
  },
  headerSpacer: {
    width: 32,
  },
  pressed: {
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notifCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  notifItem: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: Palette.neutral[50],
  },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTextWrap: {
    flex: 1,
    gap: 2,
  },
  notifItemTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[900],
  },
  notifItemBody: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
});
