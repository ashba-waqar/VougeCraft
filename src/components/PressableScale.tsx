import React from 'react';
import {
  Pressable,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { triggerHaptic } from '../utils/haptics';

export interface PressableScaleProps {
  onPress?: (event?: GestureResponderEvent) => void;
  onLongPress?: (event?: GestureResponderEvent) => void;
  children: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
  disabled?: boolean;
  activeScale?: number;
  style?: StyleProp<ViewStyle>;
  hitSlop?: any;
  accessibilityLabel?: string;
  accessibilityRole?: any;
  accessibilityState?: any;
  testID?: string;
  onLayout?: (event: any) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PressableScale: React.FC<PressableScaleProps> = ({
  onPress,
  onLongPress,
  children,
  disabled = false,
  activeScale = 0.96,
  style,
  hitSlop,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  testID,
  onLayout,
}) => {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    triggerHaptic('light');
    if (!reducedMotion) {
      scale.value = withSpring(activeScale, {
        damping: 15,
        stiffness: 350,
        mass: 0.8,
      });
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    if (!reducedMotion) {
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 300,
        mass: 0.8,
      });
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      testID={testID}
      onLayout={onLayout}
      style={[style as any, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};
