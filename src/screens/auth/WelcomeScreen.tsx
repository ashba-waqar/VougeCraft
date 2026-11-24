import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing, fontFamilies } from '../../theme';
import { PressableScale, PaperGrain, FadeInUp } from '../../components';
import { useStudioStore } from '../../store/useStudioStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { supabase } from '../../services/supabase';
import { showToast } from '../../utils/toast';
import { triggerHaptic } from '../../utils/haptics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const setOnboardingCompleted = useStudioStore(
    (state) => state.setOnboardingCompleted
  );
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleLogIn = () => {
    navigation.navigate('Login');
  };

  const handleGuestSignIn = async () => {
    if (isGuestLoading) return;
    setIsGuestLoading(true);
    triggerHaptic('medium');

    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error || !data.session) {
        showToast(error?.message || 'Could not sign in as guest');
        setIsGuestLoading(false);
        return;
      }

      showToast('Guest session started.');
      setOnboardingCompleted(true);
    } catch {
      showToast('Could not sign in as guest');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PaperGrain />

      <View style={styles.container}>
        {/* Top brand header */}
        <FadeInUp index={0} style={styles.header}>
          <Text style={styles.title}>VogueCraft</Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.tagline}
          >
            Haute couture atelier in your hands
          </Text>
        </FadeInUp>

        {/* Center illustration: Simple line illustration of a dress on a hanger */}
        <FadeInUp index={1} style={styles.illustrationWrapper}>
          <View style={styles.illustrationCanvas}>
            <Svg width={200} height={250} viewBox="0 0 200 250" fill="none">
              {/* Subtle croquis vertical balance guide */}
              <Line
                x1={100}
                y1={24}
                x2={100}
                y2={242}
                stroke="rgba(127, 0, 32, 0.12)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />

              {/* Hanger Hook */}
              <Path
                d="M100 62 C100 50 114 46 114 36 C114 26 105 22 97 25 C92 27 89 32 90 37"
                stroke="#7F0020"
                strokeWidth={2}
                strokeLinecap="round"
              />

              {/* Hanger Wire Triangle */}
              <Path
                d="M48 82 L100 62 L152 82 C154 83 152 86 150 86 L50 86 C48 86 46 83 48 82 Z"
                stroke="#7F0020"
                strokeWidth={1.75}
                strokeLinejoin="round"
                fill="rgba(127, 0, 32, 0.04)"
              />

              {/* Dress Shoulder Straps hanging from wire */}
              <Path
                d="M72 86 L68 106"
                stroke="#7F0020"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Path
                d="M128 86 L132 106"
                stroke="#7F0020"
                strokeWidth={1.5}
                strokeLinecap="round"
              />

              {/* Dress Sweetheart Neckline */}
              <Path
                d="M68 106 C82 114 92 114 100 110 C108 114 118 114 132 106"
                stroke="#7F0020"
                strokeWidth={1.75}
                strokeLinecap="round"
              />

              {/* Fitted Bodice Contours & Waist */}
              <Path
                d="M68 106 C64 124 70 138 76 152 C84 155 116 155 124 152 C130 138 136 124 132 106"
                stroke="#7F0020"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="rgba(243, 230, 232, 0.35)"
              />

              {/* Princess Seams on Bodice */}
              <Path
                d="M86 116 L84 153"
                stroke="#7F0020"
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.7}
              />
              <Path
                d="M114 116 L116 153"
                stroke="#7F0020"
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.7}
              />

              {/* Flowing Couture Skirt */}
              <Path
                d="M76 152 C68 174 54 208 42 232 C58 240 72 230 86 237 C100 242 114 231 128 237 C142 241 156 230 158 232 C146 208 132 174 124 152 Z"
                stroke="#7F0020"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="rgba(243, 230, 232, 0.45)"
              />

              {/* Skirt Draped Pleat Lines */}
              <Path
                d="M80 154 C78 184 72 210 68 234"
                stroke="#7F0020"
                strokeWidth={1.2}
                opacity={0.75}
                strokeLinecap="round"
              />
              <Path
                d="M100 154 C100 186 102 214 104 239"
                stroke="#7F0020"
                strokeWidth={1.2}
                opacity={0.75}
                strokeLinecap="round"
              />
              <Path
                d="M120 154 C122 184 128 210 132 234"
                stroke="#7F0020"
                strokeWidth={1.2}
                opacity={0.75}
                strokeLinecap="round"
              />

              {/* Atelier Accent Gold Ribbon Tie at Waist */}
              <Path
                d="M96 152 C94 162 90 172 88 178"
                stroke="#C9A24B"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Path
                d="M104 152 C106 162 110 172 112 178"
                stroke="#C9A24B"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Circle
                cx={100}
                cy={152}
                r={3}
                fill="#C9A24B"
              />
            </Svg>
          </View>
        </FadeInUp>

        {/* Bottom Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Burgundy gradient "Sign up" button */}
          <FadeInUp index={2}>
            <PressableScale
              onPress={handleSignUp}
              style={styles.buttonWrapper}
              accessibilityLabel="Sign up"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={['#7F0020', '#A31538']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryButtonText}>Sign up</Text>
              </LinearGradient>
            </PressableScale>
          </FadeInUp>

          {/* Outline "Log in" button */}
          <FadeInUp index={3}>
            <PressableScale
              onPress={handleLogIn}
              style={styles.outlineButton}
              accessibilityLabel="Log in"
              accessibilityRole="button"
            >
              <Text style={styles.outlineButtonText}>Log in</Text>
            </PressableScale>
          </FadeInUp>

          {/* Continue as guest text button */}
          <FadeInUp index={4}>
            <PressableScale
              onPress={handleGuestSignIn}
              style={styles.guestLinkButton}
              accessibilityLabel="Continue as guest"
              accessibilityRole="button"
              disabled={isGuestLoading}
            >
              {isGuestLoading ? (
                <ActivityIndicator size="small" color="#7F0020" />
              ) : (
                <Text style={styles.guestLinkText}>Continue as guest</Text>
              )}
            </PressableScale>
          </FadeInUp>

          {/* Legal links */}
          <FadeInUp index={5} style={styles.legalLinksRow}>
            <PressableScale
              onPress={() => navigation.navigate('Privacy')}
              accessibilityLabel="Privacy policy"
              accessibilityRole="link"
            >
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
            </PressableScale>
            <Text style={styles.legalDot}>•</Text>
            <PressableScale
              onPress={() => navigation.navigate('Terms')}
              accessibilityLabel="Terms of service"
              accessibilityRole="link"
            >
              <Text style={styles.legalLinkText}>Terms of Service</Text>
            </PressableScale>
          </FadeInUp>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F4EE', // cream background
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.titleBold,
    fontSize: 40,
    lineHeight: 46,
    color: '#3A0A16',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.2,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  illustrationCanvas: {
    width: 200,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  buttonWrapper: {
    width: '100%',
  },
  primaryGradient: {
    height: 52,
    borderRadius: radius.cards,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  outlineButton: {
    height: 52,
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: '#7F0020',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    color: '#7F0020',
    letterSpacing: 0.3,
  },
  guestLinkButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  guestLinkText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 8,
  },
  legalLinkText: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 10,
    color: colors.textMuted,
  },
});