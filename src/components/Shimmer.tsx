import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export interface ShimmerProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 100,
  borderRadius = 12,
  style,
  children,
}) => {
  const [layoutWidth, setLayoutWidth] = useState<number>(200);
  const translateX = useSharedValue(-1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    translateX.value = -1;
    translateX.value = withRepeat(
      withTiming(1, { duration: 1300, easing: Easing.linear }),
      -1,
      false
    );
  }, [reducedMotion]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== layoutWidth) {
      setLayoutWidth(w);
    }
  };

  const animatedSweep = useAnimatedStyle(() => {
    if (reducedMotion) return {};
    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-1, 1],
            [-layoutWidth, layoutWidth * 1.5]
          ),
        },
      ],
    };
  });

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        {
          width: width as any,
          height: height as any,
          borderRadius,
        },
        style,
      ]}
    >
      {!reducedMotion && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedSweep]}>
          <LinearGradient
            colors={['#F3E6E8', '#FFFFFF', '#F3E6E8']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: layoutWidth * 1.5, height: '100%' }}
          />
        </Animated.View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3E6E8',
    overflow: 'hidden',
    position: 'relative',
  },
});
