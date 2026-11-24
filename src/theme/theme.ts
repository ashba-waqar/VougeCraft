import { create } from 'zustand';
import { lightColors, darkColors, ColorTheme } from './colors';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ColorTheme;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  colors: lightColors,
  toggleTheme: () =>
    set((state) => ({
      isDark: !state.isDark,
      colors: !state.isDark ? darkColors : lightColors,
    })),
}));

export const useTheme = () => useThemeStore((s) => s.colors);
