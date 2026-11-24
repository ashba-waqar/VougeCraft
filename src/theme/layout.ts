import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface LayoutInfo {
  width: number;
  height: number;
  isSmall: boolean;
  isTablet: boolean;
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  pagePadding: number;
  contentMaxWidth: number;
  columns: number;
}

/**
 * Shared responsive layout hook built on useWindowDimensions and safe area insets.
 * Updates dynamically on orientation change or window resize.
 */
export function useLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmall = width < 400;
  const isTablet = width >= 768;
  const pagePadding = isTablet ? 24 : isSmall ? 12 : 16;
  const contentMaxWidth = 560;
  const columns = isTablet ? 3 : 2;

  return {
    width,
    height,
    isSmall,
    isTablet,
    insets: {
      top: insets.top,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right,
    },
    pagePadding,
    contentMaxWidth,
    columns,
  };
}
