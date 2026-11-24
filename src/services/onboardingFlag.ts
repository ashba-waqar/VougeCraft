import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_FLAG_KEY = '@voguecraft_has_seen_onboarding';

type FlagListener = (seen: boolean) => void;
const flagListeners = new Set<FlagListener>();

export async function getHasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_FLAG_KEY);
    return value === 'true';
  } catch (err) {
    console.warn('VogueCraft: Error reading onboarding flag:', err);
    return false;
  }
}

export async function setHasSeenOnboarding(value: boolean = true): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_FLAG_KEY, value ? 'true' : 'false');
    flagListeners.forEach((fn) => fn(value));
  } catch (err) {
    console.warn('VogueCraft: Error setting onboarding flag:', err);
  }
}

export async function clearHasSeenOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_FLAG_KEY);
    flagListeners.forEach((fn) => fn(false));
  } catch (err) {
    console.warn('VogueCraft: Error clearing onboarding flag:', err);
  }
}

export function subscribeHasSeenOnboarding(listener: FlagListener): () => void {
  flagListeners.add(listener);
  return () => flagListeners.delete(listener);
}
