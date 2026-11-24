import { Platform, ToastAndroid } from 'react-native';

export function showToast(message: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    // Elegant fallback on iOS and web
    console.log(`[VogueCraft]: ${message}`);
  }
}
