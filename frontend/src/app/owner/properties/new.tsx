import React, { useState } from 'react';
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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastBanner } from '@/components/ui/confirm-dialog';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { StackHeader } from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { CITY_OPTIONS, SHARED_FACILITY_OPTIONS } from '@/data/mock-data';
import type { KostGenderType, PropertyItem } from '@/types/kostly';

interface UploadedPhoto {
  id: string;
  uri: string;
  tag: string;
}

const SAMPLE_GALLERY: UploadedPhoto[] = [
  {
    id: 'ph-1',
    uri: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80',
    tag: 'Foto Sampul Utama',
  },
  {
    id: 'ph-2',
    uri: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=900&q=80',
    tag: 'Ruang Bersama',
  },
];

export default function AddPropertyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, addOwnerProperty } = useApp();

  const [propertyName, setPropertyName] = useState('Kost Senopati Living Suites');
  const [genderType, setGenderType] = useState<KostGenderType>('CAMPUR');
  const [description, setDescription] = useState(
    'Hunian eksklusif dan tenang di pusat Jakarta Selatan. Dekat pusat perkantoran Senopati & SCBD, dilengkapi keamanan 24 jam serta area komunal yang nyaman untuk bersosialisasi dan WFH.'
  );
  const [selectedCityIdx, setSelectedCityIdx] = useState(0);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [fullAddress, setFullAddress] = useState('Jl. Senopati Dalam II No. 14, RT 04 / RW 02');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    'WiFi Super Cepat',
    'Dapur Bersama',
    'Area Parkir',
    'CCTV 24 Jam',
    'Penjaga Kost',
    'Ruang Santai',
  ]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>(SAMPLE_GALLERY);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedCity = CITY_OPTIONS[selectedCityIdx];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const toggleFacility = (label: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleSimulateUpload = () => {
    if (photos.length >= 10) {
      showToast('Maksimal 10 foto gedung kost.');
      return;
    }
    const newPhoto: UploadedPhoto = {
      id: `ph-${Date.now()}`,
      uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80',
      tag: `Area Kost #${photos.length + 1}`,
    };
    setPhotos((prev) => [...prev, newPhoto]);
    showToast('Foto gedung ditambahkan ke pratinjau.');
  };

  const buildPropertyRecord = (status: 'DRAFT' | 'PUBLISHED'): PropertyItem => ({
    id: `prop-${Date.now()}`,
    ownerId: user.id,
    name: propertyName.trim() || 'Kost Baru',
    description: description.trim(),
    address: fullAddress.trim(),
    landmark: '400m di belakang Ashta District 8 Mall',
    city: selectedCity.city,
    province: selectedCity.province,
    genderType,
    status,
    verified: false,
    rating: 5.0,
    reviewCount: 0,
    photoCount: photos.length,
    imageUrl: photos[0]?.uri ?? SAMPLE_GALLERY[0].uri,
    gallery: photos.map((p) => p.uri),
    startingPrice: 2200000,
    facilities: selectedFacilities.slice(0, 4),
    hasBookingHistory: false,
    rooms: [
      {
        id: `room-${Date.now()}`,
        propertyId: `prop-${Date.now()}`,
        name: 'Tipe Standar',
        description: 'Kamar baru siap diatur tarif dan detailnya.',
        monthlyPrice: 2200000,
        capacity: 1,
        status: 'ACTIVE',
        highlights: ['AC', 'WiFi'],
        availableCount: 2,
      },
    ],
  });

  const handleSaveDraft = () => {
    if (!propertyName.trim()) {
      showToast('Isi nama properti kost terlebih dahulu.');
      return;
    }
    addOwnerProperty(buildPropertyRecord('DRAFT'));
    showToast('Properti disimpan dalam status Draf.');
  };

  const handleNextStep = () => {
    if (!propertyName.trim() || !fullAddress.trim()) {
      showToast('Lengkapi nama properti dan alamat lengkap terlebih dahulu.');
      return;
    }
    addOwnerProperty(buildPropertyRecord('DRAFT'));
    showToast('Informasi properti valid! Mengalihkan ke Tipe Kamar...');
    setTimeout(() => {
      router.replace('/owner/properties/index');
    }, 650);
  };

  return (
    <View style={styles.screen}>
      <StackHeader title="Tambah Properti" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Stepper Header */}
        <View style={styles.stepperSection}>
          <ResponsiveContainer maxWidth={760}>
            <View style={styles.stepperTop}>
              <View style={styles.stepLabelRow}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepCircleText}>1</Text>
                </View>
                <Text style={styles.stepCountText}>Langkah 1 dari 4</Text>
              </View>
              <View style={styles.draftBadge}>
                <View style={styles.draftDot} />
                <Text style={styles.draftBadgeText}>Status: Draf</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressSeg, styles.progressSegActive]} />
              <View style={styles.progressSeg} />
              <View style={styles.progressSeg} />
              <View style={styles.progressSeg} />
            </View>

            <View style={styles.stepperFoot}>
              <Text style={styles.stepperCurrent}>1. Info Dasar Properti</Text>
              <Text style={styles.stepperNext}>Berikutnya: Kamar & Tarif</Text>
            </View>
          </ResponsiveContainer>
        </View>

        <ResponsiveContainer maxWidth={760}>
          <View style={styles.formContainer}>
            {/* Educational Micro-Banner */}
            <View style={styles.infoBanner}>
              <MaterialIcons name="info" size={20} color={Palette.primary[600]} />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>Sistem Berjenjang Kostly</Text>
                <Text style={styles.infoDesc}>
                  Data kamar spesifik, nomor unit, dan tarif bulanan diatur terpisah pada langkah berikutnya setelah profil umum properti tersimpan.
                </Text>
              </View>
            </View>

            {/* Card 1: Informasi Dasar Kost */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <MaterialIcons name="apartment" size={20} color={Palette.primary[600]} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Informasi Dasar Kost</Text>
                  <Text style={styles.cardSub}>
                    Nama resmi dan tipe hunian yang dicari penyewa
                  </Text>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>
                    Nama Properti Kost <Text style={styles.req}>*</Text>
                  </Text>
                  <Text style={styles.charLimit}>Maks. 60 Karakter</Text>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    value={propertyName}
                    onChangeText={setPropertyName}
                    maxLength={60}
                    placeholder="Contoh: Kost Senopati Living Suites"
                    placeholderTextColor={Palette.neutral[400]}
                    style={styles.inputField}
                  />
                  {propertyName.trim().length >= 5 && (
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color={Palette.semantic.success600}
                    />
                  )}
                </View>
                <Text style={styles.helperText}>
                  Gunakan nama yang mudah dikenali dan mencerminkan lokasi.
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Kategori Penghuni Kost <Text style={styles.req}>*</Text>
                </Text>
                <View style={styles.genderGroup}>
                  {(
                    [
                      { value: 'CAMPUR', label: 'Campur', icon: 'group' },
                      { value: 'PUTRA', label: 'Khusus Putra', icon: 'male' },
                      { value: 'PUTRI', label: 'Khusus Putri', icon: 'female' },
                    ] as const
                  ).map((opt) => {
                    const active = genderType === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setGenderType(opt.value)}
                        style={[styles.genderPill, active && styles.genderPillActive]}>
                        <MaterialIcons
                          name={opt.icon}
                          size={16}
                          color={active ? Palette.primary[700] : Palette.neutral[600]}
                        />
                        <Text
                          style={[
                            styles.genderText,
                            active && styles.genderTextActive,
                          ]}
                          numberOfLines={1}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>
                    Deskripsi Singkat Kost <Text style={styles.req}>*</Text>
                  </Text>
                  <Text style={styles.charLimit}>{description.length}/500</Text>
                </View>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                  multiline
                  numberOfLines={4}
                  placeholder="Jelaskan keunggulan hunian, lingkungan sekitar, dan suasana kost..."
                  placeholderTextColor={Palette.neutral[400]}
                  style={styles.textarea}
                />
              </View>
            </View>

            {/* Card 2: Alamat & Aksesibilitas */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <MaterialIcons name="location-on" size={20} color={Palette.primary[600]} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Alamat & Aksesibilitas</Text>
                  <Text style={styles.cardSub}>
                    Bantu calon penyewa menemukan hunian dengan akurat
                  </Text>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Kota / Area Wilayah <Text style={styles.req}>*</Text>
                </Text>
                <Pressable
                  onPress={() => setCityPickerOpen(true)}
                  style={styles.selectBox}>
                  <Text style={styles.selectText}>{selectedCity.label}</Text>
                  <MaterialIcons name="expand-more" size={20} color={Palette.neutral[500]} />
                </Pressable>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Alamat Lengkap & Patokan Terdekat <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  value={fullAddress}
                  onChangeText={setFullAddress}
                  placeholder="Contoh: Jl. Senopati Dalam II No. 14"
                  placeholderTextColor={Palette.neutral[400]}
                  style={styles.simpleInput}
                />
                <View style={styles.landmarkPill}>
                  <MaterialIcons name="place" size={16} color={Palette.primary[600]} />
                  <Text style={styles.landmarkText}>
                    Patokan: 400m di belakang Ashta District 8 Mall
                  </Text>
                </View>
              </View>

              {/* Map Snapshot Preview */}
              <View style={styles.mapPreview}>
                <View style={styles.mapGridOverlay}>
                  <MaterialIcons name="map" size={34} color={Palette.primary[300]} />
                  <Text style={styles.mapCoordText}>
                    {selectedCity.city}, {selectedCity.province}
                  </Text>
                </View>
                <View style={styles.mapFooterBar}>
                  <View style={styles.mapPinRow}>
                    <MaterialIcons name="near-me" size={17} color={Palette.primary[600]} />
                    <Text style={styles.mapPinLabel}>Pin Lokasi Terkonfirmasi</Text>
                  </View>
                  <Pressable onPress={() => showToast('Koordinat peta diperbarui.')}>
                    <Text style={styles.mapChangeLink}>Ubah Titik</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Card 3: Fasilitas Bersama */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <MaterialIcons name="room-service" size={20} color={Palette.primary[600]} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Fasilitas Bersama</Text>
                  <Text style={styles.cardSub}>
                    Pilih fasilitas gedung yang dapat dinikmati bersama
                  </Text>
                </View>
              </View>

              <View style={styles.facilityGrid}>
                {SHARED_FACILITY_OPTIONS.map((fac) => {
                  const checked = selectedFacilities.includes(fac.label);
                  return (
                    <Pressable
                      key={fac.id}
                      onPress={() => toggleFacility(fac.label)}
                      style={[styles.facilityOption, checked && styles.facilityOptionActive]}>
                      <View style={[styles.checkSquare, checked && styles.checkSquareActive]}>
                        {checked && <MaterialIcons name="check" size={13} color="#FFFFFF" />}
                      </View>
                      <View style={styles.facilityTextWrap}>
                        <Text style={styles.facilityLabel} numberOfLines={1}>
                          {fac.label}
                        </Text>
                        <Text style={styles.facilitySub} numberOfLines={1}>
                          {fac.subtitle}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Card 4: Foto Utama Gedung Kost */}
            <View style={styles.card}>
              <View style={styles.photoCardTop}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <MaterialIcons name="add-a-photo" size={20} color={Palette.primary[600]} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>Foto Utama Gedung Kost</Text>
                    <Text style={styles.cardSub}>
                      Maksimal 10 foto (JPG/PNG). Foto fasad & ruang umum
                    </Text>
                  </View>
                </View>
                <View style={styles.photoCountBadge}>
                  <Text style={styles.photoCountText}>{photos.length}/10 Foto</Text>
                </View>
              </View>

              <Pressable
                onPress={handleSimulateUpload}
                style={({ pressed }) => [styles.dropzone, pressed && styles.pressed]}>
                <View style={styles.dropzoneIcon}>
                  <MaterialIcons name="cloud-upload" size={26} color={Palette.primary[600]} />
                </View>
                <Text style={styles.dropzoneTitle}>Ketuk untuk Mengunggah Foto Gedung</Text>
                <Text style={styles.dropzoneSub}>
                  Pencahayaan terang menarik calon penyewa lebih cepat. Hindari foto blur atau gelap.
                </Text>
              </Pressable>

              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={photo.id} style={styles.photoTile}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photoImg}
                      contentFit="cover"
                    />
                    <View
                      style={[
                        styles.photoTag,
                        index === 0 ? styles.photoTagPrimary : styles.photoTagSecondary,
                      ]}>
                      <Text style={styles.photoTagText}>{photo.tag}</Text>
                    </View>
                    <Pressable
                      accessibilityLabel="Hapus Foto"
                      onPress={() =>
                        setPhotos((prev) => prev.filter((item) => item.id !== photo.id))
                      }
                      style={styles.removePhotoBtn}>
                      <MaterialIcons name="close" size={15} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>

              <View style={styles.photoNotice}>
                <MaterialIcons name="verified" size={17} color={Palette.semantic.warning600} />
                <Text style={styles.photoNoticeText}>
                  Foto kamar tidur & kamar mandi pribadi akan diunggah pada tahap spesifikasi unit kamar.
                </Text>
              </View>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* Sticky Bottom Navigation Buttons */}
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}>
        <ResponsiveContainer maxWidth={760}>
          <View style={styles.footerButtons}>
            <Pressable
              onPress={handleNextStep}
              style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}>
              <Text style={styles.nextBtnText}>Lanjut ke Pengaturan Kamar</Text>
              <MaterialIcons name="arrow-forward" size={19} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={handleSaveDraft}
              style={({ pressed }) => [styles.draftBtn, pressed && styles.pressed]}>
              <MaterialIcons name="bookmark-outline" size={18} color={Palette.neutral[600]} />
              <Text style={styles.draftBtnText}>Simpan sebagai Draf</Text>
            </Pressable>
          </View>
        </ResponsiveContainer>
      </View>

      {/* City Picker Modal */}
      <Modal
        transparent
        visible={cityPickerOpen}
        animationType="fade"
        onRequestClose={() => setCityPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCityPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Pilih Kota / Area Wilayah</Text>
            {CITY_OPTIONS.map((city, idx) => {
              const selected = idx === selectedCityIdx;
              return (
                <Pressable
                  key={city.value}
                  onPress={() => {
                    setSelectedCityIdx(idx);
                    setCityPickerOpen(false);
                  }}
                  style={[styles.modalOption, selected && styles.modalOptionActive]}>
                  <Text
                    style={[
                      styles.modalOptionText,
                      selected && styles.modalOptionTextActive,
                    ]}>
                    {city.label}
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
    paddingBottom: 28,
  },
  stepperSection: {
    backgroundColor: Palette.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral[200],
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  stepperTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    backgroundColor: Palette.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.primary[600],
  },
  stepCountText: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[900],
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.semantic.warning50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  draftDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: Palette.semantic.warning600,
  },
  draftBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.semantic.warning600,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Palette.neutral[100],
    borderRadius: 9999,
    padding: 2,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  progressSeg: {
    flex: 1,
    borderRadius: 9999,
    backgroundColor: Palette.neutral[200],
  },
  progressSegActive: {
    backgroundColor: Palette.primary[600],
  },
  stepperFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperCurrent: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  stepperNext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[400],
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  infoBanner: {
    backgroundColor: Palette.primary[50],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.primary[100],
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoTextWrap: {
    flex: 1,
    gap: 3,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[800],
  },
  infoDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  card: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Palette.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  cardSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Palette.neutral[700],
  },
  req: {
    color: Palette.semantic.danger600,
  },
  charLimit: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[400],
  },
  inputRow: {
    backgroundColor: Palette.neutral[100],
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[900],
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  genderGroup: {
    flexDirection: 'row',
    backgroundColor: Palette.neutral[100],
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 9,
  },
  genderPillActive: {
    backgroundColor: Palette.neutral[0],
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  genderText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[600],
  },
  genderTextActive: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[700],
  },
  textarea: {
    backgroundColor: Palette.neutral[100],
    borderRadius: 10,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[900],
  },
  selectBox: {
    backgroundColor: Palette.neutral[100],
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[900],
  },
  simpleInput: {
    backgroundColor: Palette.neutral[100],
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[900],
  },
  landmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.primary[50],
    padding: 9,
    borderRadius: 10,
    marginTop: 2,
  },
  landmarkText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.primary[700],
    flex: 1,
  },
  mapPreview: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    backgroundColor: Palette.primary[50],
  },
  mapGridOverlay: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapCoordText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Palette.primary[700],
  },
  mapFooterBar: {
    backgroundColor: Palette.neutral[0],
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.neutral[200],
  },
  mapPinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapPinLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[800],
  },
  mapChangeLink: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  facilityOption: {
    width: '48.3%',
    backgroundColor: Palette.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  facilityOptionActive: {
    borderColor: Palette.primary[200],
    backgroundColor: Palette.primary[50],
  },
  checkSquare: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Palette.neutral[300],
    backgroundColor: Palette.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSquareActive: {
    backgroundColor: Palette.primary[600],
    borderColor: Palette.primary[600],
  },
  facilityTextWrap: {
    flex: 1,
  },
  facilityLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[900],
  },
  facilitySub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  photoCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  photoCountBadge: {
    backgroundColor: Palette.primary[50],
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  photoCountText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  dropzone: {
    backgroundColor: Palette.neutral[50],
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Palette.primary[200],
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  dropzoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: Palette.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dropzoneTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[900],
    textAlign: 'center',
  },
  dropzoneSub: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    textAlign: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: '48.3%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Palette.neutral[100],
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  photoTagPrimary: {
    backgroundColor: Palette.primary[600],
  },
  photoTagSecondary: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  photoTagText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 9999,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNotice: {
    backgroundColor: Palette.neutral[50],
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  stickyFooter: {
    backgroundColor: 'rgba(248, 250, 252, 0.96)',
    borderTopWidth: 1,
    borderTopColor: Palette.neutral[200],
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerButtons: {
    gap: 8,
  },
  nextBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Palette.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  draftBtn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: Palette.neutral[0],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  draftBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[700],
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
    maxWidth: 400,
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
    marginBottom: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
  },
  modalOptionActive: {
    backgroundColor: Palette.primary[50],
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[700],
  },
  modalOptionTextActive: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[700],
  },
  pressed: {
    opacity: 0.85,
  },
});
