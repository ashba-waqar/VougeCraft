import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
} from 'react-native';
import { Sheet } from '../../components/Sheet';
import { colors, radius, spacing, typography } from '../../theme';
import { useCanvasStore } from '../../store/canvasStore';
import { FABRICS, PATTERNS } from '../fabrics';
import { FabricId, PatternId } from '../../types/canvas';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STUDIO_PALETTE = [
  '#0E0E10', // ink
  '#2C2C34', // graphite
  '#8A8794', // text muted
  '#7F0020', // atelier accent
  '#B85D3A', // terracotta
  '#2E3A59', // indigo
  '#587065', // sage
  '#7C6757', // raw umber
  '#78182E', // crimson brocade
  '#D4AF37', // antique gold
  '#E8D5D8', // rose chiffon
  '#F7F4EE', // paper cream
];

interface ColorFabricSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const ColorFabricSheet: React.FC<ColorFabricSheetProps> = ({
  visible,
  onClose,
}) => {
  const [tab, setTab] = useState<'Colors' | 'Fabrics' | 'Patterns'>('Colors');
  const [hexInput, setHexInput] = useState('#0E0E10');
  const [fillScale, setFillScale] = useState(1.0);
  const [fillRotation, setFillRotation] = useState(0);

  const toolSettings = useCanvasStore((state) => state.toolSettings);
  const updateToolSettings = useCanvasStore((state) => state.updateToolSettings);

  const handleSelectColor = (hex: string) => {
    triggerHaptic('selection');
    setHexInput(hex);
    updateToolSettings({
      color: hex,
      fill: {
        type: 'color',
        value: hex,
        scale: 1.0,
        rotation: 0,
      },
    });
  };

  const handleSelectFabric = (id: FabricId) => {
    triggerHaptic('selection');
    const fabric = FABRICS[id];
    updateToolSettings({
      color: fabric.baseColor,
      fill: {
        type: 'fabric',
        value: id,
        scale: fillScale,
        rotation: fillRotation,
      },
    });
  };

  const handleSelectPattern = (id: PatternId) => {
    triggerHaptic('selection');
    updateToolSettings({
      fill: {
        type: 'pattern',
        value: id,
        scale: fillScale,
        rotation: fillRotation,
      },
    });
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Palette and materials">
      {/* Tab toggle chips */}
      <View style={styles.tabRow}>
        {(['Colors', 'Fabrics', 'Patterns'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              triggerHaptic('selection');
              setTab(t);
            }}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
          >
            <Text
              style={[styles.tabText, tab === t && styles.tabTextActive]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Colors Tab */}
      {tab === 'Colors' && (
        <View style={styles.contentSection}>
          <Text style={styles.sectionSubtitle}>Studio palette</Text>
          <View style={styles.paletteGrid}>
            {STUDIO_PALETTE.map((hex) => (
              <Pressable
                key={hex}
                onPress={() => handleSelectColor(hex)}
                style={[
                  styles.colorCircleWrapper,
                  toolSettings.color === hex && styles.colorSelected,
                ]}
              >
                <View style={[styles.colorCircle, { backgroundColor: hex }]} />
              </Pressable>
            ))}
          </View>

          <View style={styles.hexInputRow}>
            <Text style={styles.hexLabel}>Hex code</Text>
            <TextInput
              value={hexInput}
              onChangeText={(text) => {
                setHexInput(text);
                if (text.startsWith('#') && (text.length === 4 || text.length === 7)) {
                  updateToolSettings({ color: text });
                }
              }}
              style={styles.hexInput}
              maxLength={7}
            />
          </View>
        </View>
      )}

      {/* Fabrics Tab */}
      {tab === 'Fabrics' && (
        <View style={styles.contentSection}>
          <Text style={styles.sectionSubtitle}>Procedural fabrics</Text>
          <View style={styles.swatchGrid}>
            {(Object.keys(FABRICS) as FabricId[]).map((id) => {
              const fabric = FABRICS[id];
              const isSelected =
                toolSettings.fill?.type === 'fabric' &&
                toolSettings.fill?.value === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => handleSelectFabric(id)}
                  style={[
                    styles.swatchCard,
                    isSelected && styles.swatchCardActive,
                  ]}
                >
                  <View
                    style={[
                      styles.swatchSquare,
                      { backgroundColor: fabric.baseColor },
                    ]}
                  />
                  <Text numberOfLines={1} style={styles.swatchName}>
                    {fabric.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.swatchDesc}>
                    {fabric.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Patterns Tab */}
      {tab === 'Patterns' && (
        <View style={styles.contentSection}>
          <Text style={styles.sectionSubtitle}>Fashion patterns</Text>
          <View style={styles.swatchGrid}>
            {(Object.keys(PATTERNS) as PatternId[]).map((id) => {
              const pat = PATTERNS[id];
              const isSelected =
                toolSettings.fill?.type === 'pattern' &&
                toolSettings.fill?.value === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => handleSelectPattern(id)}
                  style={[
                    styles.swatchCard,
                    isSelected && styles.swatchCardActive,
                  ]}
                >
                  <View
                    style={[
                      styles.swatchSquare,
                      { backgroundColor: colors.paperElevated },
                    ]}
                  />
                  <Text numberOfLines={1} style={styles.swatchName}>
                    {pat.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.swatchDesc}>
                    {pat.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Scale and rotation controls */}
      {(tab === 'Fabrics' || tab === 'Patterns') && (
        <View style={styles.transformRow}>
          <View style={styles.transformCol}>
            <Text style={styles.transformLabel}>Scale</Text>
            <View style={styles.scaleChips}>
              {[0.5, 1.0, 2.0].map((sc) => (
                <Pressable
                  key={sc}
                  onPress={() => {
                    triggerHaptic('selection');
                    setFillScale(sc);
                    if (toolSettings.fill) {
                      updateToolSettings({
                        fill: { ...toolSettings.fill, scale: sc },
                      });
                    }
                  }}
                  style={[
                    styles.miniChip,
                    fillScale === sc && styles.miniChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.miniChipText,
                      fillScale === sc && styles.miniChipTextActive,
                    ]}
                  >
                    {sc}x
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.transformCol}>
            <Text style={styles.transformLabel}>Rotation</Text>
            <View style={styles.scaleChips}>
              {[0, 45, 90].map((deg) => (
                <Pressable
                  key={deg}
                  onPress={() => {
                    triggerHaptic('selection');
                    setFillRotation(deg);
                    if (toolSettings.fill) {
                      updateToolSettings({
                        fill: { ...toolSettings.fill, rotation: deg },
                      });
                    }
                  }}
                  style={[
                    styles.miniChip,
                    fillRotation === deg && styles.miniChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.miniChipText,
                      fillRotation === deg && styles.miniChipTextActive,
                    ]}
                  >
                    {deg} deg
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.chips,
    backgroundColor: colors.paperElevated,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  tabText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.graphite,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  contentSection: {
    paddingBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  colorCircleWrapper: {
    padding: 2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: colors.accent,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hexLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.graphite,
  },
  hexInput: {
    backgroundColor: colors.paperElevated,
    borderRadius: radius.buttons,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    width: 100,
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.ink,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  swatchCard: {
    width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.sm) / 2,
    backgroundColor: colors.paperElevated,
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    alignItems: 'center',
  },
  swatchCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  swatchSquare: {
    width: 38,
    height: 38,
    borderRadius: radius.buttons,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  swatchName: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 12,
    color: colors.ink,
  },
  swatchDesc: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  transformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lineSubtle,
  },
  transformCol: {
    flex: 1,
  },
  transformLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  scaleChips: {
    flexDirection: 'row',
    gap: 4,
  },
  miniChip: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: radius.chips,
    backgroundColor: colors.paperElevated,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  miniChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  miniChipText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.graphite,
    fontWeight: '600',
  },
  miniChipTextActive: {
    color: '#FFFFFF',
  },
});
