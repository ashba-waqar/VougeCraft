import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme, spacing, typography, radius } from '../../theme';
import { IconButton, PaperGrain, Card } from '../../components';

export const PrivacyScreen: React.FC = () => {
  const colors = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={['top', 'left', 'right']}>
      <PaperGrain />

      {/* Top Header */}
      <View style={styles.header}>
        <IconButton
          icon={<ArrowLeft size={20} color={colors.ink} strokeWidth={1.75} />}
          onPress={() => navigation.goBack()}
          variant="ghost"
          size={36}
          shape="circle"
          accessibilityLabel="Back"
        />
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={[styles.contentCard, { backgroundColor: colors.paperCard }]}>
          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            Information We Store
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            VogueCraft stores your account credentials (email address), designer profile details (display name and role title), custom fashion sketches, vector stroke layers, technical specification sheets, color palettes, and photos uploaded to your moodboards or atelier profile.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            Third-Party AI Processing
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Our AI Studio features (including Palette Harmonizer, Design Assistant, and Motif Generator) process your prompts and style queries using trusted third-party artificial intelligence providers, specifically Groq and NVIDIA Cloud APIs. Prompts sent to these services are processed solely to generate the requested design output.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            Storage & Security
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            All sketches, thumbnails, exported lookbooks, and moodboard media are secured in isolated cloud storage containers guarded by row-level security policies. Your work is private to your authenticated atelier session.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            Account & Data Deletion
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            You hold complete ownership of your work. You can permanently delete your account, sketches, boards, palettes, and all uploaded media at any time through the Profile settings screen. Deletion immediately and irrevocably removes all data from our active databases and cloud storage.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  contentCard: {
    padding: spacing.xl,
    borderRadius: radius.cards,
  },
  sectionHeading: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
  },
});
