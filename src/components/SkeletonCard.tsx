import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Shimmer } from './Shimmer';
import { radius, spacing } from '../theme';

export interface SkeletonCardProps {
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  width = '100%',
  height = 190,
  style,
}) => {
  return (
    <View
      style={[
        styles.cardContainer,
        { width: width as any, minHeight: height as any },
        style,
      ]}
    >
      {/* Thumbnail shimmer box */}
      <Shimmer width="100%" height={110} borderRadius={10} />

      {/* Title bar shimmer */}
      <View style={styles.contentSection}>
        <Shimmer width="72%" height={13} borderRadius={4} />
        {/* Meta / tags row shimmer */}
        <View style={styles.metaRow}>
          <Shimmer width="40%" height={10} borderRadius={3} />
          <View style={styles.dot} />
          <Shimmer width="30%" height={10} borderRadius={3} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: '#E8D8D2',
    padding: spacing.sm,
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  contentSection: {
    paddingTop: spacing.sm,
    paddingHorizontal: 2,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E8D8D2',
  },
});
