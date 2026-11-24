import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  Check,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Share2,
  Download,
  CloudUpload,
} from 'lucide-react-native';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { Shimmer } from './Shimmer';
import { useTheme, radius, spacing, typography, shadows } from '../theme';
import { Sketch } from '../types/canvas';
import { triggerHaptic } from '../utils/haptics';
import { exportService } from '../services/exportService';
import { supabase } from '../services/supabase';

export type ExportFormat = 'png' | 'trans_png' | 'pdf';

interface ExportSheetProps {
  visible: boolean;
  onClose: () => void;
  sketch: Sketch;
  onExport?: (format: ExportFormat) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ExportSheet: React.FC<ExportSheetProps> = ({
  visible,
  onClose,
  sketch,
  onExport,
}) => {
  const colors = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [includeFigure, setIncludeFigure] = useState(false);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (visible) {
      supabase.auth.getUser().then(({ data }) => {
        const registered = !!data?.user && !data.user.is_anonymous;
        setIsRegistered(registered);
        if (registered) setIncludeWatermark(false);
      });
    }
  }, [visible]);

  const formats: { id: ExportFormat; title: string; sub: string; icon: any }[] = [
    {
      id: 'png',
      title: 'PNG image',
      sub: 'Paper background',
      icon: ImageIcon,
    },
    {
      id: 'trans_png',
      title: 'Transparent PNG',
      sub: 'Garment contour only',
      icon: Sparkles,
    },
    {
      id: 'pdf',
      title: 'PDF document',
      sub: 'Vector print spec',
      icon: FileText,
    },
  ];

  const handleExportAction = async (action: 'share' | 'gallery' | 'cloud') => {
    triggerHaptic('medium');
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsExporting(true);

    try {
      if (selectedFormat === 'pdf') {
        await exportService.exportTechPackPdf({
          sketch,
          showWatermark: includeWatermark,
        });
      } else {
        const snap = await exportService.generatePng(sketch, {
          transparent: selectedFormat === 'trans_png',
          excludeFigure: selectedFormat === 'trans_png' && !includeFigure,
          scale: 2,
        });

        if (controller.signal.aborted) return;

        if (action === 'gallery') {
          await exportService.saveImageToGallery(snap.uri);
        } else if (action === 'cloud') {
          await exportService.uploadToCloud(snap.uri, snap.base64);
        } else {
          await exportService.shareFile(snap.uri, 'image/png');
        }
      }
      if (onExport) onExport(selectedFormat);
    } catch (err) {
      console.warn('Export action failed:', err);
    } finally {
      if (!controller.signal.aborted) {
        setIsExporting(false);
        onClose();
      }
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setIsExporting(false);
  };

  const handleClose = () => {
    if (isExporting) {
      handleCancel();
    }
    setIsExporting(false);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={handleClose} title="Export design">
      <View style={styles.container}>
        {/* Live Preview Box */}
        <View
          style={[
            styles.previewBox,
            {
              backgroundColor:
                selectedFormat === 'trans_png' ? 'transparent' : '#F7F4EE',
              borderColor: colors.line,
            },
          ]}
        >
          <Svg width={110} height={120} viewBox="0 0 110 110">
            {sketch.layers.map((layer) =>
              layer.items.map((item) => {
                if (item.type === 'stroke') {
                  return (
                    <Path
                      key={item.id}
                      d={item.svgPath}
                      stroke={item.color}
                      strokeWidth={item.width}
                      fill="none"
                    />
                  );
                }
                if (item.type === 'shape') {
                  return (
                    <Path
                      key={item.id}
                      d={item.svgPath}
                      stroke={item.stroke?.color || '#0E0E10'}
                      strokeWidth={1.5}
                      fill={item.fill?.type === 'color' ? item.fill.value : 'none'}
                    />
                  );
                }
                return null;
              })
            )}
          </Svg>
        </View>

        {/* Format Options */}
        <View style={styles.formatsList}>
          {formats.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFormat === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedFormat(f.id);
                }}
                style={[
                  styles.formatRow,
                  {
                    backgroundColor: colors.paperElevated,
                    borderColor: isSelected ? colors.accent : colors.line,
                  },
                  isSelected && { backgroundColor: colors.accentSoft },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: colors.paperCard,
                      borderColor: colors.line,
                    },
                  ]}
                >
                  <Icon size={18} color={colors.ink} strokeWidth={1.75} />
                </View>

                <View style={styles.formatTextCol}>
                  <Text style={[styles.formatTitle, { color: colors.ink }]}>
                    {f.title}
                  </Text>
                  <Text style={[styles.formatSub, { color: colors.textMuted }]}>
                    {f.sub}
                  </Text>
                </View>

                {isSelected && (
                  <View
                    style={[
                      styles.checkCircle,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Transparent & Watermark Toggles */}
        {selectedFormat === 'trans_png' && (
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setIncludeFigure(!includeFigure);
            }}
            style={[styles.toggleRow, { borderColor: colors.line, backgroundColor: colors.paperElevated }]}
          >
            <Text style={[styles.toggleText, { color: colors.ink }]}>Include figure model outline</Text>
            <View style={[styles.checkbox, includeFigure && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              {includeFigure && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
            </View>
          </Pressable>
        )}

        {isRegistered && (
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setIncludeWatermark(!includeWatermark);
            }}
            style={[styles.toggleRow, { borderColor: colors.line, backgroundColor: colors.paperElevated }]}
          >
            <Text style={[styles.toggleText, { color: colors.ink }]}>{"Include 'Made with VogueCraft' watermark"}</Text>
            <View style={[styles.checkbox, includeWatermark && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              {includeWatermark && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
            </View>
          </Pressable>
        )}

        {/* Action Buttons & Shimmer */}
        {isExporting ? (
          <View style={{ gap: 10, marginTop: spacing.sm }}>
            <Shimmer height={46} borderRadius={radius.buttons} />
            <Button
              label="Cancel"
              variant="ghost"
              size="small"
              onPress={handleCancel}
              style={{ alignSelf: 'center' }}
            />
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            <Button
              label="Share"
              onPress={() => handleExportAction('share')}
              size="large"
              fullWidth
              style={[styles.exportBtn, { backgroundColor: colors.accent }]}
            />
            {selectedFormat !== 'pdf' && (
              <View style={styles.secondaryActionsRow}>
                <Button
                  label="Save to gallery"
                  onPress={() => handleExportAction('gallery')}
                  size="small"
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Upload to cloud"
                  onPress={() => handleExportAction('cloud')}
                  size="small"
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
  },
  previewBox: {
    width: '100%',
    height: 140,
    borderRadius: radius.buttons,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  formatsList: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.buttons,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  formatTextCol: {
    flex: 1,
  },
  formatTitle: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 14,
  },
  formatSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    marginTop: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtn: {
    borderRadius: radius.buttons,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.buttons,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  toggleText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C2BFB8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
