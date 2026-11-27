import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import { PropertyCard } from '@/components/ui/property-card';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { TabHeader } from '@/components/ui/screen-header';
import { ROUTES } from '@/constants/routes';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useResponsive } from '@/hooks/use-responsive';

export default function BerandaScreen() {
  const router = useRouter();
  const { isMobile, columns } = useResponsive();
  const { user, properties, wishlistIds, bookings, toggleWishlist } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const firstName = user.fullName.split(' ')[0] || 'Dimas';

  const publishedProperties = useMemo(
    () => properties.filter((p) => p.status === 'PUBLISHED'),
    [properties]
  );

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedProperties.filter((prop) => {
      return (
        !q ||
        prop.name.toLowerCase().includes(q) ||
        prop.city.toLowerCase().includes(q) ||
        prop.address.toLowerCase().includes(q) ||
        (prop.landmark?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [publishedProperties, searchQuery]);

  const popularList = filteredProperties.slice(0, 2);
  const nearbyList = filteredProperties.length > 1 ? filteredProperties.slice(1) : filteredProperties;

  const activeFilterCount = 3;

  const ownerProperties = properties.filter((p) => p.ownerId === user.id);
  const pendingBookingsCount = bookings.filter((b) => b.status === 'PENDING').length;
  const approvedBookingsCount = bookings.filter((b) => b.status === 'APPROVED').length;

  return (
    <View style={styles.screen}>
      <TabHeader title={user.role === 'OWNER' ? 'Dashboard' : 'Beranda'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}>
        <ResponsiveContainer>
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>Selamat Datang, {firstName} 👋</Text>
            <Text style={styles.greetingSubtitle}>
              {user.role === 'OWNER'
                ? 'Pantau properti, ketersediaan kamar, dan pengajuan sewa masuk'
                : 'Temukan kost nyaman dan strategis impianmu'}
            </Text>
          </View>

          {/* Owner Summary Panel (visible in Owner role) */}
          {user.role === 'OWNER' && (
            <View style={styles.ownerPanel}>
              <View style={styles.ownerStatsRow}>
                <View style={styles.ownerStatCard}>
                  <Text style={styles.ownerStatNum}>
                    {ownerProperties.filter((p) => p.status === 'PUBLISHED').length}
                  </Text>
                  <Text style={styles.ownerStatLabel}>Properti Terbit</Text>
                </View>
                <View style={styles.ownerStatCard}>
                  <Text style={[styles.ownerStatNum, { color: Palette.semantic.warning600 }]}>
                    {pendingBookingsCount}
                  </Text>
                  <Text style={styles.ownerStatLabel}>Menunggu Persetujuan</Text>
                </View>
                <View style={styles.ownerStatCard}>
                  <Text style={[styles.ownerStatNum, { color: Palette.semantic.success600 }]}>
                    {approvedBookingsCount}
                  </Text>
                  <Text style={styles.ownerStatLabel}>Booking Disetujui</Text>
                </View>
              </View>

              <View style={styles.ownerActionsRow}>
                <Pressable
                  onPress={() => router.push('/owner/properties/new')}
                  style={({ pressed }) => [styles.ownerPrimaryBtn, pressed && styles.pressed]}>
                  <AppIcon name="add-business" size={18} color="#FFFFFF" />
                  <Text style={styles.ownerPrimaryText}>Tambah Properti Kost</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push(ROUTES.ownerProperties)}
                  style={({ pressed }) => [styles.ownerSecondaryBtn, pressed && styles.pressed]}>
                  <Text style={styles.ownerSecondaryText}>Kelola Properti</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Search & Filter Trigger */}
          <View style={styles.searchSection}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <AppIcon name="search" size={19} color={Palette.neutral[400]} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Cari area, kampus, atau nama kost..."
                  placeholderTextColor={Palette.neutral[400]}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={() => router.push('/explore')}
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    accessibilityLabel="Hapus pencarian"
                    onPress={() => setSearchQuery('')}
                    hitSlop={8}>
                    <AppIcon name="close-circle" size={18} color={Palette.neutral[400]} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* Section 1: Rekomendasi Kost Terpopuler */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTopRow}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Rekomendasi Kost Terpopuler
              </Text>
              <Pressable
                onPress={() => router.push('/explore')}
                style={({ pressed }) => [styles.seeAllBtn, pressed && styles.pressed]}>
                <Text style={styles.seeAllText}>Lihat Semua (248)</Text>
                <AppIcon name="chevron-right" size={15} color={Palette.primary[600]} />
              </Pressable>
            </View>
            <Text style={styles.sectionSubtitle}>Pilihan terfavorit dengan rating terbaik</Text>
          </View>

          {popularList.length === 0 ? (
            <View style={styles.emptyBox}>
              <AppIcon name="search-off" size={32} color={Palette.neutral[400]} />
              <Text style={styles.emptyTitle}>Tidak ada kost yang cocok</Text>
              <Text style={styles.emptySub}>Coba ubah kata kunci atau reset filter chip.</Text>
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                }}
                style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Reset Filter</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.grid, columns > 1 && styles.gridWide]}>
              {popularList.map((prop) => (
                <View
                  key={prop.id}
                  style={
                    columns === 3
                      ? styles.col3
                      : columns === 2
                        ? styles.col2
                        : styles.col1
                  }>
                  <PropertyCard
                    property={prop}
                    isWishlisted={wishlistIds.includes(prop.id)}
                    showWishlist={user.role !== 'OWNER'}
                    onToggleWishlist={toggleWishlist}
                    onPressDetail={(id) =>
                      router.push({ pathname: '/properties/[id]', params: { id } })
                    }
                    priceLabel="Mulai dari"
                  />
                </View>
              ))}
            </View>
          )}

          {/* Section 2: Kost Baru di Sekitarmu */}
          {nearbyList.length > 0 && (
            <>
              <View style={[styles.sectionHeader, styles.sectionSpaced]}>
                <View style={styles.sectionTopRow}>
                  <Text style={styles.sectionTitle} numberOfLines={1}>
                    Kost Baru di Sekitarmu
                  </Text>
                  <Pressable
                    onPress={() => router.push('/explore')}
                    style={({ pressed }) => [styles.seeAllBtn, pressed && styles.pressed]}>
                    <Text style={styles.seeAllText}>Lihat Semua</Text>
                    <AppIcon name="chevron-right" size={15} color={Palette.primary[600]} />
                  </Pressable>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Pilihan teranyar dengan fasilitas modern
                </Text>
              </View>

              <View style={[styles.grid, columns > 1 && styles.gridWide]}>
                {nearbyList.map((prop) => (
                  <View
                    key={`nearby-${prop.id}`}
                    style={
                      columns === 3
                        ? styles.col3
                        : columns === 2
                          ? styles.col2
                          : styles.col1
                    }>
                    <PropertyCard
                      property={prop}
                      isWishlisted={wishlistIds.includes(prop.id)}
                      showWishlist={user.role !== 'OWNER'}
                      onToggleWishlist={toggleWishlist}
                      onPressDetail={(id) =>
                        router.push({ pathname: '/properties/[id]', params: { id } })
                      }
                      priceLabel="Harga sewa"
                    />
                  </View>
                ))}
              </View>
            </>
          )}
        </ResponsiveContainer>
      </ScrollView>
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
    paddingTop: 18,
    paddingBottom: 36,
  },
  scrollContentMobile: {
    paddingBottom: 28,
  },
  greetingSection: {
    marginBottom: 14,
  },
  greetingTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  greetingSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    marginTop: 2,
  },
  ownerPanel: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.primary[100],
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  ownerStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ownerStatCard: {
    flex: 1,
    backgroundColor: Palette.neutral[50],
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  ownerStatNum: {
    fontSize: 20,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.primary[600],
  },
  ownerStatLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[600],
    textAlign: 'center',
    marginTop: 2,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ownerPrimaryBtn: {
    flex: 1,
    backgroundColor: Palette.primary[600],
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ownerPrimaryText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ownerSecondaryBtn: {
    backgroundColor: Palette.primary[50],
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerSecondaryText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[700],
  },
  searchSection: {
    gap: 12,
    marginBottom: 22,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    height: 46,
    borderRadius: 9999,
    backgroundColor: Palette.neutral[0],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[900],
  },
  filterTrigger: {
    width: 46,
    height: 46,
    borderRadius: 9999,
    backgroundColor: Palette.neutral[0],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9999,
    backgroundColor: Palette.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: Palette.neutral[0],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
  },
  chipAllActive: {
    backgroundColor: Palette.primary[600],
    borderColor: Palette.primary[600],
  },
  chipSelected: {
    backgroundColor: Palette.primary[50],
    borderColor: Palette.primary[300],
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Palette.neutral[700],
  },
  chipAllText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chipSelectedText: {
    color: Palette.primary[700],
    fontWeight: '600',
  },
  sectionHeader: {
    gap: 3,
    marginBottom: 14,
  },
  sectionSpaced: {
    marginTop: 28,
  },
  sectionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.25,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  seeAllBtn: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  grid: {
    gap: 16,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  col1: {
    width: '100%',
  },
  col2: {
    width: '48.8%',
  },
  col3: {
    width: '32.2%',
  },
  emptyBox: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
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
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Palette.primary[50],
  },
  resetBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  pressed: {
    opacity: 0.8,
  },
});
