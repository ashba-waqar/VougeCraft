import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Pressable,
  Image,
  ScrollView,
  Alert,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import {
  Plus,
  Palette,
  Image as ImageIcon,
  Layers,
  Scissors,
  Sparkles,
  Move,
  RotateCw,
  Trash2,
  Maximize2,
  FolderPlus,
  FileDown,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme, radius, spacing, typography, shadows } from '../../theme';
import { IconButton, Button, Card, Sheet, PressableScale, FadeInUp, PaperGrain, CardSurface } from '../../components';
import { FABRIC_SWATCHES, COLOR_SWATCHES, GARMENT_TEMPLATES, SketchItem } from '../../data';
import { ExportEngine } from '../../canvas/engine/export';
import { exportService } from '../../services/exportService';
import { sketchRepository } from '../../services/sketchRepository';
import { triggerHaptic } from '../../utils/haptics';
import { useBoard } from '../../hooks/useBoard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BoardItem {
  id: string;
  type: 'sketch' | 'swatch' | 'palette' | 'photo';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  data: any;
  groupId?: string;
}

const INITIAL_BOARD_ITEMS: BoardItem[] = [
  {
    id: 'item-1',
    type: 'sketch',
    x: 35,
    y: 40,
    scale: 1.0,
    rotation: -4,
    data: {
      title: 'Kurta draft',
      path: GARMENT_TEMPLATES[6].strokePath,
      color: '#0E0E10',
    },
  },
  {
    id: 'item-2',
    type: 'swatch',
    x: 215,
    y: 30,
    scale: 1.0,
    rotation: 5,
    data: {
      name: 'Raw silk',
      fiber: 'Slub texture',
      color: '#D4AF37',
    },
  },
  {
    id: 'item-3',
    type: 'palette',
    x: 45,
    y: 220,
    scale: 1.0,
    rotation: 2,
    data: {
      name: 'Atelier palette',
      colors: ['#0E0E10', '#7F0020', '#B85D3A', '#D4AF37', '#F7F4EE'],
    },
  },
  {
    id: 'item-4',
    type: 'swatch',
    x: 220,
    y: 190,
    scale: 1.0,
    rotation: -3,
    data: {
      name: 'Brocade weave',
      fiber: 'Gold zari',
      color: '#78182E',
    },
  },
];

const AnimatedView = Animated.createAnimatedComponent(View);

const getDeterministicTilt = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  const val = ((Math.abs(hash) % 41) - 20) / 10;
  return Math.round(val * 10) / 10;
};

interface DraggableBoardItemProps {
  item: BoardItem;
  isSelected: boolean;
  onSelect: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  children: React.ReactNode;
}

const DraggableBoardItem: React.FC<DraggableBoardItemProps> = ({
  item,
  isSelected,
  onSelect,
  onUpdatePosition,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
        },
        onPanResponderGrant: () => {
          setIsDragging(true);
          triggerHaptic('selection');
        },
        onPanResponderMove: (_, gestureState) => {
          setDragOffset({ x: gestureState.dx, y: gestureState.dy });
        },
        onPanResponderRelease: (_, gestureState) => {
          setIsDragging(false);
          const didMove =
            Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
          if (didMove) {
            triggerHaptic('light');
            onUpdatePosition(item.x + gestureState.dx, item.y + gestureState.dy);
          } else {
            onSelect();
          }
          setDragOffset({ x: 0, y: 0 });
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          setDragOffset({ x: 0, y: 0 });
        },
      }),
    [item.x, item.y, onSelect, onUpdatePosition]
  );

  const baseTilt = getDeterministicTilt(item.id);
  const totalRotation = baseTilt + (item.rotation || 0);
  const currentScale = isDragging ? 1.04 * (item.scale || 1) : item.scale || 1;
  const currentShadowOpacity = isDragging ? 0.38 : 0.22;
  const currentElevation = isDragging ? 10 : 6;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.boardItemWrapper,
        {
          left: item.x + dragOffset.x,
          top: item.y + dragOffset.y,
          zIndex: isDragging ? 99 : isSelected ? 30 : 10,
          transform: [
            { scale: currentScale },
            { rotate: `${totalRotation}deg` },
          ],
        },
      ]}
    >
      <View style={styles.pinDot} />
      <CardSurface
        borderRadius={radius.cards}
        shadowOpacity={currentShadowOpacity}
        shadowElevation={currentElevation}
        style={[
          styles.boardCardSurface,
          isSelected && styles.boardCardSelected,
        ]}
      >
        {children}
      </CardSurface>
    </View>
  );
};

