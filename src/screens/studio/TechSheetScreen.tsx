import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line } from 'react-native-svg';
import {
  ArrowLeft,
  Share2,
  FileDown,
  Printer,
  Check,
  Scissors,
  Layers,
} from 'lucide-react-native';
import { useTheme, radius, spacing, typography, shadows } from '../../theme';
import { IconButton, Button, Card } from '../../components';
import { useCanvasStore } from '../../store/canvasStore';
import { ExportEngine } from '../../canvas/engine/export';
import { exportService } from '../../services/exportService';
import { GARMENT_TEMPLATES } from '../../data';
import { triggerHaptic } from '../../utils/haptics';
import { useTechPack } from '../../hooks/useTechPack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MeasurementItem {
  id: string;
  label: string; // 1 to 2 words
  value: string;
}

interface TechSheetScreenProps {
  navigation: any;
  route: any;
}

export const TechSheetScreen: React.FC<TechSheetScreenProps> = ({
  navigation,
  route,
}) => {
  const colors = useTheme();
  const sketch = useCanvasStore((state) => state.sketch);
  const sketchId = route?.params?.sketchId || sketch?.id || 'sketch_atelier_seed';

  const {
    unit,
    measurements,
    fabrics,
    notes: atelierNotes,
    toggleUnit,
    updateMeasurement,
    updateFabricNotes,
    updateStitchNotes,
    updateEmbroideryNotes,
    updateNotes: setAtelierNotes,
  } = useTechPack(sketchId);

  const fabricNotes = fabrics.fabricNotes;
  const stitchNotes = fabrics.stitchNotes;
  const embroideryNotes = fabrics.embroideryNotes;

  const handleUpdateMeasurement = (id: string, text: string) => {
    updateMeasurement(id, text);
  };

  const frontPath = GARMENT_TEMPLATES[6].strokePath; // Kurta front
  const backPath = GARMENT_TEMPLATES[6].strokePath; // Kurta back

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    triggerHaptic('medium');
    setIsExporting(true);
    try {
      await exportService.exportTechPackPdf({
        sketch,
        measurements,
        unit,
        fabricNotes,
        stitchNotes,
        embroideryNotes,
        notes: atelierNotes,
      });
    } catch (err) {
      console.warn('PDF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    triggerHaptic('medium');
    setIsExporting(true);
    try {
      const snap = await exportService.generatePng(sketch, {
        transparent: false,
        scale: 2,
      });
      await exportService.shareFile(snap.uri, 'image/png');
    } catch (err) {
      console.warn('Image export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    return handleExportPdf();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={['top', 'left', 'right']}>
      {/* Top Bar */}
      <View style={[styles.header, { backgroundColor: colors.paperCard, borderBottomColor: colors.lineSubtle }]}>
        <IconButton
          icon={<ArrowLeft size={20} color={colors.ink} strokeWidth={1.75} />}
          onPress={() => navigation.goBack()}
          variant="ghost"
          size={36}
          accessibilityLabel="Back"
        />

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>Tech sheet</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {sketch.title}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <IconButton
            icon={<Printer size={18} color={colors.ink} strokeWidth={1.75} />}
            onPress={handleExportPdf}
            variant="ghost"
            size={36}
            accessibilityLabel="Print PDF"
          />
          <IconButton
            icon={<Share2 size={18} color={colors.ink} strokeWidth={1.75} />}
            onPress={handleShare}
            variant="ghost"
            size={36}
            accessibilityLabel="Share"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Flat Views: Front and Back */}
        <Card variant="elevated" style={[styles.sectionCard, { backgroundColor: colors.paperCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Technical flats</Text>

          <View style={styles.flatsRow}>
            {/* Front View */}
            <View style={styles.flatCol}>
              <Text style={[styles.viewLabel, { color: colors.textMuted }]}>Front view</Text>
              <View style={[styles.svgFrame, { backgroundColor: colors.paperElevated, borderColor: colors.line }]}>
                <Svg width={120} height={130} viewBox="0 0 110 110">
                  <Path
                    d={frontPath}
                    stroke={colors.ink}
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {GARMENT_TEMPLATES[6].detailPaths?.map((d, i) => (
                    <Path
                      key={i}
                      d={d}
                      stroke={colors.line}
                      strokeWidth={1}
                      fill="none"
                    />
                  ))}
                </Svg>
              </View>
            </View>

            {/* Back View */}
            <View style={styles.flatCol}>
              <Text style={[styles.viewLabel, { color: colors.textMuted }]}>Back view</Text>
              <View style={[styles.svgFrame, { backgroundColor: colors.paperElevated, borderColor: colors.line }]}>
                <Svg width={120} height={130} viewBox="0 0 110 110">
                  <Path
                    d={backPath}
                    stroke={colors.ink}
                    strokeWidth={1.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Line
                    x1={55}
                    y1={24}
                    x2={55}
                    y2={96}
                    stroke={colors.line}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                </Svg>
              </View>
            </View>
          </View>
        </Card>

        {/* Measurements Grid */}
        <Card variant="elevated" style={[styles.sectionCard, { backgroundColor: colors.paperCard }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>Measurements</Text>
            <Pressable
              onPress={toggleUnit}
              style={[
                styles.unitTogglePill,
                { backgroundColor: colors.paperElevated, borderColor: colors.line },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Toggle unit"
            >
              <Text style={[styles.unitToggleText, { color: colors.accent }]}>
                {unit === 'inch' ? 'in' : 'cm'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.measurementsGrid}>
            {measurements.map((m) => (
              <View key={m.id} style={[styles.measurementField, { backgroundColor: colors.paperElevated, borderColor: colors.line }]}>
                <Text style={[styles.measureLabel, { color: colors.textMuted }]}>{m.label}</Text>
                <TextInput
                  value={m.value}
                  onChangeText={(val) => handleUpdateMeasurement(m.id, val)}
                  style={[styles.measureInput, { color: colors.ink }]}
                  maxLength={10}
                />
              </View>
            ))}
          </View>
        </Card>

        {/* Color Palette Chips */}
        <Card variant="elevated" style={[styles.sectionCard, { backgroundColor: colors.paperCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Color palette</Text>
          <View style={styles.colorsRow}>
            {[
              { name: 'Pure silk', hex: '#E6C687' },
              { name: 'Gold zari', hex: '#D4AF37' },
              { name: 'Crimson', hex: '#78182E' },
              { name: 'Ink contour', hex: '#0E0E10' },
            ].map((c, i) => (
              <View key={i} style={styles.colorChipItem}>
                <View style={[styles.colorSquare, { backgroundColor: c.hex }]} />
                <Text numberOfLines={1} style={[styles.colorChipName, { color: colors.ink }]}>
                  {c.name}
                </Text>
                <Text style={[styles.colorChipHex, { color: colors.textMuted }]}>
                  {c.hex}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Fabric & Stitch Notes */}
        <Card variant="elevated" style={[styles.sectionCard, { backgroundColor: colors.paperCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Construction notes</Text>

          <View style={styles.noteField}>
            <Text style={[styles.noteFieldLabel, { color: colors.textMuted }]}>Fabric specification</Text>
            <TextInput
              value={fabricNotes}
              onChangeText={updateFabricNotes}
              style={[styles.noteInput, { backgroundColor: colors.paperElevated, borderColor: colors.line, color: colors.ink }]}
              maxLength={60}
            />
          </View>

          <View style={styles.noteField}>
            <Text style={[styles.noteFieldLabel, { color: colors.textMuted }]}>Stitch standard</Text>
            <TextInput
              value={stitchNotes}
              onChangeText={updateStitchNotes}
              style={[styles.noteInput, { backgroundColor: colors.paperElevated, borderColor: colors.line, color: colors.ink }]}
              maxLength={60}
            />
          </View>

          <View style={styles.noteField}>
            <Text style={[styles.noteFieldLabel, { color: colors.textMuted }]}>Embroidery details</Text>
            <TextInput
              value={embroideryNotes}
              onChangeText={updateEmbroideryNotes}
              style={[styles.noteInput, { backgroundColor: colors.paperElevated, borderColor: colors.line, color: colors.ink }]}
              maxLength={80}
            />
          </View>

          <View style={styles.noteField}>
            <Text style={[styles.noteFieldLabel, { color: colors.textMuted }]}>Atelier notes</Text>
            <TextInput
              value={atelierNotes}
              onChangeText={setAtelierNotes}
              style={[styles.noteInput, { backgroundColor: colors.paperElevated, borderColor: colors.line, color: colors.ink }]}
              maxLength={80}
            />
          </View>
        </Card>

        {/* Export Action Buttons */}
        <View style={styles.exportActionsContainer}>
          <Button
            label="Export PDF"
            onPress={handleExportPdf}
            size="large"
            icon={<FileDown size={18} color="#FFFFFF" strokeWidth={2} />}
            fullWidth
          />
          <Button
            label="Export image"
            onPress={handleExportImage}
            variant="outline"
            size="medium"
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </View>
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
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    height: 52,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 16,
  },
  headerSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    paddingBottom: 60,
  },
  sectionCard: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  unitTogglePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.chips,
    borderWidth: 1,
  },
  unitToggleText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  flatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  flatCol: {
    flex: 1,
    alignItems: 'center',
  },
  viewLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    marginBottom: 4,
  },
  svgFrame: {
    width: '100%',
    height: 140,
    borderRadius: radius.buttons,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  measurementField: {
    width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.lg * 2 - spacing.xs * 2) / 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.buttons,
    borderWidth: 1,
  },
  measureLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  measureInput: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    paddingVertical: 2,
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorChipItem: {
    alignItems: 'center',
    width: 60,
  },
  colorSquare: {
    width: 38,
    height: 38,
    borderRadius: radius.buttons,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  colorChipName: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    textAlign: 'center',
  },
  colorChipHex: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    textAlign: 'center',
  },
  noteField: {
    marginVertical: 4,
  },
  noteFieldLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    marginBottom: 4,
  },
  noteInput: {
    borderRadius: radius.buttons,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
  },
  exportActionsContainer: {
    marginTop: spacing.sm,
  },
});
