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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import type { AppIconName } from '@/components/ui/app-icon.types';
import { ToastBanner } from '@/components/ui/confirm-dialog';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { StackHeader } from '@/components/ui/screen-header';
import { ROUTES } from '@/constants/routes';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { CITY_OPTIONS, SHARED_FACILITY_OPTIONS } from '@/data/mock-data';
import type { KostGenderType } from '@/types/kostly';

interface UploadedPhoto {
  id: string;
  uri: string;
  tag: string;
}

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { properties, updateOwnerProperty } = useApp();

  const property = properties.find((p) => p.id === id);

  // ── derive initial city index ─────────────────────────────────────────────
  const initialCityIdx = property
    ? Math.max(
        CITY_OPTIONS.findIndex((c) => c.city === property.city),
        0
      )
    : 0;

  // ── form state pre-filled from property ──────────────────────────────────
  const [propertyName, setPropertyName] = useState(property?.name ?? '');
  const [genderType, setGenderType] = useState<KostGenderType>(
    property?.genderType ?? 'CAMPUR'
  );
  const [description, setDescription] = useState(property?.description ?? '');
  const [selectedCityIdx, setSelectedCityIdx] = useState(initialCityIdx);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [fullAddress, setFullAddress] = useState(property?.address ?? '');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    property?.facilities ?? []
  );
  const [photos, setPhotos] = useState<UploadedPhoto[]>(
    (property?.gallery ?? [property?.imageUrl ?? '']).map((uri, i) => ({
      id: `ph-${i}`,
      uri,
      tag: i === 0 ? 'Foto Sampul Utama' : `Foto Kost #${i + 1}`,
    }))
  );
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

  const handleSave = () => {
    if (!propertyName.trim() || !fullAddress.trim()) {
      showToast('Lengkapi nama properti dan alamat lengkap terlebih dahulu.');
      return;
    }
    if (!property) return;

    updateOwnerProperty({
      ...property,
      name: propertyName.trim(),
      genderType,
      description: description.trim(),
      city: selectedCity.city,
      province: selectedCity.province,
      address: fullAddress.trim(),
      facilities: selectedFacilities,
      photoCount: photos.length,
      imageUrl: photos[0]?.uri ?? property.imageUrl,
      gallery: photos.map((p) => p.uri),
    });

    showToast('Perubahan berhasil disimpan!');
    setTimeout(() => {
      router.replace(ROUTES.ownerProperties);
    }, 650);
  };

  // ── property not found guard ──────────────────────────────────────────────
  if (!property) {
    return (
      <View style={styles.screen}>
        <StackHeader title="Edit Properti" />
        <View style={styles.notFound}>
          <AppIcon name="error" size={48} color={Palette.neutral[400]} />
          <Text style={styles.notFoundText}>Properti tidak ditemukan.</Text>
          <Pressable
            onPress={() => router.replace(ROUTES.ownerProperties)}
            style={styles.backLink}>
            <Text style={styles.backLinkText}>Kembali ke Daftar Properti</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StackHeader title="Edit Properti" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <View style={styles.statusBar}>
          <ResponsiveContainer maxWidth={760}>
            <View style={styles.statusBarInner}>
              <View style={[styles.statusDot, property.status === 'PUBLISHED' ? styles.dotPublished : styles.dotDraft]} />
              <Text style={styles.statusBarText}>
                Status:{' '}
                <Text style={styles.statusBarBold}>
                  {property.status === 'PUBLISHED' ? 'Dipublikasikan' : property.status === 'DRAFT' ? 'Draf' : 'Diarsipkan'}
                </Text>
              </Text>
              <View style={styles.statusBarSpacer} />
              <Text style={styles.statusBarHint}>Perubahan langsung diterapkan</Text>
            </View>
          </ResponsiveContainer>
        </View>

        <ResponsiveContainer maxWidth={760}>
          <View style={styles.formContainer}>
            {/* Card 1 – Info Dasar */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <AppIcon name="business" size={20} color={Palette.primary[600]} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Informasi Dasar Kost</Text>
                  <Text style={styles.cardSub}>Nama resmi dan tipe hunian</Text>
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
                    <AppIcon name="check-circle" size={20} color={Palette.semantic.success600} />
                  )}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Kategori Penghuni Kost <Text style={styles.req}>*</Text>
                </Text>
                <View style={styles.genderGroup}>
                  {(
                    [
                      { value: 'CAMPUR', label: 'Campur', icon: 'people' },
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
                        <AppIcon
                          name={opt.icon as AppIconName}
                          size={16}
                          color={active ? Palette.primary[700] : Palette.neutral[600]}
                        />
                        <Text
                          style={[styles.genderText, active && styles.genderTextActive]}
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

            {/* Card 2 – Alamat */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <AppIcon name="location" size={20} color={Palette.primary[600]} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Alamat &amp; Aksesibilitas</Text>
                  <Text style={styles.cardSub}>Bantu calon penyewa menemukan hunian</Text>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Kota / Area Wilayah <Text style={styles.req}>*</Text>
                </Text>
                <Pressable onPress={() => setCityPickerOpen(true)} style={styles.selectBox}>
                  <Text style={styles.selectText}>{selectedCity.label}</Text>
                  <AppIcon name="chevron-down" size={20} color={Palette.neutral[500]} />
                </Pressable>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Alamat Lengkap <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  value={fullAddress}
                  onChangeText={setFullAddress}
                  placeholder="Contoh: Jl. Senopati Dalam II No. 14"
                  placeholderTextColor={Palette.neutral[400]}
                  style={styles.simpleInput}
                />
              </View>
            </View>

            {/* Card 3 – Fasilitas */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <AppIcon name="room-service" size={20} color={Palette.primary[600]} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Fasilitas Bersama</Text>
                  <Text style={styles.cardSub}>Fasilitas gedung yang dapat dinikmati bersama</Text>
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
                        {checked && <AppIcon name="check" size={13} color="#FFFFFF" />}
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

            {/* Card 4 – Foto */}
            <View style={styles.card}>
              <View style={styles.photoCardTop}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <AppIcon name="camera-add" size={20} color={Palette.primary[600]} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>Foto Utama Gedung Kost</Text>
                    <Text style={styles.cardSub}>Maksimal 10 foto (JPG/PNG)</Text>
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
                  <AppIcon name="cloud-upload" size={26} color={Palette.primary[600]} />
                </View>
                <Text style={styles.dropzoneTitle}>Ketuk untuk Menambah Foto</Text>
                <Text style={styles.dropzoneSub}>Foto baru akan ditambahkan ke galeri properti.</Text>
              </Pressable>

              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={photo.id} style={styles.photoTile}>
                    <Image source={{ uri: photo.uri }} style={styles.photoImg} contentFit="cover" />
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
                      <AppIcon name="close" size={15} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <ResponsiveContainer maxWidth={760}>
          <View style={styles.footerButtons}>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}>
              <AppIcon name="check-circle" size={19} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}>
              <Text style={styles.cancelBtnText}>Batal</Text>
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
                  {selected && <AppIcon name="check" size={18} color={Palette.primary[600]} />}
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
  screen: { flex: 1, backgroundColor: Palette.neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 28 },

  // Not-found
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[600],
    textAlign: 'center',
  },
  backLink: { marginTop: 4 },
  backLinkText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Palette.primary[600],
  },

  // Status bar
  statusBar: {
    backgroundColor: Palette.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral[200],
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
  dotPublished: { backgroundColor: Palette.semantic.success600 },
  dotDraft: { backgroundColor: Palette.semantic.warning600 },
  statusBarText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  statusBarBold: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[800],
  },
  statusBarSpacer: { flex: 1 },
  statusBarHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[400],
  },

  // Form
  formContainer: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  card: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 16,
    gap: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Palette.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  cardSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Palette.neutral[500] },

  fieldGroup: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Palette.neutral[700],
  },
  req: { color: Palette.semantic.danger600 },
  charLimit: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Palette.neutral[400] },

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
  simpleInput: {
    backgroundColor: Palette.neutral[100],
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[900],
  },
  selectBox: {
    backgroundColor: Palette.neutral[100],
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Palette.neutral[900] },

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
  genderText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Palette.neutral[600] },
  genderTextActive: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[700],
  },

  // Facility
  facilityGrid: { gap: 6 },
  facilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    backgroundColor: Palette.neutral[50],
  },
  facilityOptionActive: {
    borderColor: Palette.primary[300],
    backgroundColor: Palette.primary[50],
  },
  checkSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Palette.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSquareActive: {
    borderColor: Palette.primary[600],
    backgroundColor: Palette.primary[600],
  },
  facilityTextWrap: { flex: 1 },
  facilityLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[800],
  },
  facilitySub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Palette.neutral[500] },

  // Photos
  photoCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  photoCountBadge: {
    backgroundColor: Palette.primary[50],
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  photoCountText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Palette.primary[700],
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Palette.primary[300],
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.primary[50],
  },
  dropzoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Palette.primary[700],
  },
  dropzoneSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    textAlign: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoTile: { width: 90, height: 90, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    paddingHorizontal: 5,
  },
  photoTagPrimary: { backgroundColor: 'rgba(37,99,235,0.75)' },
  photoTagSecondary: { backgroundColor: 'rgba(0,0,0,0.45)' },
  photoTagText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  stickyFooter: {
    backgroundColor: Palette.neutral[0],
    borderTopWidth: 1,
    borderTopColor: Palette.neutral[200],
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  saveBtn: {
    flex: 1,
    backgroundColor: Palette.primary[600],
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelBtn: {
    backgroundColor: Palette.neutral[100],
    borderRadius: 14,
    paddingHorizontal: 20,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Palette.neutral[700],
  },
  pressed: { opacity: 0.78 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  modalOptionActive: { backgroundColor: Palette.primary[50] },
  modalOptionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[800],
  },
  modalOptionTextActive: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[700],
  },
});