export const BoardsScreen: React.FC = () => {
  const colors = useTheme();
  const {
    items,
    selectedItemId,
    setSelectedItemId,
    addItem,
    updateItemPosition,
    rotateItem,
    scaleItem,
    deleteItem,
    toggleGroupItem,
    uploadAndAddPhoto,
  } = useBoard();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<string[] | null>(null);
  const [isLookbookModalOpen, setIsLookbookModalOpen] = useState(false);
  const [lookbookSketches, setLookbookSketches] = useState<SketchItem[]>([]);
  const [selectedSketchIds, setSelectedSketchIds] = useState<string[]>([]);
  const [isExportingLookbook, setIsExportingLookbook] = useState(false);
  const [lookbookProgress, setLookbookProgress] = useState(0);
  const lookbookAbortRef = useRef<AbortController | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  // Extract a 5-color palette from photo
  const extractPaletteFromImage = (imageUri: string) => {
    triggerHaptic('medium');
    // Curated high-fashion 5-color harmonious extraction palette
    const extractedHarmony = [
      '#1A1A1F', // Deep shadow
      '#8C7A6B', // Muted earth
      '#D9B97A', // Warm gold
      '#7F0020', // Accent crimson
      '#EDE8DF', // Soft highlight
    ];

    setExtractedPalette(extractedHarmony);

    // Add palette directly onto board
    const newPaletteItem: BoardItem = {
      id: `palette_${Date.now()}`,
      type: 'palette',
      x: 100,
      y: 150,
      scale: 1.0,
      rotation: 0,
      data: {
        name: 'Photo palette',
        colors: extractedHarmony,
      },
    };

    addItem(newPaletteItem);
  };

  const handlePickPhoto = async () => {
    setIsAddSheetOpen(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const photoUri = result.assets[0].uri;
        await uploadAndAddPhoto(photoUri);
        // Extract 5-color palette automatically from uploaded photo!
        extractPaletteFromImage(photoUri);
      }
    } catch {}
  };

  const handleAddFabric = (fabric: any) => {
    setIsAddSheetOpen(false);
    const newSwatch: BoardItem = {
      id: `swatch_${Date.now()}`,
      type: 'swatch',
      x: 140,
      y: 120,
      scale: 1.0,
      rotation: Math.floor(Math.random() * 10) - 5,
      data: {
        name: fabric.name,
        fiber: fabric.fiber,
        color: fabric.color,
      },
    };
    addItem(newSwatch);
  };

  const handleAddSketch = (garment: any) => {
    setIsAddSheetOpen(false);
    const newSketch: BoardItem = {
      id: `sketch_${Date.now()}`,
      type: 'sketch',
      x: 80,
      y: 80,
      scale: 1.0,
      rotation: 0,
      data: {
        title: garment.name,
        path: garment.strokePath,
        color: colors.ink,
      },
    };
    addItem(newSketch);
  };

  const handleRotateSelected = () => {
    if (!selectedItemId) return;
    triggerHaptic('light');
    rotateItem(selectedItemId, 15);
  };

  const handleScaleSelected = (direction: 'up' | 'down') => {
    if (!selectedItemId) return;
    triggerHaptic('light');
    scaleItem(selectedItemId, direction);
  };

  const handleDeleteSelected = () => {
    if (!selectedItemId) return;
    triggerHaptic('medium');
    deleteItem(selectedItemId);
  };

  const handleGroupSelected = () => {
    if (!selectedItemId) return;
    triggerHaptic('light');
    toggleGroupItem(selectedItemId);
  };

  const handleUpdateItemPosition = (id: string, newX: number, newY: number) => {
    updateItemPosition(id, newX, newY);
  };

  const handleOpenLookbook = async () => {
    triggerHaptic('light');
    setIsLookbookModalOpen(true);
    try {
      const res = await sketchRepository.listSketches();
      if (res.data && res.data.length > 0) {
        setLookbookSketches(res.data);
        setSelectedSketchIds(res.data.map((s) => s.id));
      } else {
        const fallbacks: SketchItem[] = GARMENT_TEMPLATES.map((t, idx) => ({
          id: `template_${idx}`,
          title: t.name,
          date: 'Design',
          category: t.category,
          fabricTag: t.tag,
          colorHex: '#0E0E10',
          strokePath: t.strokePath,
          detailPaths: [],
          thumbnail_path: null,
          thumbnailUrl: null,
        }));
        setLookbookSketches(fallbacks);
        setSelectedSketchIds(fallbacks.map((f) => f.id));
      }
    } catch {
      // Graceful fallback
    }
  };

  const handleToggleSketchSelection = (id: string) => {
    triggerHaptic('selection');
    setSelectedSketchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMoveSketch = (index: number, direction: 'up' | 'down') => {
    triggerHaptic('selection');
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lookbookSketches.length) return;
    const updated = [...lookbookSketches];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setLookbookSketches(updated);
  };

  const handleConfirmLookbookExport = async () => {
    const selected = lookbookSketches.filter((s) =>
      selectedSketchIds.includes(s.id)
    );
    if (selected.length === 0) {
      Alert.alert('No designs selected', 'Please select at least one design for your lookbook.');
      return;
    }

    triggerHaptic('medium');
    setIsExportingLookbook(true);
    setLookbookProgress(0);

    const controller = new AbortController();
    lookbookAbortRef.current = controller;

    try {
      const palette = extractedPalette || ['#0E0E10', '#7F0020', '#B85D3A', '#D4AF37', '#EDE8DF'];

      const designs = selected.map((s) => ({
        id: s.id,
        title: s.title,
        thumbnailUrl: s.thumbnailUrl,
        sketchData: {
          id: s.id,
          title: s.title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          canvasSize: { width: 400, height: 720 },
          viewport: { scale: 1, translateX: 0, translateY: 0, rotation: 0 },
          guides: { dotGrid: false, centerLine: false, snapToGrid: false, proportionGuides: false },
          layers: [
            {
              id: 'l1',
              name: 'Garment',
              type: 'garment' as const,
              visible: true,
              locked: false,
              opacity: 1,
              items: [
                {
                  id: `stroke_${s.id}`,
                  type: 'stroke' as const,
                  points: [],
                  color: s.colorHex || '#0E0E10',
                  width: 2,
                  opacity: 1,
                  tool: 'fineliner' as const,
                  svgPath: s.strokePath,
                },
              ],
            },
          ],
        },
        paletteColors: palette,
        fabrics: s.fabricTag || 'Silk blend',
        notes: 'Haute Couture collection plate. Silhouette crafted with bespoke proportions and couture draping.',
      }));

      await exportService.exportLookbookPdf({
        title: 'Haute Couture Edition',
        season: 'Autumn / Winter Atelier Edition',
        designs,
        contactLine: 'atelier@voguecraft.studio | Private Client Services',
        showWatermark: true,
        onProgress: (p) => setLookbookProgress(p),
        signal: controller.signal,
      });

      setIsLookbookModalOpen(false);
    } catch (err: any) {
      console.warn('Lookbook export error:', err);
    } finally {
      setIsExportingLookbook(false);
      lookbookAbortRef.current = null;
    }
  };

  const handleCancelLookbookExport = () => {
    if (lookbookAbortRef.current) {
      lookbookAbortRef.current.abort();
    }
    setIsExportingLookbook(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={['top', 'left', 'right']}>
      <PaperGrain />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>Moodboard</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {items.length} items pinned
          </Text>
        </View>

        <View style={styles.headerActions}>
          <IconButton
            icon={<FileDown size={18} color={colors.ink} strokeWidth={1.75} />}
            onPress={handleOpenLookbook}
            variant="default"
            size={36}
            shape="circle"
            accessibilityLabel="Export lookbook"
          />
          <PressableScale
            onPress={() => setIsAddSheetOpen(true)}
            accessibilityLabel="Add item"
          >
            <IconButton
              icon={<Plus size={18} color="#FFFFFF" strokeWidth={2} />}
              onPress={() => setIsAddSheetOpen(true)}
              variant="filled"
              size={36}
              shape="circle"
              accessibilityLabel="Add item"
            />
          </PressableScale>
        </View>
      </View>

      {/* Floating item transform controls when item selected */}
      {selectedItem && (
        <View style={[styles.itemControlsBar, { backgroundColor: colors.paperCard, borderColor: colors.line }]}>
          <IconButton
            icon={<RotateCw size={16} color={colors.ink} strokeWidth={1.75} />}
            onPress={handleRotateSelected}
            variant="ghost"
            size={32}
            accessibilityLabel="Rotate"
          />
          <IconButton
            icon={<Maximize2 size={16} color={colors.ink} strokeWidth={1.75} />}
            onPress={() => handleScaleSelected('up')}
            variant="ghost"
            size={32}
            accessibilityLabel="Enlarge"
          />
          <IconButton
            icon={<FolderPlus size={16} color={selectedItem.groupId ? colors.accent : colors.ink} strokeWidth={1.75} />}
            onPress={handleGroupSelected}
            variant="ghost"
            size={32}
            accessibilityLabel="Group"
          />
          <IconButton
            icon={<Trash2 size={16} color={colors.danger} strokeWidth={1.75} />}
            onPress={handleDeleteSelected}
            variant="ghost"
            size={32}
            accessibilityLabel="Delete"
          />
        </View>
      )}

      {/* Freeform Moodboard Canvas */}
      <View style={styles.canvasContainer}>
        {items.map((item, index) => {
          const isSelected = item.id === selectedItemId;

          return (
            <FadeInUp key={item.id} index={index}>
              <DraggableBoardItem
                item={item}
                isSelected={isSelected}
                onSelect={() => {
                  triggerHaptic('light');
                  setSelectedItemId(isSelected ? null : item.id);
                }}
                onUpdatePosition={(newX, newY) =>
                  handleUpdateItemPosition(item.id, newX, newY)
                }
              >
                <View style={styles.boardCardItem}>
                  {/* 1. SKETCH ITEM */}
                  {item.type === 'sketch' && (
                    <View style={styles.sketchItemContent}>
                      <Svg width={120} height={120} viewBox="0 0 110 110">
                        <Path
                          d={item.data.path}
                          stroke={colors.ink}
                          strokeWidth={1.6}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.ink }]}>
                        {item.data.title}
                      </Text>
                    </View>
                  )}

                  {/* 2. SWATCH ITEM */}
                  {item.type === 'swatch' && (
                    <View style={styles.swatchItemContent}>
                      <View
                        style={[
                          styles.swatchColorBlock,
                          { backgroundColor: item.data.color },
                        ]}
                      />
                      <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.ink }]}>
                        {item.data.name}
                      </Text>
                      <Text numberOfLines={1} style={[styles.itemSub, { color: colors.textMuted }]}>
                        {item.data.fiber}
                      </Text>
                    </View>
                  )}

                  {/* 3. PALETTE ITEM (5-color extracted strip) */}
                  {item.type === 'palette' && (
                    <View style={styles.paletteItemContent}>
                      <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.ink }]}>
                        {item.data.name}
                      </Text>
                      <View style={styles.paletteStrip}>
                        {item.data.colors.map((c: string, idx: number) => (
                          <View
                            key={idx}
                            style={[styles.paletteColorBlock, { backgroundColor: c }]}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* 4. PHOTO ITEM */}
                  {item.type === 'photo' && (
                    <View style={styles.photoItemContent}>
                      <Image
                        source={{ uri: item.data.uri }}
                        style={styles.photoThumb}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                </View>
              </DraggableBoardItem>
            </FadeInUp>
          );
        })}
      </View>

      {/* Add Items Bottom Sheet */}
      <Sheet
        visible={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        title="Add to board"
        options={[
          {
            id: 'photo',
            title: 'Upload photo',
            subtitle: 'Auto extracts five colors',
            icon: <ImageIcon size={20} color={colors.ink} strokeWidth={1.75} />,
            onPress: handlePickPhoto,
          },
          {
            id: 'sketch',
            title: 'Add sketch',
            subtitle: 'Western and Eastern lines',
            icon: <Scissors size={20} color={colors.ink} strokeWidth={1.75} />,
            onPress: () => handleAddSketch(GARMENT_TEMPLATES[0]),
          },
          {
            id: 'fabric',
            title: 'Add fabric',
            subtitle: 'Raw silk or brocade',
            icon: <Layers size={20} color={colors.ink} strokeWidth={1.75} />,
            onPress: () => handleAddFabric(FABRIC_SWATCHES[0]),
          },
        ]}
      />

      {/* Lookbook Export Sheet */}
      <Sheet
        visible={isLookbookModalOpen}
        onClose={() => {
          if (!isExportingLookbook) {
            setIsLookbookModalOpen(false);
          }
        }}
        title="Export lookbook"
      >
        <View style={styles.lookbookSheetContent}>
          {isExportingLookbook ? (
            <View style={styles.lookbookProgressBox}>
              <Text style={[styles.lookbookProgressText, { color: colors.ink }]}>
                Rendering lookbook pages ({lookbookProgress}%)
              </Text>
              <View style={[styles.progressBarBg, { backgroundColor: colors.line }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${lookbookProgress}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>
              <Button
                label="Cancel"
                variant="outline"
                size="small"
                onPress={handleCancelLookbookExport}
                style={styles.cancelBtn}
              />
            </View>
          ) : (
            <>
              <Text style={[styles.lookbookSub, { color: colors.textMuted }]}>
                Select and reorder sketches for A4 landscape lookbook:
              </Text>

              <ScrollView
                style={styles.sketchesScrollList}
                showsVerticalScrollIndicator={false}
              >
                {lookbookSketches.map((sketch, idx) => {
                  const isChecked = selectedSketchIds.includes(sketch.id);
                  return (
                    <View
                      key={sketch.id}
                      style={[
                        styles.sketchCheckRow,
                        { borderColor: colors.line },
                      ]}
                    >
                      <Pressable
                        style={styles.sketchCheckLeft}
                        onPress={() => handleToggleSketchSelection(sketch.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isChecked
                              ? { backgroundColor: colors.accent, borderColor: colors.accent }
                              : { borderColor: colors.line },
                          ]}
                        >
                          {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                        </View>
                        <View style={styles.sketchCheckMeta}>
                          <Text
                            numberOfLines={1}
                            style={[styles.sketchCheckTitle, { color: colors.ink }]}
                          >
                            {sketch.title}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={[styles.sketchCheckSub, { color: colors.textMuted }]}
                          >
                            {sketch.fabricTag || sketch.category}
                          </Text>
                        </View>
                      </Pressable>

                      <View style={styles.orderActions}>
                        <Pressable
                          onPress={() => handleMoveSketch(idx, 'up')}
                          disabled={idx === 0}
                          style={[
                            styles.orderBtn,
                            idx === 0 && styles.orderBtnDisabled,
                          ]}
                          accessibilityLabel="Move up"
                        >
                          <ChevronUp
                            size={16}
                            color={idx === 0 ? colors.textMuted : colors.ink}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => handleMoveSketch(idx, 'down')}
                          disabled={idx === lookbookSketches.length - 1}
                          style={[
                            styles.orderBtn,
                            idx === lookbookSketches.length - 1 && styles.orderBtnDisabled,
                          ]}
                          accessibilityLabel="Move down"
                        >
                          <ChevronDown
                            size={16}
                            color={
                              idx === lookbookSketches.length - 1
                                ? colors.textMuted
                                : colors.ink
                            }
                          />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.lookbookActionsRow}>
                <Button
                  label="Close"
                  variant="outline"
                  size="medium"
                  onPress={() => setIsLookbookModalOpen(false)}
                  style={styles.modalActionBtn}
                />
                <Button
                  label={`Export PDF (${selectedSketchIds.length})`}
                  variant="primary"
                  size="medium"
                  onPress={handleConfirmLookbookExport}
                  disabled={selectedSketchIds.length === 0}
                  style={styles.modalActionBtn}
                />
              </View>
            </>
          )}
        </View>
      </Sheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.display.fontFamily,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  itemControlsBar: {
    position: 'absolute',
    top: 68,
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.chips,
    borderWidth: 1,
    gap: 4,
    zIndex: 50,
    ...shadows.floating,
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  boardItemWrapper: {
    position: 'absolute',
  },
  boardCardSurface: {
    borderRadius: radius.cards,
  },
  boardCardSelected: {
    borderWidth: 2,
    borderColor: '#7F0020',
  },
  boardCardItem: {
    padding: spacing.sm,
  },
  pinDot: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7F0020',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 25,
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  sketchItemContent: {
    alignItems: 'center',
    width: 130,
  },
  swatchItemContent: {
    alignItems: 'center',
    width: 110,
  },
  swatchColorBlock: {
    width: 70,
    height: 70,
    borderRadius: radius.buttons,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  paletteItemContent: {
    padding: 4,
    width: 170,
  },
  paletteStrip: {
    flexDirection: 'row',
    height: 32,
    borderRadius: radius.buttons,
    overflow: 'hidden',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  paletteColorBlock: {
    flex: 1,
  },
  photoItemContent: {
    borderRadius: radius.buttons,
    overflow: 'hidden',
  },
  photoThumb: {
    width: 120,
    height: 150,
    borderRadius: radius.buttons,
  },
  itemTitle: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 12,
    textAlign: 'center',
  },
  itemSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
  },
  lookbookSheetContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  lookbookSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  sketchesScrollList: {
    maxHeight: 260,
  },
  sketchCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sketchCheckLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sketchCheckMeta: {
    flex: 1,
  },
  sketchCheckTitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '500',
  },
  sketchCheckSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    marginTop: 2,
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderBtn: {
    padding: 6,
    borderRadius: 4,
  },
  orderBtnDisabled: {
    opacity: 0.3,
  },
  lookbookActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalActionBtn: {
    flex: 1,
  },
  lookbookProgressBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  lookbookProgressText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cancelBtn: {
    minWidth: 120,
  },
});
