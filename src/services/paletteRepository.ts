import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { PaletteRow, PaletteInsert } from '../types/database';
import { showToast } from '../utils/toast';

const LOCAL_PALETTES_KEY = '@voguecraft_saved_palettes_v2';

export interface SavedPaletteItem {
  id: string;
  name: string;
  colors: string[];
  createdAt?: number;
}

export const paletteRepository = {
  /**
   * Fetch all saved palettes for the current user
   */
  async listPalettes(): Promise<SavedPaletteItem[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const localRaw = await AsyncStorage.getItem(LOCAL_PALETTES_KEY);
        return localRaw ? JSON.parse(localRaw) : [];
      }

      const { data, error } = await supabase
        .from('palettes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Could not load saved palettes');
        const localRaw = await AsyncStorage.getItem(LOCAL_PALETTES_KEY);
        return localRaw ? JSON.parse(localRaw) : [];
      }

      const mapped: SavedPaletteItem[] = (data || []).map((row: PaletteRow) => ({
        id: row.id,
        name: row.name,
        colors: Array.isArray(row.colors) ? (row.colors as string[]) : [],
        createdAt: new Date(row.created_at).getTime(),
      }));

      await AsyncStorage.setItem(LOCAL_PALETTES_KEY, JSON.stringify(mapped));
      return mapped;
    } catch (err) {
      console.warn('VogueCraft: listPalettes error:', err);
      const localRaw = await AsyncStorage.getItem(LOCAL_PALETTES_KEY);
      return localRaw ? JSON.parse(localRaw) : [];
    }
  },

  /**
   * Save a new palette or custom tone
   */
  async createPalette(name: string, colors: string[]): Promise<SavedPaletteItem | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const newLocalItem: SavedPaletteItem = {
        id: `pal_${Date.now()}`,
        name: name.trim() || 'Custom Palette',
        colors,
        createdAt: Date.now(),
      };

      if (!user) {
        const localRaw = await AsyncStorage.getItem(LOCAL_PALETTES_KEY);
        const list: SavedPaletteItem[] = localRaw ? JSON.parse(localRaw) : [];
        list.unshift(newLocalItem);
        await AsyncStorage.setItem(LOCAL_PALETTES_KEY, JSON.stringify(list));
        return newLocalItem;
      }

      const insertData: PaletteInsert = {
        user_id: user.id,
        name: name.trim() || 'Custom Palette',
        colors,
      };

      const { data, error } = await supabase
        .from('palettes')
        .insert(insertData)
        .select()
        .single();

      if (error || !data) {
        showToast('Saved palette locally');
        const localRaw = await AsyncStorage.getItem(LOCAL_PALETTES_KEY);
        const list: SavedPaletteItem[] = localRaw ? JSON.parse(localRaw) : [];
        list.unshift(newLocalItem);
        await AsyncStorage.setItem(LOCAL_PALETTES_KEY, JSON.stringify(list));
        return newLocalItem;
      }

      return {
        id: data.id,
        name: data.name,
        colors: Array.isArray(data.colors) ? (data.colors as string[]) : colors,
        createdAt: new Date(data.created_at).getTime(),
      };
    } catch (err) {
      console.warn('VogueCraft: createPalette error:', err);
      showToast('Error saving palette');
      return null;
    }
  },

  /**
   * Rename a palette
   */
  async renamePalette(id: string, newName: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('palettes')
          .update({ name: newName.trim() })
          .eq('id', id)
          .eq('user_id', user.id);
      }

      const localRaw = await AsyncStorage.getItem(LOCAL_PALETTES_KEY);
      if (localRaw) {
        const list: SavedPaletteItem[] = JSON.parse(localRaw);
        const updated = list.map((p) => (p.id === id ? { ...p, name: newName.trim() } : p));
        await AsyncStorage.setItem(LOCAL_PALETTES_KEY, JSON.stringify(updated));
      }

      return true;
    } catch {
      showToast('Could not rename palette');
      return false;
    }
  },

  /**
   * Delete a palette from table & local cache
   */
  async deletePalette(id: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('palettes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
      }

      const localRaw = await AsyncStorage.getItem(LOCAL_PALETTES_KEY);
      if (localRaw) {
        const list: SavedPaletteItem[] = JSON.parse(localRaw);
        const filtered = list.filter((p) => p.id !== id);
        await AsyncStorage.setItem(LOCAL_PALETTES_KEY, JSON.stringify(filtered));
      }

      return true;
    } catch {
      showToast('Could not delete palette');
      return false;
    }
  },
};
