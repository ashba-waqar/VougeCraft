import React, { useRef, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import {
  Canvas,
  Path as SkiaPath,
  Group,
  Skia,
} from '@shopify/react-native-skia';
import Svg, { Path as SvgPath, G as SvgG } from 'react-native-svg';
import { colors } from '../theme';
import { useCanvasStore } from '../store/canvasStore';
import { createTool } from './tools';
import { Point, ShapeItem, StrokeItem } from '../types/canvas';
import { triggerHaptic } from '../utils/haptics';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 720;

const AnimatedView = Animated.View as any;

interface CanvasViewProps {
  onDrawingStateChange?: (isDrawing: boolean) => void;
}

// Error boundary to guarantee Skia WebGL failures never produce a blank screen
class SkiaBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: any) {
    // Failover safely to vector SVG renderer
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  onDrawingStateChange,
}) => {
  const sketch = useCanvasStore((state) => state.sketch);
  const activeToolType = useCanvasStore((state) => state.activeTool);
  const toolSettings = useCanvasStore((state) => state.toolSettings);
  const activeLayerId = useCanvasStore((state) => state.activeLayerId);
  const addItemToActiveLayer = useCanvasStore(
    (state) => state.addItemToActiveLayer
  );
  const updateShapeFill = useCanvasStore((state) => state.updateShapeFill);

  // Viewport transforms driven by Reanimated shared values
  const scale = useSharedValue(sketch.viewport.scale || 1.0);
  const translateX = useSharedValue(sketch.viewport.translateX || 0);
  const translateY = useSharedValue(sketch.viewport.translateY || 0);

  // Live stroke state for immediate visible drawing
  const [liveSvgPath, setLiveSvgPath] = useState<string>('');
  const livePointsRef = useRef<Point[]>([]);
  const livePathRef = useRef<string>('');

  // Active Tool instance
  const activeTool = useMemo(
    () => createTool(activeToolType),
    [activeToolType]
  );

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const savedScale = useSharedValue(1);

  const handlePointerDown = (point: Point) => {
    livePointsRef.current = [point];
    livePathRef.current = `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    setLiveSvgPath(livePathRef.current);
    if (onDrawingStateChange) onDrawingStateChange(true);

    activeTool.onPointerDown(point, {
      activeLayerId,
      settings: toolSettings,
      layers: sketch.layers,
      viewport: sketch.viewport,
      onCommitItem: (item) => {
        addItemToActiveLayer(item);
      },
      onUpdateShapeFill: (shapeId, layerId, fill) => {
        updateShapeFill(shapeId, layerId, fill);
      },
    });
  };

  const handlePointerMove = (point: Point) => {
    livePointsRef.current.push(point);
    livePathRef.current += ` L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    setLiveSvgPath(livePathRef.current);

    activeTool.onPointerMove(point, {
      activeLayerId,
      settings: toolSettings,
      layers: sketch.layers,
      viewport: sketch.viewport,
      onCommitItem: () => {},
      onUpdateShapeFill: () => {},
    });
  };

  const handlePointerUp = (point: Point) => {
    const finalPoints = [...livePointsRef.current, point];
    livePointsRef.current = [];
    livePathRef.current = '';
    setLiveSvgPath('');
    if (onDrawingStateChange) onDrawingStateChange(false);

    activeTool.onPointerUp(point, {
      activeLayerId,
      settings: toolSettings,
      layers: sketch.layers,
      viewport: sketch.viewport,
      onCommitItem: (item) => {
        addItemToActiveLayer(item);
      },
      onUpdateShapeFill: (shapeId, layerId, fill) => {
        updateShapeFill(shapeId, layerId, fill);
      },
    });
  };

  // 1. Single Finger Draw Gesture
  const drawGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart((e) => {
      const pt: Point = {
        x: Math.max(0, Math.min(e.x, CANVAS_WIDTH)),
        y: Math.max(0, Math.min(e.y, CANVAS_HEIGHT)),
        time: Date.now(),
      };
      runOnJS(handlePointerDown)(pt);
    })
    .onUpdate((e) => {
      const pt: Point = {
        x: Math.max(0, Math.min(e.x, CANVAS_WIDTH)),
        y: Math.max(0, Math.min(e.y, CANVAS_HEIGHT)),
        time: Date.now(),
      };
      runOnJS(handlePointerMove)(pt);
    })
    .onEnd((e) => {
      const pt: Point = {
        x: Math.max(0, Math.min(e.x, CANVAS_WIDTH)),
        y: Math.max(0, Math.min(e.y, CANVAS_HEIGHT)),
        time: Date.now(),
      };
      runOnJS(handlePointerUp)(pt);
    });

  // 2. Two-Finger Pan Gesture
  const twoFingerPan = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    });

  // 3. Pinch Zoom Gesture (0.25 to 8.0)
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, 0.25), 8.0);
    });

  // Compose Gestures
  const composedGestures = Gesture.Simultaneous(
    drawGesture,
    twoFingerPan,
    pinchGesture
  );

  const animatedTransformStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const safeMakeSkiaPath = (svgStr?: string | null) => {
    if (!svgStr) return null;
    try {
      return Skia?.Path?.MakeFromSVGString(svgStr) || null;
    } catch {
      return null;
    }
  };

  // Live stroke Skia Path
  const liveSkiaPath = useMemo(() => {
    return safeMakeSkiaPath(liveSvgPath);
  }, [liveSvgPath]);

  // Skia Rendered Layers
  const skiaRenderedLayers = useMemo(() => {
    return sketch.layers.map((layer) => {
      if (!layer.visible) return null;

      const items = layer.items.map((item) => {
        if (item.type === 'stroke') {
          const s = item as StrokeItem;
          const skPath = safeMakeSkiaPath(s.svgPath);
          if (!skPath) return null;

          // Tool appearance differences
          let strokeWidth = s.width;
          let strokeOpacity = (s.opacity || 1.0) * layer.opacity;

          if (s.tool === 'pencil') {
            strokeWidth = Math.max(s.width * 0.85, 1.0);
            strokeOpacity *= 0.82;
          } else if (s.tool === 'marker') {
            strokeWidth = s.width * 2.2;
            strokeOpacity *= 0.35;
          } else if (s.tool === 'brush') {
            strokeWidth = s.width * 1.5;
          }

          return (
            <SkiaPath
              key={s.id}
              path={skPath}
              color={s.color}
              strokeWidth={strokeWidth}
              style="stroke"
              strokeCap="round"
              strokeJoin="round"
              opacity={strokeOpacity}
            />
          );
        }

        if (item.type === 'shape') {
          const sh = item as ShapeItem;
          const skPath = safeMakeSkiaPath(sh.svgPath);
          if (!skPath) return null;

          const fillColor =
            sh.fill?.type === 'color'
              ? sh.fill.value
              : sh.fill?.type === 'fabric'
              ? colors.accentSoft
              : 'transparent';

          return (
            <Group key={sh.id} opacity={layer.opacity}>
              {sh.fill && (
                <SkiaPath path={skPath} color={fillColor} style="fill" />
              )}
              <SkiaPath
                path={skPath}
                color={sh.stroke?.color || '#0E0E10'}
                strokeWidth={sh.stroke?.width || 1.5}
                style="stroke"
                strokeCap="round"
                strokeJoin="round"
              />
            </Group>
          );
        }

        return null;
      });

      return <Group key={layer.id}>{items}</Group>;
    });
  }, [sketch.layers]);

  // SVG Fallback Content
  const svgRenderedLayers = useMemo(() => {
    return sketch.layers.map((layer) => {
      if (!layer.visible) return null;

      return (
        <SvgG key={layer.id} opacity={layer.opacity}>
          {layer.items.map((item) => {
            if (item.type === 'stroke') {
              const s = item as StrokeItem;
              let strokeWidth = s.width;
              let strokeOpacity = (s.opacity || 1.0);

              if (s.tool === 'pencil') {
                strokeWidth = Math.max(s.width * 0.85, 1.0);
                strokeOpacity *= 0.82;
              } else if (s.tool === 'marker') {
                strokeWidth = s.width * 2.2;
                strokeOpacity *= 0.35;
              } else if (s.tool === 'brush') {
                strokeWidth = s.width * 1.5;
              }

              return (
                <SvgPath
                  key={s.id}
                  d={s.svgPath}
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            }

            if (item.type === 'shape') {
              const sh = item as ShapeItem;
              const fillColor =
                sh.fill?.type === 'color'
                  ? sh.fill.value
                  : sh.fill?.type === 'fabric'
                  ? colors.accentSoft
                  : 'none';

              return (
                <SvgG key={sh.id}>
                  {sh.fill && <SvgPath d={sh.svgPath} fill={fillColor} />}
                  <SvgPath
                    d={sh.svgPath}
                    stroke={sh.stroke?.color || '#0E0E10'}
                    strokeWidth={sh.stroke?.width || 1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </SvgG>
              );
            }

            return null;
          })}
        </SvgG>
      );
    });
  }, [sketch.layers]);

  // Live stroke width / opacity
  const liveWidth =
    activeToolType === 'marker'
      ? toolSettings.size * 2.2
      : activeToolType === 'brush'
      ? toolSettings.size * 1.5
      : activeToolType === 'pencil'
      ? Math.max(toolSettings.size * 0.85, 1.0)
      : toolSettings.size;

  const liveOpacity =
    activeToolType === 'marker'
      ? 0.35
      : activeToolType === 'pencil'
      ? toolSettings.opacity * 0.82
      : toolSettings.opacity;

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <AnimatedView style={[styles.canvasSurface, animatedTransformStyle]}>
          <GestureDetector gesture={composedGestures}>
            <View style={styles.touchArea}>
              <SkiaBoundary
                fallback={
                  <Svg
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                    style={styles.svgCanvas}
                  >
                    {/* Paper background */}
                    <SvgPath
                      d={`M 0 0 H ${CANVAS_WIDTH} V ${CANVAS_HEIGHT} H 0 Z`}
                      fill="#F7F4EE"
                    />
                    {svgRenderedLayers}
                    {liveSvgPath !== '' && (
                      <SvgPath
                        d={liveSvgPath}
                        stroke={toolSettings.color}
                        strokeWidth={liveWidth}
                        strokeOpacity={liveOpacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    )}
                  </Svg>
                }
              >
                <Canvas style={styles.skiaCanvas}>
                  {/* Paper Background */}
                  <SkiaPath
                    path={`M 0 0 H ${CANVAS_WIDTH} V ${CANVAS_HEIGHT} H 0 Z`}
                    color="#F7F4EE"
                    style="fill"
                  />

                  {/* Committed Layers */}
                  {skiaRenderedLayers}

                  {/* Live Stroke */}
                  {liveSkiaPath && (
                    <SkiaPath
                      path={liveSkiaPath}
                      color={toolSettings.color}
                      strokeWidth={liveWidth}
                      style="stroke"
                      strokeCap="round"
                      strokeJoin="round"
                      opacity={liveOpacity}
                    />
                  )}
                </Canvas>
              </SkiaBoundary>
            </View>
          </GestureDetector>
        </AnimatedView>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasSurface: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#F7F4EE',
    shadowColor: '#0E0E10',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  touchArea: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  skiaCanvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  svgCanvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
});
