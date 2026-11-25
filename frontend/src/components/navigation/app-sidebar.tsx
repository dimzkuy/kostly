import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { usePathname, useRouter } from 'expo-router';

import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useResponsive } from '@/hooks/use-responsive';

interface NavEntry {
  label: string;
  href: '/index' | '/explore' | '/bookings' | '/profile';
  icon: keyof typeof MaterialIcons.glyphMap;
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isTablet } = useResponsive();
  const { user, isAuthenticated } = useApp();

  const navItems: NavEntry[] = [
    { label: user.role === 'OWNER' ? 'Dashboard' : 'Beranda', href: '/index', icon: 'home' },
    {
      label: user.role === 'OWNER' ? 'Kelola Properti' : 'Jelajah Kost',
      href: '/explore',
      icon: 'explore',
    },
    { label: 'Booking', href: '/bookings', icon: 'calendar-today' },
    { label: 'Profil Saya', href: '/profile', icon: 'person' },
  ];

  const isActive = (href: string) => {
    if (href === '/index') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(href);
  };

  return (
    <View style={[styles.sidebar, isTablet ? styles.sidebarTablet : styles.sidebarDesktop]}>
      <View style={styles.brandHeader}>
        <View style={styles.logoBox}>
          <MaterialIcons name="home-work" size={20} color="#FFFFFF" />
        </View>
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
              key={item.href}
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && styles.pressed,
              ]}>
              <MaterialIcons
                name={item.icon}
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
          <MaterialIcons name="add-business" size={19} color={Palette.primary[600]} />
          <Text style={styles.actionText}>Tambah Properti Kost</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/owner/properties/index')}
          style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
          <MaterialIcons name="apartment" size={19} color={Palette.neutral[600]} />
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
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
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
