import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { usePathname, useRouter, type Href } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import type { AppIconName } from '@/components/ui/app-icon.types';
import { ROUTES } from '@/constants/routes';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useResponsive } from '@/hooks/use-responsive';

interface NavEntry {
  label: string;
  href: Href;
  icon: AppIconName;
  activeIcon: AppIconName;
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isTablet } = useResponsive();
  const { user, isAuthenticated } = useApp();

  const navItems: NavEntry[] = [
    {
      label: user.role === 'OWNER' ? 'Dashboard' : 'Beranda',
      href: ROUTES.home,
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      label: user.role === 'OWNER' ? 'Kelola Properti' : 'Jelajah Kost',
      href: ROUTES.explore,
      icon: user.role === 'OWNER' ? 'business-outline' : 'compass-outline',
      activeIcon: user.role === 'OWNER' ? 'business' : 'compass',
    },
    {
      label: 'Booking',
      href: ROUTES.bookings,
      icon: 'calendar-outline',
      activeIcon: 'calendar',
    },
    {
      label: 'Profil Saya',
      href: ROUTES.profile,
      icon: 'person-outline',
      activeIcon: 'person',
    },
  ];

  const isActive = (href: Href) => {
    const path = String(typeof href === 'string' ? href : href.pathname);
    if (path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(path);
  };

  return (
    <View style={[styles.sidebar, isTablet ? styles.sidebarTablet : styles.sidebarDesktop]}>
      <View style={styles.brandHeader}>
        <Image
          source={require('@/assets/images/kostly-icon.png')}
          style={styles.logoImage}
          contentFit="contain"
        />
        <View>
          <Text style={styles.brandName}>Kostly</Text>
          <Text style={styles.brandTag}>Sewa Kost Transparan</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NAVIGASI UTAMA</Text>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && styles.pressed,
              ]}>
              <AppIcon
                name={active ? item.activeIcon : item.icon}
                size={20}
                color={active ? Palette.primary[600] : Palette.neutral[600]}
              />
              <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>AKSI CEPAT</Text>
        <Pressable
          onPress={() => router.push('/owner/properties/new')}
          style={({ pressed }) => [styles.actionItem, pressed && styles.pressed]}>
          <AppIcon name="add-business" size={19} color={Palette.primary[600]} />
          <Text style={styles.actionText}>Tambah Properti Kost</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(ROUTES.ownerProperties)}
          style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
          <AppIcon name="business-outline" size={19} color={Palette.neutral[600]} />
          <Text style={styles.navText}>Daftar Properti Owner</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.initials}</Text>
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName} numberOfLines={1}>
              {isAuthenticated ? user.fullName : 'Tamu Kostly'}
            </Text>
            <Text style={styles.userRole}>
              {isAuthenticated
                ? user.role === 'OWNER'
                  ? 'Pemilik Kost'
                  : 'Pencari Kost'
                : 'Belum masuk'}
            </Text>
          </View>
        </View>

        <View style={styles.authLinks}>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.authBtn, pressed && styles.pressed]}>
            <Text style={styles.authBtnText}>Masuk</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/register')}
            style={({ pressed }) => [styles.authBtnOutline, pressed && styles.pressed]}>
            <Text style={styles.authBtnOutlineText}>Daftar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: Palette.neutral[0],
    borderRightWidth: 1,
    borderRightColor: Palette.neutral[200],
    paddingVertical: 20,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  sidebarTablet: {
    width: 224,
  },
  sidebarDesktop: {
    width: 256,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  logoImage: {
    width: 30,
    height: 30,
  },
  brandName: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  brandTag: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  section: {
    gap: 4,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.7,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[400],
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: Palette.primary[50],
  },
  navText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Palette.neutral[700],
  },
  navTextActive: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[700],
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Palette.primary[50],
    borderWidth: 1,
    borderColor: Palette.primary[100],
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[700],
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral[200],
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: Palette.neutral[50],
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    backgroundColor: Palette.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '700',
    color: Palette.primary[700],
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[900],
  },
  userRole: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  authLinks: {
    flexDirection: 'row',
    gap: 8,
  },
  authBtn: {
    flex: 1,
    backgroundColor: Palette.primary[600],
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  authBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  authBtnOutline: {
    flex: 1,
    backgroundColor: Palette.neutral[0],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  authBtnOutlineText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[700],
  },
  pressed: {
    opacity: 0.75,
  },
});
