import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  useReducedMotion,
} from 'react-native-reanimated';

export interface FadeInUpProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInUp: React.FC<FadeInUpProps> = ({
  children,
  index = 0,
  delay,
  style,
}) => {
  const reducedMotion = useReducedMotion();
  const staggerDelay =
    delay !== undefined ? delay : Math.min(Math.max(0, index), 7) * 60;

  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 16);

  useEffect(() => {
    if (reducedMotion) return;

    opacity.value = withDelay(
      staggerDelay,
      withTiming(1, { duration: 320 })
    );
    translateY.value = withDelay(
      staggerDelay,
      withSpring(0, {
        damping: 15,
        stiffness: 180,
        mass: 0.8,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};
