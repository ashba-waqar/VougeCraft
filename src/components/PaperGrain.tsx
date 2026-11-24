import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

export const PaperGrain: React.FC = () => {
  return (
    <View pointerEvents="none" style={styles.grainLayer}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="paper-noise"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <Circle cx="2" cy="3" r="0.8" fill="#3A0A16" />
            <Circle cx="9" cy="2" r="0.6" fill="#3A0A16" />
            <Circle cx="14" cy="7" r="0.75" fill="#3A0A16" />
            <Circle cx="6" cy="11" r="0.7" fill="#3A0A16" />
            <Circle cx="12" cy="13" r="0.65" fill="#3A0A16" />
            <Circle cx="3" cy="14" r="0.8" fill="#3A0A16" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#paper-noise)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  grainLayer: {
    ...StyleSheet.absoluteFill,
    opacity: 0.03,
    zIndex: 0,
  },
});
