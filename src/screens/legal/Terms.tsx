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

export const TermsScreen: React.FC = () => {
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
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={[styles.contentCard, { backgroundColor: colors.paperCard }]}>
          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            Atelier Usage
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            VogueCraft provides digital drafting, technical specification, and haute couture fashion design tools. By accessing or using the platform, you agree to comply with professional standards and these terms of service.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            Intellectual Property & Ownership
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            You retain exclusive intellectual property rights and full ownership over all sketches, garment flats, moodboards, custom palettes, and technical specifications you create within VogueCraft.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            AI Features & Disclaimers
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Artificial intelligence features are provided as creative drafting aids. Prompts are transmitted to external providers (Groq and NVIDIA Cloud APIs) for synthesis. Technical measurements and pattern estimations should always be verified prior to garment manufacturing.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.lineSubtle }]} />

          <Text style={[styles.sectionHeading, { color: colors.ink }]}>
            Account Termination
          </Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            You may terminate your atelier account at any time using the Delete Account option in Profile settings. Upon termination, all stored designs and files are permanently purged.
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
