import { Dimensions, TextProps } from 'react-native';

const BASE_WIDTH = 375;

/**
 * Scale a size gently with screen width, clamped between 0.9 and 1.15.
 */
export function scale(size: number, screenWidth?: number): number {
  const currentWidth = screenWidth ?? Dimensions.get('window').width;
  const ratio = 1 + ((currentWidth - BASE_WIDTH) / BASE_WIDTH) * 0.5;
  const clamped = Math.min(1.15, Math.max(0.9, ratio));
  return Math.round(size * clamped);
}

/**
 * Text accessibility scaling guard to prevent large system fonts from breaking layouts.
 */
export const responsiveTextProps: Partial<TextProps> = {
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.2,
};
