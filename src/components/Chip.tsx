import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../theme';
import { triggerHaptic } from '../utils/haptics';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AnimatedView = Animated.View as any;

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  count,
  icon,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = () => {
    if (!onPress) return;
    triggerHaptic('selection');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedView style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        style={[
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
          style,
        ]}
      >
        <View style={styles.contentRow}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              selected ? styles.labelSelected : styles.labelUnselected,
              textStyle,
            ]}
          >
            {label}
          </Text>
          {typeof count === 'number' && (
            <View
              style={[
                styles.badge,
                selected ? styles.badgeSelected : styles.badgeUnselected,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  selected
                    ? styles.badgeTextSelected
                    : styles.badgeTextUnselected,
                ]}
              >
                {count}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.chips,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipUnselected: {
    backgroundColor: colors.paperCard,
    borderColor: colors.line,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    lineHeight: 16,
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  labelUnselected: {
    color: colors.graphite,
    fontWeight: '500',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.chips,
  },
  badgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeUnselected: {
    backgroundColor: colors.surfaceGhost,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextSelected: {
    color: '#FFFFFF',
  },
  badgeTextUnselected: {
    color: colors.textMuted,
  },
});
