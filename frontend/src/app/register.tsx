import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ToastBanner } from '@/components/ui/confirm-dialog';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { StackHeader } from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { UserRole } from '@/types/kostly';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useApp();

  const [role, setRole] = useState<UserRole>('TENANT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const strength = useMemo(() => {
    if (!password) return { level: 0, label: 'Min. 8 karakter', color: Palette.neutral[500] };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;
    if (score <= 1) return { level: 1, label: 'Lemah', color: Palette.semantic.danger600 };
    if (score === 2) return { level: 2, label: 'Sedang', color: Palette.semantic.warning600 };
    return { level: 3, label: 'Kuat', color: Palette.semantic.success600 };
  }, [password]);

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleRegister = () => {
    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg('Setujui Syarat & Ketentuan serta Kebijakan Privasi Kostly terlebih dahulu.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    setTimeout(() => {
      register({ fullName: fullName.trim(), email: email.trim(), role });
      setSubmitting(false);
      setToastMsg('Akun berhasil didaftarkan! Mengarahkan ke Kostly...');
      setTimeout(() => {
        router.replace('/index');
      }, 500);
    }, 600);
  };

  return (
    <View style={styles.screen}>
      <StackHeader showBrandLogo />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ResponsiveContainer maxWidth={520}>
            <View style={styles.headingBlock}>
              <Text style={styles.title}>Daftar Akun Baru</Text>
              <Text style={styles.subtitle}>
                Pilih peran Anda untuk memulai pengalaman terbaik di Kostly
              </Text>
            </View>

            {/* Role Selector Cards */}
            <Text style={styles.roleHeading}>PILIH PERAN ANDA</Text>
            <View style={styles.roleGrid}>
              <Pressable
                onPress={() => setRole('TENANT')}
                style={[styles.roleCard, role === 'TENANT' && styles.roleCardActive]}>
                {role === 'TENANT' && (
                  <View style={styles.roleCheck}>
                    <MaterialIcons name="check" size={13} color="#FFFFFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.roleIconBox,
                    role === 'TENANT' && styles.roleIconBoxActive,
                  ]}>
                  <MaterialIcons
                    name="person-search"
                    size={20}
                    color={role === 'TENANT' ? Palette.primary[700] : Palette.neutral[600]}
                  />
                </View>
                <Text style={styles.roleTitle}>Pencari Kost</Text>
                <Text style={styles.roleDesc}>Cari & sewa kamar impian</Text>
              </Pressable>

              <Pressable
                onPress={() => setRole('OWNER')}
                style={[styles.roleCard, role === 'OWNER' && styles.roleCardActive]}>
                {role === 'OWNER' && (
                  <View style={styles.roleCheck}>
                    <MaterialIcons name="check" size={13} color="#FFFFFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.roleIconBox,
                    role === 'OWNER' && styles.roleIconBoxActive,
                  ]}>
                  <MaterialIcons
                    name="home-work"
                    size={20}
                    color={role === 'OWNER' ? Palette.primary[700] : Palette.neutral[600]}
                  />
                </View>
                <Text style={styles.roleTitle}>Pemilik Kost</Text>
                <Text style={styles.roleDesc}>Kelola unit, kamar & penyewa</Text>
              </Pressable>
            </View>

            {/* Registration Form Card */}
            <View style={styles.formCard}>
              {/* Nama Lengkap */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>NAMA LENGKAP</Text>
                  <Text style={styles.fieldHint}>Wajib</Text>
                </View>
                <View style={styles.inputBox}>
                  <MaterialIcons name="person-outline" size={20} color={Palette.neutral[400]} />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Contoh: Budi Santoso"
                    placeholderTextColor={Palette.neutral[400]}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>ALAMAT EMAIL</Text>
                  <Text style={styles.fieldHint}>Valid</Text>
                </View>
                <View style={styles.inputBox}>
                  <MaterialIcons name="mail-outline" size={20} color={Palette.neutral[400]} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nama@email.com"
                    placeholderTextColor={Palette.neutral[400]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password + Strength Meter */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>KATA SANDI</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="lock-outline" size={20} color={Palette.neutral[400]} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Buat kata sandi minimal 8 karakter"
                    placeholderTextColor={Palette.neutral[400]}
                    secureTextEntry={!showPwd}
                    style={styles.input}
                  />
                  <Pressable onPress={() => setShowPwd((v) => !v)} hitSlop={8}>
                    <MaterialIcons
                      name={showPwd ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={Palette.neutral[400]}
                    />
                  </Pressable>
                </View>

                <View style={styles.meterRow}>
                  <View style={styles.meterBars}>
                    {[1, 2, 3].map((bar) => {
                      const filled = strength.level >= bar;
                      const barColor =
                        strength.level === 1
                          ? Palette.semantic.danger600
                          : strength.level === 2
                            ? Palette.semantic.warning600
                            : Palette.semantic.success600;
                      return (
                        <View
                          key={bar}
                          style={[
                            styles.meterBar,
                            {
                              backgroundColor: filled ? barColor : Palette.neutral[200],
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                  <Text style={[styles.meterLabel, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>KONFIRMASI KATA SANDI</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="lock-reset" size={20} color={Palette.neutral[400]} />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Ulangi kata sandi"
                    placeholderTextColor={Palette.neutral[400]}
                    secureTextEntry={!showConfirm}
                    style={styles.input}
                  />
                  <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                    <MaterialIcons
                      name={showConfirm ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={Palette.neutral[400]}
                    />
                  </Pressable>
                </View>

                {passwordsMatch && (
                  <View style={styles.matchRow}>
                    <MaterialIcons
                      name="check-circle"
                      size={14}
                      color={Palette.semantic.success600}
                    />
                    <Text style={styles.matchText}>Kata sandi cocok</Text>
                  </View>
                )}
                {passwordsMismatch && (
                  <View style={styles.matchRow}>
                    <MaterialIcons
                      name="cancel"
                      size={14}
                      color={Palette.semantic.danger600}
                    />
                    <Text style={styles.mismatchText}>Kata sandi belum cocok</Text>
                  </View>
                )}
              </View>

              {/* Terms Checkbox */}
              <Pressable
                onPress={() => setAcceptedTerms((v) => !v)}
                style={styles.termsRow}>
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.termsText}>
                  Saya menyetujui{' '}
                  <Text style={styles.termsLink}>Syarat & Ketentuan</Text> serta{' '}
                  <Text style={styles.termsLink}>Kebijakan Privasi</Text> Kostly.
                </Text>
              </Pressable>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={16} color={Palette.semantic.danger600} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <Pressable
                disabled={submitting}
                onPress={handleRegister}
                style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Daftar Sekarang</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>Sudah punya akun? </Text>
                <Pressable onPress={() => router.replace('/login')}>
                  <Text style={styles.loginLink}>Masuk di sini</Text>
                </Pressable>
              </View>
            </View>

            {/* Security Guarantee Card */}
            <View style={styles.securityCard}>
              <View style={styles.securityIconBox}>
                <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.securityTextWrap}>
                <Text style={styles.securityTitle}>Privasi & Keamanan Terjamin</Text>
                <Text style={styles.securityDesc}>
                  Data Anda dilindungi enkripsi 256-bit & verifikasi identitas resmi untuk kenyamanan transaksi sewa.
                </Text>
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>

      <ToastBanner visible={!!toastMsg} message={toastMsg ?? ''} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.neutral[50],
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  headingBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
    marginTop: 4,
  },
  roleHeading: {
    fontSize: 12,
    letterSpacing: 0.6,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[700],
    marginBottom: 10,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  roleCard: {
    flex: 1,
    backgroundColor: Palette.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 14,
    position: 'relative',
  },
  roleCardActive: {
    backgroundColor: Palette.primary[50],
    borderWidth: 2,
    borderColor: Palette.primary[600],
  },
  roleCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 9999,
    backgroundColor: Palette.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  roleIconBoxActive: {
    backgroundColor: Palette.primary[100],
  },
  roleTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[900],
  },
  roleDesc: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
    marginTop: 3,
  },
  formCard: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    padding: 18,
    gap: 16,
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
    fontSize: 12,
    letterSpacing: 0.6,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[800],
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[400],
  },
  inputBox: {
    height: 48,
    backgroundColor: Palette.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[900],
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  meterBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  meterBar: {
    flex: 1,
    height: 5,
    borderRadius: 9999,
  },
  meterLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  matchText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Palette.semantic.success600,
  },
  mismatchText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Palette.semantic.danger600,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Palette.neutral[300],
    backgroundColor: Palette.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Palette.primary[600],
    borderColor: Palette.primary[600],
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  termsLink: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.semantic.danger50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Palette.semantic.danger600,
    flex: 1,
  },
  submitBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Palette.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  loginPromptText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  securityCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Palette.primary[50],
    borderWidth: 1,
    borderColor: Palette.primary[100],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  securityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTextWrap: {
    flex: 1,
    gap: 3,
  },
  securityTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[900],
  },
  securityDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  pressed: {
    opacity: 0.85,
  },
});
