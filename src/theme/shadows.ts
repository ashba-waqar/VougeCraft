import { Platform, StyleSheet } from 'react-native';

export const shadows = StyleSheet.create({
  soft: {
    ...Platform.select({
      ios: {
        shadowColor: '#0E0E10',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#0E0E10',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
    }),
  },
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#0E0E10',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#0E0E10',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
    }),
  },
  floating: {
    ...Platform.select({
      ios: {
        shadowColor: '#0E0E10',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: '#0E0E10',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
});
