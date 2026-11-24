import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  BackHandler,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Layers,
  Palette,
  Share2,
  Sparkles,
  Box,
  Scissors,
  Check,
  FileSpreadsheet,
  Ellipsis,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ExportSheet, ColorSheet, GlassCard } from '../../components';
import { CanvasView } from '../../canvas/CanvasView';
import {
  Toolbar,
  ColorFabricSheet,
  LayersPanel,
  DetailsStrip,
  AIAssistSheet,
} from '../../canvas/panels';
import { useCanvasStore } from '../../store/canvasStore';
import { ExportEngine } from '../../canvas/engine/export';
import { triggerHaptic } from '../../utils/haptics';
import { useAutosave } from '../../hooks/useAutosave';

interface StudioScreenProps {
  navigation: any;
  route: any;
}

export const StudioScreen: React.FC<StudioScreenProps> = ({
  navigation,
  route,
}) => {
  const sketch = useCanvasStore((state) => state.sketch);
  const setTitle = useCanvasStore((state) => state.setTitle);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const canRedo = useCanvasStore((state) => state.canRedo);
  const seedExampleSketch = useCanvasStore((state) => state.seedExampleSketch);
  const fitFlatToFigure = useCanvasStore((state) => state.fitFlatToFigure);
  const loadGarmentFlat = useCanvasStore((state) => state.loadGarmentFlat);
  const loadFigureTemplate = useCanvasStore((state) => state.loadFigureTemplate);

  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isSwatchesOpen, setIsSwatchesOpen] = useState(false);
  const [isColorSheetOpen, setIsColorSheetOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(!!route.params?.openAI);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(sketch.title);
  const [isDrawing, setIsDrawing] = useState(false);
  const sketchId = route.params?.sketchId;
  const { saveStatus, retrySave } = useAutosave(sketchId);

  const { width: windowWidth } = useWindowDimensions();
  const isCompact = windowWidth < 400;

  const dotPulse = useSharedValue(1);

  useEffect(() => {
    if (saveStatus === 'saving') {
      dotPulse.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      dotPulse.value = withTiming(1, { duration: 200 });
    }
  }, [saveStatus]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotPulse.value,
  }));

  const insets = useSafeAreaInsets();
  const [toolbarHeight, setToolbarHeight] = useState(Platform.OS === 'ios' ? 104 : 96);
  const detailsProgress = useSharedValue(0);

  useEffect(() => {
    if (isDetailsOpen) {
      detailsProgress.value = withSpring(1, {
        damping: 18,
        stiffness: 180,
        mass: 0.8,
      });
    } else {
      detailsProgress.value = withSpring(
        0,
        {
          damping: 18,
          stiffness: 220,
          mass: 0.8,
        }
      );
    }
  }, [isDetailsOpen]);

  const detailsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: detailsProgress.value,
      transform: [
        {
          translateY: (1 - detailsProgress.value) * 30,
        },
      ],
    };
  });

  const detailsBottomOffset = toolbarHeight + 8;

  // Initialize or handle route params
  useEffect(() => {
    if (route.params?.templateId) {
      if (route.params.templateId.includes('croquis')) {
        loadFigureTemplate(route.params.templateId);
      } else {
        loadGarmentFlat(route.params.templateId);
      }
    } else if (route.params?.mode === 'blank') {
      // Empty canvas
    } else {
      // Default seeds example Kurta study if canvas is completely empty
      const hasItems = sketch.layers.some((l) => l.items.length > 0);
      if (!hasItems) {
        seedExampleSketch();
      }
    }


  }, [route.params]);

  // Handle hardware back press on Android
  useEffect(() => {
    const onHardwareBack = () => {
      navigation.navigate('Sketchbooks');
      return true;
    };
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBack
    );
    return () => subscription.remove();
  }, [navigation]);

  const handleFinishTitle = () => {
    if (titleInput.trim()) {
      setTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleExport = async (format: 'png' | 'trans_png' | 'pdf') => {
    triggerHaptic('medium');
    setIsExportModalOpen(false);

    try {
      if (format === 'pdf') {
        const uri = await ExportEngine.exportPdf(sketch, false);
        await ExportEngine.share(uri, 'application/pdf');
      } else if (format === 'trans_png') {
        const uri = await ExportEngine.exportPng(sketch, true);
        await ExportEngine.share(uri, 'image/png');
      } else {
        const uri = await ExportEngine.exportPng(sketch, false);
        await ExportEngine.share(uri, 'image/png');
      }
    } catch {
      // Graceful fallback
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* Top Bar: Height 52 plus safe area top inset, row with fixed 8px gaps */}
      <View style={[styles.topBar, { height: 52 + insets.top, paddingTop: insets.top }]}>
        {/* Back button (40 by 40) */}
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Sketchbooks');
            }
          }}
          hitSlop={6}
          style={styles.backBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <ArrowLeft size={20} color={colors.ink} strokeWidth={1.75} />
        </Pressable>

        {/* Editable Title + Autosave Dot (flex 1, minWidth 0, one line, ellipsis, centred) */}
        <View style={styles.titleWrapper}>
          {isEditingTitle ? (
            <View style={styles.titleInputRow}>
              <TextInput
                value={titleInput}
                onChangeText={setTitleInput}
                onBlur={handleFinishTitle}
                autoFocus
                style={styles.titleInput}
                maxLength={25}
              />
              <Pressable onPress={handleFinishTitle} hitSlop={6}>
                <Check size={16} color={colors.accent} strokeWidth={2} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setIsEditingTitle(true)}
              style={styles.titleRow}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.sketchTitle}>
                {sketch.title}
              </Text>
              {/* Autosave dot indicator placed right after title, never overlaps an icon */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  retrySave();
                }}
                hitSlop={8}
                accessibilityLabel="Autosave status indicator. Tap to retry save."
                accessibilityRole="button"
              >
                <Animated.View
                  style={[
                    styles.autosaveDot,
                    {
                      backgroundColor:
                        saveStatus === 'failed' ? '#E05656' : '#48BB78',
                    },
                    dotAnimatedStyle,
                  ]}
                />
              </Pressable>
            </Pressable>
          )}
        </View>

        {/* Top actions: 36 by 36 icon buttons with hitSlop 6 */}
        <View style={styles.topActions}>
          <Pressable
            onPress={undo}
            disabled={!canUndo}
            hitSlop={6}
            style={[styles.topIconBtn, !canUndo && styles.topIconBtnDisabled]}
            accessibilityLabel="Undo"
            accessibilityRole="button"
          >
            <Undo2 size={18} color={colors.ink} strokeWidth={1.75} />
          </Pressable>

          <Pressable
            onPress={redo}
            disabled={!canRedo}
            hitSlop={6}
            style={[styles.topIconBtn, !canRedo && styles.topIconBtnDisabled]}
            accessibilityLabel="Redo"
            accessibilityRole="button"
          >
            <Redo2 size={18} color={colors.ink} strokeWidth={1.75} />
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setIsAIOpen(true);
            }}
            hitSlop={6}
            style={styles.topIconBtn}
            accessibilityLabel="AI Assist"
            accessibilityRole="button"
          >
            <Sparkles size={18} color={colors.accent} strokeWidth={1.75} />
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              navigation.navigate('Preview3D');
            }}
            hitSlop={6}
            style={styles.topIconBtn}
            accessibilityLabel="Preview 3D"
            accessibilityRole="button"
          >
            <Box size={18} color={colors.ink} strokeWidth={1.75} />
          </Pressable>

          {isCompact ? (
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setIsMoreMenuOpen(!isMoreMenuOpen);
              }}
              hitSlop={6}
              style={[
                styles.topIconBtn,
                isMoreMenuOpen && styles.topIconBtnActive,
              ]}
              accessibilityLabel="More options"
              accessibilityRole="button"
            >
              <Ellipsis size={18} color={colors.ink} strokeWidth={1.75} />
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={() => setIsColorSheetOpen(true)}
                hitSlop={6}
                style={styles.topIconBtn}
                accessibilityLabel="Palette"
                accessibilityRole="button"
              >
                <Palette size={18} color={colors.ink} strokeWidth={1.75} />
              </Pressable>

              <Pressable
                onPress={() => setIsLayersOpen(true)}
                hitSlop={6}
                style={styles.topIconBtn}
                accessibilityLabel="Layers"
                accessibilityRole="button"
              >
                <Layers size={18} color={colors.ink} strokeWidth={1.75} />
              </Pressable>

              <Pressable
                onPress={() => setIsExportModalOpen(true)}
                hitSlop={6}
                style={styles.topIconBtn}
                accessibilityLabel="Export"
                accessibilityRole="button"
              >
                <Share2 size={18} color={colors.ink} strokeWidth={1.75} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* More Menu Popover for Small Screens */}
      {isMoreMenuOpen && (
        <Modal
          transparent
          visible={isMoreMenuOpen}
          animationType="fade"
          onRequestClose={() => setIsMoreMenuOpen(false)}
        >
          <Pressable
            style={styles.moreMenuBackdrop}
            onPress={() => setIsMoreMenuOpen(false)}
          >
            <View style={[styles.moreMenuPopover, { top: 52 + insets.top + 4 }]}>
              <GlassCard intensity="high" borderRadius={radius.cards} style={styles.moreMenuGlass}>
                <Pressable
                  onPress={() => {
                    triggerHaptic('light');
                    setIsMoreMenuOpen(false);
                    setIsLayersOpen(true);
                  }}
                  style={styles.moreMenuItem}
                  accessibilityRole="button"
                  accessibilityLabel="Layers"
                >
                  <Layers size={16} color={colors.ink} strokeWidth={1.75} />
                  <Text style={styles.moreMenuText}>Layers</Text>
                </Pressable>

                <View style={styles.moreMenuDivider} />

                <Pressable
                  onPress={() => {
                    triggerHaptic('light');
                    setIsMoreMenuOpen(false);
                    setIsColorSheetOpen(true);
                  }}
                  style={styles.moreMenuItem}
                  accessibilityRole="button"
                  accessibilityLabel="Swatches"
                >
                  <Palette size={16} color={colors.ink} strokeWidth={1.75} />
                  <Text style={styles.moreMenuText}>Swatches</Text>
                </Pressable>

                <View style={styles.moreMenuDivider} />

                <Pressable
                  onPress={() => {
                    triggerHaptic('light');
                    setIsMoreMenuOpen(false);
                    setIsExportModalOpen(true);
                  }}
                  style={styles.moreMenuItem}
                  accessibilityRole="button"
                  accessibilityLabel="Export"
                >
                  <Share2 size={16} color={colors.ink} strokeWidth={1.75} />
                  <Text style={styles.moreMenuText}>Export</Text>
                </Pressable>
              </GlassCard>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Secondary control chips row directly below top bar */}
      <View
        style={[
          styles.chipsRowContainer,
          { top: 52 + insets.top + 6 },
        ]}
        pointerEvents="box-none"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              fitFlatToFigure();
            }}
            accessibilityLabel="Fit"
          >
            <GlassCard intensity="low" borderRadius={radius.chips}>
              <View style={styles.fitPill}>
                <Text style={styles.fitPillText}>Fit</Text>
              </View>
            </GlassCard>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setIsDetailsOpen(!isDetailsOpen);
            }}
            accessibilityLabel="Details"
          >
            <GlassCard
              intensity="low"
              borderRadius={radius.chips}
              tintColor={isDetailsOpen ? '#2A0A14' : undefined}
            >
              <View style={[styles.fitPill, isDetailsOpen && styles.fitPillActive]}>
                <Scissors size={13} color={isDetailsOpen ? '#FFF' : colors.graphite} strokeWidth={1.75} />
                <Text
                  style={[
                    styles.fitPillText,
                    isDetailsOpen && styles.fitPillTextActive,
                  ]}
                >
                  Details
                </Text>
              </View>
            </GlassCard>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              navigation.navigate('TechSheet');
            }}
            accessibilityLabel="Tech sheet"
          >
            <GlassCard intensity="low" borderRadius={radius.chips}>
              <View style={styles.fitPill}>
                <FileSpreadsheet size={13} color={colors.graphite} strokeWidth={1.75} />
                <Text style={styles.fitPillText}>Tech sheet</Text>
              </View>
            </GlassCard>
          </Pressable>
        </ScrollView>
      </View>

      {/* Main Canvas View */}
      <View style={[styles.canvasContainer, { paddingBottom: toolbarHeight }]}>
        <CanvasView onDrawingStateChange={setIsDrawing} />
      </View>

      {/* Details mode horizontal strip */}
      {isDetailsOpen && (
        <Animated.View
          style={[
            styles.detailsStripContainer,
            { bottom: detailsBottomOffset },
            detailsAnimatedStyle,
          ]}
          pointerEvents="box-none"
        >
          <DetailsStrip onClose={() => setIsDetailsOpen(false)} />
        </Animated.View>
      )}

      {/* Floating Toolbar */}
      <View
        style={styles.toolbarContainer}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          if (height > 0) {
            setToolbarHeight(height);
          }
        }}
      >
        <Toolbar
          isDrawing={isDrawing}
          onOpenColorPicker={() => setIsColorSheetOpen(true)}
        />
      </View>

      {/* Slide-in Layers Panel */}
      <LayersPanel
        visible={isLayersOpen}
        onClose={() => setIsLayersOpen(false)}
      />

      {/* Color Sheet */}
      <ColorSheet
        visible={isColorSheetOpen}
        onClose={() => setIsColorSheetOpen(false)}
      />

      {/* Color & Fabric Swatches Sheet */}
      <ColorFabricSheet
        visible={isSwatchesOpen}
        onClose={() => setIsSwatchesOpen(false)}
      />

      {/* Export Bottom Sheet with Live Preview */}
      <ExportSheet
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sketch={sketch}
        onExport={handleExport}
      />

      {/* AI Assist Sheet */}
      <AIAssistSheet
        visible={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
    ...(Platform.OS === 'web'
      ? {
          height: '100dvh' as any,
          maxHeight: '100dvh' as any,
        }
      : {}),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D8D2',
    backgroundColor: '#F7F4EE',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(127, 0, 32, 0.12)',
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    gap: 6,
  },
  sketchTitle: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
    flexShrink: 1,
  },
  autosaveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  titleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  titleInput: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 15,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  topIconBtnActive: {
    backgroundColor: '#F3E6E8',
    borderColor: '#7F0020',
  },
  topIconBtnDisabled: {
    opacity: 0.35,
  },
  moreMenuBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  moreMenuPopover: {
    position: 'absolute',
    right: 12,
    width: 140,
    zIndex: 100,
    elevation: 20,
  },
  moreMenuGlass: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(127, 0, 32, 0.12)',
    ...shadows.floating,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  moreMenuText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
  },
  moreMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 2,
  },
  chipsRowContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
  },
  chipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  fitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
  },
  fitPillActive: {
    backgroundColor: '#7F0020',
  },
  fitPillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.graphite,
  },
  fitPillTextActive: {
    color: '#FFFFFF',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
    ...(Platform.OS === 'web' ? { position: 'fixed' as any } : {}),
  },
  detailsStripContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 20,
    elevation: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 14, 16, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportDialog: {
    width: 290,
    backgroundColor: colors.paperCard,
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    ...shadows.floating,
  },
  exportTitle: {
    fontFamily: typography.title2.fontFamily,
    fontSize: 18,
    color: colors.ink,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  exportOption: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSubtle,
  },
  exportOptionText: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 14,
    color: colors.ink,
  },
  exportOptionSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
