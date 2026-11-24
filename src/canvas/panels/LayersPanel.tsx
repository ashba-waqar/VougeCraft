import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ArrowDownToLine,
  Plus,
  Check,
} from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { Sheet } from '../../components/Sheet';
import { useCanvasStore } from '../../store/canvasStore';
import { triggerHaptic } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LayersPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  visible,
  onClose,
}) => {
  const layers = useCanvasStore((state) => state.sketch.layers);
  const activeLayerId = useCanvasStore((state) => state.activeLayerId);
  const setActiveLayer = useCanvasStore((state) => state.setActiveLayer);
  const toggleVisibility = useCanvasStore((state) => state.toggleLayerVisibility);
  const toggleLock = useCanvasStore((state) => state.toggleLayerLock);
  const setOpacity = useCanvasStore((state) => state.setLayerOpacity);
  const duplicateLayer = useCanvasStore((state) => state.duplicateLayer);
  const deleteLayer = useCanvasStore((state) => state.deleteLayer);
  const mergeDown = useCanvasStore((state) => state.mergeLayerDown);
  const renameLayer = useCanvasStore((state) => state.renameLayer);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!visible) return null;

  const handleStartRename = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleFinishRename = (id: string) => {
    if (editingName.trim()) {
      renameLayer(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Layers">
      <View style={styles.listContent}>
        {[...layers].reverse().map((layer, reverseIndex) => {
              const actualIndex = layers.length - 1 - reverseIndex;
              const isActive = layer.id === activeLayerId;
              return (
                <Pressable
                  key={layer.id}
                  onPress={() => {
                    triggerHaptic('light');
                    setActiveLayer(layer.id);
                  }}
                  style={[styles.layerRow, isActive && styles.layerRowActive]}
                >
                  {/* Eye toggle */}
                  <Pressable
                    onPress={() => {
                      triggerHaptic('selection');
                      toggleVisibility(layer.id);
                    }}
                    style={styles.actionBtn}
                  >
                    {layer.visible ? (
                      <Eye size={16} color={colors.ink} strokeWidth={1.75} />
                    ) : (
                      <EyeOff size={16} color={colors.textLight} strokeWidth={1.75} />
                    )}
                  </Pressable>

                  {/* Lock toggle */}
                  <Pressable
                    onPress={() => {
                      triggerHaptic('selection');
                      toggleLock(layer.id);
                    }}
                    style={styles.actionBtn}
                  >
                    {layer.locked ? (
                      <Lock size={15} color={colors.accent} strokeWidth={1.75} />
                    ) : (
                      <Unlock size={15} color={colors.textLight} strokeWidth={1.75} />
                    )}
                  </Pressable>

                  {/* Layer name & count */}
                  <View style={styles.nameContainer}>
                    {editingId === layer.id ? (
                      <View style={styles.inlineRename}>
                        <TextInput
                          value={editingName}
                          onChangeText={setEditingName}
                          style={styles.renameInput}
                          autoFocus
                          maxLength={20}
                        />
                        <Pressable onPress={() => handleFinishRename(layer.id)}>
                          <Check size={16} color={colors.accent} strokeWidth={2} />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onLongPress={() => handleStartRename(layer.id, layer.name)}
                      >
                        <Text numberOfLines={1} style={styles.layerName}>
                          {layer.name}
                        </Text>
                        <Text style={styles.layerMeta}>
                          {layer.items.length} items
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Duplicate & Merge & Delete */}
                  <View style={styles.rowRightActions}>
                    <Pressable
                      onPress={() => {
                        triggerHaptic('light');
                        duplicateLayer(layer.id);
                      }}
                      style={styles.miniAction}
                    >
                      <Copy size={14} color={colors.graphite} strokeWidth={1.75} />
                    </Pressable>

                    {actualIndex > 0 && (
                      <Pressable
                        onPress={() => {
                          triggerHaptic('light');
                          mergeDown(layer.id);
                        }}
                        style={styles.miniAction}
                      >
                        <ArrowDownToLine
                          size={14}
                          color={colors.graphite}
                          strokeWidth={1.75}
                        />
                      </Pressable>
                    )}

                    {layers.length > 1 && (
                      <Pressable
                        onPress={() => {
                          triggerHaptic('medium');
                          deleteLayer(layer.id);
                        }}
                        style={styles.miniAction}
                      >
                        <Trash2 size={14} color={colors.danger} strokeWidth={1.75} />
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Opacity slider for active layer */}
          <View style={styles.opacitySection}>
            <Text style={styles.opacityLabel}>Layer opacity</Text>
            <View style={styles.opacityChips}>
              {[0.25, 0.5, 0.75, 1.0].map((op) => {
                const activeL = layers.find((l) => l.id === activeLayerId);
                const isSelected = activeL?.opacity === op;
                return (
                  <Pressable
                    key={op}
                    onPress={() => {
                      triggerHaptic('selection');
                      setOpacity(activeLayerId, op);
                    }}
                    style={[
                      styles.opacityChip,
                      isSelected && styles.opacityChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.opacityChipText,
                        isSelected && styles.opacityChipTextActive,
                      ]}
                    >
                      {Math.round(op * 100)}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 14, 16, 0.4)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  panel: {
    width: Math.min(SCREEN_WIDTH * 0.85, 330),
    height: '100%',
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(255, 255, 255, 0.75)'
        : 'rgba(255, 255, 255, 0.96)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.85)',
    paddingTop: 36,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    overflow: 'hidden',
    shadowColor: '#7F0020',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragPill: {
    width: 36,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(58, 10, 22, 0.28)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSubtle,
  },
  headerTitle: {
    fontFamily: typography.title2.fontFamily,
    fontSize: 20,
    color: colors.ink,
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    gap: spacing.xs,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.buttons,
    backgroundColor: colors.paperElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  layerRowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  actionBtn: {
    padding: 4,
    marginRight: 4,
  },
  nameContainer: {
    flex: 1,
    marginLeft: 4,
  },
  layerName: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 13,
    color: colors.ink,
  },
  layerMeta: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  inlineRename: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  renameInput: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 12,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    paddingVertical: 2,
  },
  rowRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniAction: {
    padding: 4,
  },
  opacitySection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineSubtle,
    marginTop: spacing.md,
  },
  opacityLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
  },
  opacityChips: {
    flexDirection: 'row',
    gap: 6,
  },
  opacityChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.chips,
    backgroundColor: colors.paperElevated,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  opacityChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  opacityChipText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.graphite,
    fontWeight: '600',
  },
  opacityChipTextActive: {
    color: '#FFFFFF',
  },
});
