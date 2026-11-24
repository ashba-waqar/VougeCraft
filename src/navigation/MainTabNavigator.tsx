import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  BookOpen,
  Layers,
  PenTool,
  LayoutGrid,
  User,
} from 'lucide-react-native';
import { typography, useLayout, responsiveTextProps } from '../theme';
import { PressableScale } from '../components/PressableScale';
import { SketchbooksScreen } from '../screens/main/SketchbooksScreen';
import { LibraryScreen } from '../screens/main/LibraryScreen';
import { StudioScreen } from '../screens/studio/StudioScreen';
import { BoardsScreen } from '../screens/main/BoardsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { triggerHaptic } from '../utils/haptics';

export type MainTabParamList = {
  Sketchbooks: undefined;
  Library: undefined;
  Studio:
    | {
        mode?: 'blank' | 'template';
        templateId?: string;
        sketchId?: string;
        openAI?: boolean;
      }
    | undefined;
  Boards: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, React.ComponentType<any>> = {
  Sketchbooks: BookOpen,
  Library: Layers,
  Studio: PenTool,
  Boards: LayoutGrid,
  Profile: User,
};

const AnimatedTabLabel: React.FC<{ isFocused: boolean; label: string }> = ({
  isFocused,
  label,
}) => {
  const opacity = useSharedValue(isFocused ? 1 : 0.9);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = isFocused ? 1 : 0.9;
    } else {
      opacity.value = withTiming(isFocused ? 1 : 0.9, { duration: 200 });
    }
  }, [isFocused, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      {...responsiveTextProps}
      style={[
        styles.dockLabel,
        isFocused ? styles.dockLabelActive : styles.dockLabelInactive,
        animatedStyle,
      ]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {label}
    </Animated.Text>
  );
};

const CustomBottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { insets, isSmall } = useLayout();
  const currentRoute = state.routes[state.index];

  const [tabLayouts, setTabLayouts] = useState<{
    [index: number]: { x: number; width: number; height: number };
  }>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillHeight = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const layout = tabLayouts[state.index];
    if (layout) {
      if (reducedMotion) {
        pillX.value = layout.x;
        pillWidth.value = layout.width;
        pillHeight.value = layout.height;
        pillOpacity.value = 1;
      } else {
        pillOpacity.value = withTiming(1, { duration: 150 });
        pillX.value = withSpring(layout.x, {
          damping: 18,
          stiffness: 220,
          mass: 0.8,
        });
        pillWidth.value = withSpring(layout.width, {
          damping: 18,
          stiffness: 220,
          mass: 0.8,
        });
        pillHeight.value = layout.height;
      }
    }
  }, [state.index, tabLayouts, reducedMotion]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ translateX: pillX.value }],
    width: pillWidth.value,
    height: pillHeight.value || 34,
  }));

  // In Studio screen, canvas drawing toolbar occupies the bottom; hide main tab dock
  if (currentRoute?.name === 'Studio') {
    return null;
  }

  const bottomMargin = insets.bottom + 8;

  return (
    <View
      style={[styles.barWrapper, { bottom: bottomMargin }]}
      pointerEvents="box-none"
    >
      <View style={styles.dockShadowWrapper}>
        <View style={styles.dockCapsule}>
          {Platform.OS === 'android' ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(255, 255, 255, 0.92)' },
              ]}
            />
          ) : (
            <>
              <BlurView
                intensity={40}
                tint="light"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(255, 255, 255, 0.72)' },
                ]}
              />
            </>
          )}
          <View style={styles.dockItemsRow}>
            <Animated.View
              pointerEvents="none"
              style={[styles.slidingPill, animatedPillStyle]}
            />
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const IconComponent = TAB_ICONS[route.name] || BookOpen;
              const showLabel = isFocused || !isSmall;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  triggerHaptic('light');
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              return (
                <PressableScale
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={route.name}
                  testID={descriptors[route.key]?.options?.tabBarButtonTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  onLayout={(e: LayoutChangeEvent) => {
                    const { x, width, height } = e.nativeEvent.layout;
                    setTabLayouts((prev) => {
                      if (prev[index]?.x === x && prev[index]?.width === width) return prev;
                      return { ...prev, [index]: { x, width, height } };
                    });
                  }}
                  style={styles.dockItem}
                >
                  <IconComponent
                    size={isFocused ? 18 : 17}
                    color={isFocused ? '#FFFFFF' : '#8A6B72'}
                    strokeWidth={isFocused ? 2 : 1.75}
                  />
                  {showLabel && (
                    <AnimatedTabLabel isFocused={isFocused} label={route.name} />
                  )}
                </PressableScale>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Sketchbooks" component={SketchbooksScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen
        name="Studio"
        component={StudioScreen}
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen name="Boards" component={BoardsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  dockShadowWrapper: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 40,
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 12,
  },
  dockCapsule: {
    width: '100%',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(127, 0, 32, 0.35)',
    paddingVertical: 5,
    paddingHorizontal: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  dockItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    position: 'relative',
  },
  slidingPill: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#7F0020',
    borderRadius: 24,
    shadowColor: '#7F0020',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 0,
  },
  dockItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 24,
    gap: 4,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  dockItemPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  dockLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  dockLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dockLabelInactive: {
    color: '#8A6B72',
    fontWeight: '500',
  },
});
