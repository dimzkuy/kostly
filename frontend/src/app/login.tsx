import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';

import { AppIcon } from '@/components/ui/app-icon';
import { ToastBanner } from '@/components/ui/confirm-dialog';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { StackHeader } from '@/components/ui/screen-header';
import { ROUTES } from '@/constants/routes';
import { Palette } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { UserRole } from '@/types/kostly';

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, login } = useApp();

  const [role, setRole] = useState<UserRole>('TENANT');
  const [email, setEmail] = useState('dimas.aditya@email.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    setTimeout(() => {
      login({ email: email.trim(), role });
      setSubmitting(false);
      setToastMsg(
        `Berhasil masuk sebagai ${role === 'TENANT' ? 'Pencari Kost' : 'Pemilik Kost'}!`
      );
      setTimeout(() => {
        router.replace(ROUTES.home);
      }, 450);
    }, 600);
  };

  return (
    <View style={styles.screen}>
      <StackHeader showBrandLogo hideBack={!isAuthenticated} />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ResponsiveContainer maxWidth={480}>
            <View style={styles.headingBlock}>
              <Text style={styles.title}>Masuk ke Kostly</Text>
              <Text style={styles.subtitle}>
                Kelola properti atau temukan kost impian Anda dengan mudah
              </Text>
            </View>

            {/* Role Segmented Control */}
            <View style={styles.segmentedWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: role === 'TENANT' }}
                onPress={() => setRole('TENANT')}
                style={[styles.segmentBtn, role === 'TENANT' && styles.segmentBtnActive]}>
                <AppIcon
                  name="search"
                  size={18}
                  color={role === 'TENANT' ? Palette.primary[600] : Palette.neutral[600]}
                />
                <Text
                  style={[
                    styles.segmentText,
                    role === 'TENANT' && styles.segmentTextActive,
                  ]}>
                  Pencari Kost
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: role === 'OWNER' }}
                onPress={() => setRole('OWNER')}
                style={[styles.segmentBtn, role === 'OWNER' && styles.segmentBtnActive]}>
                <AppIcon
                  name="business-outline"
                  size={18}
                  color={role === 'OWNER' ? Palette.primary[600] : Palette.neutral[600]}
                />
                <Text
                  style={[
                    styles.segmentText,
                    role === 'OWNER' && styles.segmentTextActive,
                  ]}>
                  Pemilik Kost
                </Text>
              </Pressable>
            </View>

            {/* Role Context Hint */}
            <View style={styles.hintBanner}>
              <AppIcon name="info" size={18} color={Palette.primary[600]} />
              <Text style={styles.hintText}>
                {role === 'TENANT'
                  ? 'Akses favorit tersimpan, pengajuan sewa, dan tagihan kos.'
                  : 'Kelola kamar, monitor okupansi, dan pantau pembayaran sewa.'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ALAMAT EMAIL</Text>
                <View style={styles.inputBox}>
                  <AppIcon name="mail-outline" size={20} color={Palette.neutral[400]} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nama@email.com"
                    placeholderTextColor={Palette.neutral[400]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>KATA SANDI</Text>
                <View style={styles.inputBox}>
                  <AppIcon name="lock-outline" size={20} color={Palette.neutral[400]} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Masukkan kata sandi"
                    placeholderTextColor={Palette.neutral[400]}
                    secureTextEntry={!showPassword}
                    style={styles.input}
                  />
                  <Pressable
                    accessibilityLabel="Tampilkan atau sembunyikan kata sandi"
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}>
                    <AppIcon
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={Palette.neutral[400]}
                    />
                  </Pressable>
                </View>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <AppIcon name="error-outline" size={16} color={Palette.semantic.danger600} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <View style={styles.rememberRow}>
                <Pressable
                  onPress={() => setRememberMe((v) => !v)}
                  style={styles.checkboxRow}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <AppIcon name="check" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.rememberText}>Ingat saya</Text>
                </Pressable>

                <Pressable onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotLink}>Lupa Kata Sandi?</Text>
                </Pressable>
              </View>

              <Pressable
                disabled={submitting}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitBtn,
                  submitting && styles.submitDisabled,
                  pressed && styles.pressed,
                ]}>
                {submitting ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitText}>Memverifikasi akun...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitText}>Masuk Sekarang</Text>
                )}
              </Pressable>
            </View>

            {/* Register Link */}
            <View style={styles.registerPrompt}>
              <Text style={styles.registerText}>Belum punya akun? </Text>
              <Pressable
                onPress={() => router.push('/register')}
                style={styles.registerLinkRow}>
                <Text style={styles.registerLink}>Daftar Sekarang</Text>
                <AppIcon name="chevron-right" size={16} color={Palette.primary[600]} />
              </Pressable>
            </View>

            {/* Trust Card */}
            <View style={styles.trustCard}>
              <View style={styles.trustIconBox}>
                <AppIcon name="verified-user" size={20} color={Palette.primary[600]} />
              </View>
              <View style={styles.trustTextWrap}>
                <Text style={styles.trustTitle}>Privasi & Keamanan Terjamin</Text>
                <Text style={styles.trustDesc}>
                  Data Anda dilindungi enkripsi 256-bit standar industri.
                </Text>
              </View>
            </View>

            <Text style={styles.legalText}>
              Dengan masuk, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi Kostly.
            </Text>
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
    paddingTop: 22,
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
  segmentedWrap: {
    flexDirection: 'row',
    backgroundColor: Palette.neutral[100],
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: Palette.neutral[0],
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Palette.neutral[600],
  },
  segmentTextActive: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  hintBanner: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Palette.primary[50],
    borderWidth: 1,
    borderColor: Palette.primary[100],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[700],
  },
  form: {
    marginTop: 22,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[700],
  },
  inputBox: {
    height: 50,
    backgroundColor: Palette.neutral[0],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    paddingHorizontal: 14,
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
  passwordHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Palette.neutral[300],
    backgroundColor: Palette.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Palette.primary[600],
    borderColor: Palette.primary[600],
  },
  rememberText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[700],
  },
  forgotLink: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  submitBtn: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: Palette.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.75,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerPrompt: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  registerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Palette.primary[600],
  },
  trustCard: {
    marginTop: 22,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Palette.neutral[100],
    borderWidth: 1,
    borderColor: Palette.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextWrap: {
    flex: 1,
    gap: 2,
  },
  trustTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[800],
  },
  trustDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[500],
  },
  legalText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[400],
  },
  pressed: {
    opacity: 0.85,
  },
});
