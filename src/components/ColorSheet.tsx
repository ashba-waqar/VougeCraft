import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
  PanResponder,
  Alert,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Rect, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import {
  Disc,
  Palette,
  SunMedium,
  Bookmark,
  Pipette,
  Image as ImageIcon,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../theme';
import { Sheet } from './Sheet';
import {
  READY_PALETTES,
  PaletteColor,
  SavedPalette,
  getNearestColorName,
  generateShadesAndTints,
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToHex,
  getSavedPalettes,
  storeSavedPalettes,
  extractHarmoniousPhotoPalette,
} from '../data/colorPalettes';
import { useCanvasStore } from '../store/canvasStore';
import { triggerHaptic } from '../utils/haptics';
import { usePalettes } from '../hooks/usePalettes';

interface ColorSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectColor?: (hex: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedView = Animated.View as any;

type TabType = 'Wheel' | 'Palettes' | 'Shades' | 'Saved';

export const ColorSheet: React.FC<ColorSheetProps> = ({
  visible,
  onClose,
  onSelectColor,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('Wheel');
  const toolSettings = useCanvasStore((state) => state.toolSettings);
  const selectColorStore = useCanvasStore((state) => state.selectColor);
  const sketch = useCanvasStore((state) => state.sketch);
  const activeLayerId = useCanvasStore((state) => state.activeLayerId);

  // Active color states
  const currentColor = toolSettings.color || '#0E0E10';
  const [hexInput, setHexInput] = useState<string>(currentColor);
  const [hsv, setHsv] = useState<{ h: number; s: number; v: number }>(() => {
    const rgb = hexToRgb(currentColor);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  });

  // Saved palettes hook & state
  const {
    palettes: savedPalettes,
    savePalette,
    deletePalette,
    refresh: refreshPalettes,
  } = usePalettes();
  const [isNamingPalette, setIsNamingPalette] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState('');

  // Long press inspector state
  const [inspectedColor, setInspectedColor] = useState<{
    name: string;
    hex: string;
    paletteName?: string;
  } | null>(null);

  // Feedback toast for eyedropper/save actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state when opening or when currentColor changes
  useEffect(() => {
    if (visible) {
      triggerHaptic('light');
      setHexInput(currentColor);
      const rgb = hexToRgb(currentColor);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));

      // Load saved palettes from database/cache
      refreshPalettes();
    }
  }, [visible, currentColor]);

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  // Apply chosen color
  const applyColor = (hex: string) => {
    const formatted = hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
    triggerHaptic('selection');
    setHexInput(formatted);
    const rgb = hexToRgb(formatted);
    setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));

    selectColorStore(formatted);
    if (onSelectColor) {
      onSelectColor(formatted);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Eyedropper: sample tone from canvas active layer or strokes
  const handleEyedropper = () => {
    triggerHaptic('medium');
    let sampled = '#7F0020';

    const activeLayer = sketch.layers.find((l) => l.id === activeLayerId);
    if (activeLayer && activeLayer.items.length > 0) {
      const lastItem = activeLayer.items[activeLayer.items.length - 1];
      if (lastItem.type === 'stroke' && (lastItem as any).color) {
        sampled = (lastItem as any).color;
      } else if (lastItem.type === 'shape' && (lastItem as any).stroke?.color) {
        sampled = (lastItem as any).stroke.color;
      }
    } else {
      // Sample from any available layer
      for (const layer of sketch.layers) {
        if (layer.items.length > 0) {
          const item = layer.items[0];
          if ((item as any).color) {
            sampled = (item as any).color;
            break;
          }
        }
      }
    }

    applyColor(sampled);
    showToast(`Sampled ${getNearestColorName(sampled)}`);
  };

  // From photo dominant color extraction
  const handlePickFromPhoto = async () => {
    try {
      triggerHaptic('light');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const photoColors = extractHarmoniousPhotoPalette(result.assets[0].uri);
        await savePalette('Photo Palette', photoColors);

        applyColor(photoColors[0]);
        setActiveTab('Saved');
        showToast('Photo palette extracted');
      }
    } catch {
      showToast('Could not load');
    }
  };

  // Save current color
  const handleSaveCurrentColor = async () => {
    triggerHaptic('medium');
    const existing = savedPalettes.find((p) => p.name === 'Custom Tones');
    if (existing) {
      const mergedColors = [currentColor, ...existing.colors.filter((c) => c !== currentColor)].slice(0, 10);
      await savePalette('Custom Tones', mergedColors);
    } else {
      await savePalette('Custom Tones', [currentColor]);
    }
    showToast('Saved tone');
  };

  // Save whole palette
  const handleSaveWholePalette = async () => {
    const name = newPaletteName.trim() || 'Custom Palette';
    const recentColors = useCanvasStore.getState().recentColors;
    await savePalette(name, recentColors.length > 0 ? recentColors : [currentColor]);
    setIsNamingPalette(false);
    setNewPaletteName('');
    showToast(`Saved "${name}"`);
  };

  // Delete saved palette
  const handleDeletePalette = (id: string, name: string) => {
    triggerHaptic('medium');
    Alert.alert('Delete palette', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePalette(id);
          showToast('Deleted');
        },
      },
    ]);
  };

  // Nearest fashion color name
  const colorName = getNearestColorName(currentColor);
  const { tints, shades } = generateShadesAndTints(currentColor);

  if (!visible) return null;

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      headerComponent={
        <View style={styles.sheetBlur}>
          {/* Top Swatch & Action Header */}
          <View style={styles.topHeader}>
            {/* Large Preview Swatch Tile */}
            <View style={styles.swatchInfoRow}>
              <View
                style={[
                  styles.previewSwatch,
                  { backgroundColor: currentColor },
                  (currentColor.toUpperCase() === '#FFFFFF' ||
                    currentColor.toUpperCase() === '#FFFFF0') &&
                    styles.lightSwatchBorder,
                ]}
              />
              <View style={styles.colorMetaCol}>
                <Text numberOfLines={1} style={styles.colorNameTitle}>
                  {colorName}
                </Text>
                <Text style={styles.hexSubtitle}>{currentColor.toUpperCase()}</Text>
              </View>
            </View>

            {/* Action Buttons: From Photo & Eyedropper */}
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="From photo"
                onPress={handlePickFromPhoto}
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && styles.actionBtnPressed,
                ]}
              >
                <ImageIcon size={15} color={colors.ink} strokeWidth={1.8} />
                <Text style={styles.actionBtnLabel}>From photo</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sample canvas"
                onPress={handleEyedropper}
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && styles.actionBtnPressed,
                ]}
              >
                <Pipette size={15} color={colors.ink} strokeWidth={1.8} />
                <Text style={styles.actionBtnLabel}>Sample</Text>
              </Pressable>
            </View>
          </View>

          {/* Floating Toast Pill */}
          {toastMessage && (
            <View style={styles.toastPill}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* 4 Tabs Selector */}
          <View style={styles.tabBar}>
            {(
              [
                { key: 'Wheel', icon: Disc, label: 'Wheel' },
                { key: 'Palettes', icon: Palette, label: 'Palettes' },
                { key: 'Shades', icon: SunMedium, label: 'Shades' },
                { key: 'Saved', icon: Bookmark, label: 'Saved' },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="button"
                  accessibilityLabel={tab.label}
                  onPress={() => {
                    triggerHaptic('light');
                    setActiveTab(tab.key);
                  }}
                  style={[
                    styles.tabItem,
                    isActive && styles.tabItemActive,
                  ]}
                >
                  <Icon
                    size={15}
                    color={isActive ? '#FFFFFF' : colors.graphite}
                    strokeWidth={isActive ? 2 : 1.75}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
    >
      <View style={styles.bodyContent}>
              {/* TAB 1: WHEEL */}
              {activeTab === 'Wheel' && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.wheelScrollContent}
                >
                  {/* Circular Color Wheel Spectrum */}
                  <View style={styles.wheelContainer}>
                    <Svg width={180} height={180} viewBox="0 0 180 180">
                      <Defs>
                        {Array.from({ length: 24 }).map((_, i) => {
                          const angle = i * 15;
                          const nextAngle = (i + 1) * 15;
                          const hex1 = hsvToHex(angle, hsv.s, hsv.v);
                          const hex2 = hsvToHex(nextAngle, hsv.s, hsv.v);
                          return (
                            <LinearGradient
                              key={i}
                              id={`wheelGrad_${i}`}
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <Stop offset="0%" stopColor={hex1} />
                              <Stop offset="100%" stopColor={hex2} />
                            </LinearGradient>
                          );
                        })}
                      </Defs>
                      {/* Outer Ring Hue Segments */}
                      {Array.from({ length: 24 }).map((_, i) => {
                        const startAngle = (i * 15 - 90) * (Math.PI / 180);
                        const endAngle = ((i + 1) * 15 - 90) * (Math.PI / 180);
                        const rOuter = 82;
                        const rInner = 56;
                        const x1 = 90 + rOuter * Math.cos(startAngle);
                        const y1 = 90 + rOuter * Math.sin(startAngle);
                        const x2 = 90 + rOuter * Math.cos(endAngle);
                        const y2 = 90 + rOuter * Math.sin(endAngle);
                        const x3 = 90 + rInner * Math.cos(endAngle);
                        const y3 = 90 + rInner * Math.sin(endAngle);
                        const x4 = 90 + rInner * Math.cos(startAngle);
                        const y4 = 90 + rInner * Math.sin(startAngle);

                        const pathData = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`;
                        const segmentHex = hsvToHex(i * 15, hsv.s, hsv.v);

                        return (
                          <Path
                            key={i}
                            d={pathData}
                            fill={segmentHex}
                            onPress={() => {
                              const newHue = i * 15;
                              const updated = { ...hsv, h: newHue };
                              setHsv(updated);
                              applyColor(hsvToHex(updated.h, updated.s, updated.v));
                            }}
                          />
                        );
                      })}
                      {/* Center Swatch Circle */}
                      <Circle
                        cx={90}
                        cy={90}
                        r={44}
                        fill={currentColor}
                        stroke="#FFFFFF"
                        strokeWidth={3}
                      />
                    </Svg>
                  </View>

                  {/* Sliders: Hue, Saturation, Brightness */}
                  <View style={styles.slidersBlock}>
                    {/* Hue strip */}
                    <Text style={styles.sliderLabel}>Hue</Text>
                    <View style={styles.hueStripRow}>
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                        const hHex = hsvToHex(angle, 80, 85);
                        return (
                          <Pressable
                            key={angle}
                            accessibilityLabel={`Hue ${angle}`}
                            onPress={() => {
                              const updated = { ...hsv, h: angle };
                              setHsv(updated);
                              applyColor(hsvToHex(updated.h, updated.s, updated.v));
                            }}
                            style={[
                              styles.hueDot,
                              { backgroundColor: hHex },
                              Math.abs(hsv.h - angle) < 25 && styles.hueDotActive,
                            ]}
                          />
                        );
                      })}
                    </View>

                    {/* Saturation strip */}
                    <Text style={styles.sliderLabel}>Saturation ({hsv.s}%)</Text>
                    <View style={styles.stepsRow}>
                      {[15, 35, 55, 75, 95].map((sVal) => {
                        const sHex = hsvToHex(hsv.h, sVal, hsv.v);
                        return (
                          <Pressable
                            key={sVal}
                            accessibilityLabel={`Saturation ${sVal}`}
                            onPress={() => {
                              const updated = { ...hsv, s: sVal };
                              setHsv(updated);
                              applyColor(hsvToHex(updated.h, updated.s, updated.v));
                            }}
                            style={[
                              styles.stepPill,
                              { backgroundColor: sHex },
                              Math.abs(hsv.s - sVal) < 12 && styles.stepPillActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.stepPillText,
                                { color: sVal > 50 ? '#FFFFFF' : '#0E0E10' },
                              ]}
                            >
                              {sVal}%
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Brightness strip */}
                    <Text style={styles.sliderLabel}>Brightness ({hsv.v}%)</Text>
                    <View style={styles.stepsRow}>
                      {[20, 40, 60, 80, 100].map((vVal) => {
                        const vHex = hsvToHex(hsv.h, hsv.s, vVal);
                        return (
                          <Pressable
                            key={vVal}
                            accessibilityLabel={`Brightness ${vVal}`}
                            onPress={() => {
                              const updated = { ...hsv, v: vVal };
                              setHsv(updated);
                              applyColor(hsvToHex(updated.h, updated.s, updated.v));
                            }}
                            style={[
                              styles.stepPill,
                              { backgroundColor: vHex },
                              Math.abs(hsv.v - vVal) < 12 && styles.stepPillActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.stepPillText,
                                { color: vVal > 50 ? '#FFFFFF' : '#B8B5C0' },
                              ]}
                            >
                              {vVal}%
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Hex Input Row */}
                  <View style={styles.hexInputCard}>
                    <Text style={styles.hexPrefix}>#</Text>
                    <TextInput
                      value={hexInput.replace('#', '')}
                      onChangeText={(t) => {
                        setHexInput(`#${t}`);
                        if (/^[0-9A-Fa-f]{6}$/.test(t)) {
                          applyColor(`#${t}`);
                        }
                      }}
                      autoCapitalize="characters"
                      maxLength={6}
                      placeholder="7F0020"
                      placeholderTextColor={colors.textLight}
                      style={styles.hexTextInput}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Save colour"
                      onPress={handleSaveCurrentColor}
                      style={styles.saveToneBtn}
                    >
                      <Plus size={14} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.saveToneBtnText}>Save</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}

              {/* TAB 2: PALETTES */}
              {activeTab === 'Palettes' && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.palettesScrollContent}
                >
                  {READY_PALETTES.map((palette) => (
                    <View key={palette.id} style={styles.paletteSection}>
                      <View style={styles.paletteSectionHeader}>
                        <Text style={styles.paletteTitle}>{palette.name}</Text>
                        {palette.description && (
                          <Text style={styles.paletteDescription}>
                            {palette.description}
                          </Text>
                        )}
                      </View>

                      {/* Swatches Grid */}
                      <View style={styles.swatchesGrid}>
                        {palette.colors.map((colorItem) => {
                          const isSelected =
                            currentColor.toUpperCase() ===
                            colorItem.hex.toUpperCase();
                          return (
                            <Pressable
                              key={colorItem.hex}
                              accessibilityRole="button"
                              accessibilityLabel={`${colorItem.name} ${colorItem.hex}`}
                              onPress={() => applyColor(colorItem.hex)}
                              onLongPress={() => {
                                triggerHaptic('selection');
                                setInspectedColor({
                                  name: colorItem.name,
                                  hex: colorItem.hex,
                                  paletteName: palette.name,
                                });
                              }}
                              style={[
                                styles.swatchBtn,
                                isSelected && styles.swatchBtnSelected,
                              ]}
                            >
                              <View
                                style={[
                                  styles.swatchChip,
                                  { backgroundColor: colorItem.hex },
                                ]}
                              >
                                {isSelected && (
                                  <Check
                                    size={14}
                                    color={
                                      colorItem.hex.toUpperCase() === '#FFFFF0' ||
                                      colorItem.hex.toUpperCase() === '#FFFFFF' ||
                                      colorItem.hex.toUpperCase() === '#F7E7CE'
                                        ? '#0E0E10'
                                        : '#FFFFFF'
                                    }
                                    strokeWidth={2.5}
                                  />
                                )}
                              </View>
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.swatchLabel,
                                  isSelected && styles.swatchLabelSelected,
                                ]}
                              >
                                {colorItem.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* TAB 3: SHADES */}
              {activeTab === 'Shades' && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.shadesScrollContent}
                >
                  <Text style={styles.shadesHeaderLabel}>Lighter tints</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.shadeStripRow}
                  >
                    {tints.map((tHex, idx) => {
                      const isSelected =
                        currentColor.toUpperCase() === tHex.toUpperCase();
                      return (
                        <Pressable
                          key={`tint_${idx}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Tint ${idx + 1}`}
                          onPress={() => applyColor(tHex)}
                          style={[
                            styles.shadeTileWrapper,
                            isSelected && styles.shadeTileActive,
                          ]}
                        >
                          <View
                            style={[
                              styles.shadeTile,
                              { backgroundColor: tHex },
                            ]}
                          />
                          <Text style={styles.shadeStepText}>+{idx + 1}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <Text style={[styles.shadesHeaderLabel, { marginTop: spacing.md }]}>
                    Darker shades
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.shadeStripRow}
                  >
                    {shades.map((sHex, idx) => {
                      const isSelected =
                        currentColor.toUpperCase() === sHex.toUpperCase();
                      return (
                        <Pressable
                          key={`shade_${idx}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Shade ${idx + 1}`}
                          onPress={() => applyColor(sHex)}
                          style={[
                            styles.shadeTileWrapper,
                            isSelected && styles.shadeTileActive,
                          ]}
                        >
                          <View
                            style={[
                              styles.shadeTile,
                              { backgroundColor: sHex },
                            ]}
                          />
                          <Text style={styles.shadeStepText}>-{idx + 1}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </ScrollView>
              )}

              {/* TAB 4: SAVED */}
              {activeTab === 'Saved' && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.savedScrollContent}
                >
                  {/* Action row to save palette */}
                  <View style={styles.savedActionRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Save colour"
                      onPress={handleSaveCurrentColor}
                      style={styles.saveActionPill}
                    >
                      <Plus size={14} color={colors.ink} strokeWidth={2} />
                      <Text style={styles.saveActionPillText}>Save colour</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Save palette"
                      onPress={() => setIsNamingPalette(true)}
                      style={[styles.saveActionPill, styles.saveActionPillPrimary]}
                    >
                      <Plus size={14} color="#FFFFFF" strokeWidth={2} />
                      <Text style={[styles.saveActionPillText, { color: '#FFFFFF' }]}>
                        Save palette
                      </Text>
                    </Pressable>
                  </View>

                  {/* Naming Input Modal/Strip */}
                  {isNamingPalette && (
                    <View style={styles.namePaletteCard}>
                      <TextInput
                        value={newPaletteName}
                        onChangeText={setNewPaletteName}
                        placeholder="Palette name"
                        placeholderTextColor={colors.textLight}
                        autoFocus
                        style={styles.nameInput}
                        maxLength={24}
                      />
                      <View style={styles.nameActionBtns}>
                        <Pressable
                          onPress={() => setIsNamingPalette(false)}
                          style={styles.nameCancelBtn}
                        >
                          <X size={14} color={colors.textMuted} strokeWidth={2} />
                        </Pressable>
                        <Pressable
                          onPress={handleSaveWholePalette}
                          style={styles.nameConfirmBtn}
                        >
                          <Check size={14} color="#FFFFFF" strokeWidth={2} />
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* Saved Palettes Grid */}
                  <View style={styles.savedList}>
                    {savedPalettes.map((item) => (
                      <Pressable
                        key={item.id}
                        onLongPress={() => handleDeletePalette(item.id, item.name)}
                        style={styles.savedCard}
                      >
                        <View style={styles.savedCardTop}>
                          <Text style={styles.savedCardTitle}>{item.name}</Text>
                          <Text style={styles.deleteHint}>Hold to delete</Text>
                        </View>
                        <View style={styles.savedChipsRow}>
                          {item.colors.map((cHex, i) => (
                            <Pressable
                              key={i}
                              onPress={() => applyColor(cHex)}
                              style={[
                                styles.savedChipDot,
                                { backgroundColor: cHex },
                                currentColor.toUpperCase() ===
                                  cHex.toUpperCase() &&
                                  styles.savedChipDotActive,
                              ]}
                            />
                          ))}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>

        {/* Long Press Detail Modal */}
        {inspectedColor && (
          <Modal
            transparent
            visible={Boolean(inspectedColor)}
            animationType="fade"
            onRequestClose={() => setInspectedColor(null)}
          >
            <Pressable
              style={styles.inspectBackdrop}
              onPress={() => setInspectedColor(null)}
            >
              <View style={styles.inspectCard}>
                <View
                  style={[
                    styles.inspectColorTile,
                    { backgroundColor: inspectedColor.hex },
                  ]}
                />
                <Text style={styles.inspectName}>{inspectedColor.name}</Text>
                <Text style={styles.inspectHex}>{inspectedColor.hex}</Text>
                {inspectedColor.paletteName && (
                  <Text style={styles.inspectPalette}>
                    {inspectedColor.paletteName} Palette
                  </Text>
                )}
                <Pressable
                  onPress={() => {
                    applyColor(inspectedColor.hex);
                    setInspectedColor(null);
                  }}
                  style={styles.inspectApplyBtn}
                >
                  <Text style={styles.inspectApplyText}>Apply colour</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 14, 16, 0.45)',
  },
  sheetContainer: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(255, 255, 255, 0.72)'
        : 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetBlur: {
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    backgroundColor: 'transparent',
  },
  dragHandleHit: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragPill: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(58, 10, 22, 0.28)',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  swatchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewSwatch: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  lightSwatchBorder: {
    borderColor: colors.line,
  },
  colorMetaCol: {
    justifyContent: 'center',
  },
  colorNameTitle: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  hexSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  actionBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  actionBtnLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
  },
  toastPill: {
    position: 'absolute',
    top: 55,
    alignSelf: 'center',
    backgroundColor: '#0E0E10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 99,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: spacing.lg,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 22,
    marginBottom: spacing.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  tabItemActive: {
    backgroundColor: colors.accent,
    ...shadows.soft,
  },
  tabLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.graphite,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bodyContent: {
    maxHeight: 380,
    minHeight: 280,
  },
  wheelScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  wheelContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  slidersBlock: {
    width: '100%',
    marginTop: spacing.xs,
  },
  sliderLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: 8,
  },
  hueStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hueDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.soft,
  },
  hueDotActive: {
    borderColor: colors.ink,
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepPill: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  stepPillActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hexInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: spacing.md,
    width: '100%',
  },
  hexPrefix: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginRight: 4,
  },
  hexTextInput: {
    flex: 1,
    fontFamily: typography.headline.fontFamily,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 1,
    paddingVertical: 6,
  },
  saveToneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  saveToneBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  palettesScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  paletteSection: {
    marginBottom: spacing.lg,
  },
  paletteSectionHeader: {
    marginBottom: 8,
  },
  paletteTitle: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  paletteDescription: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  swatchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchBtn: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - spacing.lg * 2 - 40) / 4,
  },
  swatchBtnSelected: {
    transform: [{ scale: 1.04 }],
  },
  swatchChip: {
    width: '100%',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  swatchLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.graphite,
    marginTop: 4,
    textAlign: 'center',
  },
  swatchLabelSelected: {
    fontWeight: '700',
    color: colors.accent,
  },
  shadesScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  shadesHeaderLabel: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
  },
  shadeStripRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  shadeTileWrapper: {
    alignItems: 'center',
  },
  shadeTile: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  shadeTileActive: {
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 12,
    padding: 2,
  },
  shadeStepText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  savedScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  savedActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  saveActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  saveActionPillPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  saveActionPillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  namePaletteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  nameInput: {
    flex: 1,
    fontFamily: typography.headline.fontFamily,
    fontSize: 13,
    color: colors.ink,
    paddingVertical: 6,
  },
  nameActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameCancelBtn: {
    padding: 6,
  },
  nameConfirmBtn: {
    backgroundColor: colors.accent,
    padding: 6,
    borderRadius: 8,
  },
  savedList: {
    gap: 10,
  },
  savedCard: {
    backgroundColor: colors.paperCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    ...shadows.soft,
  },
  savedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedCardTitle: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  deleteHint: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textLight,
  },
  savedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  savedChipDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  savedChipDotActive: {
    borderWidth: 2.5,
    borderColor: colors.accent,
    transform: [{ scale: 1.15 }],
  },
  inspectBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  inspectCard: {
    width: 240,
    backgroundColor: colors.paperCard,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.floating,
  },
  inspectColorTile: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  inspectName: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  inspectHex: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  inspectPalette: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
    marginTop: 4,
  },
  inspectApplyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 12,
  },
  inspectApplyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
