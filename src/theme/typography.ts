import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fontFamilies = {
  title: 'PlayfairDisplay_600SemiBold',
  titleBold: 'PlayfairDisplay_700Bold',
  titleRegular: 'PlayfairDisplay_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamilies.titleBold,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  title1: {
    fontFamily: fontFamilies.title,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  title2: {
    fontFamily: fontFamilies.title,
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  title3: {
    fontFamily: fontFamilies.title,
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
  },
  headline: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.graphite,
  },
  bodyMedium: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.graphite,
  },
  subhead: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  caption: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  tabLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.3,
  },
};
