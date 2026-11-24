import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { sketchRepository, CreateSketchParams } from '../services/sketchRepository';
import { SketchItem } from '../data';
import { SketchRow } from '../types/database';
import { triggerHaptic } from '../utils/haptics';
import { showToast } from '../utils/toast';

export interface UseSketchesResult {
  sketches: SketchItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  deleteSketch: (id: string) => Promise<boolean>;
  createSketch: (params: CreateSketchParams) => Promise<SketchRow | null>;
}

export function useSketches(): UseSketchesResult {
  const [sketches, setSketches] = useState<SketchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSketches = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await sketchRepository.listSketches();
      if (response.error) {
        setError(response.error.message);
      }
      setSketches(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load sketches');
      setSketches([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSketches(false);
  }, [loadSketches]);

  const refresh = useCallback(async () => {
    triggerHaptic('light');
    await loadSketches(true);
  }, [loadSketches]);

  const handleDeleteSketch = useCallback(
    async (id: string): Promise<boolean> => {
      triggerHaptic('medium');

      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'Delete sketch',
          'Are you sure you want to delete this sketch?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                // Optimistic UI removal for fluid card removal animation
                setSketches((prev) => prev.filter((s) => s.id !== id));
                const res = await sketchRepository.deleteSketch(id);
                if (res.error) {
                  showToast('Error deleting sketch');
                  // Re-fetch if deletion failed
                  loadSketches(true);
                  resolve(false);
                } else {
                  showToast('Sketch deleted');
                  resolve(true);
                }
              },
            },
          ]
        );
      });
    },
    [loadSketches]
  );

  const handleCreateSketch = useCallback(
    async (params: CreateSketchParams): Promise<SketchRow | null> => {
      try {
        const res = await sketchRepository.createSketch(params);
        if (res.data) {
          // Re-load list in background
          loadSketches(true);
          return res.data;
        }
        return null;
      } catch (err) {
        console.warn('VogueCraft: Error creating sketch in hook:', err);
        return null;
      }
    },
    [loadSketches]
  );

  return {
    sketches,
    isLoading,
    isRefreshing,
    error,
    refresh,
    deleteSketch: handleDeleteSketch,
    createSketch: handleCreateSketch,
  };
}
