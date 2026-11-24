import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  Plus,
  PenTool,
  User,
  Shirt,
  Sparkles,
  Box,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react-native';
import { colors, useTheme, radius, spacing, typography, shadows, useLayout, responsiveTextProps } from '../../theme';
import {
  Card,
  Chip,
  IconButton,
  Sheet,
  EmptyState,
  Button,
  SkeletonLoader,
  PressableScale,
  FadeInUp,
  GlassCard,
  SkeletonCard,
  PaperGrain,
  CardSurface,
} from '../../components';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  useReducedMotion,
} from 'react-native-reanimated';
import { useStudioStore } from '../../store/useStudioStore';
import { SketchItem, GARMENT_TEMPLATES, FIGURE_TEMPLATES } from '../../data';
import { triggerHaptic } from '../../utils/haptics';
import { useSketches } from '../../hooks/useSketches';
import { useCanvasStore } from '../../store/canvasStore';

interface SketchbooksScreenProps {
  navigation: any;
}

export const SketchbooksScreen: React.FC<SketchbooksScreenProps> = ({
  navigation,
}) => {
  const colors = useTheme();
  const { width, insets, pagePadding, contentMaxWidth, columns, isSmall } = useLayout();
  const effectiveWidth = Math.min(width, contentMaxWidth);
  const availableWidth = effectiveWidth - pagePadding * 2;
  const cardGap = spacing.md;
  const columnWidth = Math.floor((availableWidth - (columns - 1) * cardGap) / columns);

  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [templateCategory, setTemplateCategory] = useState<
    'All' | 'Western' | 'Eastern'
  >('All');
  const [isSheetVisible, setIsSheetVisible] = useState<boolean>(false);
  const [isTemplateSelectorVisible, setIsTemplateSelectorVisible] =
    useState<boolean>(false);
  const [templateType, setTemplateType] = useState<'garment' | 'figure'>(
    'garment'
  );

  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const sheetContentWidth = isTablet ? Math.min(windowWidth, 560) : windowWidth;
  const sheetPadding = spacing.xl * 2;
  const templateColumns = isTablet ? 3 : 2;
  const templateGap = 12;
  const availableGridWidth = sheetContentWidth - sheetPadding;
  const templateCardWidth = Math.floor(
    (availableGridWidth - templateGap * (templateColumns - 1)) / templateColumns
  );
  const {
    sketches,
    isLoading,
    isRefreshing,
    refresh,
    deleteSketch,
    createSketch,
  } = useSketches();

  const scrollY = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerTitleAnimatedStyle = useAnimatedStyle(() => {
    if (reducedMotion) return {};
    const scale = interpolate(
      scrollY.value,
      [0, 80],
      [1, 0.90],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 80],
      [0, -2],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const headerBarAnimatedStyle = useAnimatedStyle(() => {
    if (reducedMotion) return {};
    const shadowOpacity = interpolate(
      scrollY.value,
      [0, 40],
      [0, 0.08],
      Extrapolation.CLAMP
    );
    return {
      shadowColor: '#7F0020',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity,
      shadowRadius: 6,
      elevation: scrollY.value > 10 ? 2 : 0,
    };
  });

  // Studio canvas bindings
  const activeSketch = useStudioStore((state) => state.activeSketch);

  const clearAllSketches = useStudioStore((state) => state.clearAllSketches);
  const resetToInitialSketches = useStudioStore(
    (state) => state.resetToInitialSketches
  );
  const setActiveSketch = useStudioStore((state) => state.setActiveSketch);
  const setActiveTemplate = useStudioStore((state) => state.setActiveTemplate);
  const clearStrokes = useStudioStore((state) => state.clearStrokes);



  // Filter items
  const filteredSketches = sketches.filter((item) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Western') return item.category === 'Western';
    if (selectedFilter === 'Eastern') return item.category === 'Eastern';
    return true;
  });

  const handleOpenSketch = (sketch: SketchItem) => {
    setActiveSketch(sketch);
    setActiveTemplate(null);
    clearStrokes();
    useCanvasStore.getState().loadStoredSketch(sketch.id);
    navigation.navigate('Studio', { sketchId: sketch.id });
  };

  const handleNewBlank = async () => {
    setIsSheetVisible(false);
    setActiveSketch(null);
    setActiveTemplate(null);
    clearStrokes();
    const created = await createSketch({
      title: 'Blank canvas',
      templateType: 'blank',
      category: 'western',
    });
    if (!created) {
      return;
    }
    await useCanvasStore.getState().loadStoredSketch(created.id);
    navigation.navigate('Studio', { sketchId: created.id, mode: 'blank' });
  };

  const handleSelectFigureTemplate = () => {
    setTemplateType('figure');
    setIsTemplateSelectorVisible(true);
  };

  const handleSelectGarmentTemplate = () => {
    setTemplateType('garment');
    setIsTemplateSelectorVisible(true);
  };

  const handlePickTemplate = async (template: any) => {
    setIsTemplateSelectorVisible(false);
    setIsSheetVisible(false);
    setActiveSketch(null);
    setActiveTemplate(template);
    clearStrokes();
    const created = await createSketch({
      title: template.name,
      templateId: template.id,
      templateType,
      category: template.category === 'Eastern' ? 'eastern' : 'western',
    });
    if (!created) {
      return;
    }
    await useCanvasStore.getState().loadStoredSketch(created.id);
    navigation.navigate('Studio', {
      sketchId: created.id,
      mode: 'template',
      templateId: template.id,
    });
  };

  const sheetOptions = [
    {
      id: 'blank',
      title: 'Blank page',
      subtitle: 'Freehand blank paper canvas',
      icon: <PenTool size={20} color={colors.ink} strokeWidth={1.75} />,
      onPress: handleNewBlank,
    },
    {
      id: 'figure',
      title: 'Figure template',
      subtitle: 'Nine head fashion croquis',
      icon: <User size={20} color={colors.ink} strokeWidth={1.75} />,
      onPress: handleSelectFigureTemplate,
    },
    {
      id: 'garment',
      title: 'Garment template',
      subtitle: 'Western and Eastern lines',
      icon: <Shirt size={20} color={colors.ink} strokeWidth={1.75} />,
      onPress: handleSelectGarmentTemplate,
    },
  ];

  const renderSketchCard = ({ item, index }: { item: SketchItem; index: number }) => {
    const isSelected = activeSketch?.id === item.id;

    const cardContent = (
      <CardSurface
        borderRadius={radius.cards}
        style={styles.sketchCardSurface}
      >
        {/* Sketch thumbnail canvas */}
        <View style={styles.thumbnailHeader}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor:
                  item.category === 'Eastern'
                    ? '#FDF6E2'
                    : '#EFE8EA',
              },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    item.category === 'Eastern'
                      ? '#C9A24B'
                      : '#4A3F45',
                },
              ]}
            >
              {item.category}
            </Text>
          </View>
          <PressableScale
            onPress={() => {
              triggerHaptic('light');
              deleteSketch(item.id);
            }}
            hitSlop={8}
            style={styles.deleteButton}
            accessibilityLabel="Delete sketch"
          >
            <Trash2 size={14} color={colors.textLight} strokeWidth={1.75} />
          </PressableScale>
        </View>

        <View style={styles.svgPreviewWrapper}>
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={[styles.thumbnailImage, { width: Math.max(40, columnWidth - 24) }]}
              resizeMode="contain"
            />
          ) : (
            <Svg width={Math.max(40, columnWidth - 24)} height={120} viewBox="0 0 110 110">
              <Path
                d={item.strokePath}
                stroke={item.colorHex || colors.ink}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {item.detailPaths?.map((d, i) => (
                <Path
                  key={i}
                  d={d}
                  stroke={colors.line}
                  strokeWidth={1}
                  strokeLinecap="round"
                  fill="none"
                />
              ))}
            </Svg>
          )}
        </View>

        {/* Card footer details */}
        <View style={[styles.cardFooter, { borderTopColor: 'rgba(127, 0, 32, 0.08)' }]}>
          <Text {...responsiveTextProps} numberOfLines={1} style={[styles.sketchTitle, { color: colors.ink }]}>
            {item.title}
          </Text>
          <View style={styles.goldLine} />
          <View style={styles.metaRow}>
            <Text {...responsiveTextProps} numberOfLines={1} style={[styles.sketchDate, { color: colors.textMuted }]}>{item.date}</Text>
            <View style={[styles.dotSeparator, { backgroundColor: colors.line }]} />
            <Text {...responsiveTextProps} numberOfLines={1} style={[styles.fabricText, { color: colors.textMuted }]}>
              {item.fabricTag}
            </Text>
          </View>
        </View>
      </CardSurface>
    );

    return (
      <FadeInUp index={index} style={[styles.cardContainer, { width: columnWidth }]}>
        <PressableScale
          onPress={() => handleOpenSketch(item)}
          activeScale={0.96}
        >
          {isSelected ? (
            <LinearGradient
              colors={['#7F0020', '#C9A24B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorderWrapper}
            >
              {cardContent}
            </LinearGradient>
          ) : (
            cardContent
          )}
        </PressableScale>
      </FadeInUp>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.paper }]}>
      <PaperGrain />

      <View style={[styles.responsiveContainer, { maxWidth: contentMaxWidth, paddingTop: insets.top }]}>
        {/* Top Header */}
        <Animated.View style={[styles.header, { paddingHorizontal: pagePadding }, headerBarAnimatedStyle]}>
          <View style={styles.headerLeft}>
            <Animated.Text
              {...responsiveTextProps}
              numberOfLines={1}
              style={[styles.headerTitle, { color: colors.ink }, headerTitleAnimatedStyle]}
            >
              Sketchbooks
            </Animated.Text>
          </View>

          <View style={styles.headerRight}>
            {/* Quick toggle to demonstrate empty state and loaded state */}
            <IconButton
              icon={
                sketches.length > 0 ? (
                  <SlidersHorizontal
                    size={18}
                    color={colors.graphite}
                    strokeWidth={1.75}
                  />
                ) : (
                  <RefreshCw
                    size={18}
                    color={colors.graphite}
                    strokeWidth={1.75}
                  />
                )
              }
              onPress={() => {
                if (sketches.length > 0) {
                  clearAllSketches();
                } else {
                  resetToInitialSketches();
                }
              }}
              variant="default"
              size={38}
              shape="circle"
              accessibilityLabel="Toggle state"
            />

            {/* New sketch icon button */}
            <PressableScale
              onPress={() => setIsSheetVisible(true)}
              accessibilityLabel="New sketch"
            >
              <IconButton
                icon={<Plus size={20} color="#FFFFFF" strokeWidth={2} />}
                onPress={() => setIsSheetVisible(true)}
                variant="filled"
                size={38}
                shape="circle"
                accessibilityLabel="New sketch"
              />
            </PressableScale>

            {/* Small designer avatar */}
            <PressableScale
              onPress={() => navigation.navigate('Profile')}
              accessibilityLabel="Designer Profile"
            >
              <View style={[styles.avatar, { backgroundColor: '#7F0020', borderColor: '#7F0020' }]}>
                <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>VC</Text>
              </View>
            </PressableScale>
          </View>
        </Animated.View>

        {/* Studio Quick Entry Cards */}
        <View style={[styles.studioQuickBar, { paddingHorizontal: pagePadding }]}>
          <PressableScale
            onPress={() => {
              triggerHaptic('light');
              navigation.navigate('Studio', { openAI: true });
            }}
            style={styles.studioEntryWrapper}
            accessibilityLabel="Open AI Studio"
          >
            <GlassCard
              intensity="medium"
              tintColor="rgba(243, 230, 232, 0.60)"
              borderRadius={radius.buttons}
              shadowColor="#9B6B8E"
              style={styles.studioGlassCard}
            >
              <View style={styles.studioEntryCard}>
                <View style={[styles.studioIconBadge, { backgroundColor: colors.accentSoft }]}>
                  <Sparkles size={16} color={colors.accent} strokeWidth={2} />
                </View>
                <View style={styles.studioEntryTextCol}>
                  <Text {...responsiveTextProps} numberOfLines={1} style={[styles.studioEntryTitle, { color: colors.ink }]}>AI Studio</Text>
                  <Text {...responsiveTextProps} numberOfLines={1} style={[styles.studioEntrySubtitle, { color: colors.textMuted }]}>Motif & palette</Text>
                </View>
              </View>
            </GlassCard>
          </PressableScale>

          <PressableScale
            onPress={() => {
              triggerHaptic('light');
              navigation.navigate('Preview3D');
            }}
            style={styles.studioEntryWrapper}
            accessibilityLabel="Open 3D Studio"
          >
            <GlassCard
              intensity="medium"
              tintColor="rgba(243, 230, 232, 0.60)"
              borderRadius={radius.buttons}
              shadowColor="#9B6B8E"
              style={styles.studioGlassCard}
            >
              <View style={styles.studioEntryCard}>
                <View style={[styles.studioIconBadge, { backgroundColor: colors.surfaceGhost }]}>
                  <Box size={16} color={colors.ink} strokeWidth={2} />
                </View>
                <View style={styles.studioEntryTextCol}>
                  <Text {...responsiveTextProps} numberOfLines={1} style={[styles.studioEntryTitle, { color: colors.ink }]}>3D Studio</Text>
                  <Text {...responsiveTextProps} numberOfLines={1} style={[styles.studioEntrySubtitle, { color: colors.textMuted }]}>Draping & form</Text>
                </View>
              </View>
            </GlassCard>
          </PressableScale>
        </View>

        {/* Filter Chips Bar */}
        {sketches.length > 0 && (
          <View style={styles.filterBarWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterBar, { paddingHorizontal: pagePadding }]}
            >
              {(['All', 'Western', 'Eastern'] as const).map((filter) => {
                const isSelected = selectedFilter === filter;
                let customStyle = undefined;
                if (filter === 'Western') {
                  customStyle = isSelected
                    ? { backgroundColor: '#4A3F45', borderColor: '#4A3F45' }
                    : { backgroundColor: '#EFE8EA', borderColor: '#E0D6DA' };
                } else if (filter === 'Eastern') {
                  customStyle = isSelected
                    ? { backgroundColor: '#C9A24B', borderColor: '#C9A24B' }
                    : { backgroundColor: '#FDF6E2', borderColor: '#F3E5AB' };
                }
                return (
                  <PressableScale
                    key={filter}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Chip
                      label={filter}
                      selected={isSelected}
                      onPress={() => setSelectedFilter(filter)}
                      style={customStyle}
                      textStyle={
                        !isSelected && filter === 'Western'
                          ? { color: '#4A3F45' }
                          : !isSelected && filter === 'Eastern'
                          ? { color: '#C9A24B' }
                          : undefined
                      }
                    />
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Grid with Skeleton Loader or Empty State */}
        {isLoading ? (
          <View style={[styles.skeletonGrid, { paddingHorizontal: pagePadding }]}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.cardContainer, { width: columnWidth }]}>
                <SkeletonCard width={columnWidth} height={190} />
              </View>
            ))}
          </View>
        ) : filteredSketches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No sketches yet"
              helper="Start your first design below"
              actionLabel="New design"
              onAction={() => setIsSheetVisible(true)}
            />
          </View>
        ) : (
          <Animated.FlatList
            key={`sketches_grid_${columns}_${columnWidth}`}
            data={filteredSketches}
            keyExtractor={(item) => item.id}
            renderItem={renderSketchCard}
            numColumns={columns}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingHorizontal: pagePadding,
                paddingBottom: 56 + insets.bottom + 24,
              },
            ]}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={columns > 1 ? [styles.columnWrapper, { gap: cardGap }] : undefined}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshing={isRefreshing}
            onRefresh={refresh}
          />
        )}
      </View>

      {/* Bottom Sheet for Template / Blank Choice */}
      <Sheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        title="New design"
        options={sheetOptions}
      />

      {/* Template picker sub-sheet */}
      <Sheet
        visible={isTemplateSelectorVisible}
        onClose={() => setIsTemplateSelectorVisible(false)}
        title={
          templateType === 'garment' ? 'Garment templates' : 'Figure croquis'
        }
        headerComponent={
          templateType === 'garment' ? (
            <View style={styles.sheetSegmentedRow}>
              {(['All', 'Western', 'Eastern'] as const).map((cat) => {
                const isActive = templateCategory === cat;
                return (
                  <PressableScale
                    key={cat}
                    onPress={() => {
                      triggerHaptic('selection');
                      setTemplateCategory(cat);
                    }}
                    style={[
                      styles.sheetSegmentBtn,
                      isActive && styles.sheetSegmentBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sheetSegmentText,
                        isActive && styles.sheetSegmentTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          ) : null
        }
      >
        <View style={styles.templateGrid}>
          {(templateType === 'garment'
            ? templateCategory === 'All'
              ? GARMENT_TEMPLATES
              : GARMENT_TEMPLATES.filter((t) => t.category === templateCategory)
            : FIGURE_TEMPLATES
          ).map((t) => (
            <PressableScale
              key={t.id}
              onPress={() => handlePickTemplate(t)}
              style={[
                styles.templateCardItem,
                {
                  width: templateCardWidth,
                  backgroundColor: colors.paperElevated,
                  borderColor: colors.line,
                },
              ]}
              accessibilityLabel={t.name}
              accessibilityRole="button"
            >
              <Svg width={64} height={64} viewBox="0 0 110 110">
                <Path
                  d={t.strokePath}
                  stroke={colors.ink}
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text
                numberOfLines={1}
                style={[styles.templateName, { color: colors.graphite }]}
              >
                {t.name}
              </Text>
            </PressableScale>
          ))}
        </View>
      </Sheet>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.display.fontFamily,
    fontSize: 28,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  studioQuickBar: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 2,
    paddingBottom: 16,
  },
  studioEntryWrapper: {
    flex: 1,
    overflow: 'visible',
  },
  studioGlassCard: {
    width: '100%',
    shadowColor: '#9B6B8E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 10,
  },
  studioEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  studioIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 8,
    elevation: 4,
  },
  studioEntryTextCol: {
    flex: 1,
    minWidth: 0,
  },
  studioEntryTitle: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  studioEntrySubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    flexShrink: 1,
  },
  filterBarWrapper: {
    width: '100%',
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingTop: spacing.sm,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  cardContainer: {
  },
  gradientBorderWrapper: {
    padding: 1.5,
    borderRadius: radius.cards,
    width: '100%',
  },
  sketchCardSurface: {
    width: '100%',
  },
  goldLine: {
    width: 24,
    height: 2,
    backgroundColor: '#C9A24B',
    borderRadius: 1,
    marginTop: 3,
    marginBottom: 4,
  },
  thumbnailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.chips,
  },
  categoryText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 2,
  },
  svgPreviewWrapper: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImage: {
    height: 110,
    borderRadius: 8,
  },
  cardFooter: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: 2,
    borderTopWidth: 1,
  },
  sketchTitle: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 15,
    marginBottom: 2,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  sketchDate: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    flexShrink: 1,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 5,
  },
  fabricText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    flexShrink: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    ...shadows.floating,
  },
  floatingButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.buttons,
  },
  sheetSegmentedRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
    paddingBottom: 2,
  },
  sheetSegmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.chips,
    backgroundColor: colors.paperElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sheetSegmentBtnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  sheetSegmentText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sheetSegmentTextActive: {
    color: '#FFFFFF',
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: spacing.xs,
  },
  templateCardItem: {
    borderRadius: radius.cards,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  templateName: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
});
