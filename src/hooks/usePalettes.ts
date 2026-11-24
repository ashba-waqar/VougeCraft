import { useState, useEffect, useCallback } from 'react';
import { paletteRepository, SavedPaletteItem } from '../services/paletteRepository';
import { showToast } from '../utils/toast';

export interface UsePalettesResult {
  palettes: SavedPaletteItem[];
  isLoading: boolean;
  savePalette: (name: string, colors: string[]) => Promise<SavedPaletteItem | null>;
  renamePalette: (id: string, newName: string) => Promise<boolean>;
  deletePalette: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function usePalettes(): UsePalettesResult {
  const [palettes, setPalettes] = useState<SavedPaletteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await paletteRepository.listPalettes();
      setPalettes(items);
    } catch {
      showToast('Could not load palettes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const savePalette = useCallback(
    async (name: string, colors: string[]): Promise<SavedPaletteItem | null> => {
      const saved = await paletteRepository.createPalette(name, colors);
      if (saved) {
        setPalettes((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      }
      return saved;
    },
    []
  );

  const renamePalette = useCallback(
    async (id: string, newName: string): Promise<boolean> => {
      const success = await paletteRepository.renamePalette(id, newName);
      if (success) {
        setPalettes((prev) =>
          prev.map((p) => (p.id === id ? { ...p, name: newName.trim() } : p))
        );
      }
      return success;
    },
    []
  );

  const deletePalette = useCallback(
    async (id: string): Promise<boolean> => {
      const success = await paletteRepository.deletePalette(id);
      if (success) {
        setPalettes((prev) => prev.filter((p) => p.id !== id));
      }
      return success;
    },
    []
  );

  return {
    palettes,
    isLoading,
    savePalette,
    renamePalette,
    deletePalette,
    refresh,
  };
}
