import { useState, useEffect, useRef, useCallback } from 'react';
import {
  techPackRepository,
  TechPackData,
  MeasurementItem,
  FabricDetails,
} from '../services/techPackRepository';
import { TechPackUnit } from '../types/database';

export interface UseTechPackResult {
  techPack: TechPackData | null;
  unit: TechPackUnit;
  measurements: MeasurementItem[];
  fabrics: FabricDetails;
  notes: string;
  isLoading: boolean;
  toggleUnit: () => void;
  updateMeasurement: (id: string, text: string) => void;
  updateFabricNotes: (text: string) => void;
  updateStitchNotes: (text: string) => void;
  updateEmbroideryNotes: (text: string) => void;
  updateNotes: (text: string) => void;
  updateColorChips: (chips: string[]) => void;
}

export function useTechPack(sketchId: string): UseTechPackResult {
  const [techPack, setTechPack] = useState<TechPackData | null>(null);
  const [unit, setUnitState] = useState<TechPackUnit>('inch');
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [fabrics, setFabrics] = useState<FabricDetails>({
    fabricNotes: '',
    stitchNotes: '',
    embroideryNotes: '',
    colorChips: [],
  });
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveTimerRef = useRef<any>(null);
  const techPackRef = useRef<TechPackData | null>(null);

  // Sync techPackRef with state changes
  useEffect(() => {
    if (techPack) {
      techPackRef.current = {
        ...techPack,
        unit,
        measurements,
        fabrics,
        notes,
      };
    }
  }, [techPack, unit, measurements, fabrics, notes]);

  // Load tech pack on mount or sketchId change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    techPackRepository.getOrCreateTechPack(sketchId).then((loaded) => {
      if (!isMounted) return;
      setTechPack(loaded);
      setUnitState(loaded.unit);
      setMeasurements(loaded.measurements);
      setFabrics(loaded.fabrics);
      setNotes(loaded.notes);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [sketchId]);

  // Debounced autosave (1.5 seconds)
  const triggerAutosave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const current = techPackRef.current;
      if (!current) return;
      await techPackRepository.saveTechPack(current);
    }, 1500);
  }, []);

  const toggleUnit = useCallback(() => {
    setUnitState((prevUnit) => {
      const nextUnit: TechPackUnit = prevUnit === 'inch' ? 'cm' : 'inch';
      setMeasurements((prevM) =>
        prevM.map((m) => {
          const num = parseFloat(m.value.replace(/[^0-9.]/g, ''));
          if (isNaN(num)) return m;
          if (nextUnit === 'cm') {
            return { ...m, value: `${Math.round(num * 2.54)} cm` };
          } else {
            return { ...m, value: `${Math.round(num / 2.54)} in` };
          }
        })
      );
      triggerAutosave();
      return nextUnit;
    });
  }, [triggerAutosave]);

  const updateMeasurement = useCallback(
    (id: string, text: string) => {
      setMeasurements((prev) =>
        prev.map((m) => (m.id === id ? { ...m, value: text } : m))
      );
      triggerAutosave();
    },
    [triggerAutosave]
  );

  const updateFabricNotes = useCallback(
    (text: string) => {
      setFabrics((prev) => ({ ...prev, fabricNotes: text }));
      triggerAutosave();
    },
    [triggerAutosave]
  );

  const updateStitchNotes = useCallback(
    (text: string) => {
      setFabrics((prev) => ({ ...prev, stitchNotes: text }));
      triggerAutosave();
    },
    [triggerAutosave]
  );

  const updateEmbroideryNotes = useCallback(
    (text: string) => {
      setFabrics((prev) => ({ ...prev, embroideryNotes: text }));
      triggerAutosave();
    },
    [triggerAutosave]
  );

  const updateColorChips = useCallback(
    (chips: string[]) => {
      setFabrics((prev) => ({ ...prev, colorChips: chips }));
      triggerAutosave();
    },
    [triggerAutosave]
  );

  const updateNotes = useCallback(
    (text: string) => {
      setNotes(text);
      triggerAutosave();
    },
    [triggerAutosave]
  );

  return {
    techPack,
    unit,
    measurements,
    fabrics,
    notes,
    isLoading,
    toggleUnit,
    updateMeasurement,
    updateFabricNotes,
    updateStitchNotes,
    updateEmbroideryNotes,
    updateNotes,
    updateColorChips,
  };
}
