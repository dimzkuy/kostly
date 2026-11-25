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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { ToastBanner } from '@/components/ui/confirm-dialog';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { StackHeader } from '@/components/ui/screen-header';
import { Palette } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }
    setErrorMsg(null);
    setStatus('loading');
    setTimeout(() => {
      setStatus('sent');
      setToastMsg(`Tautan pemulihan telah dikirim ke ${email.trim()}.`);
      setTimeout(() => setToastMsg(null), 3000);
    }, 800);
  };

  return (
    <View style={styles.screen}>
      <StackHeader title="Lupa Kata Sandi" />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ResponsiveContainer maxWidth={480}>
            {/* Hero Illustration */}
            <View style={styles.heroBlock}>
              <View style={styles.heroCircle}>
                <MaterialIcons name="enhanced-encryption" size={40} color={Palette.primary[600]} />
                <View style={styles.keyBadge}>
                  <MaterialIcons name="vpn-key" size={15} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.title}>Lupa Kata Sandi?</Text>
              <Text style={styles.subtitle}>
                Masukkan alamat email yang terdaftar di akun Kostly Anda. Kami akan mengirimkan tautan pemulihan kata sandi yang aman.
              </Text>
            </View>

            {/* Email Input Section */}
            <View style={styles.formSection}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Alamat Email</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="mail-outline" size={20} color={Palette.neutral[400]} />
                  <TextInput
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      if (status === 'sent') setStatus('idle');
                    }}
                    placeholder="contoh@email.com"
                    placeholderTextColor={Palette.neutral[400]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
                <View style={styles.helperRow}>
                  <MaterialIcons name="info-outline" size={15} color={Palette.neutral[400]} />
                  <Text style={styles.helperText}>
                    Pastikan alamat email Anda aktif untuk menerima tautan reset kata sandi.
                  </Text>
                </View>
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={16} color={Palette.semantic.danger600} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <Pressable
                disabled={status === 'loading'}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitBtn,
                  status === 'sent' && styles.submitBtnSent,
                  pressed && styles.pressed,
                ]}>
                {status === 'loading' ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitText}>Memproses Permintaan...</Text>
                  </>
                ) : status === 'sent' ? (
                  <>
                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    <Text style={styles.submitText}>Terkirim!</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.submitText}>Kirim Tautan Reset</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              <View style={styles.backPrompt}>
                <Text style={styles.backPromptText}>Ingat kata sandi Anda? </Text>
                <Pressable onPress={() => router.replace('/login')}>
                  <Text style={styles.backLink}>Kembali ke Masuk</Text>
                </Pressable>
              </View>
            </View>

            {/* Support Banner */}
            <View style={styles.supportCard}>
              <View style={styles.supportTop}>
                <View style={styles.supportIcon}>
                  <MaterialIcons name="support-agent" size={20} color={Palette.primary[600]} />
                </View>
                <View style={styles.supportTextWrap}>
                  <Text style={styles.supportTitle}>Butuh bantuan lebih lanjut?</Text>
                  <Text style={styles.supportDesc}>
                    Hubungi Tim Dukungan Kostly via email Customer Service resmi kami yang siap siaga 24/7.
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  setToastMsg('Email Customer Care resmi: support@kostly.id');
                  setTimeout(() => setToastMsg(null), 2600);
                }}
                style={({ pressed }) => [styles.supportBtn, pressed && styles.pressed]}>
                <MaterialIcons name="mail" size={18} color={Palette.primary[600]} />
                <Text style={styles.supportBtnText}>Hubungi Dukungan Email</Text>
              </Pressable>
            </View>

            {/* Security Micro-Badge */}
            <View style={styles.microBadge}>
              <MaterialIcons name="verified-user" size={16} color={Palette.neutral[400]} />
              <Text style={styles.microText}>
                Proses enkripsi data terproteksi end-to-end
              </Text>
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
    paddingTop: 26,
    paddingBottom: 36,
  },
  heroBlock: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    marginBottom: 24,
  },
  heroCircle: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: Palette.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  keyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: Palette.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Manrope_700Bold',
    fontWeight: '700',
    color: Palette.neutral[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
    textAlign: 'center',
    maxWidth: 340,
  },
  formSection: {
    gap: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
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
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
  },
  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
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
  submitBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: Palette.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnSent: {
    backgroundColor: Palette.semantic.success600,
  },
  submitText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPromptText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  backLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.primary[600],
  },
  supportCard: {
    marginTop: 26,
    backgroundColor: Palette.neutral[100],
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  supportTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  supportIcon: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: Palette.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextWrap: {
    flex: 1,
    gap: 3,
  },
  supportTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[800],
  },
  supportDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[600],
  },
  supportBtn: {
    backgroundColor: Palette.neutral[0],
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  supportBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Palette.neutral[700],
  },
  microBadge: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  microText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Palette.neutral[400],
  },
  pressed: {
    opacity: 0.85,
  },
});
