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
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import { ToastBanner } from '@/components/ui/confirm-dialog';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { StackHeader } from '@/components/ui/screen-header';
import { GenderBadge, StatusBadge, VerifiedBadge } from '@/components/ui/status-badge';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatIDR } from '@/data/mock-data';
import type { RoomItem } from '@/types/kostly';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, properties, wishlistIds, toggleWishlist, createBookingRequest } = useApp();

  const isOwner = user.role === 'OWNER';
  const property = useMemo(
    () => properties.find((p) => p.id === id) ?? properties[0],
    [properties, id]
  );
  const isOwnedByMe = isOwner && property.ownerId === user.id;

  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
  const [startDate, setStartDate] = useState('2026-12-01');
  const [durationMonths, setDurationMonths] = useState(3);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isWishlisted = wishlistIds.includes(property.id);

  const handleConfirmBooking = () => {
    if (!selectedRoom || isOwner) return;
    createBookingRequest({
      property,
      roomId: selectedRoom.id,
      startDate,
      durationMonths,
    });
    setSelectedRoom(null);
    setToastMsg('Pengajuan sewa dikirim! Menunggu persetujuan pemilik.');
    setTimeout(() => {
      setToastMsg(null);
      router.push('/bookings');
    }, 900);
  };

  return (
    <View style={styles.screen}>
      <StackHeader title="Detail Properti" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ResponsiveContainer maxWidth={860}>
          {/* Cover Photo */}
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: property.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
            />
            <View style={styles.heroTopLeft}>
              {property.verified && <VerifiedBadge />}
              <GenderBadge genderType={property.genderType} />
            </View>
            {!isOwner && (
              <Pressable
                accessibilityLabel="Simpan ke Wishlist"
                onPress={() => toggleWishlist(property.id)}
                style={styles.wishlistBtn}>
                <AppIcon
                  name={isWishlisted ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isWishlisted ? Palette.semantic.danger600 : Palette.neutral[700]}
                />
              </Pressable>
            )}
          </View>

          {/* Main Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.ratingRow}>
              <AppIcon name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {property.rating.toFixed(1)} ({property.reviewCount} ulasan)
              </Text>
              <View style={styles.dot} />
              <Text style={styles.cityText}>
                {property.city}, {property.province}
              </Text>
            </View>

            <Text style={styles.title}>{property.name}</Text>

            <View style={styles.addressRow}>
              <AppIcon name="location" size={16} color={Palette.primary[600]} />
              <Text style={styles.addressText}>
                {property.address}
                {property.landmark ? ` • ${property.landmark}` : ''}
              </Text>
            </View>

            <Text style={styles.desc}>{property.description}</Text>

            <View style={styles.facilitiesWrap}>
              {property.facilities.map((fac) => (
                <View key={fac} style={styles.facilityChip}>
                  <AppIcon name="check-circle" size={14} color={Palette.primary[600]} />
                  <Text style={styles.facilityText}>{fac}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Rooms Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Pilihan Tipe Kamar</Text>

            <View style={styles.roomList}>
              {property.rooms.map((room) => {
                const bookable = room.status === 'ACTIVE' && room.availableCount > 0;
                return (
                  <View key={room.id} style={styles.roomCard}>
                    <View style={styles.roomTop}>
                      <View style={styles.roomTitleWrap}>
                        <Text style={styles.roomName}>{room.name}</Text>
                        <Text style={styles.roomCapacity}>
                          Kapasitas {room.capacity} orang • Tersedia {room.availableCount} unit
                        </Text>
                      </View>
                      <StatusBadge domain="room" status={room.status} />
                    </View>

                    <Text style={styles.roomDesc}>{room.description}</Text>

                    <View style={styles.roomTags}>
                      {room.highlights.map((h) => (
                        <View key={h} style={styles.roomTag}>
                          <Text style={styles.roomTagText}>{h}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.roomFooter}>
                      <View>
                        <Text style={styles.priceValue}>{formatIDR(room.monthlyPrice)}</Text>
                        <Text style={styles.priceUnit}>/ bulan</Text>
                      </View>
                      {isOwner ? (
                        <View style={styles.ownerRoomBadge}>
                          <Text style={styles.ownerRoomBadgeText}>
                            {bookable ? `${room.availableCount} Unit Tersedia` : 'Tidak Tersedia'}
                          </Text>
                        </View>
                      ) : (
                        <Pressable
                          disabled={!bookable}
                          onPress={() => setSelectedRoom(room)}
                          style={({ pressed }) => [
                            styles.bookBtn,
                            !bookable && styles.bookBtnDisabled,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.bookBtnText}>
                            {bookable ? 'Ajukan Sewa' : 'Tidak Tersedia'}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* Booking Request Modal (Tenant only) */}
      {!isOwner && (
        <Modal
          transparent
          visible={!!selectedRoom}
          animationType="fade"
          onRequestClose={() => setSelectedRoom(null)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRoom(null)}>
            <Pressable style={styles.modalCard} onPress={() => { }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajukan Sewa Kamar</Text>
                <Pressable onPress={() => setSelectedRoom(null)}>
                  <AppIcon name="close" size={20} color={Palette.neutral[500]} />
                </Pressable>
              </View>

              <Text style={styles.modalProp}>{property.name}</Text>
              <Text style={styles.modalRoom}>{selectedRoom?.name}</Text>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Tanggal Mulai Sewa (YYYY-MM-DD)</Text>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="2026-12-01"
                  style={styles.modalInput}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Durasi Sewa (Bulan)</Text>
                <View style={styles.durationRow}>
                  {[1, 3, 6, 12].map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setDurationMonths(m)}
                      style={[
                        styles.durChip,
                        durationMonths === m && styles.durChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.durChipText,
                          durationMonths === m && styles.durChipTextActive,
                        ]}>
                        {m} Bln
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {selectedRoom && (
                <View style={styles.summaryBox}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tarif Bulanan</Text>
                    <Text style={styles.summaryVal}>{formatIDR(selectedRoom.monthlyPrice)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Durasi</Text>
                    <Text style={styles.summaryVal}>{durationMonths} bulan</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                    <Text style={styles.summaryTotalLabel}>Total Estimasi</Text>
                    <Text style={styles.summaryTotalVal}>
                      {formatIDR(selectedRoom.monthlyPrice * durationMonths)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.modalNote}>
                <AppIcon name="info" size={16} color={Palette.primary[600]} />
                <Text style={styles.modalNoteText}>
                  Pengajuan memerlukan persetujuan pemilik. Pembayaran diatur secara manual langsung dengan pemilik di luar aplikasi Kostly.
                </Text>
              </View>

              <Pressable
                onPress={handleConfirmBooking}
                style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}>
                <Text style={styles.confirmBtnText}>Kirim Pengajuan Sewa</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}

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
    paddingBottom: 36,
  },
  heroWrap: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Palette.neutral[200],
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    gap: 6,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginTop: 14,
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 16,
    gap: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[800],
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 9999,
    backgroundColor: Palette.neutral[300],
  },
  cityText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[700],
  },
  facilitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  facilityText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Palette.primary[800],
  },
  sectionBlock: {
    marginTop: 22,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    marginBottom: 6,
  },
  roomList: {
    gap: 12,
  },
  roomCard: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 16,
    gap: 10,
  },
  roomTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  roomTitleWrap: {
    flex: 1,
    gap: 2,
  },
  roomName: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  roomCapacity: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  roomDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  roomTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roomTag: {
    backgroundColor: Palette.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roomTagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[700],
  },
  roomFooter: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral[100],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceValue: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.primary[600],
  },
  priceUnit: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  bookBtn: {
    backgroundColor: Palette.primary[600],
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookBtnDisabled: {
    backgroundColor: Palette.neutral[300],
  },
  bookBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ownerNoticeBanner: {
    backgroundColor: Palette.primary[50],
    borderWidth: 1,
    borderColor: Palette.primary[100],
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  ownerNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
    color: Palette.primary[900],
  },
  ownerManageBtn: {
    backgroundColor: Palette.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  ownerManageBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ownerRoomBadge: {
    backgroundColor: Palette.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ownerRoomBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[600],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Palette.neutral[0],
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  modalProp: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[800],
  },
  modalRoom: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    marginTop: -8,
  },
  modalField: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[700],
  },
  modalInput: {
    height: 44,
    backgroundColor: Palette.neutral[50],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[900],
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Palette.neutral[100],
    alignItems: 'center',
  },
  durChipActive: {
    backgroundColor: Palette.primary[600],
  },
  durChipText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Palette.neutral[700],
  },
  durChipTextActive: {
    color: '#FFFFFF',
  },
  summaryBox: {
    backgroundColor: Palette.neutral[50],
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  summaryVal: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Palette.neutral[800],
  },
  summaryTotalRow: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral[200],
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Palette.neutral[900],
  },
  summaryTotalVal: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.primary[600],
  },
  modalNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Palette.primary[50],
    padding: 10,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  modalNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
    color: Palette.primary[900],
  },
  confirmBtn: {
    backgroundColor: Palette.primary[600],
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});
