import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const triggerHaptic = (style: 'light' | 'medium' | 'selection' = 'light') => {
  if (Platform.OS === 'web') return;
  try {
    if (style === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (style === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (style === 'selection') {
      Haptics.selectionAsync();
    }
  } catch {
    // Graceful fallback if unsupported
  }
};
