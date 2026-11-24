import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { TechPackRow, TechPackUnit } from '../types/database';
import { syncQueue } from './syncQueue';
import { showToast } from '../utils/toast';

export interface MeasurementItem {
  id: string;
  label: string;
  value: string;
}

export interface FabricDetails {
  fabricNotes: string;
  stitchNotes: string;
  embroideryNotes: string;
  colorChips?: string[];
}

export interface TechPackData {
  id: string;
  sketchId: string;
  unit: TechPackUnit;
  measurements: MeasurementItem[];
  fabrics: FabricDetails;
  notes: string;
}

const DEFAULT_MEASUREMENTS: MeasurementItem[] = [
  { id: 'chest', label: 'Chest', value: '38 in' },
  { id: 'waist', label: 'Waist', value: '30 in' },
  { id: 'hip', label: 'Hip', value: '40 in' },
  { id: 'shoulder', label: 'Shoulder', value: '16 in' },
  { id: 'sleeve', label: 'Sleeve', value: '24 in' },
  { id: 'length', label: 'Length', value: '42 in' },
  { id: 'inseam', label: 'Inseam', value: '31 in' },
];

const DEFAULT_FABRICS: FabricDetails = {
  fabricNotes: 'Pure raw silk shell. Brocade trim.',
  stitchNotes: 'Single needle topstitch 1/4 inch. French seams.',
  embroideryNotes: 'Zardozi & gold zari cord work on collar and cuffs.',
  colorChips: ['#0E0E10', '#7F0020', '#D4AF37'],
};

const DEFAULT_NOTES = 'Tailored cut with 2 inch side vents.';

function getLocalKey(sketchId: string): string {
  return `@voguecraft_techpack_${sketchId}`;
}

export const techPackRepository = {
  /**
   * Get or create a tech pack for the given sketch ID
   */
  async getOrCreateTechPack(sketchId: string): Promise<TechPackData> {
    const localKey = getLocalKey(sketchId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const localRaw = await AsyncStorage.getItem(localKey);
        if (localRaw) return JSON.parse(localRaw);

        const fallback: TechPackData = {
          id: `local_tp_${sketchId}`,
          sketchId,
          unit: 'inch',
          measurements: DEFAULT_MEASUREMENTS,
          fabrics: DEFAULT_FABRICS,
          notes: DEFAULT_NOTES,
        };
        await AsyncStorage.setItem(localKey, JSON.stringify(fallback));
        return fallback;
      }

      // Check if row already exists
      const { data: existing, error: fetchError } = await supabase
        .from('tech_packs')
        .select('*')
        .eq('sketch_id', sketchId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!fetchError && existing) {
        const parsed: TechPackData = {
          id: existing.id,
          sketchId: existing.sketch_id,
          unit: existing.unit,
          measurements: Array.isArray(existing.measurements)
            ? (existing.measurements as any)
            : DEFAULT_MEASUREMENTS,
          fabrics: (existing.fabrics as any) || DEFAULT_FABRICS,
          notes: existing.notes || '',
        };
        await AsyncStorage.setItem(localKey, JSON.stringify(parsed));
        return parsed;
      }

      // Create new row on first open
      const { data: created, error: insertError } = await supabase
        .from('tech_packs')
        .insert({
          user_id: user.id,
          sketch_id: sketchId,
          unit: 'inch',
          measurements: DEFAULT_MEASUREMENTS as any,
          fabrics: DEFAULT_FABRICS as any,
          notes: DEFAULT_NOTES,
        })
        .select()
        .single();

      if (insertError || !created) {
        console.warn('VogueCraft: Error creating tech pack:', insertError);
        const localRaw = await AsyncStorage.getItem(localKey);
        if (localRaw) return JSON.parse(localRaw);

        return {
          id: `tp_${Date.now()}`,
          sketchId,
          unit: 'inch',
          measurements: DEFAULT_MEASUREMENTS,
          fabrics: DEFAULT_FABRICS,
          notes: DEFAULT_NOTES,
        };
      }

      const techPackData: TechPackData = {
        id: created.id,
        sketchId: created.sketch_id,
        unit: created.unit,
        measurements: Array.isArray(created.measurements)
          ? (created.measurements as any)
          : DEFAULT_MEASUREMENTS,
        fabrics: (created.fabrics as any) || DEFAULT_FABRICS,
        notes: created.notes || '',
      };

      await AsyncStorage.setItem(localKey, JSON.stringify(techPackData));
      return techPackData;
    } catch (err) {
      console.warn('VogueCraft: getOrCreateTechPack error:', err);
      const localRaw = await AsyncStorage.getItem(localKey);
      if (localRaw) return JSON.parse(localRaw);

      return {
        id: `tp_${Date.now()}`,
        sketchId,
        unit: 'inch',
        measurements: DEFAULT_MEASUREMENTS,
        fabrics: DEFAULT_FABRICS,
        notes: DEFAULT_NOTES,
      };
    }
  },

  /**
   * Save / autosave tech pack updates
   */
  async saveTechPack(techPack: TechPackData): Promise<boolean> {
    const localKey = getLocalKey(techPack.sketchId);

    try {
      // 1. Cache locally
      await AsyncStorage.setItem(localKey, JSON.stringify(techPack));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return true;

      // 2. Update Supabase
      const { error } = await supabase
        .from('tech_packs')
        .update({
          unit: techPack.unit,
          measurements: techPack.measurements as any,
          fabrics: techPack.fabrics as any,
          notes: techPack.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', techPack.id)
        .eq('user_id', user.id);

      if (error) {
        console.warn('VogueCraft: saveTechPack remote update error:', error);
        await syncQueue.enqueue('tech_pack', techPack.id, 'update', {
          id: techPack.id,
          unit: techPack.unit,
          measurements: techPack.measurements,
          fabrics: techPack.fabrics,
          notes: techPack.notes,
          sketchId: techPack.sketchId,
        });
        return false;
      }

      return true;
    } catch (err) {
      console.warn('VogueCraft: saveTechPack exception:', err);
      showToast('Could not save tech sheet');
      return false;
    }
  },
};
