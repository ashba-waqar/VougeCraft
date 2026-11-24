import React from 'react';
import {
  StyleSheet,
  View,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export type GlassIntensity = 'low' | 'medium' | 'high';

export interface GlassCardProps {
  intensity?: GlassIntensity;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
  borderRadius?: number;
  shadowColor?: string;
}

const INTENSITY_CONFIG = {
  low: {
    blur: 15,
    iosFill: 'rgba(255, 255, 255, 0.45)',
    androidFill: 'rgba(255, 255, 255, 0.80)',
  },
  medium: {
    blur: 30,
    iosFill: 'rgba(255, 255, 255, 0.60)',
    androidFill: 'rgba(255, 255, 255, 0.85)',
  },
  high: {
    blur: 50,
    iosFill: 'rgba(255, 255, 255, 0.75)',
    androidFill: 'rgba(255, 255, 255, 0.92)',
  },
};

export const GlassCard: React.FC<GlassCardProps> = ({
  intensity = 'medium',
  children,
  style,
  tintColor,
  borderRadius = 18,
  shadowColor,
}) => {
  const config = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.medium;
  const iosBg = tintColor || config.iosFill;
  const androidBg = tintColor || config.androidFill;

  return (
    <View
      style={[
        styles.shadowWrapper,
        shadowColor ? { shadowColor } : null,
        { borderRadius },
        style,
      ]}
    >
      <View style={[styles.innerContainer, { borderRadius }]}>
        {Platform.OS === 'ios' ? (
          <>
            <BlurView
              intensity={config.blur}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: iosBg },
              ]}
            />
          </>
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: androidBg },
            ]}
          />
        )}

        {/* Faint top-left white gradient highlight */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.45)',
            'rgba(255, 255, 255, 0.08)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.75, y: 0.75 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 4,
    backgroundColor: 'transparent',
  },
  innerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.80)',
    overflow: 'hidden',
  },
});
