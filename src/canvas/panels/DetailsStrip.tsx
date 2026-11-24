import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { X } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { DetailType, DetailStampItem } from '../../types/canvas';
import { useCanvasStore } from '../../store/canvasStore';
import { triggerHaptic } from '../../utils/haptics';
import { GlassCard } from '../../components/GlassCard';

interface DetailStampConfig {
  type: DetailType;
  label: string; // 1 word
  renderIcon: () => React.ReactNode;
}

const DETAILS: DetailStampConfig[] = [
  {
    type: 'button_round',
    label: 'Button',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Circle cx={10} cy={10} r={8} stroke={colors.ink} strokeWidth={1.5} fill="none" />
        <Circle cx={8} cy={8} r={1} fill={colors.ink} />
        <Circle cx={12} cy={8} r={1} fill={colors.ink} />
        <Circle cx={8} cy={12} r={1} fill={colors.ink} />
        <Circle cx={12} cy={12} r={1} fill={colors.ink} />
      </Svg>
    ),
  },
  {
    type: 'stitch_single',
    label: 'Stitch',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Line x1={2} y1={10} x2={18} y2={10} stroke={colors.ink} strokeWidth={1.5} strokeDasharray="3 3" />
      </Svg>
    ),
  },
  {
    type: 'stitch_double',
    label: 'Topstitch',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Line x1={2} y1={7} x2={18} y2={7} stroke={colors.ink} strokeWidth={1.2} strokeDasharray="3 3" />
        <Line x1={2} y1={13} x2={18} y2={13} stroke={colors.ink} strokeWidth={1.2} strokeDasharray="3 3" />
      </Svg>
    ),
  },
  {
    type: 'zipper',
    label: 'Zipper',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Line x1={10} y1={2} x2={10} y2={18} stroke={colors.ink} strokeWidth={1.5} />
        <Line x1={7} y1={6} x2={13} y2={6} stroke={colors.ink} strokeWidth={1} />
        <Line x1={7} y1={10} x2={13} y2={10} stroke={colors.ink} strokeWidth={1} />
        <Line x1={7} y1={14} x2={13} y2={14} stroke={colors.ink} strokeWidth={1} />
      </Svg>
    ),
  },
  {
    type: 'pleat_knife',
    label: 'Pleat',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Line x1={5} y1={3} x2={3} y2={17} stroke={colors.ink} strokeWidth={1.2} />
        <Line x1={10} y1={3} x2={8} y2={17} stroke={colors.ink} strokeWidth={1.2} />
        <Line x1={15} y1={3} x2={13} y2={17} stroke={colors.ink} strokeWidth={1.2} />
      </Svg>
    ),
  },
  {
    type: 'dart',
    label: 'Dart',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M 6 3 L 10 17 L 14 3 Z" stroke={colors.ink} strokeWidth={1.2} fill="none" />
      </Svg>
    ),
  },
  {
    type: 'pocket_patch',
    label: 'Patch',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M 4 5 L 16 5 L 16 12 L 10 16 L 4 12 Z" stroke={colors.ink} strokeWidth={1.2} fill="none" />
      </Svg>
    ),
  },
  {
    type: 'pocket_welt',
    label: 'Welt',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Rect x={3} y={7} width={14} height={6} stroke={colors.ink} strokeWidth={1.2} fill="none" rx={1} />
      </Svg>
    ),
  },
  {
    type: 'collar_notch',
    label: 'Notch',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M 3 6 L 10 15 L 17 6 L 14 4 L 10 11 L 6 4 Z" stroke={colors.ink} strokeWidth={1.2} fill="none" />
      </Svg>
    ),
  },
  {
    type: 'collar_mandarin',
    label: 'Band',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M 3 13 Q 10 8 17 13 L 16 10 Q 10 5 4 10 Z" stroke={colors.ink} strokeWidth={1.2} fill="none" />
      </Svg>
    ),
  },
  {
    type: 'embroidery_floral',
    label: 'Floral',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Circle cx={10} cy={10} r={3} stroke={colors.accent} strokeWidth={1} fill="none" />
        <Path d="M 10 4 L 10 7 M 10 13 L 10 16 M 4 10 L 7 10 M 13 10 L 16 10" stroke={colors.accent} strokeWidth={1} />
      </Svg>
    ),
  },
  {
    type: 'embroidery_zari',
    label: 'Zari',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M 2 10 L 6 6 L 10 10 L 14 6 L 18 10 L 14 14 L 10 10 L 6 14 Z" stroke="#D4AF37" strokeWidth={1.2} fill="none" />
      </Svg>
    ),
  },
  {
    type: 'tassel',
    label: 'Tassel',
    renderIcon: () => (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Circle cx={10} cy={5} r={2} fill={colors.ink} />
        <Path d="M 8 7 L 6 16 M 10 7 L 10 17 M 12 7 L 14 16" stroke={colors.ink} strokeWidth={1} />
      </Svg>
    ),
  },
];

export interface DetailsStripProps {
  onClose?: () => void;
}

export const DetailsStrip: React.FC<DetailsStripProps> = ({ onClose }) => {
  const addItemToActiveLayer = useCanvasStore(
    (state) => state.addItemToActiveLayer
  );

  const handleStampDetail = (type: DetailType) => {
    triggerHaptic('light');
    const stamp: DetailStampItem = {
      id: `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'detailStamp',
      stampType: type,
      position: { x: 200, y: 280 }, // Center of standard canvas
      scale: 1.0,
      rotation: 0,
      color: '#0E0E10',
    };
    addItemToActiveLayer(stamp);
  };

  return (
    <GlassCard intensity="low" borderRadius={20} style={styles.glassWrapper}>
      <View style={styles.container}>
        {onClose && (
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              onClose();
            }}
            style={styles.dismissBtn}
            accessibilityLabel="Close details"
          >
            <View style={styles.dragPill} />
            <X size={15} color={colors.graphite} strokeWidth={2} />
          </Pressable>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
          style={styles.scrollView}
        >
          {DETAILS.map((d) => (
            <Pressable
              key={d.type}
              onPress={() => handleStampDetail(d.type)}
              style={({ pressed }) => [
                styles.detailItem,
                pressed && styles.detailItemPressed,
              ]}
              accessibilityLabel={d.label}
            >
              <View style={styles.iconCircle}>{d.renderIcon()}</View>
              <Text numberOfLines={1} style={styles.detailLabel}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  glassWrapper: {
    height: 76,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    paddingLeft: 6,
    paddingRight: 6,
  },
  dismissBtn: {
    width: 34,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(232, 216, 210, 0.6)',
    paddingRight: 4,
    marginRight: 4,
    gap: 6,
  },
  dragPill: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    backgroundColor: '#C5B7B1',
  },
  scrollView: {
    flex: 1,
  },
  scrollList: {
    alignItems: 'center',
    paddingRight: spacing.md,
    gap: 6,
  },
  detailItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
  },
  detailItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.paperElevated,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: colors.graphite,
    textAlign: 'center',
  },
});
