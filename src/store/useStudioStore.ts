import { create } from 'zustand';
import {
  SketchItem,
  GarmentTemplate,
  FigureTemplate,
  FabricSwatch,
  INITIAL_SKETCHES,
  FABRIC_SWATCHES,
} from '../data';

export type DrawingTool = 'pencil' | 'pen' | 'brush' | 'eraser';

export interface DrawnPath {
  id: string;
  d: string;
  color: string;
  width: number;
}

interface StudioState {
  // App state
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;

  // Sketches
  sketches: SketchItem[];
  activeSketch: SketchItem | null;
  setActiveSketch: (sketch: SketchItem | null) => void;
  addSketch: (sketch: SketchItem) => void;
  deleteSketch: (id: string) => void;
  clearAllSketches: () => void; // for testing empty state
  resetToInitialSketches: () => void;

  // Active studio canvas state
  activeTemplate: GarmentTemplate | FigureTemplate | null;
  setActiveTemplate: (template: GarmentTemplate | FigureTemplate | null) => void;
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedFabric: FabricSwatch;
  setSelectedFabric: (fabric: FabricSwatch) => void;
  drawnStrokes: DrawnPath[];
  addStroke: (stroke: DrawnPath) => void;
  undoStroke: () => void;
  clearStrokes: () => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  onboardingCompleted: false,
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

  sketches: INITIAL_SKETCHES,
  activeSketch: null,
  setActiveSketch: (sketch) => set({ activeSketch: sketch }),
  addSketch: (sketch) =>
    set((state) => ({ sketches: [sketch, ...state.sketches] })),
  deleteSketch: (id) =>
    set((state) => ({
      sketches: state.sketches.filter((s) => s.id !== id),
      activeSketch: state.activeSketch?.id === id ? null : state.activeSketch,
    })),
  clearAllSketches: () => set({ sketches: [] }),
  resetToInitialSketches: () => set({ sketches: INITIAL_SKETCHES }),

  activeTemplate: null,
  setActiveTemplate: (template) => set({ activeTemplate: template }),
  activeTool: 'pencil',
  setActiveTool: (tool) => set({ activeTool: tool }),
  selectedColor: '#0E0E10',
  setSelectedColor: (color) => set({ selectedColor: color }),
  selectedFabric: FABRIC_SWATCHES[0],
  setSelectedFabric: (fabric) => set({ selectedFabric: fabric }),
  drawnStrokes: [],
  addStroke: (stroke) =>
    set((state) => ({ drawnStrokes: [...state.drawnStrokes, stroke] })),
  undoStroke: () =>
    set((state) => ({
      drawnStrokes: state.drawnStrokes.slice(0, -1),
    })),
  clearStrokes: () => set({ drawnStrokes: [] }),
}));
