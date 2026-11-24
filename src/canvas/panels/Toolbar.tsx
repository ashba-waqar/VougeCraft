import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Pencil,
  PenTool,
  Highlighter,
  Paintbrush,
  Eraser,
  Slash,
  Square,
  PaintBucket,
  LassoSelect,
  Type,
  Plus,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ToolType } from '../../types/canvas';
import { useCanvasStore } from '../../store/canvasStore';
import { triggerHaptic } from '../../utils/haptics';

interface ToolButtonConfig {
  type: ToolType;
  icon: any;
  label: string;
}

const TOOLS: ToolButtonConfig[] = [
  { type: 'pencil', icon: Pencil, label: 'Pencil' },
  { type: 'fineliner', icon: PenTool, label: 'Fine liner' },
  { type: 'marker', icon: Highlighter, label: 'Marker' },
  { type: 'brush', icon: Paintbrush, label: 'Brush' },
  { type: 'eraser', icon: Eraser, label: 'Eraser' },
  { type: 'line', icon: Slash, label: 'Line' },
  { type: 'shape', icon: Square, label: 'Shape' },
  { type: 'fill', icon: PaintBucket, label: 'Fill' },
  { type: 'lasso', icon: LassoSelect, label: 'Lasso' },
  { type: 'textNote', icon: Type, label: 'Text' },
];

const FALLBACK_RECENT = [
  '#7F0020',
  '#3A0A16',
  '#0E0E10',
  '#B85D3A',
  '#C9A24B',
  '#2D5A27',
];

