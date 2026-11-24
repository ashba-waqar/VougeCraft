import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { PenTool, Sparkles } from 'lucide-react-native';
import { useTheme, radius, spacing, typography, useLayout, responsiveTextProps } from '../../theme';
import { Card, Chip, Button, SkeletonLoader, EmptyState, PressableScale, FadeInUp, SkeletonCard, PaperGrain, CardSurface } from '../../components';
import {
  GARMENT_TEMPLATES,
  FIGURE_TEMPLATES,
  GarmentTemplate,
  FigureTemplate,
} from '../../data';
import { useStudioStore } from '../../store/useStudioStore';
import { useCanvasStore } from '../../store/canvasStore';
import { sketchRepository } from '../../services/sketchRepository';
import { triggerHaptic } from '../../utils/haptics';

type SubCategory =
  | 'All'
  | 'Tops'
  | 'Bottoms'
  | 'Dresses'
  | 'Outerwear'
  | 'Formal'
  | 'Bridal';

interface ExtendedTemplate {
  id: string;
  name: string;
  category: 'Western' | 'Eastern' | 'Figures';
  subCategory: SubCategory;
  helper: string;
  strokePath: string;
  detailPaths?: string[];
}

const TEMPLATE_SUBCATEGORIES: Record<string, SubCategory[]> = {
  blazer: ['Outerwear', 'Formal'],
  trench: ['Outerwear'],
  slip_dress: ['Dresses', 'Formal'],
  shirt: ['Tops'],
  jeans: ['Bottoms'],
  skirt: ['Bottoms'],
  kurta: ['Tops', 'Formal'],
  sherwani: ['Outerwear', 'Formal', 'Bridal'],
  lehenga: ['Bridal', 'Formal', 'Dresses'],
  sharara: ['Bottoms', 'Formal', 'Bridal'],
  saree: ['Bridal', 'Formal', 'Dresses'],
  dupatta: ['Tops', 'Bridal', 'Formal'],
  female_croquis: ['Formal'],
  male_croquis: ['Formal'],
  neutral_figure: ['Formal'],
};

interface LibraryScreenProps {
  navigation: any;
}

const DesignButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={() => {
        triggerHaptic('light');
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.designButton,
        pressed && styles.designButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Design"
    >
      <PenTool
        size={12}
        color={pressed ? '#FFFFFF' : '#7F0020'}
        strokeWidth={1.75}
      />
      <Text
        style={[
          styles.designButtonText,
          pressed && styles.designButtonTextPressed,
        ]}
      >
        Design
      </Text>
    </Pressable>
  );
};

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const colors = useTheme();
  const { width, insets, pagePadding, contentMaxWidth, columns } = useLayout();
  const effectiveWidth = Math.min(width, contentMaxWidth);
  const availableWidth = effectiveWidth - pagePadding * 2;
  const cardGap = spacing.md;
  const columnWidth = Math.floor((availableWidth - (columns - 1) * cardGap) / columns);

  const [segmentedTab, setSegmentedTab] = useState<'Western' | 'Eastern' | 'Figures'>('Western');
  const [selectedSubFilter, setSelectedSubFilter] = useState<SubCategory>('All');
  const [isLoading, setIsLoading] = useState(true);

  const activeTemplate = useStudioStore((state) => state.activeTemplate);
  const setActiveTemplate = useStudioStore((state) => state.setActiveTemplate);
  const setActiveSketch = useStudioStore((state) => state.setActiveSketch);
  const clearStrokes = useStudioStore((state) => state.clearStrokes);

  useEffect(() => {
    // Brief skeleton loader simulation on mount
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Prepare full catalog
  const catalog: ExtendedTemplate[] = [
    ...GARMENT_TEMPLATES.map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category as 'Western' | 'Eastern',
      subCategory: (TEMPLATE_SUBCATEGORIES[g.id]?.[0] || 'Formal') as SubCategory,
      helper: g.helper,
      strokePath: g.strokePath,
      detailPaths: g.detailPaths,
    })),
    ...FIGURE_TEMPLATES.map((f) => ({
      id: f.id,
      name: f.name,
      category: 'Figures' as const,
      subCategory: 'Formal' as SubCategory,
      helper: f.helper,
      strokePath: f.strokePath,
    })),
  ];

  // Filter items
  const filtered = catalog.filter((item) => {
    if (item.category !== segmentedTab) return false;
    if (selectedSubFilter === 'All') return true;
    const itemSubs = TEMPLATE_SUBCATEGORIES[item.id] || [];
    return itemSubs.includes(selectedSubFilter);
  });

  const handleUseTemplate = async (template: ExtendedTemplate) => {
    triggerHaptic('medium');
    setActiveSketch(null);
    setActiveTemplate(template as any);
    clearStrokes();

    const created = await sketchRepository.createSketch({
      title: template.name,
      templateId: template.id,
      templateType: template.category === 'Figures' ? 'figure' : 'garment',
      category: template.category === 'Eastern' ? 'eastern' : 'western',
    });

    if (!created.data) {
      return;
    }

    const targetId = created.data.id;
    await useCanvasStore.getState().loadStoredSketch(targetId);

    navigation.navigate('Studio', {
      sketchId: targetId,
      mode: 'template',
      templateId: template.id,
    });
  };

  const subFilters: SubCategory[] = [
    'All',
    'Tops',
    'Bottoms',
    'Dresses',
    'Outerwear',
    'Formal',
    'Bridal',
  ];

  const renderTemplateCard = ({ item, index }: { item: ExtendedTemplate; index: number }) => {
    const isSelected = activeTemplate?.id === item.id;

    const cardContent = (
      <CardSurface
        borderRadius={radius.cards}
        style={styles.libraryCardSurface}
      >
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>
            {item.subCategory}
          </Text>
        </View>

        <View style={styles.svgWrapper}>
          <Svg width={Math.max(40, columnWidth - 24)} height={120} viewBox="0 0 110 110">
            <Path
              d={item.strokePath}
              stroke={colors.ink}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {item.detailPaths?.map((d, i) => (
              <Path
                key={i}
                d={d}
                stroke={colors.line}
                strokeWidth={1}
                fill="none"
              />
            ))}
          </Svg>
        </View>

        <View style={[styles.infoSection, { borderTopColor: 'rgba(127, 0, 32, 0.08)' }]}>
          <Text {...responsiveTextProps} numberOfLines={1} style={[styles.title, { color: colors.ink }]}>
            {item.name}
          </Text>
          <Text {...responsiveTextProps} numberOfLines={1} style={[styles.helper, { color: colors.textMuted }]}>
            {item.helper}
          </Text>
          <View style={styles.actionRow}>
            <DesignButton onPress={() => handleUseTemplate(item)} />
          </View>
        </View>
      </CardSurface>
    );

    return (
      <FadeInUp index={index} style={[styles.cardWrapper, { width: columnWidth }]}>
        <PressableScale
          onPress={() => handleUseTemplate(item)}
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
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: pagePadding }]}>
          <Text {...responsiveTextProps} numberOfLines={1} style={[styles.headerTitle, { color: colors.ink }]}>Library</Text>
        </View>

        {/* Segmented Control: Western | Eastern | Figures */}
        <View style={[styles.segmentedContainer, { marginHorizontal: pagePadding, backgroundColor: colors.paperElevated, borderColor: colors.line }]}>
          {(['Western', 'Eastern', 'Figures'] as const).map((tab) => {
            const isActive = segmentedTab === tab;
            return (
              <PressableScale
                key={tab}
                onPress={() => {
                  triggerHaptic('selection');
                  setSegmentedTab(tab);
                }}
                style={[
                  styles.segmentedButton,
                  isActive && [
                    styles.segmentedButtonActive,
                    {
                      backgroundColor: '#7F0020',
                    },
                  ],
                ]}
              >
                <Text
                  {...responsiveTextProps}
                  numberOfLines={1}
                  style={[
                    styles.segmentedText,
                    { color: isActive ? '#FFFFFF' : colors.graphite },
                  ]}
                >
                  {tab}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        {/* Subcategory Filter Chips */}
        {segmentedTab !== 'Figures' && (
          <View style={styles.filterScroll}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={subFilters}
              keyExtractor={(item) => item}
              contentContainerStyle={[styles.filterScrollContent, { paddingHorizontal: pagePadding }]}
              renderItem={({ item }) => (
                <PressableScale onPress={() => setSelectedSubFilter(item)}>
                  <Chip
                    label={item}
                    selected={selectedSubFilter === item}
                    onPress={() => setSelectedSubFilter(item)}
                  />
                </PressableScale>
              )}
            />
          </View>
        )}

        {/* Content Grid with Skeleton Loader */}
        {isLoading ? (
          <View style={[styles.skeletonGrid, { paddingHorizontal: pagePadding }]}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.cardWrapper, { width: columnWidth }]}>
                <SkeletonCard width={columnWidth} height={200} />
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="No templates found"
              helper="Select another filter tag"
              actionLabel="Reset filter"
              onAction={() => setSelectedSubFilter('All')}
            />
          </View>
        ) : (
          <FlatList
            key={`library_grid_${columns}_${columnWidth}`}
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderTemplateCard}
            numColumns={columns}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingHorizontal: pagePadding,
                paddingBottom: 56 + insets.bottom + 24,
              },
            ]}
            columnWrapperStyle={columns > 1 ? [styles.columnWrapper, { gap: cardGap }] : undefined}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.display.fontFamily,
    fontSize: 28,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  segmentedContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.buttons,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  filterScroll: {
    paddingBottom: spacing.xs,
  },
  filterScrollContent: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingTop: spacing.xs,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  cardWrapper: {
  },
  gradientBorderWrapper: {
    padding: 1.5,
    borderRadius: radius.cards,
    width: '100%',
  },
  libraryCardSurface: {
    width: '100%',
  },
  badgeRow: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  badgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#B08A3E',
    fontWeight: '700',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  infoSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
  },
  title: {
    fontFamily: typography.title3.fontFamily,
    fontSize: 14,
    marginTop: 4,
    flexShrink: 1,
  },
  helper: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    marginTop: 2,
    marginBottom: spacing.xs,
    flexShrink: 1,
  },
  actionRow: {
    marginTop: 4,
  },
  designButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.buttons,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7F0020',
  },
  designButtonPressed: {
    backgroundColor: '#7F0020',
  },
  designButtonText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#7F0020',
  },
  designButtonTextPressed: {
    color: '#FFFFFF',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
});
