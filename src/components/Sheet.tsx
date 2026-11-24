import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  ViewStyle,
  Platform,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../theme';
import { triggerHaptic } from '../utils/haptics';
import { PressableScale } from './PressableScale';

export interface SheetOption {
  id: string;
  title: string; // 1 to 3 words
  subtitle?: string; // max 6 words
  icon: React.ReactNode;
  onPress: () => void;
}

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string; // 1 to 3 words
  headerComponent?: React.ReactNode;
  footer?: React.ReactNode;
  options?: SheetOption[];
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: React.RefObject<ScrollView | null>;
}

const AnimatedView = Animated.View as any;

export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  title,
  headerComponent,
  footer,
  options,
  children,
  style,
  contentContainerStyle,
  scrollRef,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(windowHeight);
  const opacity = useSharedValue(0);

  const isTablet = windowWidth >= 768;

  const handleClose = () => {
    triggerHaptic('light');
    opacity.value = withTiming(0, { duration: 160 });
    translateY.value = withTiming(
      windowHeight,
      { duration: 200 },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      }
    );
  };

  useEffect(() => {
    if (visible) {
      triggerHaptic('light');
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 220,
        mass: 0.8,
      });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(windowHeight, { duration: 220 });
    }
  }, [visible, windowHeight]);

  // Lock body scroll on web when sheet is open
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (visible) {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = originalOverflow;
        };
      }
    }
  }, [visible]);

  // Web viewport: ensure root html, body and #root have height 100%
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'voguecraft-sheet-root-style';
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
          html, body, #root {
            height: 100% !important;
            margin: 0;
            padding: 0;
          }
        `;
        document.head.appendChild(styleEl);
      }
    }
  }, []);

  // Drag-to-dismiss gesture: attached ONLY to the header & drag handle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 4,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.value = gestureState.dy;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 70 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          translateY.value = withSpring(0, {
            damping: 20,
            stiffness: 250,
            mass: 0.8,
          });
        }
      },
    })
  ).current;

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <AnimatedView style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </AnimatedView>

        <AnimatedView
          style={[
            styles.sheet,
            {
              maxHeight: windowHeight * 0.85,
              maxWidth: isTablet ? 560 : '100%',
              alignSelf: 'center',
            },
            sheetStyle,
            style,
          ]}
        >
          {Platform.OS === 'ios' && (
            <BlurView
              intensity={30}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Part 1: Fixed Header with drag handle, title and close icon */}
          <View {...panResponder.panHandlers} style={styles.headerContainer}>
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  Platform.OS === 'web'
                    ? ({ touchAction: 'none' } as any)
                    : null,
                ]}
              />
            </View>

            {(title !== undefined || headerComponent !== undefined) && (
              <View style={styles.headerRow}>
                <View style={styles.titleWrapper}>
                  {title ? (
                    <Text
                      numberOfLines={1}
                      style={[typography.title2, styles.title]}
                    >
                      {title}
                    </Text>
                  ) : null}
                </View>
                <PressableScale
                  onPress={handleClose}
                  style={styles.closeBtn}
                  accessibilityLabel="Close sheet"
                  accessibilityRole="button"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={20} color={colors.ink} strokeWidth={1.75} />
                </PressableScale>
              </View>
            )}

            {headerComponent}
          </View>

          {/* Part 2: ScrollView with flexShrink 1 and flexGrow 0 for the content */}
          <ScrollView
            ref={scrollRef as any}
            style={[
              styles.scrollView,
              Platform.OS === 'web'
                ? ({
                    touchAction: 'pan-y',
                    overscrollBehavior: 'contain',
                  } as any)
                : null,
            ]}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 24 },
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {options && (
              <View style={styles.optionsList}>
                {options.map((option, index) => (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      handleClose();
                      option.onPress();
                    }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      index < options.length - 1 && styles.optionBorder,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View style={styles.iconCircle}>{option.icon}</View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      {option.subtitle && (
                        <Text style={styles.optionSubtitle}>
                          {option.subtitle}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {children}
          </ScrollView>

          {/* Part 3: Optional fixed footer for buttons */}
          {footer && (
            <View
              style={[
                styles.footerContainer,
                { paddingBottom: Math.max(insets.bottom, spacing.md) },
              ]}
            >
              {footer}
            </View>
          )}
        </AnimatedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    width: '100%',
    flexShrink: 1,
    overflow: 'hidden',
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(255, 255, 255, 0.82)'
        : 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  headerContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSubtle,
    backgroundColor: 'transparent',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(58, 10, 22, 0.28)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
    paddingBottom: 2,
  },
  titleWrapper: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceGhost,
  },
  scrollView: {
    flexShrink: 1,
    flexGrow: 0,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  footerContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lineSubtle,
    backgroundColor: colors.paperCard,
  },
  optionsList: {
    backgroundColor: colors.paperElevated,
    borderRadius: radius.cards,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSubtle,
  },
  optionPressed: {
    backgroundColor: colors.accentSoft,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.paperCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    marginRight: spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: typography.headline.fontFamily,
    fontSize: 15,
    color: colors.ink,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
