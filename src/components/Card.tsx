import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '../theme';
import { triggerHaptic } from '../utils/haptics';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outline' | 'flat';
  padding?: keyof typeof spacing | number;
}

const AnimatedView = Animated.View as any;

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'elevated',
  padding = 'md',
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
    triggerHaptic('light');
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: colors.paperCard,
          borderWidth: 1,
          borderColor: colors.line,
        };
      case 'flat':
        return {
          backgroundColor: colors.paperElevated,
          borderWidth: 1,
          borderColor: colors.lineSubtle,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.paperCard,
          borderWidth: 1,
          borderColor: colors.line,
          ...shadows.card,
        };
    }
  };

  if (onPress) {
    return (
      <AnimatedView style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.card,
            getVariantStyle(),
            { padding: paddingValue },
            style,
          ]}
        >
          {children}
        </Pressable>
      </AnimatedView>
    );
  }

  return (
    <View
      style={[
        styles.card,
        getVariantStyle(),
        { padding: paddingValue },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.cards,
    overflow: 'hidden',
  },
});
