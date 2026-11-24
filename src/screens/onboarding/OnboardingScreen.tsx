import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  BackHandler,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, {
  Path,
  Circle,
  Line,
  Rect,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { Button } from '../../components';
import { useStudioStore } from '../../store/useStudioStore';
import { GARMENT_TEMPLATES } from '../../data';
import { triggerHaptic } from '../../utils/haptics';
import { setHasSeenOnboarding } from '../../services/onboardingFlag';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedView = Animated.View as any;

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<any>(null);
  const setOnboardingCompleted = useStudioStore(
    (state) => state.setOnboardingCompleted
  );

  // Animation values for Screen 1 (Pencil drawing dress)
  const drawProgress = useSharedValue(0);
  const pencilTilt = useSharedValue(-25);

  useEffect(() => {
    // Loop the drawing stroke and pencil movement
    drawProgress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 2800,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        withDelay(1200, withTiming(0, { duration: 400 }))
      ),
      -1,
      false
    );

    pencilTilt.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 700 }),
        withTiming(-30, { duration: 700 })
      ),
      -1,
      true
    );
  }, []);

  // Handle Android hardware back button: page 2 goes back to page 1, page 1 exits app
  useEffect(() => {
    const onBackPress = () => {
      if (currentIndex === 1) {
        scrollRef.current?.scrollTo({ x: 0, animated: true });
        setCurrentIndex(0);
        triggerHaptic('light');
        return true;
      }
      return false;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backSubscription.remove();
  }, [currentIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentIndex && (page === 0 || page === 1)) {
      setCurrentIndex(page);
      triggerHaptic('selection');
    }
  };

  const handleStart = () => {
    triggerHaptic('light');
    scrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: true });
    setCurrentIndex(1);
  };

  const handleFinishOnboarding = async () => {
    triggerHaptic('medium');
    await setHasSeenOnboarding(true);
    setOnboardingCompleted(true);
    if ((navigation as any).replace) {
      (navigation as any).replace('Welcome');
    } else {
      (navigation as any).navigate('Welcome');
    }
  };

  // Pencil tip trajectory calculated from key dress outline nodes
  const animatedPencilStyle = useAnimatedStyle(() => {
    const p = drawProgress.value;
    let x = 60;
    let y = 40;

    if (p < 0.2) {
      // Top scoop
      const sub = p / 0.2;
      x = interpolate(sub, [0, 1], [42, 78]);
      y = interpolate(sub, [0, 1], [40, 40]);
    } else if (p < 0.45) {
      // Right side waist to hem
      const sub = (p - 0.2) / 0.25;
      x = interpolate(sub, [0, 1], [78, 96]);
      y = interpolate(sub, [0, 1], [40, 150]);
    } else if (p < 0.7) {
      // Bottom hem drape
      const sub = (p - 0.45) / 0.25;
      x = interpolate(sub, [0, 1], [96, 24]);
      y = interpolate(sub, [0, 1], [150, 150]);
    } else {
      // Left side back to start
      const sub = (p - 0.7) / 0.3;
      x = interpolate(sub, [0, 1], [24, 42]);
      y = interpolate(sub, [0, 1], [150, 40]);
    }

    return {
      position: 'absolute',
      left: x,
      top: y,
      transform: [
        { translateX: -4 },
        { translateY: -32 },
        { rotate: `${pencilTilt.value}deg` },
      ],
      opacity: p > 0.02 ? 1 : 0,
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar with brand mark & skip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>VogueCraft</Text>
        </View>
        <Button
          label="Skip"
          onPress={handleFinishOnboarding}
          variant="ghost"
          size="small"
        />
      </View>

      {/* Swipeable 2-page carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const page = Math.round(offsetX / SCREEN_WIDTH);
          if (page !== currentIndex && (page === 0 || page === 1)) {
            setCurrentIndex(page);
          }
        }}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {/* SCREEN 1: Pencil drawing dress outline */}
        <View style={styles.page}>
          <View style={styles.illustrationCard}>
            {/* Paper Texture Lines */}
            <View style={styles.paperGrid}>
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
            </View>

            {/* Dress SVG Canvas */}
            <View style={styles.canvasContainer}>
              <Svg width={180} height={200} viewBox="0 0 120 180">
                {/* Subtle croquis guide line */}
                <Line
                  x1={60}
                  y1={20}
                  x2={60}
                  y2={170}
                  stroke={colors.line}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <Circle
                  cx={60}
                  cy={24}
                  r={8}
                  stroke={colors.line}
                  strokeWidth={1}
                  fill="none"
                />

                {/* Guide ghost outline */}
                <Path
                  d="M44 40 L60 44 L76 40 L82 72 L96 150 L60 154 L24 150 L38 72 Z"
                  stroke={colors.line}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  fill="none"
                />

                {/* Active drawing stroke */}
                <Path
                  d="M44 40 L60 44 L76 40 L82 72 L96 150 L60 154 L24 150 L38 72 Z"
                  stroke={colors.ink}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* Inner dress drape fold */}
                <Path
                  d="M52 74 Q60 84 68 74"
                  stroke={colors.accent}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M60 44 L60 154"
                  stroke={colors.lineSubtle}
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
              </Svg>

              {/* Dynamic Pencil following outline */}
              <AnimatedView style={[styles.pencilObject, animatedPencilStyle]}>
                <Svg width={24} height={40} viewBox="0 0 24 40" fill="none">
                  {/* Pencil body */}
                  <Rect
                    x={7}
                    y={0}
                    width={10}
                    height={26}
                    rx={2}
                    fill={colors.accent}
                    stroke={colors.ink}
                    strokeWidth={1}
                  />
                  {/* Ferrule band */}
                  <Rect
                    x={7}
                    y={6}
                    width={10}
                    height={3}
                    fill={colors.line}
                  />
                  {/* Wood collar */}
                  <Path
                    d="M7 26 L17 26 L12 36 Z"
                    fill="#EAD5B7"
                    stroke={colors.ink}
                    strokeWidth={1}
                  />
                  {/* Graphite tip */}
                  <Path
                    d="M10.5 32.5 L13.5 32.5 L12 37 Z"
                    fill={colors.ink}
                  />
                </Svg>
              </AnimatedView>
            </View>
          </View>

          {/* Copy and CTA */}
          <View style={styles.copyContainer}>
            <Text style={styles.screenTitle}>Sketch your vision</Text>
            <Text style={styles.screenHelper}>
              Handcraft silhouettes on paper canvas
            </Text>
          </View>

          <View style={styles.ctaContainer}>
            <Button
              label="Start"
              onPress={handleStart}
              size="large"
              fullWidth
            />
          </View>
        </View>

        {/* SCREEN 2: Garment silhouettes (western and eastern) fading in */}
        <View style={styles.page}>
          <View style={styles.silhouettesWrapper}>
            {/* Top row: Western silhouettes */}
            <View style={styles.silhouettesRow}>
              {[
                GARMENT_TEMPLATES[0], // blazer
                GARMENT_TEMPLATES[1], // trench
                GARMENT_TEMPLATES[2], // slip dress
              ].map((garment) => (
                <View key={garment.id} style={styles.silhouetteCard}>
                  <View style={styles.silhouetteHeader}>
                    <Text style={styles.silhouetteCategory}>Western</Text>
                  </View>
                  <Svg width={72} height={80} viewBox="0 0 110 110">
                    <Path
                      d={garment.strokePath}
                      stroke={colors.ink}
                      strokeWidth={1.5}
                      fill={colors.paperElevated}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {garment.detailPaths?.map((path, i) => (
                      <Path
                        key={i}
                        d={path}
                        stroke={colors.textMuted}
                        strokeWidth={1}
                        fill="none"
                      />
                    ))}
                  </Svg>
                  <Text numberOfLines={1} style={styles.silhouetteName}>
                    {garment.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Bottom row: Eastern silhouettes */}
            <View style={styles.silhouettesRow}>
              {[
                GARMENT_TEMPLATES[6], // kurta
                GARMENT_TEMPLATES[8], // lehenga
                GARMENT_TEMPLATES[10], // saree
              ].map((garment) => (
                <View key={garment.id} style={styles.silhouetteCard}>
                  <View style={styles.silhouetteHeader}>
                    <Text style={styles.silhouetteCategory}>Eastern</Text>
                  </View>
                  <Svg width={72} height={80} viewBox="0 0 110 110">
                    <Path
                      d={garment.strokePath}
                      stroke={colors.accent}
                      strokeWidth={1.5}
                      fill={colors.accentSoft}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {garment.detailPaths?.map((path, i) => (
                      <Path
                        key={i}
                        d={path}
                        stroke={colors.accent}
                        strokeWidth={0.9}
                        fill="none"
                      />
                    ))}
                  </Svg>
                  <Text numberOfLines={1} style={styles.silhouetteName}>
                    {garment.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Copy and CTA */}
          <View style={styles.copyContainer}>
            <Text style={styles.screenTitle}>Any fabric. Any style.</Text>
            <Text style={styles.screenHelper}>
              Western tailoring to Eastern drapes
            </Text>
          </View>

          <View style={styles.ctaContainer}>
            <Button
              label="Open studio"
              onPress={handleFinishOnboarding}
              size="large"
              fullWidth
            />
          </View>
        </View>
      </ScrollView>

      {/* Pagination Dashes */}
      <View style={styles.paginationRow}>
        <Pressable
          onPress={() => {
            triggerHaptic('selection');
            scrollRef.current?.scrollTo({ x: 0, animated: true });
            setCurrentIndex(0);
          }}
          accessibilityRole="button"
          accessibilityLabel="Go to page 1"
          style={[
            styles.pageIndicator,
            currentIndex === 0
              ? styles.pageIndicatorActive
              : styles.pageIndicatorInactive,
          ]}
        />
        <Pressable
          onPress={() => {
            triggerHaptic('selection');
            scrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: true });
            setCurrentIndex(1);
          }}
          accessibilityRole="button"
          accessibilityLabel="Go to page 2"
          style={[
            styles.pageIndicator,
            currentIndex === 1
              ? styles.pageIndicatorActive
              : styles.pageIndicatorInactive,
          ]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    height: 52,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontFamily: typography.title2.fontFamily,
    fontSize: 20,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  pager: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xxl,
  },
  illustrationCard: {
    width: '100%',
    height: 280,
    backgroundColor: colors.paperCard,
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.soft,
  },
  paperGrid: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.md,
    opacity: 0.7,
  },
  gridLine: {
    height: 1,
    backgroundColor: colors.lineSubtle,
    width: '100%',
  },
  canvasContainer: {
    width: 180,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pencilObject: {
    zIndex: 10,
  },
  silhouettesWrapper: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  silhouettesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  silhouetteCard: {
    flex: 1,
    backgroundColor: colors.paperCard,
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    ...shadows.soft,
  },
  silhouetteHeader: {
    marginBottom: 4,
  },
  silhouetteCategory: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  silhouetteName: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.graphite,
    marginTop: 4,
    fontWeight: '500',
  },
  copyContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  screenTitle: {
    fontFamily: typography.title1.fontFamily,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  screenHelper: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
  ctaContainer: {
    width: '100%',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  pageIndicator: {
    height: 3,
    borderRadius: 2,
  },
  pageIndicatorActive: {
    width: 24,
    backgroundColor: colors.ink,
  },
  pageIndicatorInactive: {
    width: 8,
    backgroundColor: colors.line,
  },
});
