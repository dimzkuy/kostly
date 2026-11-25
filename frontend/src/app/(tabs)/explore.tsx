import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { PropertyCard } from '@/components/ui/property-card';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { TabHeader } from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useResponsive } from '@/hooks/use-responsive';

const EXPLORE_CHIPS = [
  'Semua',
  'Jakarta Selatan',
  'Bandung',
  'Campur',
  'Putri',
  'Putra',
  '< Rp 2 Juta',
  'AC & KM Dalam',
  'Dekat Stasiun/MRT',
] as const;

const SORT_OPTIONS = [
  'Rekomendasi Terbaik',
  'Harga Termurah',
  'Paling Populer',
  'Rating Tertinggi',
] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

export default function JelajahScreen() {
  const router = useRouter();
  const { isMobile, columns } = useResponsive();
  const { properties, wishlistIds, toggleWishlist } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([
    'Jakarta Selatan',
    'AC & KM Dalam',
  ]);
  const [sortBy, setSortBy] = useState<SortOption>('Rekomendasi Terbaik');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const toggleChip = (chip: string) => {
    if (chip === 'Semua') {
      setSelectedChips(['Semua']);
      return;
    }
    setSelectedChips((prev) => {
      const withoutAll = prev.filter((c) => c !== 'Semua');
      const next = withoutAll.includes(chip)
        ? withoutAll.filter((c) => c !== chip)
        : [...withoutAll, chip];
      return next.length === 0 ? ['Semua'] : next;
    });
  };

  const activeFiltersCount = selectedChips.includes('Semua') ? 0 : selectedChips.length;

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const published = properties.filter((p) => p.status === 'PUBLISHED');

    const filtered = published.filter((prop) => {
      const matchesSearch =
        !q ||
        prop.name.toLowerCase().includes(q) ||
        prop.city.toLowerCase().includes(q) ||
        prop.address.toLowerCase().includes(q) ||
        (prop.landmark?.toLowerCase().includes(q) ?? false);

      if (!matchesSearch) return false;
      if (selectedChips.includes('Semua') || selectedChips.length === 0) return true;

      return selectedChips.some((chip) => {
        if (chip === 'Jakarta Selatan') return prop.city === 'Jakarta Selatan';
        if (chip === 'Bandung') return prop.city === 'Bandung';
        if (chip === 'Campur') return prop.genderType === 'CAMPUR';
        if (chip === 'Putri') return prop.genderType === 'PUTRI';
        if (chip === 'Putra') return prop.genderType === 'PUTRA';
        if (chip === '< Rp 2 Juta') return prop.startingPrice < 2000000;
        if (chip === 'AC & KM Dalam') {
          return (
            prop.facilities.some((f) => f.includes('AC')) &&
            prop.facilities.some((f) => f.includes('KM Dalam'))
          );
        }
        if (chip === 'Dekat Stasiun/MRT') {
          const text = `${prop.landmark ?? ''} ${prop.address}`.toLowerCase();
          return text.includes('mrt') || text.includes('stasiun');
        }
        return true;
      });
    });

    const copy = [...filtered];
    if (sortBy === 'Harga Termurah') {
      copy.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'Paling Populer') {
      copy.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sortBy === 'Rating Tertinggi') {
      copy.sort((a, b) => b.rating - a.rating);
    }
    return copy;
  }, [properties, searchQuery, selectedChips, sortBy]);

  return (
    <View style={styles.screen}>
      <TabHeader title="Jelajah" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}>
        <ResponsiveContainer>
          {/* Search + Filter Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <MaterialIcons name="search" size={20} color={Palette.neutral[400]} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Cari area, kampus, atau nama kost..."
                  placeholderTextColor={Palette.neutral[400]}
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    accessibilityLabel="Hapus pencarian"
                    onPress={() => setSearchQuery('')}
                    hitSlop={8}>
                    <MaterialIcons name="cancel" size={18} color={Palette.neutral[400]} />
                  </Pressable>
                )}
              </View>

              <Pressable
                accessibilityLabel="Filter Kost"
                onPress={() => setFilterModalOpen(true)}
                style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}>
                <MaterialIcons name="tune" size={21} color={Palette.neutral[700]} />
                {activeFiltersCount > 0 && (
                  <View style={styles.filterCountBadge}>
                    <Text style={styles.filterCountText}>{activeFiltersCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}>
              {EXPLORE_CHIPS.map((chip) => {
                const active = selectedChips.includes(chip);
                const isAll = chip === 'Semua' && active;
                return (
                  <Pressable
                    key={chip}
                    onPress={() => toggleChip(chip)}
                    style={({ pressed }) => [
                      styles.chip,
                      isAll && styles.chipAllActive,
                      !isAll && active && styles.chipSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        isAll && styles.chipAllText,
                        !isAll && active && styles.chipSelectedText,
                      ]}>
                      {chip}
                    </Text>
                    {!isAll && active && (
                      <MaterialIcons name="check" size={14} color={Palette.primary[600]} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Results Count & Sort Header */}
          <View style={styles.resultsBar}>
            <View style={styles.countRow}>
              <Text style={styles.countStrong}>{filteredAndSorted.length} Kost Pilihan</Text>
              <Text style={styles.countSub}>ditemukan</Text>
            </View>

            <Pressable
              onPress={() => setSortMenuOpen(true)}
              style={({ pressed }) => [styles.sortBtn, pressed && styles.pressed]}>
              <MaterialIcons name="swap-vert" size={16} color={Palette.neutral[500]} />
              <Text style={styles.sortLabel}>{sortBy}</Text>
              <MaterialIcons name="expand-more" size={16} color={Palette.neutral[400]} />
            </Pressable>
          </View>

          {/* Cards Grid / List */}
          {filteredAndSorted.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="location-searching" size={36} color={Palette.neutral[400]} />
              <Text style={styles.emptyTitle}>Belum ada kost sesuai filter</Text>
              <Text style={styles.emptyDesc}>
                Coba hapus sebagian filter atau gunakan kata kunci lokasi lain.
              </Text>
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setSelectedChips(['Semua']);
                }}
                style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Tampilkan Semua Kost</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.grid, columns > 1 && styles.gridWide]}>
              {filteredAndSorted.map((prop) => (
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
                    onToggleWishlist={toggleWishlist}
                    onPressDetail={(id) =>
                      router.push({ pathname: '/properties/[id]', params: { id } })
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>

      {/* Sort Dropdown Modal */}
      <Modal
        transparent
        visible={sortMenuOpen}
        animationType="fade"
        onRequestClose={() => setSortMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSortMenuOpen(false)}>
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Urutkan Hasil</Text>
            {SORT_OPTIONS.map((option) => {
              const selected = sortBy === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    setSortBy(option);
                    setSortMenuOpen(false);
                  }}
                  style={[styles.sortOptionRow, selected && styles.sortOptionSelected]}>
                  <Text
                    style={[
                      styles.sortOptionText,
                      selected && styles.sortOptionTextSelected,
                    ]}>
                    {option}
                  </Text>
                  {selected && (
                    <MaterialIcons name="check" size={18} color={Palette.primary[600]} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filter Sheet Modal */}
      <Modal
        transparent
        visible={filterModalOpen}
        animationType="fade"
        onRequestClose={() => setFilterModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalOpen(false)}>
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter Pencarian</Text>
              <Pressable onPress={() => setSelectedChips(['Semua'])}>
                <Text style={styles.clearLink}>Reset</Text>
              </Pressable>
            </View>
            <View style={styles.modalChipsWrap}>
              {EXPLORE_CHIPS.map((chip) => {
                const active = selectedChips.includes(chip);
                return (
                  <Pressable
                    key={chip}
                    onPress={() => toggleChip(chip)}
                    style={[styles.chip, active && styles.chipSelected]}>
                    <Text style={[styles.chipText, active && styles.chipSelectedText]}>
                      {chip}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => setFilterModalOpen(false)}
              style={styles.applyFilterBtn}>
              <Text style={styles.applyFilterText}>
                Terapkan ({filteredAndSorted.length} Kost)
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingTop: 14,
    paddingBottom: 36,
  },
  scrollContentMobile: {
    paddingBottom: 28,
  },
  searchSection: {
    gap: 10,
    marginBottom: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.neutral[0],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    paddingHorizontal: 12,
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
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.neutral[0],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 9999,
    backgroundColor: Palette.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterCountText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chipsRow: {
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
    fontSize: 13,
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
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  countStrong: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  countSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.neutral[100],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sortLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Palette.neutral[700],
  },
  grid: {
    gap: 14,
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
  emptyDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 8,
    backgroundColor: Palette.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  clearLink: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
  },
  sortOptionSelected: {
    backgroundColor: Palette.primary[50],
  },
  sortOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[700],
  },
  sortOptionTextSelected: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[700],
  },
  modalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 6,
  },
  applyFilterBtn: {
    marginTop: 4,
    backgroundColor: Palette.primary[600],
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFilterText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
});
