import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Palette } from '@/constants/theme';
import { formatIDR } from '@/data/mock-data';
import type { PropertyItem } from '@/types/kostly';
import { GenderBadge, VerifiedBadge } from './status-badge';

interface PropertyCardProps {
  property: PropertyItem;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onPressDetail: (id: string) => void;
  priceLabel?: string;
}

export function PropertyCard({
  property,
  isWishlisted,
  onToggleWishlist,
  onPressDetail,
  priceLabel = 'Mulai dari',
}: PropertyCardProps) {
  const locationText = property.landmark
    ? `${property.city} • ${property.landmark}`
    : `${property.address}, ${property.city}`;

  return (
    <Pressable
      onPress={() => onPressDetail(property.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: property.imageUrl }}
          style={styles.coverImage}
          contentFit="cover"
          transition={200}
        />

        <View style={styles.topLeftBadges}>
          {property.verified && <VerifiedBadge />}
          <GenderBadge genderType={property.genderType} />
          {property.popularTag && (
            <View style={styles.popularPill}>
              <Text style={styles.popularText}>{property.popularTag}</Text>
            </View>
          )}
        </View>

        <Pressable
          accessibilityLabel="Simpan ke Wishlist"
          onPress={(e) => {
            e.stopPropagation();
            onToggleWishlist(property.id);
          }}
          style={({ pressed }) => [styles.wishlistBtn, pressed && styles.btnPressed]}>
          <MaterialIcons
            name={isWishlisted ? 'favorite' : 'favorite-border'}
            size={18}
            color={isWishlisted ? Palette.semantic.danger600 : Palette.neutral[700]}
          />
        </Pressable>

        <View style={styles.ratingPill}>
          <MaterialIcons name="star" size={13} color="#F59E0B" />
          <Text style={styles.ratingValue}>{property.rating.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({property.reviewCount})</Text>
        </View>

        <View style={styles.photoPill}>
          <MaterialIcons name="photo-camera" size={12} color="#FFFFFF" />
          <Text style={styles.photoText}>{property.photoCount} Foto</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View>
          <Text style={styles.title} numberOfLines={2}>
            {property.name}
          </Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={14} color={Palette.primary[500]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationText}
            </Text>
          </View>
        </View>

        <View style={styles.facilityRow}>
          {property.facilities.slice(0, 4).map((fac) => (
            <View key={fac} style={styles.facilityChip}>
              <Text style={styles.facilityText}>{fac}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>{priceLabel}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>{formatIDR(property.startingPrice)}</Text>
              <Text style={styles.pricePeriod}> / bln</Text>
            </View>
          </View>

          <Pressable
            onPress={() => onPressDetail(property.id)}
            style={({ pressed }) => [styles.detailBtn, pressed && styles.detailBtnPressed]}>
            <Text style={styles.detailBtnText}>Lihat Detail</Text>
            <MaterialIcons name="chevron-right" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.96,
  },
  imageWrapper: {
    width: '100%',
    height: 196,
    backgroundColor: Palette.neutral[100],
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  topLeftBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 54,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  popularPill: {
    backgroundColor: Palette.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  popularText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  wishlistBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  btnPressed: {
    transform: [{ scale: 0.92 }],
  },
  ratingPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  ratingValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ratingCount: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[300],
  },
  photoPill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  photoText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
  },
  body: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  facilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  facilityChip: {
    backgroundColor: Palette.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  facilityText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Palette.neutral[600],
  },
  footer: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral[100],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.primary[600],
  },
  pricePeriod: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  detailBtn: {
    backgroundColor: Palette.primary[600],
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailBtnPressed: {
    backgroundColor: Palette.primary[700],
  },
  detailBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
