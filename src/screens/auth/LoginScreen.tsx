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
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontFamilies } from '../../theme';
import { GlassCard, PressableScale, FadeInUp, PaperGrain } from '../../components';
import { useStudioStore } from '../../store/useStudioStore';
import { supabase } from '../../services/supabase';
import { triggerHaptic } from '../../utils/haptics';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const setOnboardingCompleted = useStudioStore(
    (state) => state.setOnboardingCompleted
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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

  const handleLogin = async () => {
    triggerHaptic('light');
    if (!validate()) {
      triggerHaptic('medium');
      return;
    }

    setIsLoading(true);
    setGeneralError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setGeneralError(error.message);
        triggerHaptic('medium');
      } else if (data.session) {
        triggerHaptic('medium');
        setOnboardingCompleted(true);
      }
    } catch (err: any) {
      // Graceful fallback for offline / unconfigured Supabase environment
      console.warn('Login error:', err);
      setGeneralError(err?.message || 'Unable to sign in. Please verify your connection.');
      triggerHaptic('medium');
    } finally {
      setIsLoading(false);
    }
  };

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

            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subheading}>
              Sign in to access your digital couture studio
            </Text>
          </FadeInUp>

          {/* Form Card: GlassCard with soft mauve shadow */}
          <GlassCard
            borderRadius={18}
            shadowColor="#9B6B8E"
            style={styles.formGlassCard}
          >
            <View style={styles.formContainer}>
              {/* Field 1: Email */}
              <FadeInUp index={1} style={styles.inputGroup}>
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

              {/* Field 2: Password */}
              <FadeInUp index={2} style={styles.inputGroup}>
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
                    placeholder="Enter password"
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

              {/* General Supabase / Network Error */}
              {generalError ? (
                <FadeInUp index={3}>
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </FadeInUp>
              ) : null}

              {/* Submit Button */}
              <FadeInUp index={generalError ? 4 : 3} style={styles.submitBlock}>
                <PressableScale
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={styles.submitButton}
                  accessibilityLabel="Log in"
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
                      <Text style={styles.submitButtonText}>Log in</Text>
                    )}
                  </LinearGradient>
                </PressableScale>
              </FadeInUp>
            </View>
          </GlassCard>

          {/* Footer Navigation: Switch to Sign Up */}
          <FadeInUp index={4} style={styles.footerBlock}>
            <PressableScale
              onPress={() => navigation.navigate('SignUp')}
              style={styles.switchButton}
              accessibilityLabel="Go to sign up"
              accessibilityRole="button"
            >
              <Text style={styles.switchText}>
                New to VogueCraft?{' '}
                <Text style={styles.switchTextBold}>Sign up</Text>
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
});