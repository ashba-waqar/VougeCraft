import React from 'react';
import {
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius } from '../theme';
import { triggerHaptic } from '../utils/haptics';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'filled' | 'active' | 'ghost' | 'paper';
  size?: number;
  shape?: 'square' | 'circle';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const AnimatedView = Animated.View as any;

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'default',
  size = 44,
  shape = 'square',
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled) return;
    triggerHaptic('light');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'filled':
        return { backgroundColor: colors.primary || '#7F0020' };
      case 'active':
        return {
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
          borderWidth: 1,
        };
      case 'paper':
        return {
          backgroundColor: colors.paperCard,
          borderColor: colors.line,
          borderWidth: 1,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'default':
      default:
        return {
          backgroundColor: colors.surfaceGhost,
          borderColor: colors.lineSubtle,
          borderWidth: 1,
        };
    }
  };

  const borderRadius = shape === 'circle' ? size / 2 : radius.buttons;

  return (
    <AnimatedView style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.base,
          {
            width: size,
            height: size,
            borderRadius,
          },
          getVariantStyle(),
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon}
      </Pressable>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