interface ToolbarProps {
  onOpenColorPicker?: () => void;
  isDrawing?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenColorPicker }) => {
  const insets = useSafeAreaInsets();
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const toolSettings = useCanvasStore((state) => state.toolSettings);
  const updateToolSettings = useCanvasStore((state) => state.updateToolSettings);
  const recentColors = useCanvasStore((state) => state.recentColors);
  const selectColor = useCanvasStore((state) => state.selectColor);

  const [isSizePopoverOpen, setIsSizePopoverOpen] = useState(false);

  const handleSelectTool = (type: ToolType) => {
    triggerHaptic('light');
    setActiveTool(type);
  };

  const handleSelectColor = (hex: string) => {
    triggerHaptic('selection');
    selectColor(hex);
  };

  const rawColors =
    recentColors && recentColors.length > 0 ? recentColors : FALLBACK_RECENT;
  const displayRecentColors = [
    '#7F0020',
    ...rawColors.filter((c) => c.toUpperCase() !== '#7F0020'),
  ].slice(0, 6);

  return (
    <View
      style={[
        styles.fixedBottomContainer,
        { paddingBottom: insets.bottom + 8 },
      ]}
    >
      {/* Row 1: Tool icons in a horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsScrollContent}
        style={styles.toolsScrollView}
      >
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.type;
          return (
            <Pressable
              key={t.type}
              accessibilityRole="button"
              accessibilityLabel={t.label}
              onPress={() => handleSelectTool(t.type)}
              style={({ pressed }) => [
                styles.toolBtn,
                isActive && styles.toolBtnActive,
                pressed && styles.toolBtnPressed,
              ]}
            >
              <Icon
                size={20}
                color={isActive ? '#FFFFFF' : colors.ink}
                strokeWidth={isActive ? 2 : 1.75}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Row 2: Recent colour dots, the plus button and the size button in a fixed row */}
      <View style={styles.fixedBottomRow}>
        <View style={styles.colorDotsGroup}>
          {displayRecentColors.map((hex) => {
            const isSelected =
              toolSettings.color?.toUpperCase() === hex.toUpperCase();
            return (
              <Pressable
                key={hex}
                accessibilityRole="button"
                accessibilityLabel={`Select color ${hex}`}
                onPress={() => handleSelectColor(hex)}
                style={[
                  styles.colorDotWrapper,
                  isSelected && styles.colorDotWrapperActive,
                ]}
              >
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: hex },
                    (hex.toUpperCase() === '#FFFFFF' ||
                      hex.toUpperCase() === '#FFFFF0') &&
                      styles.lightDotBorder,
                  ]}
                />
              </Pressable>
            );
          })}

          {/* Plus Button for full color/palette sheet */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Full palette"
            onPress={() => {
              triggerHaptic('light');
              if (onOpenColorPicker) onOpenColorPicker();
            }}
            style={styles.plusBtn}
          >
            <Plus size={16} color={colors.ink} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.rowDivider} />

        {/* Size Dot that opens size and opacity popover */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Size and opacity"
          onPress={() => {
            triggerHaptic('light');
            setIsSizePopoverOpen(!isSizePopoverOpen);
          }}
          style={[
            styles.sizeDotBtn,
            isSizePopoverOpen && styles.sizeDotBtnActive,
          ]}
        >
          <View
            style={[
              styles.sizePreviewDot,
              {
                width: Math.min(Math.max(toolSettings.size, 6), 20),
                height: Math.min(Math.max(toolSettings.size, 6), 20),
                borderRadius: Math.min(Math.max(toolSettings.size, 6), 20) / 2,
                backgroundColor: isSizePopoverOpen ? colors.accent : colors.ink,
              },
            ]}
          />
        </Pressable>
      </View>

      {/* Size & Opacity Popover */}
      {isSizePopoverOpen && (
        <View
          style={[
            styles.sizeOpacityPopover,
            { bottom: insets.bottom + 58 },
          ]}
        >
          <Text style={styles.popoverLabel}>Stroke width</Text>
          <View style={styles.chipsRow}>
            {[2, 4, 8, 16, 28].map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                accessibilityLabel={`Width ${s}`}
                onPress={() => {
                  triggerHaptic('selection');
                  updateToolSettings({ size: s });
                }}
                style={[
                  styles.chip,
                  toolSettings.size === s && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    toolSettings.size === s && styles.chipTextActive,
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.popoverLabel, { marginTop: 10 }]}>Opacity</Text>
          <View style={styles.chipsRow}>
            {[0.25, 0.5, 0.75, 1.0].map((op) => (
              <Pressable
                key={op}
                accessibilityRole="button"
                accessibilityLabel={`Opacity ${Math.round(op * 100)} percent`}
                onPress={() => {
                  triggerHaptic('selection');
                  updateToolSettings({ opacity: op });
                }}
                style={[
                  styles.chip,
                  toolSettings.opacity === op && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    toolSettings.opacity === op && styles.chipTextActive,
                  ]}
                >
                  {Math.round(op * 100)}%
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fixedBottomContainer: {
    width: '100%',
    backgroundColor: '#F7F4EE',
    borderTopWidth: 1,
    borderTopColor: '#E3DDD1',
    zIndex: 90,
    ...shadows.soft,
  },
  toolsScrollView: {
    height: 52,
  },
  toolsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toolBtnActive: {
    backgroundColor: '#7F0020',
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  toolBtnPressed: {
    opacity: 0.65,
  },
  fixedBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 4,
  },
  colorDotsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E3DDD1',
    marginHorizontal: 4,
  },
  colorDotWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotWrapperActive: {
    borderColor: '#7F0020',
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  lightDotBorder: {
    borderColor: '#E3DDD1',
  },
  plusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE8DF',
    borderWidth: 1,
    borderColor: '#E3DDD1',
  },
  sizeDotBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE8DF',
    borderWidth: 1,
    borderColor: '#E3DDD1',
  },
  sizeDotBtnActive: {
    borderColor: '#7F0020',
    backgroundColor: '#F3E6E8',
  },
  sizePreviewDot: {
    backgroundColor: colors.ink,
  },
  sizeOpacityPopover: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: '#E3DDD1',
    padding: spacing.sm,
    width: 240,
    zIndex: 100,
    ...shadows.card,
  },
  popoverLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  chip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: radius.small,
    backgroundColor: '#F7F4EE',
    borderWidth: 1,
    borderColor: '#E3DDD1',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#7F0020',
    borderColor: '#7F0020',
  },
  chipText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.ink,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
