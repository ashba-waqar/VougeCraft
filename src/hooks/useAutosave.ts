import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { useCanvasStore } from '../store/canvasStore';
import {
  sketchRepository,
  compactSketchData,
  exportSkiaThumbnail,
} from '../services/sketchRepository';
import { supabase } from '../services/supabase';
import { Sketch } from '../types/canvas';
import { showToast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';

export type SaveStatus = 'saved' | 'saving' | 'failed';

export function useAutosave(sketchId?: string) {
  const sketch = useCanvasStore((state) => state.sketch);
  const isAutosaved = useCanvasStore((state) => state.isAutosaved);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const isLeavingRef = useRef<boolean>(false);
  const conflictResolvedRef = useRef<boolean>(false);
  const lastSavedPayloadRef = useRef<string>('');

  // 1. Derive save status from internal state and store isAutosaved
  const computedSaveStatus: SaveStatus =
    saveStatus === 'failed'
      ? 'failed'
      : !isAutosaved
      ? 'saving'
      : saveStatus;

  // 2. Perform Save
  const performSave = useCallback(
    async (sketchToSave: Sketch): Promise<void> => {
      if (!sketchToSave || !sketchToSave.id) {
        setSaveStatus('failed');
        setLastErrorMessage('No sketch loaded');
        return;
      }

      // Check if sketch has no database row
      if (
        sketchToSave.id.startsWith('blank_') ||
        sketchToSave.id.startsWith('sketch_local_') ||
        sketchToSave.id.startsWith('tpl_') ||
        sketchToSave.id.startsWith('sketch_guest_')
      ) {
        setSaveStatus('failed');
        const msg = 'Sketch has no database row. Changes cannot sync to cloud.';
        setLastErrorMessage(msg);
        showToast(msg);
        return;
      }

      setSaveStatus('saving');

      try {
        const compacted = compactSketchData(sketchToSave);
        const payloadString = JSON.stringify(compacted);

        // Skip if identical to last save
        if (payloadString === lastSavedPayloadRef.current) {
          setSaveStatus('saved');
          return;
        }

        const res = await sketchRepository.updateSketch(sketchToSave.id, {
          title: sketchToSave.title,
          data: compacted,
        });

        if (res.error && !res.data) {
          setSaveStatus('failed');
          setLastErrorMessage(res.error.message);
        } else {
          lastSavedPayloadRef.current = payloadString;
          setSaveStatus('saved');
          setLastErrorMessage(null);
        }
      } catch (err: any) {
        console.warn('VogueCraft: Autosave error:', err);
        const errMsg = err?.message || 'Autosave failed';
        setSaveStatus('failed');
        setLastErrorMessage(errMsg);
        showToast(`Save error: ${errMsg}`);
      }
    },
    []
  );

  // 3. Retry Save handler for tapping the red dot
  const retrySave = useCallback(async () => {
    triggerHaptic('medium');
    if (lastErrorMessage) {
      showToast(`Last error: ${lastErrorMessage}`);
    } else {
      showToast('Retrying save...');
    }
    lastSavedPayloadRef.current = '';
    const current = useCanvasStore.getState().sketch;
    await performSave(current);
  }, [lastErrorMessage, performSave]);

  // 4. Export thumbnail and upload when leaving canvas
  const exportAndUploadThumbnail = useCallback(async (): Promise<string | null> => {
    try {
      const currentSketch = useCanvasStore.getState().sketch;
      if (!currentSketch || !currentSketch.id) return null;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const base64Png = await exportSkiaThumbnail(currentSketch);
      if (!base64Png) return null;

      const res = await sketchRepository.uploadThumbnail(
        user.id,
        currentSketch.id,
        base64Png
      );
      return res.data;
    } catch (err) {
      console.warn('VogueCraft: Thumbnail export & upload error:', err);
      return null;
    }
  }, []);

  // 5. Check for conflict on sketch open (once)
  useEffect(() => {
    let isMounted = true;

    async function checkInitialSketch() {
      if (!sketchId) return;

      if (
        sketchId.startsWith('blank_') ||
        sketchId.startsWith('sketch_local_') ||
        sketchId.startsWith('tpl_') ||
        sketchId.startsWith('sketch_guest_')
      ) {
        if (isMounted) {
          setSaveStatus('failed');
          const msg = 'Sketch has no database row. Changes cannot sync.';
          setLastErrorMessage(msg);
          showToast(msg);
        }
        return;
      }

      if (conflictResolvedRef.current) return;

      const res = await sketchRepository.getSketch(sketchId);
      if (!isMounted) return;

      if (res.error || !res.data?.sketch) {
        setSaveStatus('failed');
        const msg = res.error?.message || 'Sketch not found in database.';
        setLastErrorMessage(msg);
        showToast(msg);
        return;
      }

      if (res.data?.serverNewer && res.data.serverUpdatedAt) {
        conflictResolvedRef.current = true;
        Alert.alert(
          'Sync Conflict',
          'A newer version of this sketch exists on the server. Keep this version?',
          [
            {
              text: 'Keep local version',
              style: 'cancel',
              onPress: () => {
                performSave(useCanvasStore.getState().sketch);
              },
            },
            {
              text: 'Load server version',
              onPress: async () => {
                if (res.data?.sketch) {
                  useCanvasStore.setState({
                    sketch: res.data.sketch,
                    isAutosaved: true,
                  });
                  setSaveStatus('saved');
                  setLastErrorMessage(null);
                }
              },
            },
          ]
        );
      }
    }

    checkInitialSketch();

    return () => {
      isMounted = false;
    };
  }, [sketchId, performSave]);

  // 6. Autosave on change: 2 seconds after the last change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      performSave(sketch);
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sketch, performSave]);

  // 7. Save when app goes to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        const current = useCanvasStore.getState().sketch;
        performSave(current);
        exportAndUploadThumbnail();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [performSave, exportAndUploadThumbnail]);

  // 8. Save and export thumbnail when component unmounts (leaving canvas / back button)
  useEffect(() => {
    return () => {
      if (!isLeavingRef.current) {
        isLeavingRef.current = true;
        const current = useCanvasStore.getState().sketch;
        performSave(current);
        exportAndUploadThumbnail();
      }
    };
  }, [performSave, exportAndUploadThumbnail]);

  return {
    saveStatus: computedSaveStatus,
    lastErrorMessage,
    retrySave,
    triggerSave: () => performSave(sketch),
    exportAndUploadThumbnail,
  };
}
