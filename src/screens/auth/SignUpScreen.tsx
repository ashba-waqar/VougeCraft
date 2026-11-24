import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontFamilies } from '../../theme';
import { GlassCard, PressableScale, FadeInUp, PaperGrain } from '../../components';
import { useStudioStore } from '../../store/useStudioStore';
import { supabase } from '../../services/supabase';
import { showToast } from '../../utils/toast';
import { triggerHaptic } from '../../utils/haptics';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const setOnboardingCompleted = useStudioStore(
    (state) => state.setOnboardingCompleted
  );

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isCheckEmailOpen, setIsCheckEmailOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const upsertProfile = async (userId: string, name: string) => {
    if (!userId || !name) return;
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            display_name: name,
          },
          { onConflict: 'id' }
        );
      if (profileError) {
        showToast(profileError.message || 'Could not update profile name');
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not update profile name');
    }

    try {
      const localProfile = {
        id: userId,
        displayName: name,
        roleTitle: 'Couture designer',
        avatarUrl: null,
        storagePath: null,
      };
      await AsyncStorage.setItem(
        '@voguecraft_user_profile_v1',
        JSON.stringify(localProfile)
      );
    } catch {}
  };

  const validate = (): boolean => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setIsAlreadyRegistered(false);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      isValid = false;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleResendEmail = async () => {
    if (isResending) return;
    triggerHaptic('medium');
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (error) {
        showToast(error.message || 'Could not resend email');
      } else {
        showToast('Confirmation email sent');
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not resend email');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignUp = async () => {
    triggerHaptic('light');
    if (!validate()) {
      triggerHaptic('medium');
      return;
    }

    const trimmedName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();

    setIsLoading(true);
    setGeneralError(null);
    setIsAlreadyRegistered(false);

    let isFinished = false;
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        setIsLoading(false);
        setGeneralError('Request timed out. Please try again.');
      }
    }, 20000);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: trimmedName,
          },
        },
      });

      // (1) Check if email is already registered
      const isRegistered =
        (data?.user?.identities && data.user.identities.length === 0) ||
        error?.message?.toLowerCase().includes('already registered') ||
        error?.message?.toLowerCase().includes('already in use');

      if (isRegistered) {
        setIsAlreadyRegistered(true);
        setGeneralError('This email is already registered');
        triggerHaptic('medium');
        return;
      }

      if (error) {
        setGeneralError(error.message);
        triggerHaptic('medium');
        return;
      }

      // (2) If session exists, upsert profile and let auth gate open tabs
      if (data?.session) {
        triggerHaptic('medium');
        await upsertProfile(data.session.user.id, trimmedName);
        setOnboardingCompleted(true);
        return;
      }

      // (3) If data.user exists but data.session is null, attempt immediate sign in
      if (data?.user && !data.session) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (signInError) {
          const isUnconfirmed =
            signInError.message?.toLowerCase().includes('email not confirmed') ||
            signInError.message?.toLowerCase().includes('not confirmed');

          if (isUnconfirmed) {
            setIsCheckEmailOpen(true);
            return;
          }

          setGeneralError(signInError.message);
          triggerHaptic('medium');
          return;
        }

        if (signInData?.session) {
          triggerHaptic('medium');
          await upsertProfile(signInData.session.user.id, trimmedName);
          setOnboardingCompleted(true);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Sign up error:', err);
      setGeneralError(
        err?.message || 'Unable to create account. Please verify connection.'
      );
      triggerHaptic('medium');
    } finally {
      isFinished = true;
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  if (isCheckEmailOpen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PaperGrain />
        <View style={styles.checkEmailContainer}>
          <PressableScale
            onPress={() => setIsCheckEmailOpen(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color="#3A0A16" strokeWidth={1.75} />
          </PressableScale>

          <FadeInUp index={0} style={styles.checkEmailCard}>
            <GlassCard
              borderRadius={18}
              shadowColor="#9B6B8E"
              style={styles.formGlassCard}
            >
              <View style={styles.checkEmailContent}>
                <View style={styles.mailIconCircle}>
                  <Mail size={32} color="#7F0020" strokeWidth={1.75} />
                </View>

                <Text style={styles.heading}>Check your email</Text>
                <Text style={styles.checkEmailSubheading}>
                  We sent a confirmation link to {email.trim().toLowerCase()}. Confirm your email to enter your digital atelier.
                </Text>

                <PressableScale
                  onPress={handleResendEmail}
                  disabled={isResending}
                  style={styles.submitButton}
                  accessibilityLabel="Resend email"
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={['#7F0020', '#A31538']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Resend email</Text>
                    )}
                  </LinearGradient>
                </PressableScale>

                <PressableScale
                  onPress={() =>
                    navigation.navigate('Login', {
                      email: email.trim().toLowerCase(),
                    } as any)
                  }
                  style={styles.switchButton}
                  accessibilityLabel="Go to log in"
                  accessibilityRole="button"
                >
                  <Text style={styles.switchText}>
                    Confirmed?{' '}
                    <Text style={styles.switchTextBold}>Log in</Text>
                  </Text>
                </PressableScale>
              </View>
            </GlassCard>
          </FadeInUp>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <PaperGrain />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header: Back Button & Serif Heading */}
          <FadeInUp index={0} style={styles.headerBlock}>
            <PressableScale
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <ArrowLeft size={22} color="#3A0A16" strokeWidth={1.75} />
            </PressableScale>

            <Text style={styles.heading}>Create Atelier Account</Text>
            <Text style={styles.subheading}>
              Join VogueCraft to craft and preserve your collections
            </Text>
          </FadeInUp>

          {/* Form Card: GlassCard with soft mauve shadow */}
          <GlassCard
            borderRadius={18}
            shadowColor="#9B6B8E"
            style={styles.formGlassCard}
          >
            <View style={styles.formContainer}>
              {/* Field 1: Designer Name */}
              <FadeInUp index={1} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Designer name</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'name' && styles.inputWrapperFocused,
                    !!nameError && styles.inputWrapperError,
                  ]}
                >
                  <User
                    size={18}
                    color={focusedField === 'name' ? '#7F0020' : '#8A8794'}
                    strokeWidth={1.75}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={displayName}
                    onChangeText={(val) => {
                      setDisplayName(val);
                      if (nameError) setNameError(null);
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Elena Rostova"
                    placeholderTextColor="#A8A29E"
                    autoCapitalize="words"
                    style={styles.textInput}
                  />
                </View>
                {nameError ? (
                  <Text style={styles.inlineErrorText}>{nameError}</Text>
                ) : null}
              </FadeInUp>

              {/* Field 2: Email */}
              <FadeInUp index={2} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email address</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'email' && styles.inputWrapperFocused,
                    !!emailError && styles.inputWrapperError,
                  ]}
                >
                  <Mail
                    size={18}
                    color={focusedField === 'email' ? '#7F0020' : '#8A8794'}
                    strokeWidth={1.75}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (emailError) setEmailError(null);
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="designer@voguecraft.atelier"
                    placeholderTextColor="#A8A29E"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.textInput}
                  />
                </View>
                {emailError ? (
                  <Text style={styles.inlineErrorText}>{emailError}</Text>
                ) : null}
              </FadeInUp>

              {/* Field 3: Password */}
              <FadeInUp index={3} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === 'password' && styles.inputWrapperFocused,
                    !!passwordError && styles.inputWrapperError,
                  ]}
                >
                  <Lock
                    size={18}
                    color={focusedField === 'password' ? '#7F0020' : '#8A8794'}
                    strokeWidth={1.75}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (passwordError) setPasswordError(null);
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Create a secure password"
                    placeholderTextColor="#A8A29E"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                  <PressableScale
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.eyeButton}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#8A8794" strokeWidth={1.75} />
                    ) : (
                      <Eye size={18} color="#8A8794" strokeWidth={1.75} />
                    )}
                  </PressableScale>
                </View>
                {passwordError ? (
                  <Text style={styles.inlineErrorText}>{passwordError}</Text>
                ) : null}
              </FadeInUp>

              {/* General Error or Already Registered */}
              {isAlreadyRegistered ? (
                <FadeInUp index={4} style={styles.alreadyRegisteredCard}>
                  <Text style={styles.alreadyRegisteredText}>
                    This email is already registered
                  </Text>
                  <PressableScale
                    onPress={() => {
                      triggerHaptic('medium');
                      navigation.navigate('Login', {
                        email: email.trim().toLowerCase(),
                      } as any);
                    }}
                    style={styles.alreadyRegisteredLoginBtn}
                    accessibilityLabel="Log in"
                    accessibilityRole="button"
                  >
                    <Text style={styles.alreadyRegisteredLoginText}>Log in</Text>
                  </PressableScale>
                </FadeInUp>
              ) : generalError ? (
                <FadeInUp index={4}>
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </FadeInUp>
              ) : null}

              {/* Submit Button */}
              <FadeInUp index={generalError ? 5 : 4} style={styles.submitBlock}>
                <PressableScale
                  onPress={handleSignUp}
                  disabled={isLoading}
                  style={styles.submitButton}
                  accessibilityLabel="Create account"
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={['#7F0020', '#A31538']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Create account</Text>
                    )}
                  </LinearGradient>
                </PressableScale>
              </FadeInUp>
            </View>
          </GlassCard>

          {/* Footer: Switch to Login */}
          <FadeInUp index={5} style={styles.footerBlock}>
            <PressableScale
              onPress={() => navigation.navigate('Login')}
              style={styles.switchButton}
              accessibilityLabel="Go to log in"
              accessibilityRole="button"
            >
              <Text style={styles.switchText}>
                Already have an account?{' '}
                <Text style={styles.switchTextBold}>Log in</Text>
              </Text>
            </PressableScale>
          </FadeInUp>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F4EE', // cream background
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerBlock: {
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(127, 0, 32, 0.12)',
    marginBottom: spacing.lg,
  },
  heading: {
    fontFamily: fontFamilies.titleBold,
    fontSize: 32,
    lineHeight: 38,
    color: '#3A0A16',
    letterSpacing: -0.4,
  },
  subheading: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 6,
  },
  formGlassCard: {
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: spacing.xl,
  },
  formContainer: {
    padding: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: '#3A0A16',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8D8D2',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: '#7F0020', // burgundy focus ring
  },
  inputWrapperError: {
    borderColor: '#BE123C',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: '#1A1A1F',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  inlineErrorText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: '#BE123C', // short inline error text in #BE123C
    marginTop: 4,
    marginLeft: 2,
  },
  generalErrorText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: '#BE123C', // short inline error text in #BE123C
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  submitBlock: {
    marginTop: spacing.sm,
  },
  submitButton: {
    width: '100%',
  },
  submitGradient: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerBlock: {
    alignItems: 'center',
    gap: spacing.md,
  },
  switchButton: {
    paddingVertical: 6,
  },
  switchText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  switchTextBold: {
    fontFamily: fontFamilies.bodySemiBold,
    color: '#7F0020',
  },
  alreadyRegisteredCard: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(127, 0, 32, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(127, 0, 32, 0.2)',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  alreadyRegisteredText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    color: '#7F0020',
    textAlign: 'center',
  },
  alreadyRegisteredLoginBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    backgroundColor: '#7F0020',
  },
  alreadyRegisteredLoginText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  checkEmailContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    justifyContent: 'center',
  },
  checkEmailCard: {
    width: '100%',
  },
  checkEmailContent: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  mailIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(127, 0, 32, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  checkEmailSubheading: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});