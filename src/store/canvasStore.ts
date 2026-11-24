import { create } from 'zustand';
import { produce } from 'immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Sketch,
  Layer,
  CanvasItem,
  Point,
  StrokeItem,
  ToolType,
  ToolSettings,
  Viewport,
  Guides,
  Fill,
  ShapeItem,
} from '../types/canvas';
import { HistoryManager } from '../canvas/engine/history';
import { FIGURE_CROQUIS } from '../canvas/templates/figures';
import { GARMENT_FLATS } from '../canvas/templates/flats';
import { getStoredRecentColors, storeRecentColors } from '../data/colorPalettes';
import { sketchRepository } from '../services/sketchRepository';

const DEFAULT_LAYERS: Layer[] = [
  {
    id: 'layer_figure',
    name: 'Figure',
    type: 'figure',
    visible: true,
    locked: true,
    opacity: 0.6,
    items: [
      {
        id: `croquis_${FIGURE_CROQUIS[0].id}`,
        type: 'stroke',
        tool: 'fineliner',
        color: '#A8A49C',
        width: 1.2,
        opacity: 0.6,
        points: [],
        svgPath: FIGURE_CROQUIS[0].strokePath,
      },
    ],
  },
  {
    id: 'layer_garment',
    name: 'Garment',
    type: 'garment',
    visible: true,
    locked: false,
    opacity: 1.0,
    items: [],
  },
  {
    id: 'layer_details',
    name: 'Details',
    type: 'details',
    visible: true,
    locked: false,
    opacity: 1.0,
    items: [],
  },
  {
    id: 'layer_notes',
    name: 'Notes',
    type: 'notes',
    visible: true,
    locked: false,
    opacity: 1.0,
    items: [],
  },
];

const DEFAULT_SKETCH: Sketch = {
  id: 'sketch_atelier_seed',
  title: 'Kurta study',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  canvasSize: { width: 400, height: 720 },
  layers: DEFAULT_LAYERS,
  viewport: {
    scale: 1.0,
    translateX: 0,
    translateY: 0,
    rotation: 0,
  },
  guides: {
    dotGrid: true,
    centerLine: true,
    snapToGrid: false,
    proportionGuides: false,
  },
};

interface CanvasStoreState {
  sketch: Sketch;
  activeLayerId: string;
  activeTool: ToolType;
  toolSettings: ToolSettings;
  isAutosaved: boolean;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryManager;

  recentColors: string[];
  selectColor: (hex: string) => void;

  // Actions
  setActiveTool: (tool: ToolType) => void;
  updateToolSettings: (settings: Partial<ToolSettings>) => void;
  setActiveLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  duplicateLayer: (layerId: string) => void;
  deleteLayer: (layerId: string) => void;
  mergeLayerDown: (layerId: string) => void;
  renameLayer: (layerId: string, name: string) => void;

  addItemToActiveLayer: (item: CanvasItem) => void;
  eraseNearPoint: (point: Point, radius?: number) => void;
  updateShapeFill: (shapeId: string, layerId: string, fill: Fill) => void;

  undo: () => void;
  redo: () => void;

  setViewport: (viewport: Partial<Viewport>) => void;
  resetViewport: () => void;
  toggleGuide: (guide: keyof Guides) => void;

  loadFigureTemplate: (figureId: string) => void;
  loadGarmentFlat: (flatId: string) => void;
  fitFlatToFigure: () => void;
  setTitle: (title: string) => void;

  triggerAutosave: () => void;
  loadStoredSketch: (id: string) => Promise<void>;
  seedExampleSketch: () => void;

  // Non-destructive AI Assist actions
  addCustomLayer: (layer: Layer) => void;
  applyCleanedSketch: (cleanedSvgPath: string) => void;
  applyGarmentVariant: (variant: any, mode: 'duplicate' | 'replace') => void;
  savedPalettes: Array<{ id: string; name: string; colors: string[] }>;
  savePalette: (name: string, colors: string[]) => void;
  customPatterns: Array<{ id: string; name: string; patternSvg: string }>;
  saveCustomPattern: (id: string, name: string, patternSvg: string) => void;
  applyMotifToGarmentPart: (part: 'sleeves' | 'body' | 'full', motif: any) => void;
  applyBorderBrush: (borderPath: string, motifName: string) => void;
  applyHarmonicPalette: (paletteColors: string[]) => void;
}

