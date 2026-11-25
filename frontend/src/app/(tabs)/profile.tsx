import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import type { AppIconName } from '@/components/ui/app-icon.types';
import { ConfirmDialog, ToastBanner } from '@/components/ui/confirm-dialog';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { TabHeader } from '@/components/ui/screen-header';
import { ROUTES } from '@/constants/routes';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';

export default function ProfilSayaScreen() {
  const router = useRouter();
  const {
    user,
    wishlistIds,
    bookings,
    switchDemoRole,
    toggleWhatsappAlerts,
    logout,
  } = useApp();

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const activeBookingsCount = bookings.filter(
    (b) => b.status === 'APPROVED' || b.status === 'PENDING'
  ).length;
  const historyCount = bookings.length;

  return (
    <View style={styles.screen}>
      <TabHeader title="Profil" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ResponsiveContainer maxWidth={760}>
          {/* Profile Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{user.initials}</Text>
              </View>
              <Pressable
                accessibilityLabel="Ganti Foto Profil"
                onPress={() => showToast('Fitur unggah foto profil akan terhubung ke Supabase Storage.')}
                style={({ pressed }) => [styles.cameraBadge, pressed && styles.pressed]}>
                <AppIcon name="camera" size={14} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text style={styles.userName}>{user.fullName}</Text>

            <View style={styles.verifiedBadge}>
              <AppIcon name="verified" size={15} color={Palette.semantic.success600} />
              <Text style={styles.verifiedBadgeText}>
                {user.role === 'OWNER'
                  ? 'Pemilik Kost Terverifikasi'
                  : 'Pencari Kost Terverifikasi'}
              </Text>
            </View>

            <View style={styles.contactList}>
              <View style={styles.contactRow}>
                <AppIcon name="mail-outline" size={15} color={Palette.neutral[400]} />
                <Text style={styles.contactText}>{user.email}</Text>
              </View>
              <View style={styles.contactRow}>
                <AppIcon name="call" size={15} color={Palette.neutral[400]} />
                <Text style={styles.contactText}>{user.phone}</Text>
                <View style={styles.dotSep} />
                <Text style={styles.ktpText}>KTP Terverifikasi</Text>
              </View>
            </View>
          </View>

          {/* Activity Summary Metrics (3 Columns) */}
          <View style={styles.metricsGrid}>
            <Pressable
              onPress={() => router.push('/bookings')}
              style={({ pressed }) => [styles.metricCard, pressed && styles.pressed]}>
              <View style={[styles.metricIconBox, { backgroundColor: Palette.primary[50] }]}>
                <AppIcon name="bed" size={20} color={Palette.primary[600]} />
              </View>
              <Text style={styles.metricValue}>{activeBookingsCount}</Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Booking Aktif
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/bookings')}
              style={({ pressed }) => [styles.metricCard, pressed && styles.pressed]}>
              <View style={[styles.metricIconBox, { backgroundColor: Palette.neutral[100] }]}>
                <AppIcon name="history" size={20} color={Palette.neutral[700]} />
              </View>
              <Text style={styles.metricValue}>{historyCount}</Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Riwayat Sewa
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/explore')}
              style={({ pressed }) => [styles.metricCard, pressed && styles.pressed]}>
              <View style={[styles.metricIconBox, { backgroundColor: Palette.semantic.danger50 }]}>
                <AppIcon name="heart" size={20} color={Palette.semantic.danger600} />
              </View>
              <Text style={styles.metricValue}>{wishlistIds.length}</Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Disimpan
              </Text>
            </Pressable>
          </View>

          {/* Group 1: Penyewaan Saya / Manajemen Properti */}
          <View style={styles.groupSection}>
            <Text style={styles.groupTitle}>
              {user.role === 'OWNER' ? 'MANAJEMEN PROPERTI' : 'PENYEWAAN SAYA'}
            </Text>
            <View style={styles.groupCard}>
              {user.role === 'OWNER' && (
                <>
                  <MenuRow
                    icon="add-business"
                    iconBg={Palette.primary[50]}
                    iconColor={Palette.primary[600]}
                    title="Tambah Properti Kost"
                    subtitle="Daftarkan properti baru dalam 4 langkah"
                    onPress={() => router.push('/owner/properties/new')}
                  />
                  <Divider />
                  <MenuRow
                    icon="business"
                    iconBg={Palette.neutral[100]}
                    iconColor={Palette.neutral[700]}
                    title="Daftar Properti Saya"
                    subtitle="Kelola Draf, Terbit, dan Arsip"
                    onPress={() => router.push(ROUTES.ownerProperties)}
                  />
                  <Divider />
                </>
              )}

              {user.role !== 'OWNER' && (
                <>
                  <MenuRow
                    icon="bookmark"
                    iconBg={Palette.semantic.danger50}
                    iconColor={Palette.semantic.danger600}
                    title="Kost Disimpan (Wishlist)"
                    subtitle={`${wishlistIds.length} properti tersimpan`}
                    onPress={() => router.push('/explore')}
                  />
                  <Divider />
                </>
              )}
              <MenuRow
                icon="badge"
                iconBg={Palette.primary[50]}
                iconColor={Palette.primary[600]}
                title="Dokumen Saya"
                subtitle="KTP & Berkas terverifikasi"
                subtitleColor={Palette.semantic.success600}
                onPress={() => showToast('Dokumen KTP Anda sudah terverifikasi.')}
              />
              <Divider />
              <MenuRow
                icon="receipt"
                iconBg={Palette.neutral[100]}
                iconColor={Palette.neutral[700]}
                title="Riwayat Pembayaran Manual"
                subtitle="Bukti transfer & konfirmasi"
                onPress={() => router.push('/bookings')}
              />
            </View>
          </View>

          {/* Group 2: Mode Pengguna (Preview Switcher) */}
          <View style={styles.groupSection}>
            <Pressable
              onPress={() => {
                const nextRole = user.role === 'TENANT' ? 'OWNER' : 'TENANT';
                switchDemoRole(nextRole);
                showToast(
                  nextRole === 'OWNER'
                    ? 'Mode pratinjau beralih ke Pemilik Kost.'
                    : 'Mode pratinjau beralih ke Pencari Kost.'
                );
              }}
              style={({ pressed }) => [styles.switchBanner, pressed && styles.pressed]}>
              <View style={styles.switchLeft}>
                <View style={[styles.rowIconBox, { backgroundColor: Palette.primary[50] }]}>
                  <AppIcon name="swap-horiz" size={20} color={Palette.primary[600]} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowTitle}>
                    {user.role === 'TENANT'
                      ? 'Beralih ke Akun Pemilik Kost'
                      : 'Beralih ke Akun Pencari Kost'}
                  </Text>
                  <Text style={styles.rowSub}>
                    {user.role === 'TENANT'
                      ? 'Kelola dan sewakan properti Anda'
                      : 'Cari dan ajukan sewa kamar kost'}
                  </Text>
                </View>
              </View>
              <AppIcon name="chevron-right" size={20} color={Palette.neutral[400]} />
            </Pressable>
          </View>

          {/* Group 3: Akun & Keamanan */}
          <View style={styles.groupSection}>
            <Text style={styles.groupTitle}>AKUN & KEAMANAN</Text>
            <View style={styles.groupCard}>
              <MenuRow
                icon="person-outline"
                iconBg={Palette.neutral[100]}
                iconColor={Palette.neutral[700]}
                title="Edit Informasi Pribadi"
                onPress={() => showToast('Informasi profil dapat diperbarui via endpoint /me.')}
              />
              <Divider />
              <MenuRow
                icon="lock-reset"
                iconBg={Palette.neutral[100]}
                iconColor={Palette.neutral[700]}
                title="Ubah Kata Sandi"
                onPress={() => router.push('/forgot-password')}
              />
              <Divider />
              <View style={styles.menuRow}>
                <View style={styles.menuLeft}>
                  <View style={[styles.rowIconBox, { backgroundColor: Palette.semantic.success50 }]}>
                    <AppIcon name="chat" size={19} color={Palette.semantic.success600} />
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowTitle}>Preferensi Notifikasi</Text>
                    <Text style={styles.rowSub}>Pemberitahuan & WhatsApp Alert</Text>
                  </View>
                </View>
                <Switch
                  value={user.whatsappAlerts}
                  onValueChange={toggleWhatsappAlerts}
                  trackColor={{ false: Palette.neutral[200], true: Palette.primary[600] }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* Group 4: Bantuan & Legal */}
          <View style={styles.groupSection}>
            <Text style={styles.groupTitle}>BANTUAN & LEGAL</Text>
            <View style={styles.groupCard}>
              <MenuRow
                icon="help"
                iconBg={Palette.neutral[100]}
                iconColor={Palette.neutral[700]}
                title="Pusat Bantuan Kostly & FAQ"
                onPress={() => showToast('Pusat bantuan tersedia 24/7 melalui email support@kostly.id.')}
              />
              <Divider />
              <MenuRow
                icon="gavel"
                iconBg={Palette.neutral[100]}
                iconColor={Palette.neutral[700]}
                title="Kebijakan Privasi & Aturan Kost"
                onPress={() => showToast('Kebijakan Privasi & Ketentuan Layanan Kostly v1.4.2.')}
              />
            </View>
          </View>

          {/* Logout Action */}
          <View style={styles.logoutWrap}>
            <Pressable
              onPress={() => setLogoutConfirmOpen(true)}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}>
              <AppIcon name="logout" size={20} color={Palette.semantic.danger600} />
              <Text style={styles.logoutText}>Keluar dari Akun</Text>
            </Pressable>
            <Text style={styles.versionText}>
              Kostly App v1.4.2 • Platform Sewa Kost Transparan
            </Text>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      <ConfirmDialog
        visible={logoutConfirmOpen}
        title="Keluar dari Akun?"
        message="Anda akan diarahkan ke halaman masuk Kostly."
        confirmLabel="Keluar"
        destructive
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          logout();
          router.replace('/login');
        }}
      />

      <ToastBanner visible={!!toastMsg} message={toastMsg ?? ''} type="info" />
    </View>
  );
}

function MenuRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  subtitleColor,
  onPress,
}: {
  icon: AppIconName;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
      <View style={styles.menuLeft}>
        <View style={[styles.rowIconBox, { backgroundColor: iconBg }]}>
          <AppIcon name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle && (
            <Text style={[styles.rowSub, subtitleColor ? { color: subtitleColor } : null]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <AppIcon name="chevron-right" size={20} color={Palette.neutral[400]} />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
    paddingBottom: 36,
  },
  profileCard: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 24,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: Palette.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 26,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.primary[700],
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: Palette.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
    marginBottom: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: Palette.semantic.success50,
    marginBottom: 14,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.semantic.success600,
  },
  contactList: {
    alignItems: 'center',
    gap: 5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  dotSep: {
    width: 4,
    height: 4,
    borderRadius: 9999,
    backgroundColor: Palette.neutral[300],
  },
  ktpText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.semantic.success600,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    marginTop: 2,
  },
  groupSection: {
    marginTop: 20,
  },
  groupTitle: {
    fontSize: 12,
    letterSpacing: 0.7,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[500],
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  groupCard: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    gap: 12,
  },
  menuRowPressed: {
    backgroundColor: Palette.neutral[50],
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Palette.neutral[900],
  },
  rowSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.neutral[100],
    marginHorizontal: 15,
  },
  switchBanner: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoutWrap: {
    marginTop: 22,
    gap: 14,
  },
  logoutBtn: {
    backgroundColor: Palette.semantic.danger50,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.semantic.danger600,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[400],
  },
  pressed: {
    opacity: 0.78,
  },
});
