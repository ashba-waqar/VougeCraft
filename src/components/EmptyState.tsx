import React from 'react';
import { StyleSheet, View, Text, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { colors, spacing, typography } from '../theme';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string; // 1 to 3 words: default "No sketches yet"
  helper?: string; // max 6 words: default "Start your first design below"
  actionLabel?: string; // 1 to 3 words
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No sketches yet',
  helper = 'Start your first design below',
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.illustrationWrapper}>
        <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
          {/* Subtle desk ring */}
          <Circle
            cx={60}
            cy={60}
            r={50}
            stroke={colors.line}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          {/* Sketchbook back page */}
          <Rect
            x={34}
            y={28}
            width={56}
            height={68}
            rx={6}
            stroke={colors.line}
            strokeWidth={1.5}
            fill={colors.paperElevated}
            transform="rotate(6 62 62)"
          />
          {/* Main sketchbook open page */}
          <Rect
            x={28}
            y={24}
            width={58}
            height={72}
            rx={6}
            stroke={colors.ink}
            strokeWidth={1.5}
            fill={colors.paperCard}
          />
          {/* Page binding spine thread */}
          <Line
            x1={36}
            y1={24}
            x2={36}
            y2={96}
            stroke={colors.line}
            strokeWidth={1}
          />
          {/* Minimal dress silhouette line on page */}
          <Path
            d="M52 38 L62 38 L66 52 L69 78 L45 78 L48 52 Z"
            stroke={colors.accent}
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Pencil lying across */}
          <Path
            d="M74 44 L92 84 L88 86 L70 46 Z"
            stroke={colors.ink}
            strokeWidth={1.5}
            fill={colors.paperCard}
          />
          <Path
            d="M88 86 L94 92 L92 84 Z"
            stroke={colors.ink}
            strokeWidth={1.5}
            fill={colors.ink}
          />
        </Svg>
      </View>

      <Text style={[typography.title2, styles.title]}>{title}</Text>
      {helper && <Text style={[typography.subhead, styles.helper]}>{helper}</Text>}

      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <Button label={actionLabel} onPress={onAction} size="small" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  illustrationWrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  helper: {
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  actionWrapper: {
    marginTop: spacing.lg,
  },
});