let autosaveTimeout: any = null;

export const useCanvasStore = create<CanvasStoreState>((set, get) => {
  const history = new HistoryManager();

  return {
    sketch: DEFAULT_SKETCH,
    activeLayerId: 'layer_garment',
    activeTool: 'pencil',
    toolSettings: {
      size: 4,
      opacity: 0.9,
      stabilizer: 30,
      color: '#7F0020',
      isDashed: false,
      snap15Deg: false,
    },
    recentColors: [
      '#7F0020',
      '#C9A24B',
      '#B85D3A',
      '#D4AF37',
      '#2D5A27',
      '#2A0A14',
    ],
    selectColor: (hex: string) => {
      const normalized = hex.startsWith('#')
        ? hex.toUpperCase()
        : '#' + hex.toUpperCase();
      set(
        produce((state: CanvasStoreState) => {
          state.toolSettings.color = normalized;
          state.toolSettings.fill = {
            type: 'color',
            value: normalized,
            scale: 1.0,
            rotation: 0,
          };
          const filtered = state.recentColors.filter(
            (col) => col.toUpperCase() !== normalized
          );
          state.recentColors = [normalized, ...filtered].slice(0, 6);
        })
      );
      storeRecentColors(get().recentColors);
    },
    isAutosaved: true,
    canUndo: false,
    canRedo: false,
    history,
    savedPalettes: [
      {
        id: 'pal_init_1',
        name: 'Mughal Gold',
        colors: ['#0E2A1E', '#1D4D39', '#D4AF37', '#EED888', '#F7F4EE'],
      },
    ],
    savePalette: (name: string, colors: string[]) => {
      set(
        produce((state: CanvasStoreState) => {
          state.savedPalettes.unshift({
            id: `pal_${Date.now()}`,
            name,
            colors,
          });
        })
      );
    },
    customPatterns: [],
    saveCustomPattern: (id: string, name: string, patternSvg: string) => {
      set(
        produce((state: CanvasStoreState) => {
          state.customPatterns.unshift({ id, name, patternSvg });
        })
      );
    },

    addCustomLayer: (newLayer: Layer) => {
      const command = {
        id: `cmd_add_layer_${Date.now()}`,
        name: `Add ${newLayer.name}`,
        execute: () => {
          set(
            produce((state: CanvasStoreState) => {
              state.sketch.layers.push(newLayer);
              state.activeLayerId = newLayer.id;
            })
          );
        },
        undo: () => {
          set(
            produce((state: CanvasStoreState) => {
              state.sketch.layers = state.sketch.layers.filter(
                (l) => l.id !== newLayer.id
              );
              state.activeLayerId =
                state.sketch.layers[state.sketch.layers.length - 1]?.id ||
                'layer_garment';
            })
          );
        },
      };

      history.push(command, get().sketch);
      set({ canUndo: history.canUndo, canRedo: history.canRedo });
      get().triggerAutosave();
    },

    eraseNearPoint: (point, radius = 24) => {
      const activeId = get().activeLayerId;
      const targetLayer = get().sketch.layers.find((l) => l.id === activeId);
      if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

      const previousItems = [...targetLayer.items];
      const itemsToKeep = targetLayer.items.filter((item) => {
        if (item.type === 'stroke') {
          const s = item as StrokeItem;
          if (s.points && s.points.length > 0) {
            return !s.points.some(
              (p: Point) => Math.hypot(p.x - point.x, p.y - point.y) <= radius
            );
          }
          return false;
        }
        return true;
      });

      if (itemsToKeep.length !== targetLayer.items.length) {
        const command = {
          id: `cmd_erase_${Date.now()}`,
          name: 'Erase stroke',
          execute: () => {
            set(
              produce((state: CanvasStoreState) => {
                const layer = state.sketch.layers.find((l) => l.id === activeId);
                if (layer) layer.items = itemsToKeep;
              })
            );
          },
          undo: () => {
            set(
              produce((state: CanvasStoreState) => {
                const layer = state.sketch.layers.find((l) => l.id === activeId);
                if (layer) layer.items = previousItems;
              })
            );
          },
        };
        history.push(command, get().sketch);
        set({ canUndo: history.canUndo, canRedo: history.canRedo });
        get().triggerAutosave();
      }
    },

    applyCleanedSketch: (cleanedSvgPath: string) => {
      const activeId = get().activeLayerId;
      const cleanLayerId = `layer_clean_${Date.now()}`;
      const newLayer: Layer = {
        id: cleanLayerId,
        name: 'AI Clean',
        type: 'garment',
        visible: true,
        locked: false,
        opacity: 1.0,
        items: [
          {
            id: `item_clean_${Date.now()}`,
            type: 'shape',
            shapeType: 'path',
            svgPath: cleanedSvgPath,
            closed: false,
            stroke: {
              color: '#0E0E10',
              width: 2.2,
            },
          },
        ],
      };

      const previousLayers = [...get().sketch.layers];

      const command = {
        id: `cmd_clean_${Date.now()}`,
        name: 'AI Clean',
        execute: () => {
          set(
            produce((state: CanvasStoreState) => {
              const rawLayer = state.sketch.layers.find((l) => l.id === activeId);
              if (rawLayer) rawLayer.opacity = 0.2;
              state.sketch.layers.push(newLayer);
              state.activeLayerId = cleanLayerId;
            })
          );
        },
        undo: () => {
          set(
            produce((state: CanvasStoreState) => {
              state.sketch.layers = previousLayers;
              state.activeLayerId = activeId;
            })
          );
        },
      };

      history.push(command, get().sketch);
      set({ canUndo: history.canUndo, canRedo: history.canRedo });
      get().triggerAutosave();
    },

    applyGarmentVariant: (variant: any, mode: 'duplicate' | 'replace') => {
      const activeId = get().activeLayerId;
      const previousLayers = [...get().sketch.layers];
      const targetLayer = get().sketch.layers.find((l) => l.id === activeId);
      const previousItems = targetLayer ? [...targetLayer.items] : [];

      const newShapeItems: CanvasItem[] = [
        {
          id: `var_body_${Date.now()}`,
          type: 'shape',
          shapeType: 'path',
          svgPath: variant.strokePath,
          closed: true,
          fill: {
            type: 'fabric',
            value: 'silk',
            scale: 1.0,
            rotation: 0,
          },
          stroke: {
            color: '#0E0E10',
            width: 2,
          },
        },
        ...variant.detailPaths.map((dp: string, idx: number) => ({
          id: `var_det_${Date.now()}_${idx}`,
          type: 'shape' as const,
          shapeType: 'path' as const,
          svgPath: dp,
          closed: false,
          stroke: {
            color: '#0E0E10',
            width: 1.5,
          },
        })),
      ];

      if (mode === 'duplicate') {
        const variantLayerId = `layer_variant_${Date.now()}`;
        const newLayer: Layer = {
          id: variantLayerId,
          name: variant.title,
          type: 'garment',
          visible: true,
          locked: false,
          opacity: 1.0,
          items: newShapeItems,
        };

        const command = {
          id: `cmd_var_dup_${Date.now()}`,
          name: `Variant ${variant.title}`,
          execute: () => {
            set(
              produce((state: CanvasStoreState) => {
                state.sketch.layers.push(newLayer);
                state.activeLayerId = variantLayerId;
              })
            );
          },
          undo: () => {
            set(
              produce((state: CanvasStoreState) => {
                state.sketch.layers = previousLayers;
                state.activeLayerId = activeId;
              })
            );
          },
        };

        history.push(command, get().sketch);
        set({ canUndo: history.canUndo, canRedo: history.canRedo });
        get().triggerAutosave();
      } else {
        const command = {
          id: `cmd_var_rep_${Date.now()}`,
          name: `Replace ${variant.title}`,
          execute: () => {
            set(
              produce((state: CanvasStoreState) => {
                const layer = state.sketch.layers.find((l) => l.id === activeId);
                if (layer) layer.items = newShapeItems;
              })
            );
          },
          undo: () => {
            set(
              produce((state: CanvasStoreState) => {
                const layer = state.sketch.layers.find((l) => l.id === activeId);
                if (layer) layer.items = previousItems;
              })
            );
          },
        };

        history.push(command, get().sketch);
        set({ canUndo: history.canUndo, canRedo: history.canRedo });
        get().triggerAutosave();
      }
    },

    applyMotifToGarmentPart: (part, motif) => {
      const garmentLayer = get().sketch.layers.find((l) => l.type === 'garment');
      if (!garmentLayer) return;

      const previousItems = [...garmentLayer.items];
      const patternId = motif.id;

      get().saveCustomPattern(patternId, motif.name, motif.patternSvg);

      const targetPartIds =
        part === 'sleeves'
          ? ['kurta_sleeve_left', 'kurta_sleeve_right', 'sleeve_left', 'sleeve_right']
          : part === 'body'
          ? ['kurta_body', 'body']
          : ['kurta_body', 'kurta_sleeve_left', 'kurta_sleeve_right', 'body'];

      const command = {
        id: `cmd_motif_part_${Date.now()}`,
        name: `Apply ${motif.name} to ${part}`,
        execute: () => {
          set(
            produce((state: CanvasStoreState) => {
              const gLayer = state.sketch.layers.find((l) => l.type === 'garment');
              if (!gLayer) return;

              let matchedAny = false;
              gLayer.items.forEach((item) => {
                if (
                  item.type === 'shape' &&
                  (targetPartIds.includes(item.id) ||
                    targetPartIds.includes((item as any).name?.toLowerCase()))
                ) {
                  matchedAny = true;
                  (item as ShapeItem).fill = {
                    type: 'fabric',
                    value: 'silk',
                    scale: 1.0,
                    rotation: 0,
                  };
                  (item as ShapeItem).stroke = {
                    color: motif.accentColor,
                    width: 1.8,
                  };
                }
              });

              if (!matchedAny) {
                const newPart: ShapeItem = {
                  id: `part_${part}_${Date.now()}`,
                  type: 'shape',
                  shapeType: 'path',
                  name: `Embroidered ${part}`,
                  closed: true,
                  svgPath:
                    part === 'sleeves'
                      ? 'M 170 120 L 130 200 L 142 210 L 165 155 Z M 230 120 L 270 200 L 258 210 L 235 155 Z'
                      : 'M 170 120 L 230 120 L 236 210 L 246 450 L 154 450 L 164 210 Z',
                  fill: {
                    type: 'fabric',
                    value: 'silk',
                    scale: 1.0,
                    rotation: 0,
                  },
                  stroke: {
                    color: motif.accentColor,
                    width: 1.8,
                  },
                };
                gLayer.items.push(newPart);
              }
            })
          );
        },
        undo: () => {
          set(
            produce((state: CanvasStoreState) => {
              const gLayer = state.sketch.layers.find((l) => l.type === 'garment');
              if (gLayer) gLayer.items = previousItems;
            })
          );
        },
      };

      history.push(command, get().sketch);
      set({ canUndo: history.canUndo, canRedo: history.canRedo });
      get().triggerAutosave();
    },


    applyBorderBrush: (borderPath, motifName) => {
      const activeId = get().activeLayerId;
      const borderLayerId = `layer_border_${Date.now()}`;
      const newLayer: Layer = {
        id: borderLayerId,
        name: `Border: ${motifName}`,
        type: 'details',
        visible: true,
        locked: false,
        opacity: 1.0,
        items: [
          {
            id: `item_border_${Date.now()}`,
            type: 'shape',
            shapeType: 'path',
            svgPath:
              borderPath ||
              'M 154 445 L 246 445 M 130 205 L 142 210 M 270 205 L 258 210',
            closed: false,
            stroke: {
              color: '#D4AF37',
              width: 3.2,
              style: 'dashed',
            },
          },
        ],
      };

      const previousLayers = [...get().sketch.layers];

      const command = {
        id: `cmd_border_${Date.now()}`,
        name: `Border ${motifName}`,
        execute: () => {
          set(
            produce((state: CanvasStoreState) => {
              state.sketch.layers.push(newLayer);
              state.activeLayerId = borderLayerId;
            })
          );
        },
        undo: () => {
          set(
            produce((state: CanvasStoreState) => {
              state.sketch.layers = previousLayers;
              state.activeLayerId = activeId;
            })
          );
        },
      };

      history.push(command, get().sketch);
      set({ canUndo: history.canUndo, canRedo: history.canRedo });
      get().triggerAutosave();
    },


    applyHarmonicPalette: (paletteColors) => {
      const gLayer = get().sketch.layers.find((l) => l.type === 'garment');
      if (!gLayer) return;

      const previousItems = [...gLayer.items];
      const primaryColor = paletteColors[0] || '#0E2A1E';
      const accentColor = paletteColors[2] || '#D4AF37';

      const command = {
        id: `cmd_palette_${Date.now()}`,
        name: 'Apply palette',
        execute: () => {
          set(
            produce((state: CanvasStoreState) => {
              const layer = state.sketch.layers.find((l) => l.type === 'garment');
              if (!layer) return;
              layer.items.forEach((item, idx) => {
                if (item.type === 'shape') {
                  (item as ShapeItem).fill = {
                    type: 'color',
                    value: idx % 2 === 0 ? primaryColor : accentColor,
                    scale: 1,
                    rotation: 0,
                  };
                }
              });
            })
          );
        },
        undo: () => {
          set(
            produce((state: CanvasStoreState) => {
              const layer = state.sketch.layers.find((l) => l.type === 'garment');
              if (layer) layer.items = previousItems;
            })
          );
        },
      };

      history.push(command, get().sketch);
      set({ canUndo: history.canUndo, canRedo: history.canRedo });
      get().triggerAutosave();
    },


    setActiveTool: (tool) => set({ activeTool: tool }),

    updateToolSettings: (settings) => {
      set(
        produce((state: CanvasStoreState) => {
          state.toolSettings = { ...state.toolSettings, ...settings };
          if (settings.color) {
            const normalized = settings.color.startsWith('#')
              ? settings.color.toUpperCase()
              : `#${settings.color.toUpperCase()}`;
            state.toolSettings.color = normalized;
            state.toolSettings.fill = {
              type: 'color',
              value: normalized,
              scale: 1.0,
              rotation: 0,
            };
            const filtered = state.recentColors.filter(
              (col) => col.toUpperCase() !== normalized
            );
            state.recentColors = [normalized, ...filtered].slice(0, 6);
          }
        })
      );
      if (settings.color) {
        storeRecentColors(get().recentColors);
      }
    },

    setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

    toggleLayerVisibility: (layerId) =>
      set(
        produce((state: CanvasStoreState) => {
          const layer = state.sketch.layers.find((l) => l.id === layerId);
          if (layer) layer.visible = !layer.visible;
        })
      ),

    toggleLayerLock: (layerId) =>
      set(
        produce((state: CanvasStoreState) => {
          const layer = state.sketch.layers.find((l) => l.id === layerId);
          if (layer) layer.locked = !layer.locked;
        })
      ),

    setLayerOpacity: (layerId, opacity) =>
      set(
        produce((state: CanvasStoreState) => {
          const layer = state.sketch.layers.find((l) => l.id === layerId);
          if (layer) layer.opacity = opacity;
        })
      ),

    reorderLayers: (fromIndex, toIndex) =>
      set(
        produce((state: CanvasStoreState) => {
          const [moved] = state.sketch.layers.splice(fromIndex, 1);
          state.sketch.layers.splice(toIndex, 0, moved);
        })
      ),

    duplicateLayer: (layerId) =>
      set(
        produce((state: CanvasStoreState) => {
          const idx = state.sketch.layers.findIndex((l) => l.id === layerId);
          if (idx !== -1) {
            const original = state.sketch.layers[idx];
            const duplicate: Layer = {
              ...original,
              id: `layer_${Date.now()}`,
              name: `${original.name} copy`,
              items: JSON.parse(JSON.stringify(original.items)),
            };
            state.sketch.layers.splice(idx + 1, 0, duplicate);
          }
        })
      ),

    deleteLayer: (layerId) =>
      set(
        produce((state: CanvasStoreState) => {
          if (state.sketch.layers.length <= 1) return;
          state.sketch.layers = state.sketch.layers.filter((l) => l.id !== layerId);
          if (state.activeLayerId === layerId) {
            state.activeLayerId = state.sketch.layers[0].id;
          }
        })
      ),

    mergeLayerDown: (layerId) =>
      set(
        produce((state: CanvasStoreState) => {
          const idx = state.sketch.layers.findIndex((l) => l.id === layerId);
          if (idx > 0) {
            const target = state.sketch.layers[idx - 1];
            const source = state.sketch.layers[idx];
            target.items = [...target.items, ...source.items];
            state.sketch.layers.splice(idx, 1);
            state.activeLayerId = target.id;
          }
        })
      ),

    renameLayer: (layerId, name) =>
      set(
        produce((state: CanvasStoreState) => {
          const layer = state.sketch.layers.find((l) => l.id === layerId);
          if (layer) layer.name = name;
        })
      ),

    addItemToActiveLayer: (item) => {
      const activeId = get().activeLayerId;
      const targetLayer = get().sketch.layers.find((l) => l.id === activeId);
      if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

      const previousItems = [...targetLayer.items];

      const command = {
        id: `cmd_add_${Date.now()}`,
        name: `Add ${item.type}`,
        execute: () => {
          set(
            produce((state: CanvasStoreState) => {
              const layer = state.sketch.layers.find((l) => l.id === activeId);
              if (layer) layer.items.push(item);
            })
          );
        },
        undo: () => {
          set(
            produce((state: CanvasStoreState) => {
              const layer = state.sketch.layers.find((l) => l.id === activeId);
              if (layer) layer.items = previousItems;
            })
          );
        },
      };

      history.push(command, get().sketch);
      set({ canUndo: history.canUndo, canRedo: history.canRedo });
      get().triggerAutosave();
    },


    updateShapeFill: (shapeId, layerId, fill) => {
      const layer = get().sketch.layers.find((l) => l.id === layerId);
      const shape = layer?.items.find((i) => i.id === shapeId) as ShapeItem | undefined;
      if (!shape) return;

      const previousFill = shape.fill;

      const command = {
        id: `cmd_fill_${Date.now()}`,
        name: 'Update fill',
        execute: () => {
          set(
            produce((state: CanvasStoreState) => {
              const targetL = state.sketch.layers.find((l) => l.id === layerId);
              const targetS = targetL?.items.find((i) => i.id === shapeId) as
                | ShapeItem
                | undefined;
              if (targetS) targetS.fill = fill;
            })
          );
        },
        undo: () => {
          set(
            produce((state: CanvasStoreState) => {
              const targetL = state.sketch.layers.find((l) => l.id === layerId);
              const targetS = targetL?.items.find((i) => i.id === shapeId) as
                | ShapeItem
                | undefined;
              if (targetS) targetS.fill = previousFill;
            })
          );
        },
      };

      history.push(command, get().sketch);
      set({ canUndo: history.canUndo, canRedo: history.canRedo });
      get().triggerAutosave();
    },


    undo: () => {
      if (history.undo()) {
        set({ canUndo: history.canUndo, canRedo: history.canRedo });
        get().triggerAutosave();
      }
    },

    redo: () => {
      if (history.redo()) {
        set({ canUndo: history.canUndo, canRedo: history.canRedo });
        get().triggerAutosave();
      }
    },

    setViewport: (viewport) =>
      set(
        produce((state: CanvasStoreState) => {
          state.sketch.viewport = { ...state.sketch.viewport, ...viewport };
        })
      ),

    resetViewport: () =>
      set(
        produce((state: CanvasStoreState) => {
          state.sketch.viewport = {
            scale: 1.0,
            translateX: 0,
            translateY: 0,
            rotation: 0,
          };
        })
      ),

    toggleGuide: (guide) =>
      set(
        produce((state: CanvasStoreState) => {
          state.sketch.guides[guide] = !state.sketch.guides[guide];
        })
      ),

    loadFigureTemplate: (figureId) => {
      const croquis = FIGURE_CROQUIS.find((f) => f.id === figureId);
      if (!croquis) return;

      set(
        produce((state: CanvasStoreState) => {
          let figLayer = state.sketch.layers.find((l) => l.type === 'figure');
          if (!figLayer) {
            figLayer = {
              id: 'layer_figure',
              name: 'Figure',
              type: 'figure',
              visible: true,
              locked: true,
              opacity: 0.6,
              items: [],
            };
            state.sketch.layers.unshift(figLayer);
          }

          figLayer.items = [
            {
              id: `croquis_${croquis.id}`,
              type: 'shape',
              shapeType: 'path',
              closed: false,
              svgPath: croquis.strokePath,
              stroke: { color: '#8A8794', width: 1.2, style: 'solid' },
            },
          ];
        })
      );
      get().triggerAutosave();
    },

    loadGarmentFlat: (flatId) => {
      const flat = GARMENT_FLATS.find((f) => f.id === flatId);
      if (!flat) return;

      set(
        produce((state: CanvasStoreState) => {
          let gLayer = state.sketch.layers.find((l) => l.type === 'garment');
          if (!gLayer) {
            gLayer = {
              id: 'layer_garment',
              name: 'Garment',
              type: 'garment',
              visible: true,
              locked: false,
              opacity: 1.0,
              items: [],
            };
            state.sketch.layers.push(gLayer);
          }

          gLayer.items = JSON.parse(JSON.stringify(flat.parts));
          state.sketch.title = flat.name;
        })
      );
      get().triggerAutosave();
    },

    fitFlatToFigure: () => {
      set(
        produce((state: CanvasStoreState) => {
          state.sketch.viewport = {
            scale: 1.0,
            translateX: 0,
            translateY: 0,
            rotation: 0,
          };
        })
      );
    },

    setTitle: (title) =>
      set(
        produce((state: CanvasStoreState) => {
          state.sketch.title = title;
          state.sketch.updatedAt = new Date().toISOString();
        })
      ),

    triggerAutosave: () => {
      set({ isAutosaved: false });
      if (autosaveTimeout) clearTimeout(autosaveTimeout);

      autosaveTimeout = setTimeout(async () => {
        try {
          const current = get().sketch;
          await AsyncStorage.setItem(
            `voguecraft_sketch_${current.id}`,
            JSON.stringify(current)
          );
          await sketchRepository.updateSketch(current.id, {
            title: current.title,
            data: current as any,
          });
          set({ isAutosaved: true });
        } catch {}
      }, 2000); // Throttled to 2 seconds after last change
    },

    loadStoredSketch: async (id) => {
      try {
        const res = await sketchRepository.getSketch(id);
        if (res.data?.sketch) {
          set({ sketch: res.data.sketch, isAutosaved: true });
          return;
        }
        const stored = await AsyncStorage.getItem(`voguecraft_sketch_${id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          set({ sketch: parsed, isAutosaved: true });
        }
      } catch {}
    },

    seedExampleSketch: () => {
      // Seeds the Kurta flat with Brocade sleeves and Silk body to satisfy:
      // "Fill a kurta sleeve with brocade and the body with silk independently."
      const kurta = GARMENT_FLATS[0]; // flat_kurta
      const femaleCroquis = FIGURE_CROQUIS[0]; // female front

      const parts = JSON.parse(JSON.stringify(kurta.parts)) as ShapeItem[];

      // Body filled with Silk
      const bodyPart = parts.find((p) => p.id === 'kurta_body');
      if (bodyPart) {
        bodyPart.fill = {
          type: 'fabric',
          value: 'silk',
          scale: 1.0,
          rotation: 0,
        };
      }

      // Left Sleeve filled with Brocade
      const sleeveLeft = parts.find((p) => p.id === 'kurta_sleeve_left');
      if (sleeveLeft) {
        sleeveLeft.fill = {
          type: 'fabric',
          value: 'brocade',
          scale: 1.0,
          rotation: 0,
        };
      }

      // Right Sleeve filled with Brocade
      const sleeveRight = parts.find((p) => p.id === 'kurta_sleeve_right');
      if (sleeveRight) {
        sleeveRight.fill = {
          type: 'fabric',
          value: 'brocade',
          scale: 1.0,
          rotation: 0,
        };
      }

      set(
        produce((state: CanvasStoreState) => {
          state.sketch.title = 'Kurta study';
          // Figure layer
          const figLayer = state.sketch.layers.find((l) => l.type === 'figure');
          if (figLayer) {
            figLayer.items = [
              {
                id: `croquis_${femaleCroquis.id}`,
                type: 'shape',
                shapeType: 'path',
                closed: false,
                svgPath: femaleCroquis.strokePath,
                stroke: { color: '#8A8794', width: 1.2, style: 'solid' },
              },
            ];
          }

          // Garment layer
          const garmentLayer = state.sketch.layers.find((l) => l.type === 'garment');
          if (garmentLayer) {
            garmentLayer.items = parts;
          }
        })
      );
      get().triggerAutosave();
    },
  };
});

// Hydrate stored recent colors on initialization
getStoredRecentColors().then((stored) => {
  if (stored && stored.length > 0) {
    useCanvasStore.setState({ recentColors: stored });
  }
});
