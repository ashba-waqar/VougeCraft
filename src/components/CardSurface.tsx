import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface CardSurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  shadowOpacity?: number;
  shadowElevation?: number;
}

export const CardSurface: React.FC<CardSurfaceProps> = ({
  children,
  style,
  borderRadius = 16,
  shadowOpacity = 0.22,
  shadowElevation = 6,
}) => {
  return (
    <View
      style={[
        styles.shadowWrapper,
        {
          borderRadius,
          shadowOpacity,
          elevation: shadowElevation,
        },
        style,
      ]}
    >
      <View style={[styles.innerContainer, { borderRadius }]}>
        <LinearGradient
          colors={['#FFFFFF', '#FBF3F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    backgroundColor: 'transparent',
    shadowColor: '#9B6B8E',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  innerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(127, 0, 32, 0.10)',
    overflow: 'hidden',
    position: 'relative',
  },
});
