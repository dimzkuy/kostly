import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { StackHeader } from '@/components/ui/screen-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ROUTES } from '@/constants/routes';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatIDR } from '@/data/mock-data';

export default function OwnerPropertiesScreen() {
  const router = useRouter();
  const { user, properties } = useApp();

  const owned = properties.filter((p) => p.ownerId === user.id);

  return (
    <View style={styles.screen}>
      <StackHeader title="Properti Saya" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ResponsiveContainer maxWidth={860}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.heading}>Daftar Properti Kost</Text>
              <Text style={styles.sub}>{owned.length} properti terdaftar</Text>
            </View>
            <Pressable
              onPress={() => router.push('/owner/properties/new')}
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
              <AppIcon name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Tambah Properti</Text>
            </Pressable>
          </View>

          <View style={styles.list}>
            {owned.map((prop) => (
              <View key={prop.id} style={styles.card}>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/properties/[id]', params: { id: prop.id } })
                  }
                  style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
                  <Image
                    source={{ uri: prop.imageUrl }}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                  <View style={styles.cardBody}>
                    <View style={styles.badgeRow}>
                      <StatusBadge domain="property" status={prop.status} />
                      {prop.hasBookingHistory && (
                        <View style={styles.historyTag}>
                          <Text style={styles.historyTagText}>Ada Riwayat Sewa</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.propName} numberOfLines={1}>
                      {prop.name}
                    </Text>
                    <Text style={styles.propMeta} numberOfLines={1}>
                      {prop.city} • {prop.rooms.length} tipe kamar
                    </Text>
                    <Text style={styles.propPrice}>
                      Mulai {formatIDR(prop.startingPrice)} / bln
                    </Text>
                  </View>
                </Pressable>

                {/* Edit button */}
                <Pressable
                  accessibilityLabel="Edit Properti"
                  onPress={() => router.push(ROUTES.ownerPropertyEdit(prop.id))}
                  style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}>
                  <AppIcon name="create-outline" size={16} color={Palette.primary[600]} />
                </Pressable>
              </View>
            ))}
          </View>
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
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  sub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  addBtn: {
    backgroundColor: Palette.primary[600],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: Palette.neutral[100],
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  editBtn: {
    width: 44,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: Palette.neutral[200],
    backgroundColor: Palette.primary[50],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  historyTag: {
    backgroundColor: Palette.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  historyTagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[600],
  },
  propName: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  propMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  propPrice: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.primary[600],
  },
  pressed: {
    opacity: 0.85,
  },
});
