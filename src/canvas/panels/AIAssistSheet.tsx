import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import {
  Sparkles,
  Wand2,
  Palette,
  Split,
  Plus,
  Check,
  Crown,
  Gem,
  CircleDot,
  Scissors,
  Layers,
  Sliders,
} from 'lucide-react-native';
import { Sheet, Button, SkeletonLoader, Chip, Shimmer, SkeletonCard } from '../../components';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import {
  aiService,
  AIMotifResult,
  AICleanResult,
  AIPaletteResult,
  AIVariantResult,
  MotifStyle,
  HarmonicWardrobeResult,
} from '../../services/aiService';
import { useCanvasStore } from '../../store/canvasStore';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface AIAssistSheetProps {
  visible: boolean;
  onClose: () => void;
}

type AITab = 'motif' | 'clean' | 'palette' | 'variants';

const SCREEN_WIDTH = Dimensions.get('window').width;

const MOTIF_STYLES: MotifStyle[] = [
  'Zardozi',
  'Zari',
  'Resham',
  'Floral',
  'Geometric',
  'Paisley',
];

const PRESET_BASE_COLORS = [
  { name: 'Emerald', hex: '#0E2A1E' },
  { name: 'Ruby', hex: '#4A121A' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Sapphire', hex: '#1A2A44' },
  { name: 'Terracotta', hex: '#8C3B24' },
  { name: 'Ivory', hex: '#EDE8DF' },
];

export const AIAssistSheet: React.FC<AIAssistSheetProps> = ({
  visible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AITab>('motif');

  // Motif state
  const [motifPrompt, setMotifPrompt] = useState('gold zardozi on emerald silk');
  const [selectedStyle, setSelectedStyle] = useState<MotifStyle>('Zardozi');
  const [density, setDensity] = useState<number>(65);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isMotifLoading, setIsMotifLoading] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [motifError, setMotifError] = useState(false);
  const [motifs, setMotifs] = useState<AIMotifResult[]>([]);
  const [motifHistory, setMotifHistory] = useState<AIMotifResult[]>([]);
  const [selectedMotifId, setSelectedMotifId] = useState<string | null>(null);

  // Clean state
  const [isCleanLoading, setIsCleanLoading] = useState(false);
  const [cleanResult, setCleanResult] = useState<AICleanResult | null>(null);
  const [sliderPosition, setSliderPosition] = useState(0.5);

  // Palette Harmonizer state
  const [selectedBaseColor, setSelectedBaseColor] = useState('#0E2A1E'); // default Emerald
  const [isHarmonizerLoading, setIsHarmonizerLoading] = useState(false);
  const [harmonizerError, setHarmonizerError] = useState(false);
  const [wardrobeResult, setWardrobeResult] = useState<HarmonicWardrobeResult | null>(null);
  const [savedPaletteIds, setSavedPaletteIds] = useState<string[]>([]);

  // Abort controller for cancellation when leaving screen
  const abortControllerRef = useRef<AbortController | null>(null);

  // Variants state
  const [isVariantsLoading, setIsVariantsLoading] = useState(false);
  const [variants, setVariants] = useState<AIVariantResult[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Store bindings
  const addCustomLayer = useCanvasStore((state) => state.addCustomLayer);
  const applyCleanedSketch = useCanvasStore((state) => state.applyCleanedSketch);
  const applyGarmentVariant = useCanvasStore((state) => state.applyGarmentVariant);
  const savePalette = useCanvasStore((state) => state.savePalette);
  const saveCustomPattern = useCanvasStore((state) => state.saveCustomPattern);
  const applyMotifToGarmentPart = useCanvasStore((state) => state.applyMotifToGarmentPart);
  const applyBorderBrush = useCanvasStore((state) => state.applyBorderBrush);
  const applyHarmonicPalette = useCanvasStore((state) => state.applyHarmonicPalette);

  const loadMotifHistory = async () => {
    try {
      const hist = await aiService.getMotifHistory?.();
      if (hist && hist.length > 0) {
        setMotifHistory(hist);
      }
    } catch {
      // silent
    }
  };

  // Initial generators on first open and cancellation on close
  React.useEffect(() => {
    if (visible) {
      loadMotifHistory();
      if (motifs.length === 0) {
        handleGenerateMotifs();
        handleHarmonize(selectedBaseColor);
      }
    }
    if (!visible) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    }
  }, [visible]);

  const handleImprovePrompt = async () => {
    if (!motifPrompt.trim()) return;
    triggerHaptic('light');
    setIsImprovingPrompt(true);
    try {
      const improved = await aiService.improveMotifPrompt?.(motifPrompt, selectedStyle);
      if (improved) setMotifPrompt(improved);
    } catch {
      // silent
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  // Tab 1: Motif handlers
  const handleGenerateMotifs = async () => {
    triggerHaptic('light');
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsMotifLoading(true);
    setMotifError(false);
    try {
      const results = await aiService.generateMotifs(
        {
          prompt: motifPrompt,
          style: selectedStyle,
          density,
          scale,
        },
        controller.signal
      );
      if (!controller.signal.aborted) {
        setMotifs(results);
        if (results[0]) setSelectedMotifId(results[0].id);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message === 'Aborted') return;
      if (err?.status === 429) {
        showToast('Daily limit reached');
      }
      setMotifError(true);
    } finally {
      if (!controller.signal.aborted) {
        setIsMotifLoading(false);
      }
      loadMotifHistory();
    }
  };

  const handleApplyMotifPart = (part: 'sleeves' | 'body' | 'full') => {
    const selectedMotif = motifs.find((m) => m.id === selectedMotifId);
    if (!selectedMotif) return;
    triggerHaptic('medium');
    applyMotifToGarmentPart(part, {
      ...selectedMotif,
      scale,
      rotation,
    });
    onClose();
  };

  const handleApplyBorder = () => {
    const selectedMotif = motifs.find((m) => m.id === selectedMotifId);
    if (!selectedMotif) return;
    triggerHaptic('medium');
    applyBorderBrush(selectedMotif.borderBrushPath, selectedMotif.name);
    onClose();
  };

  // Tab 2: Clean sketch handlers
  const handleCleanSketch = async () => {
    triggerHaptic('light');
    setIsCleanLoading(true);
    try {
      const result = await aiService.cleanSketch();
      setCleanResult(result);
      setSliderPosition(0.5);
    } catch {
      // fallback
    } finally {
      setIsCleanLoading(false);
    }
  };

  const handleApplyClean = () => {
    if (!cleanResult) return;
    triggerHaptic('medium');
    applyCleanedSketch(cleanResult.afterSvgPath);
    onClose();
  };

  // Tab 3: Harmonizer handlers
  const handleHarmonize = async (baseColor: string) => {
    triggerHaptic('light');
    setSelectedBaseColor(baseColor);
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsHarmonizerLoading(true);
    setHarmonizerError(false);
    try {
      const result = await aiService.harmonizeWardrobe(baseColor, controller.signal);
      if (!controller.signal.aborted) {
        setWardrobeResult(result);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message === 'Aborted') return;
      if (err?.status === 429) {
        showToast('Daily limit reached');
      }
      setHarmonizerError(true);
    } finally {
      if (!controller.signal.aborted) {
        setIsHarmonizerLoading(false);
      }
    }
  };

  const handlePickPhoto = async () => {
    triggerHaptic('light');
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
      });
      if (!res.canceled && res.assets[0]) {
        handleHarmonize('#0E2A1E');
      }
    } catch {
      handleHarmonize('#0E2A1E');
    }
  };

  const handleApplyPaletteToGarment = (palette: AIPaletteResult) => {
    triggerHaptic('medium');
    applyHarmonicPalette(palette.colors);
    savePalette(palette.name, palette.colors);
    setSavedPaletteIds((prev) => [...prev, palette.id]);
    onClose();
  };

  // Tab 4: Variants handlers
  const handleGenerateVariants = async () => {
    triggerHaptic('light');
    setIsVariantsLoading(true);
    try {
      const results = await aiService.generateVariants();
      setVariants(results);
      if (results[0]) setSelectedVariantId(results[0].id);
    } catch {
      // fallback
    } finally {
      setIsVariantsLoading(false);
    }
  };

  const handleApplyVariant = (
    variant: AIVariantResult,
    mode: 'duplicate' | 'replace'
  ) => {
    triggerHaptic('medium');
    applyGarmentVariant(variant, mode);
    onClose();
  };

  const activeMotif = motifs.find((m) => m.id === selectedMotifId);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="AI Studio"
    >
      <View style={styles.container}>
        {/* 4 Tabs: Motif, Clean, Harmonizer, Variants */}
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('motif');
              if (motifs.length === 0) handleGenerateMotifs();
            }}
            style={[styles.tabButton, activeTab === 'motif' && styles.tabButtonActive]}
          >
            <Sparkles
              size={15}
              color={activeTab === 'motif' ? colors.accent : colors.textMuted}
              strokeWidth={1.75}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'motif' && styles.tabTextActive,
              ]}
            >
              Motif
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('clean');
              if (!cleanResult) handleCleanSketch();
            }}
            style={[styles.tabButton, activeTab === 'clean' && styles.tabButtonActive]}
          >
            <Wand2
              size={15}
              color={activeTab === 'clean' ? colors.accent : colors.textMuted}
              strokeWidth={1.75}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'clean' && styles.tabTextActive,
              ]}
            >
              Clean
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('palette');
              if (!wardrobeResult) handleHarmonize(selectedBaseColor);
            }}
            style={[styles.tabButton, activeTab === 'palette' && styles.tabButtonActive]}
          >
            <Palette
              size={15}
              color={activeTab === 'palette' ? colors.accent : colors.textMuted}
              strokeWidth={1.75}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'palette' && styles.tabTextActive,
              ]}
            >
              Harmonizer
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('variants');
              if (variants.length === 0) handleGenerateVariants();
            }}
            style={[
              styles.tabButton,
              activeTab === 'variants' && styles.tabButtonActive,
            ]}
          >
            <Split
              size={15}
              color={activeTab === 'variants' ? colors.accent : colors.textMuted}
              strokeWidth={1.75}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'variants' && styles.tabTextActive,
              ]}
            >
              Variants
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: Motif & Embroidery Generator */}
        {activeTab === 'motif' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
          >
            {/* Prompt input row */}
            <View style={styles.promptRow}>
              <TextInput
                value={motifPrompt}
                onChangeText={setMotifPrompt}
                placeholder="gold zardozi on emerald silk"
                placeholderTextColor={colors.textLight}
                style={styles.promptInput}
              />
              <Button
                label={isImprovingPrompt ? "..." : "Improve"}
                size="small"
                variant="outline"
                onPress={handleImprovePrompt}
                disabled={isImprovingPrompt || isMotifLoading}
              />
              <Button
                label="Generate"
                size="small"
                onPress={handleGenerateMotifs}
                disabled={isMotifLoading}
              />
            </View>

            {/* Style Chips Bar */}
            <Text style={styles.sectionLabel}>Embroidery style</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {MOTIF_STYLES.map((style) => (
                <Pressable
                  key={style}
                  onPress={() => {
                    triggerHaptic('light');
                    setSelectedStyle(style);
                  }}
                  style={[
                    styles.styleChip,
                    selectedStyle === style && styles.styleChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.styleChipText,
                      selectedStyle === style && styles.styleChipTextActive,
                    ]}
                  >
                    {style}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Density, Scale & Rotation Sliders */}
            <View style={styles.paramControlsRow}>
              <View style={styles.paramBox}>
                <View style={styles.paramHeader}>
                  <Text style={styles.paramLabel}>Density</Text>
                  <Text style={styles.paramValue}>{density}%</Text>
                </View>
                <View style={styles.paramTrack}>
                  <View style={[styles.paramFill, { width: `${density}%` }]} />
                </View>
                <View style={styles.paramStepRow}>
                  <Pressable
                    onPress={() => setDensity(Math.max(20, density - 15))}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDensity(Math.min(100, density + 15))}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.paramBox}>
                <View style={styles.paramHeader}>
                  <Text style={styles.paramLabel}>Scale</Text>
                  <Text style={styles.paramValue}>{scale.toFixed(1)}x</Text>
                </View>
                <View style={styles.paramTrack}>
                  <View
                    style={[
                      styles.paramFill,
                      { width: `${((scale - 0.5) / 1.5) * 100}%` },
                    ]}
                  />
                </View>
                <View style={styles.paramStepRow}>
                  <Pressable
                    onPress={() => setScale(Math.max(0.5, scale - 0.25))}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setScale(Math.min(2.0, scale + 0.25))}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.paramBox}>
                <View style={styles.paramHeader}>
                  <Text style={styles.paramLabel}>Rotation</Text>
                  <Text style={styles.paramValue}>{rotation}deg</Text>
                </View>
                <View style={styles.paramTrack}>
                  <View
                    style={[
                      styles.paramFill,
                      { width: `${(rotation / 360) * 100}%` },
                    ]}
                  />
                </View>
                <View style={styles.paramStepRow}>
                  <Pressable
                    onPress={() => setRotation((prev) => (prev - 45 + 360) % 360)}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRotation((prev) => (prev + 45) % 360)}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Motif Results Grid */}
            <Text style={styles.sectionLabel}>Seamless motifs</Text>
            {isMotifLoading ? (
              <View style={{ gap: 10 }}>
                <View style={styles.gridRow}>
                  <Shimmer height={105} width="48%" borderRadius={14} />
                  <Shimmer height={105} width="48%" borderRadius={14} />
                  <Shimmer height={105} width="48%" borderRadius={14} />
                  <Shimmer height={105} width="48%" borderRadius={14} />
                </View>
                <Button
                  label="Cancel"
                  size="small"
                  variant="ghost"
                  onPress={() => {
                    abortControllerRef.current?.abort();
                    setIsMotifLoading(false);
                  }}
                  style={{ alignSelf: 'center' }}
                />
              </View>
            ) : motifError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>Try again</Text>
                <Button
                  label="Retry"
                  size="small"
                  variant="outline"
                  onPress={handleGenerateMotifs}
                />
              </View>
            ) : (
              <View style={styles.gridRow}>
                {motifs.map((motif) => {
                  const isSelected = selectedMotifId === motif.id;
                  return (
                    <Pressable
                      key={motif.id}
                      onPress={() => {
                        triggerHaptic('light');
                        setSelectedMotifId(motif.id);
                      }}
                      style={[
                        styles.motifCard,
                        isSelected && styles.motifCardSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.motifPreviewBox,
                          { backgroundColor: motif.baseColor },
                        ]}
                      >
                        {motif.imageUrl ? (
                          <Image
                            source={{ uri: motif.imageUrl }}
                            style={styles.motifImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Svg width={46} height={46} viewBox="0 0 50 50">
                            <Path
                              d={motif.previewSvg}
                              fill={motif.accentColor}
                              opacity={0.9}
                            />
                          </Svg>
                        )}
                      </View>
                      <Text style={styles.motifTitle} numberOfLines={1}>
                        {motif.name}
                      </Text>
                      <Text style={styles.motifHelper} numberOfLines={1}>
                        {motif.helper}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Fabric Preview & Non-destructive Apply Actions */}
            {activeMotif && (
              <View style={styles.motifApplySection}>
                <View style={styles.previewTemplateCard}>
                  <View style={[styles.drapePreviewBox, { backgroundColor: activeMotif.baseColor }]}>
                    {activeMotif.imageUrl ? (
                      <Image
                        source={{ uri: activeMotif.imageUrl }}
                        style={styles.drapeImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Svg width="100%" height={56} viewBox="0 0 200 50">
                        <Defs>
                          <LinearGradient id="drape_shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor={activeMotif.baseColor} stopOpacity="0.8" />
                            <Stop offset="50%" stopColor={activeMotif.accentColor} stopOpacity="0.45" />
                            <Stop offset="100%" stopColor={activeMotif.baseColor} stopOpacity="0.8" />
                          </LinearGradient>
                        </Defs>
                        <Rect x="0" y="0" width="200" height="50" fill="url(#drape_shimmer)" />
                        <Path d={activeMotif.borderBrushPath} stroke={activeMotif.accentColor} strokeWidth={2} fill="none" />
                      </Svg>
                    )}
                  </View>
                  <Text style={styles.drapeCardLabel}>Drape on fabric</Text>
                </View>

                {/* Apply Buttons: Sleeves, Body, and Border */}
                <View style={styles.applyButtonsRow}>
                  <Button
                    label="To sleeves"
                    size="small"
                    variant="primary"
                    onPress={() => handleApplyMotifPart('sleeves')}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="To body"
                    size="small"
                    variant="outline"
                    onPress={() => handleApplyMotifPart('body')}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Border"
                    size="small"
                    variant="secondary"
                    onPress={handleApplyBorder}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}

            {/* History Row */}
            {motifHistory.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionLabel}>History</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.historyRow}
                >
                  {motifHistory.map((item) => {
                    const isSelected = selectedMotifId === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          triggerHaptic('light');
                          if (!motifs.some((m) => m.id === item.id)) {
                            setMotifs((prev) => [item, ...prev]);
                          }
                          setSelectedMotifId(item.id);
                        }}
                        style={[
                          styles.historyCard,
                          isSelected && styles.motifCardSelected,
                        ]}
                      >
                        <View style={styles.historyThumbBox}>
                          {item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.historyThumb}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={[
                                styles.historyThumb,
                                { backgroundColor: item.baseColor },
                              ]}
                            />
                          )}
                        </View>
                        <Text style={styles.historyTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </ScrollView>
        )}

        {/* Tab 2: Clean Sketch */}
        {activeTab === 'clean' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
          >
            <View style={styles.headerInfoRow}>
              <View>
                <Text style={styles.sectionLabel}>Stroke clean up</Text>
                <Text style={styles.microHelper}>Catmull Rom smoothing</Text>
              </View>
              <Button
                label="Clean up"
                size="small"
                variant="outline"
                onPress={handleCleanSketch}
              />
            </View>

            {isCleanLoading ? (
              <Shimmer height={220} borderRadius={16} />
            ) : cleanResult ? (
              <View style={styles.cleanComparisonCard}>
                <View style={styles.cleanCanvasWrapper}>
                  <Svg width="100%" height={180} viewBox="100 120 200 380">
                    {sliderPosition < 0.9 && (
                      <Path
                        d={cleanResult.beforeSvgPath}
                        stroke="#A0A0AB"
                        strokeWidth={2}
                        strokeDasharray="4,3"
                        fill="none"
                        opacity={1 - sliderPosition}
                      />
                    )}
                    {sliderPosition > 0.1 && (
                      <Path
                        d={cleanResult.afterSvgPath}
                        stroke={colors.accent}
                        strokeWidth={2.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity={sliderPosition}
                      />
                    )}
                  </Svg>
                </View>

                {/* Before / After Slider Toggle */}
                <View style={styles.sliderControlRow}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic('light');
                      setSliderPosition(0.0);
                    }}
                    style={[
                      styles.sliderPill,
                      sliderPosition < 0.3 && styles.sliderPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sliderPillText,
                        sliderPosition < 0.3 && styles.sliderPillTextActive,
                      ]}
                    >
                      Before
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      triggerHaptic('light');
                      setSliderPosition(0.5);
                    }}
                    style={[
                      styles.sliderPill,
                      sliderPosition >= 0.3 &&
                        sliderPosition <= 0.7 &&
                        styles.sliderPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sliderPillText,
                        sliderPosition >= 0.3 &&
                          sliderPosition <= 0.7 &&
                          styles.sliderPillTextActive,
                      ]}
                    >
                      50 / 50
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      triggerHaptic('light');
                      setSliderPosition(1.0);
                    }}
                    style={[
                      styles.sliderPill,
                      sliderPosition > 0.7 && styles.sliderPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sliderPillText,
                        sliderPosition > 0.7 && styles.sliderPillTextActive,
                      ]}
                    >
                      After
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.metricsRow}>
                  <Text style={styles.metricText}>
                    {cleanResult.reductionPercentage}
                  </Text>
                  <Text style={styles.metricMuted}>Non destructive</Text>
                </View>

                <Button
                  label="Apply clean"
                  variant="primary"
                  size="medium"
                  onPress={handleApplyClean}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : null}
          </ScrollView>
        )}

        {/* Tab 3: Palette Harmonizer (Color Combos, Jewellery & Footwear) */}
        {activeTab === 'palette' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
          >
            {/* Base Hue Selector */}
            <View style={styles.headerInfoRow}>
              <View>
                <Text style={styles.sectionLabel}>Pick base tone</Text>
                <Text style={styles.microHelper}>Harmonizes full look</Text>
              </View>
              <Button
                label="From photo"
                size="small"
                variant="outline"
                onPress={handlePickPhoto}
              />
            </View>

            {/* Preset Color Swatches Strip */}
            <View style={styles.presetHueRow}>
              {PRESET_BASE_COLORS.map((hue) => {
                const isSelected = selectedBaseColor === hue.hex;
                return (
                  <Pressable
                    key={hue.name}
                    onPress={() => handleHarmonize(hue.hex)}
                    style={[
                      styles.hueButton,
                      isSelected && styles.hueButtonSelected,
                    ]}
                  >
                    <View style={[styles.hueCircle, { backgroundColor: hue.hex }]} />
                    <Text
                      style={[
                        styles.hueText,
                        isSelected && styles.hueTextSelected,
                      ]}
                    >
                      {hue.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isHarmonizerLoading ? (
              <View style={{ gap: 12 }}>
                <Shimmer height={68} borderRadius={14} />
                <Shimmer height={90} borderRadius={14} />
                <Shimmer height={90} borderRadius={14} />
              </View>
            ) : harmonizerError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>Try again</Text>
                <Button
                  label="Retry"
                  size="small"
                  variant="outline"
                  onPress={() => handleHarmonize(selectedBaseColor)}
                />
              </View>
            ) : wardrobeResult ? (
              <View style={{ gap: 14 }}>
                {/* Row 1: Color Combinations (Swatches) */}
                <View>
                  <Text style={styles.harmonizerRowTitle}>1. Color palettes</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalCardRow}
                  >
                    {wardrobeResult.palettes.map((pal) => (
                      <Pressable
                        key={pal.id}
                        onPress={() => handleApplyPaletteToGarment(pal)}
                        style={styles.palComboCard}
                      >
                        <View style={styles.palHeader}>
                          <Text style={styles.palCardTitle}>{pal.name}</Text>
                          <Text style={styles.palCardType}>{pal.harmony}</Text>
                        </View>
                        <View style={styles.palStrip}>
                          {pal.colors.map((c, i) => (
                            <View
                              key={i}
                              style={[
                                styles.palChip,
                                { backgroundColor: c },
                                i === 0 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                                i === pal.colors.length - 1 && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                              ]}
                            />
                          ))}
                        </View>
                        <Text style={styles.applyHint}>Tap to apply</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Row 2: Jewellery Pairings */}
                <View>
                  <Text style={styles.harmonizerRowTitle}>2. Jewellery pairings</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalCardRow}
                  >
                    {wardrobeResult.jewellery.map((jewel) => (
                      <View key={jewel.id} style={styles.jewelCard}>
                        <View style={styles.jewelIconRow}>
                          {jewel.name === 'Kundan' || jewel.name === 'Polki' ? (
                            <Gem size={16} color={jewel.metal === 'silver' ? '#718096' : '#D4AF37'} strokeWidth={1.8} />
                          ) : jewel.name === 'Jadau' ? (
                            <Crown size={16} color="#D4AF37" strokeWidth={1.8} />
                          ) : jewel.name === 'Pearl' ? (
                            <CircleDot size={16} color="#8A8794" strokeWidth={1.8} />
                          ) : (
                            <Sparkles size={16} color={jewel.metal === 'silver' ? '#718096' : '#D4AF37'} strokeWidth={1.8} />
                          )}
                          <View
                            style={[
                              styles.metalBadge,
                              { backgroundColor: jewel.metal === 'silver' ? '#EDF2F7' : '#FEFCBF' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.metalBadgeText,
                                { color: jewel.metal === 'silver' ? '#4A5568' : '#975A16' },
                              ]}
                            >
                              {jewel.metal}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.jewelTitle}>{jewel.name}</Text>
                        <Text style={styles.jewelTag} numberOfLines={2}>
                          {jewel.tag}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Row 3: Footwear Matches */}
                <View>
                  <Text style={styles.harmonizerRowTitle}>3. Footwear matches</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalCardRow}
                  >
                    {wardrobeResult.footwear.map((shoe) => (
                      <View key={shoe.id} style={styles.shoeCard}>
                        <View style={styles.shoeBadge}>
                          <Text style={styles.shoeBadgeText}>
                            {shoe.styleCategory}
                          </Text>
                        </View>
                        <Text style={styles.shoeTitle}>{shoe.name}</Text>
                        <Text style={styles.shoeTag} numberOfLines={2}>
                          {shoe.tag}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : null}
          </ScrollView>
        )}

        {/* Tab 4: Garment Variants */}
        {activeTab === 'variants' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
          >
            <View style={styles.headerInfoRow}>
              <View>
                <Text style={styles.sectionLabel}>Garment variants</Text>
                <Text style={styles.microHelper}>Alternate cutlines</Text>
              </View>
              <Button
                label="Generate"
                size="small"
                variant="outline"
                onPress={handleGenerateVariants}
              />
            </View>

            {isVariantsLoading ? (
              <View style={{ gap: 12 }}>
                <SkeletonCard width="100%" height={100} />
                <SkeletonCard width="100%" height={100} />
                <SkeletonCard width="100%" height={100} />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {variants.map((v) => {
                  const isSelected = selectedVariantId === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => {
                        triggerHaptic('light');
                        setSelectedVariantId(v.id);
                      }}
                      style={[
                        styles.variantCard,
                        isSelected && styles.variantCardSelected,
                      ]}
                    >
                      <View style={styles.variantTop}>
                        <View style={styles.variantBadge}>
                          <Text style={styles.variantBadgeText}>{v.feature}</Text>
                        </View>
                        <Text style={styles.variantTitle}>{v.title}</Text>
                      </View>
                      <Text style={styles.variantHelper}>{v.helper}</Text>

                      {isSelected && (
                        <View style={styles.variantActions}>
                          <Button
                            label="Duplicate layer"
                            size="small"
                            variant="outline"
                            onPress={() => handleApplyVariant(v, 'duplicate')}
                            style={{ flex: 1 }}
                          />
                          <Button
                            label="Replace cut"
                            size="small"
                            variant="primary"
                            onPress={() => handleApplyVariant(v, 'replace')}
                            style={{ flex: 1 }}
                          />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceGhost,
    borderRadius: radius.chips,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: radius.chips,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.soft,
  },
  tabText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  tabContent: {
    paddingBottom: 24,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  promptInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.small,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.ink,
  },
  sectionLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: spacing.sm,
  },
  styleChip: {
    backgroundColor: colors.surfaceGhost,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.chips,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  styleChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.accent,
    ...shadows.soft,
  },
  styleChipText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  styleChipTextActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  paramControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.sm,
  },
  paramBox: {
    flex: 1,
    backgroundColor: colors.surfaceGhost,
    borderRadius: radius.small,
    padding: 8,
  },
  paramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paramLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
  },
  paramValue: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.ink,
    fontWeight: '600',
  },
  paramTrack: {
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  paramFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  paramStepRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  stepBtn: {
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineSubtle,
  },
  stepBtnText: {
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.sm,
  },
  motifCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    padding: 8,
    alignItems: 'center',
  },
  motifCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  motifPreviewBox: {
    width: '100%',
    height: 64,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  motifTitle: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  motifHelper: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  motifApplySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    padding: 10,
    marginTop: 4,
  },
  previewTemplateCard: {
    marginBottom: 10,
  },
  drapePreviewBox: {
    borderRadius: radius.small,
    overflow: 'hidden',
    marginBottom: 4,
  },
  drapeCardLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  applyButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  microHelper: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  cleanComparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    padding: 14,
  },
  cleanCanvasWrapper: {
    height: 180,
    backgroundColor: colors.canvasPaper,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  sliderControlRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceGhost,
    borderRadius: radius.chips,
    padding: 3,
    marginTop: 14,
  },
  sliderPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radius.chips,
  },
  sliderPillActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.soft,
  },
  sliderPillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  sliderPillTextActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  metricText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#38A169',
  },
  metricMuted: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
  },
  presetHueRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  hueButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radius.small,
    backgroundColor: colors.surfaceGhost,
  },
  hueButtonSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.accent,
    ...shadows.soft,
  },
  hueCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 3,
  },
  hueText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: colors.textMuted,
  },
  hueTextSelected: {
    color: colors.ink,
    fontWeight: '600',
  },
  harmonizerRowTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  horizontalCardRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  palComboCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    padding: 8,
    ...shadows.soft,
  },
  palHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  palCardTitle: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
  },
  palCardType: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  palStrip: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  palChip: {
    flex: 1,
    height: '100%',
  },
  applyHint: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: colors.accent,
    fontWeight: '600',
  },
  jewelCard: {
    width: 135,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    padding: 10,
    ...shadows.soft,
  },
  jewelIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metalBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  metalBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  jewelTitle: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  jewelTag: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: colors.textMuted,
    lineHeight: 12,
  },
  shoeCard: {
    width: 135,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    padding: 10,
    ...shadows.soft,
  },
  shoeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceGhost,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginBottom: 6,
  },
  shoeBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 8,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  shoeTitle: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  shoeTag: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: colors.textMuted,
    lineHeight: 12,
  },
  variantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    padding: 12,
  },
  variantCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  variantTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  variantBadge: {
    backgroundColor: colors.surfaceGhost,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  variantBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    fontWeight: '600',
    color: colors.ink,
    textTransform: 'uppercase',
  },
  variantTitle: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  variantHelper: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  variantActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  errorBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceGhost,
    borderRadius: radius.small,
    marginVertical: 12,
    gap: 8,
  },
  errorText: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 13,
    color: colors.textMuted,
  },
  motifImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.small,
  },
  drapeImage: {
    width: '100%',
    height: 56,
    borderRadius: radius.small,
  },
  historySection: {
    marginTop: 14,
    marginBottom: 4,
  },
  historyRow: {
    gap: 10,
    paddingVertical: 4,
  },
  historyCard: {
    width: 80,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    padding: 6,
    ...shadows.soft,
  },
  historyThumbBox: {
    width: 68,
    height: 68,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surfaceGhost,
    marginBottom: 4,
  },
  historyThumb: {
    width: '100%',
    height: '100%',
  },
  historyTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: colors.ink,
    textAlign: 'center',
  },
});
