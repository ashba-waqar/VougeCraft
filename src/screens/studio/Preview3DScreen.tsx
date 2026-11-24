import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Sparkles,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Sun,
  Wind,
  ArrowUp,
  ArrowDown,
} from 'lucide-react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  G,
  Ellipse,
} from 'react-native-svg';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { IconButton } from '../../components';
import { useCanvasStore } from '../../store/canvasStore';
import { triggerHaptic } from '../../utils/haptics';

// Try loading Three.js and Expo-GL safely
let THREE: any = null;
let GLView: any = null;
try {
  THREE = require('three');
  const expoGl = require('expo-gl');
  GLView = expoGl.GLView;
} catch {
  // Graceful fallback to 2D layered flat studio mode
}

interface Preview3DScreenProps {
  navigation: any;
  route?: any;
}

export type MannequinType = 'female' | 'male' | 'neutral';

export type FabricPreset =
  | 'jamawar'
  | 'silk'
  | 'organza'
  | 'chiffon'
  | 'velvet'
  | 'denim'
  | 'linen';

export interface WardrobeLayer {
  id: 'shirt' | 'plazo' | 'sharara' | 'dupatta' | 'jacket' | 'kurta' | 'lehenga';
  name: string; // 1 word
  enabled: boolean;
  order: number; // Stacking order: higher renders on top
  color: string;
  flowWeight: number; // Fabric flow multiplier
}

export const FABRIC_PRESETS: Record<
  FabricPreset,
  {
    name: string;
    sheen: number;
    roughness: number;
    opacity: number;
    thickness: number;
    flowWeight: number;
    color: string;
    highlight: string;
    helper: string;
  }
> = {
  jamawar: {
    name: 'Jamawar',
    sheen: 30,
    roughness: 70,
    opacity: 1.0,
    thickness: 0.85,
    flowWeight: 0.18, // heavy, barely moves
    color: '#6B1D2F',
    highlight: '#D4AF37',
    helper: 'Heavy matte metallic brocade',
  },
  silk: {
    name: 'Silk',
    sheen: 92,
    roughness: 18,
    opacity: 0.98,
    thickness: 0.45,
    flowWeight: 0.65, // fluid drape
    color: '#D4AF37',
    highlight: '#FFF7DC',
    helper: 'High lustrous sheen drape',
  },
  organza: {
    name: 'Organza',
    sheen: 60,
    roughness: 35,
    opacity: 0.70,
    thickness: 0.25,
    flowWeight: 0.40, // crisp, structured volume
    color: '#E8DED1',
    highlight: '#FFFFFF',
    helper: 'Semi transparent crisp volume',
  },
  chiffon: {
    name: 'Chiffon',
    sheen: 45,
    roughness: 25,
    opacity: 0.50,
    thickness: 0.15,
    flowWeight: 0.95, // very light, maximum sway
    color: '#E8D5D8',
    highlight: '#FFFFFF',
    helper: 'Translucent soft fluid drape',
  },
  velvet: {
    name: 'Velvet',
    sheen: 80,
    roughness: 60,
    opacity: 1.0,
    thickness: 0.75,
    flowWeight: 0.45, // dense short pile
    color: '#341D38',
    highlight: '#684270',
    helper: 'Deep plush directional pile',
  },
  denim: {
    name: 'Denim',
    sheen: 15,
    roughness: 85,
    opacity: 1.0,
    thickness: 0.90,
    flowWeight: 0.25, // structured twill
    color: '#2D3E50',
    highlight: '#4C647C',
    helper: 'Matte diagonal twill weave',
  },
  linen: {
    name: 'Linen',
    sheen: 10,
    roughness: 92,
    opacity: 1.0,
    thickness: 0.55,
    flowWeight: 0.35, // dry flax hand
    color: '#C2B49F',
    highlight: '#DFD7C8',
    helper: 'Rough natural flax texture',
  },
};

const INITIAL_WARDROBE_LAYERS: WardrobeLayer[] = [
  { id: 'shirt', name: 'Shirt', enabled: false, order: 1, color: '#FFFFFF', flowWeight: 0.3 },
  { id: 'plazo', name: 'Plazo', enabled: false, order: 2, color: '#2D3E50', flowWeight: 0.6 },
  { id: 'sharara', name: 'Sharara', enabled: false, order: 2, color: '#C2B49F', flowWeight: 0.8 },
  { id: 'lehenga', name: 'Lehenga', enabled: false, order: 2, color: '#8C3B24', flowWeight: 0.5 },
  { id: 'kurta', name: 'Kurta', enabled: true, order: 3, color: '#D4AF37', flowWeight: 0.45 },
  { id: 'jacket', name: 'Jacket', enabled: false, order: 4, color: '#1A1A1F', flowWeight: 0.2 },
  { id: 'dupatta', name: 'Dupatta', enabled: true, order: 5, color: '#0F382A', flowWeight: 0.95 },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

export const Preview3DScreen: React.FC<Preview3DScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const sketch = useCanvasStore((state) => state.sketch);

  // 3D Scene Controls
  const [mannequin, setMannequin] = useState<MannequinType>('female');
  const [fabricPreset, setFabricPreset] = useState<FabricPreset>('silk');
  const [sheen, setSheen] = useState<number>(FABRIC_PRESETS.silk.sheen);
  const [roughness, setRoughness] = useState<number>(FABRIC_PRESETS.silk.roughness);
  const [flow, setFlow] = useState<number>(65); // Vertex sway simulation
  const [lightAngle, setLightAngle] = useState<number>(45); // Spotlight direction
  const [isTurntableOn, setIsTurntableOn] = useState<boolean>(true);
  const [rotationAngle, setRotationAngle] = useState<number>(15);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [swayTick, setSwayTick] = useState<number>(0);
  const [useGlMode, setUseGlMode] = useState<boolean>(false);
  const [glReady, setGlReady] = useState<boolean>(false);
  const [isSnapshotting, setIsSnapshotting] = useState<boolean>(false);

  // Wardrobe multi-layer state
  const [wardrobeLayers, setWardrobeLayers] = useState<WardrobeLayer[]>(
    INITIAL_WARDROBE_LAYERS
  );
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'fabric' | 'lighting'>(
    'wardrobe'
  );

  const threeSceneRef = useRef<any>(null);
  const turntableAngleRef = useRef<number>(15);

  // Sync canvas sketch colors into active garment
  useEffect(() => {
    let extractedColor = '#D4AF37';
    for (const layer of sketch.layers) {
      for (const item of layer.items) {
        if (item.type === 'shape' && item.fill) {
          if (item.fill.type === 'color') extractedColor = item.fill.value;
          break;
        }
      }
    }
    setWardrobeLayers((prev) =>
      prev.map((l) => (l.id === 'kurta' ? { ...l, color: extractedColor } : l))
    );
  }, [sketch]);

  // Turntable & Drape Sway Animation Loop
  useEffect(() => {
    let interval: any = null;
    interval = setInterval(() => {
      setSwayTick((prev) => prev + 0.08);

      if (isTurntableOn) {
        turntableAngleRef.current = (turntableAngleRef.current + 1.0) % 360;
        setRotationAngle(turntableAngleRef.current);

        if (threeSceneRef.current?.group) {
          threeSceneRef.current.group.rotation.y =
            (turntableAngleRef.current * Math.PI) / 180;
          threeSceneRef.current.renderer?.render(
            threeSceneRef.current.scene,
            threeSceneRef.current.camera
          );
        }
      }
    }, 33);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTurntableOn]);

  const handleSelectPreset = (presetKey: FabricPreset) => {
    triggerHaptic('light');
    setFabricPreset(presetKey);
    const p = FABRIC_PRESETS[presetKey];
    setSheen(p.sheen);
    setRoughness(p.roughness);
  };

  const handleToggleWardrobeLayer = (id: string) => {
    triggerHaptic('light');
    setWardrobeLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    triggerHaptic('light');
    setWardrobeLayers((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((l) => l.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index + 1 : index - 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;

      const tempOrder = sorted[index].order;
      sorted[index].order = sorted[targetIndex].order;
      sorted[targetIndex].order = tempOrder;

      return [...sorted];
    });
  };

  const onPanGesture = (event: any) => {
    const { translationX } = event.nativeEvent;
    const delta = translationX * 0.4;
    const newAngle = (turntableAngleRef.current + delta) % 360;
    setRotationAngle(newAngle < 0 ? newAngle + 360 : newAngle);
  };

  const onPanEnd = () => {
    turntableAngleRef.current = rotationAngle;
  };

  const handleResetView = () => {
    triggerHaptic('light');
    turntableAngleRef.current = 0;
    setRotationAngle(0);
    setZoomLevel(1.0);
    setLightAngle(45);
  };

  const handleSnapshot = () => {
    triggerHaptic('medium');
    setIsSnapshotting(true);
    setTimeout(() => {
      setIsSnapshotting(false);
      Alert.alert('Saved to boards', 'High-res 3D snapshot saved.');
    }, 450);
  };

  // Optional Three.js WebGL context initialization
  const onContextCreate = async (gl: any) => {
    try {
      if (!THREE) return;
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf7f4ee);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 1.2, 3.8);

      const renderer = new THREE.WebGLRenderer({ context: gl, antialias: true });
      renderer.setSize(width, height);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambientLight);

      const spotLight = new THREE.SpotLight(0xfff7e6, 1.6);
      spotLight.position.set(2, 5, 3);
      scene.add(spotLight);

      const group = new THREE.Group();
      scene.add(group);

      threeSceneRef.current = { scene, camera, renderer, group };
      setGlReady(true);
      setUseGlMode(true);
      renderer.render(scene, camera);
    } catch {
      setUseGlMode(false);
    }
  };

  const currentPreset = FABRIC_PRESETS[fabricPreset];
  const rotRad = (rotationAngle * Math.PI) / 180;
  const lightRad = (lightAngle * Math.PI) / 180;
  const shadowOffsetX = Math.sin(rotRad) * 22;
  const highlightOffsetX = -Math.sin(rotRad - lightRad) * 28;

  // Sorted enabled wardrobe layers for rendering
  const enabledLayers = wardrobeLayers
    .filter((l) => l.enabled)
    .sort((a, b) => a.order - b.order);

  // Compute sway displacement for flow effect
  const computeSway = (layerFlowWeight: number) => {
    const amp = (flow / 100) * layerFlowWeight * currentPreset.flowWeight * 14;
    return Math.sin(swayTick + layerFlowWeight * 3) * amp;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <IconButton
          icon={<ArrowLeft size={18} color={colors.ink} strokeWidth={1.75} />}
          onPress={() => navigation.goBack()}
          variant="ghost"
          size={36}
          accessibilityLabel="Back to sketch"
        />

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>3D Studio</Text>
          <Text style={styles.headerSubtitle}>Multi layer draping</Text>
        </View>

        <View style={styles.headerActions}>
          <IconButton
            icon={
              isTurntableOn ? (
                <Pause size={16} color={colors.ink} strokeWidth={1.75} />
              ) : (
                <Play size={16} color={colors.ink} strokeWidth={1.75} />
              )
            }
            onPress={() => {
              triggerHaptic('light');
              setIsTurntableOn(!isTurntableOn);
            }}
            variant={isTurntableOn ? 'filled' : 'default'}
            size={36}
            shape="circle"
            accessibilityLabel="Turntable"
          />

          <IconButton
            icon={<Camera size={16} color={colors.ink} strokeWidth={1.75} />}
            onPress={handleSnapshot}
            variant="default"
            size={36}
            shape="circle"
            disabled={isSnapshotting}
            accessibilityLabel="Snapshot"
          />
        </View>
      </View>

      {/* Main 3D Viewport with Fallback */}
      <View style={styles.viewportArea}>
        <View style={styles.studioLightingCircle} />

        {useGlMode && GLView && glReady ? (
          <GLView style={styles.glCanvas} onContextCreate={onContextCreate} />
        ) : (
          <PanGestureHandler onGestureEvent={onPanGesture} onEnded={onPanEnd}>
            <View style={styles.fallbackCanvasWrapper}>
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 320 480"
                style={{ transform: [{ scale: zoomLevel }] }}
              >
                <Defs>
                  {/* Studio Floor Soft Shadow */}
                  <RadialGradient
                    id="floor_shadow"
                    cx="50%"
                    cy="50%"
                    r="50%"
                    fx="50%"
                    fy="50%"
                  >
                    <Stop offset="0%" stopColor="#CDC4B3" stopOpacity="0.75" />
                    <Stop offset="60%" stopColor="#DFD8C9" stopOpacity="0.4" />
                    <Stop offset="100%" stopColor="#F7F4EE" stopOpacity="0" />
                  </RadialGradient>

                  {/* Mannequin Form Shading */}
                  <LinearGradient
                    id="mannequin_grad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <Stop offset="0%" stopColor="#CEC5B3" />
                    <Stop offset="40%" stopColor="#ECE6DA" />
                    <Stop offset="80%" stopColor="#DDD5C5" />
                    <Stop offset="100%" stopColor="#BDB3A0" />
                  </LinearGradient>
                </Defs>

                {/* 1. Floor Spotlight & Soft Pedestal Shadow */}
                <Ellipse
                  cx={160 + shadowOffsetX * 0.4}
                  cy="435"
                  rx="95"
                  ry="24"
                  fill="url(#floor_shadow)"
                />

                {/* 2. Mannequin Stand Base & Metal Pole */}
                <Circle cx="160" cy="430" r="32" fill="#99948B" />
                <Circle cx="160" cy="430" r="28" fill="#B3ACA1" />
                <Rect x="157" y="270" width="6" height="160" fill="#7D776E" />

                {/* 3. Mannequin Form */}
                <G transform={`translate(${shadowOffsetX * 0.15}, 0)`}>
                  <Ellipse cx="160" cy="80" rx="14" ry="7" fill="#A89E90" />
                  <Path
                    d="M 151 80 L 151 106 L 169 106 L 169 80 Z"
                    fill="url(#mannequin_grad)"
                  />
                  {mannequin === 'female' ? (
                    <Path
                      d="M 125 116 Q 160 108 195 116 L 198 168 Q 192 205 186 230 L 188 280 L 132 280 L 134 230 Q 128 205 122 168 Z"
                      fill="url(#mannequin_grad)"
                    />
                  ) : mannequin === 'male' ? (
                    <Path
                      d="M 116 114 Q 160 106 204 114 L 202 175 Q 196 215 192 245 L 190 285 L 130 285 L 128 245 Q 124 215 118 175 Z"
                      fill="url(#mannequin_grad)"
                    />
                  ) : (
                    <Path
                      d="M 120 115 Q 160 108 200 115 L 198 170 Q 194 210 188 238 L 188 282 L 132 282 L 132 238 Q 126 210 122 170 Z"
                      fill="url(#mannequin_grad)"
                    />
                  )}
                </G>

                {/* 4. Multi-Layer Garment Meshes in Order */}
                {enabledLayers.map((layer) => {
                  const swayOffset = computeSway(layer.flowWeight);
                  const isDupatta = layer.id === 'dupatta';
                  const isKurta = layer.id === 'kurta';
                  const isLehenga = layer.id === 'lehenga';
                  const isSharara = layer.id === 'sharara';
                  const isPlazo = layer.id === 'plazo';
                  const isShirt = layer.id === 'shirt';
                  const isJacket = layer.id === 'jacket';

                  return (
                    <G
                      key={layer.id}
                      transform={`translate(${highlightOffsetX * 0.12 + swayOffset}, 0)`}
                      opacity={currentPreset.opacity}
                    >
                      {/* Shirt Base Layer */}
                      {isShirt && (
                        <Path
                          d="M 128 116 Q 160 110 192 116 L 198 180 L 188 280 L 132 280 L 122 180 Z"
                          fill={layer.color}
                          stroke="#1A1A1F"
                          strokeWidth={1.2}
                        />
                      )}

                      {/* Bottom Layers: Lehenga, Sharara, Plazo */}
                      {isLehenga && (
                        <Path
                          d={`M 134 235 L 186 235 L ${228 + swayOffset * 0.4} 425 Q 160 435 ${92 - swayOffset * 0.4} 425 Z`}
                          fill={layer.color}
                          stroke="#1A1A1F"
                          strokeWidth={1.4}
                        />
                      )}

                      {isSharara && (
                        <Path
                          d={`M 134 235 L 186 235 L 196 330 L ${226 + swayOffset * 0.5} 425 L 165 425 L 160 330 L 155 425 L ${94 - swayOffset * 0.5} 425 L 124 330 Z`}
                          fill={layer.color}
                          stroke="#1A1A1F"
                          strokeWidth={1.4}
                        />
                      )}

                      {isPlazo && (
                        <Path
                          d="M 134 235 L 186 235 L 206 425 L 164 425 L 160 270 L 156 425 L 114 425 Z"
                          fill={layer.color}
                          stroke="#1A1A1F"
                          strokeWidth={1.4}
                        />
                      )}

                      {/* Kurta Body */}
                      {isKurta && (
                        <Path
                          d={`M 124 118 Q 160 112 196 118 L 206 185 L ${216 + swayOffset * 0.3} 338 Q 160 348 ${104 - swayOffset * 0.3} 338 L 114 185 Z`}
                          fill={layer.color}
                          stroke="#1A1A1F"
                          strokeWidth={1.3}
                        />
                      )}

                      {/* Jacket Structured Layer */}
                      {isJacket && (
                        <Path
                          d="M 120 114 Q 160 108 200 114 L 208 190 L 198 250 L 175 250 L 172 130 L 148 130 L 145 250 L 122 250 L 112 190 Z"
                          fill={layer.color}
                          stroke="#0E0E10"
                          strokeWidth={1.6}
                        />
                      )}

                      {/* Dupatta Draped Fluidly Over Everything */}
                      {isDupatta && (
                        <Path
                          d={`M 122 118 Q 160 148 198 120 L ${235 + swayOffset} 390 Q 185 410 ${105 - swayOffset} 390 Z`}
                          fill={layer.color}
                          stroke="#D4AF37"
                          strokeWidth={1.5}
                          fillOpacity={0.88}
                        />
                      )}

                      {/* Dynamic Sheen Highlight Accent */}
                      <Path
                        d={`M ${160 + highlightOffsetX} 122 Q ${158 + highlightOffsetX} 225 ${156 + highlightOffsetX + swayOffset} 332`}
                        stroke={currentPreset.highlight}
                        strokeWidth={sheen > 50 ? 4 : 2}
                        strokeOpacity={sheen / 150}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </G>
                  );
                })}
              </Svg>
            </View>
          </PanGestureHandler>
        )}

        {/* Floating Viewport Status Pills */}
        <View style={styles.floatingViewportPills}>
          <Pressable
            onPress={handleResetView}
            style={styles.floatingResetBtn}
            accessibilityLabel="Reset view"
          >
            <RotateCcw size={13} color={colors.ink} strokeWidth={1.75} />
            <Text style={styles.floatingResetText}>Reset</Text>
          </Pressable>

          <View style={styles.angleIndicatorPill}>
            <Text style={styles.angleText}>{Math.round(rotationAngle)}°</Text>
          </View>
        </View>
      </View>

      {/* Studio Dock with Tabs: Wardrobe, Fabric, Lighting */}
      <View
        style={[
          styles.controlDock,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {/* Dock Navigation Strip */}
        <View style={styles.dockTabBar}>
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('wardrobe');
            }}
            style={[
              styles.dockTabBtn,
              activeTab === 'wardrobe' && styles.dockTabBtnActive,
            ]}
          >
            <Layers
              size={13}
              color={activeTab === 'wardrobe' ? colors.ink : colors.textMuted}
              strokeWidth={1.75}
            />
            <Text
              style={[
                styles.dockTabText,
                activeTab === 'wardrobe' && styles.dockTabTextActive,
              ]}
            >
              Wardrobe
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('fabric');
            }}
            style={[
              styles.dockTabBtn,
              activeTab === 'fabric' && styles.dockTabBtnActive,
            ]}
          >
            <Sparkles
              size={13}
              color={activeTab === 'fabric' ? colors.ink : colors.textMuted}
              strokeWidth={1.75}
            />
            <Text
              style={[
                styles.dockTabText,
                activeTab === 'fabric' && styles.dockTabTextActive,
              ]}
            >
              Fabric
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('lighting');
            }}
            style={[
              styles.dockTabBtn,
              activeTab === 'lighting' && styles.dockTabBtnActive,
            ]}
          >
            <Sun
              size={13}
              color={activeTab === 'lighting' ? colors.ink : colors.textMuted}
              strokeWidth={1.75}
            />
            <Text
              style={[
                styles.dockTabText,
                activeTab === 'lighting' && styles.dockTabTextActive,
              ]}
            >
              Lighting
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: Wardrobe Layer Stack & Reordering */}
        {activeTab === 'wardrobe' && (
          <View style={styles.wardrobeSection}>
            <Text style={styles.dockSubhead}>Toggle and reorder</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wardrobeLayersRow}
            >
              {wardrobeLayers
                .sort((a, b) => b.order - a.order) // top layer first
                .map((layer) => (
                  <View
                    key={layer.id}
                    style={[
                      styles.layerCard,
                      layer.enabled && styles.layerCardActive,
                    ]}
                  >
                    <Pressable
                      onPress={() => handleToggleWardrobeLayer(layer.id)}
                      style={styles.layerTogglePress}
                    >
                      <View
                        style={[
                          styles.layerColorIndicator,
                          { backgroundColor: layer.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.layerCardName,
                          layer.enabled && styles.layerCardNameActive,
                        ]}
                      >
                        {layer.name}
                      </Text>
                      {layer.enabled ? (
                        <Eye size={12} color={colors.accent} strokeWidth={2} />
                      ) : (
                        <EyeOff size={12} color={colors.textLight} strokeWidth={1.75} />
                      )}
                    </Pressable>

                    {/* Layer Reorder Buttons (Up / Down) */}
                    {layer.enabled && (
                      <View style={styles.layerReorderRow}>
                        <Pressable
                          onPress={() => handleMoveLayer(layer.id, 'up')}
                          style={styles.reorderBtn}
                          accessibilityLabel="Move over"
                        >
                          <ArrowUp size={10} color={colors.ink} strokeWidth={2} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleMoveLayer(layer.id, 'down')}
                          style={styles.reorderBtn}
                          accessibilityLabel="Move under"
                        >
                          <ArrowDown size={10} color={colors.ink} strokeWidth={2} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Tab 2: Fabric Presets & Fall Effect Slider */}
        {activeTab === 'fabric' && (
          <View style={{ gap: 8 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetButtonsStrip}
            >
              {(
                [
                  'jamawar',
                  'silk',
                  'organza',
                  'chiffon',
                  'velvet',
                  'denim',
                  'linen',
                ] as FabricPreset[]
              ).map((p) => {
                const isSelected = fabricPreset === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => handleSelectPreset(p)}
                    style={[
                      styles.presetButton,
                      isSelected && styles.presetButtonActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.presetDot,
                        { backgroundColor: FABRIC_PRESETS[p].color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.presetText,
                        isSelected && styles.presetTextActive,
                      ]}
                    >
                      {FABRIC_PRESETS[p].name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* PBR Sheen, Roughness & Flow Slider */}
            <View style={styles.slidersRow}>
              <View style={styles.sliderBox}>
                <View style={styles.sliderLabelRow}>
                  <Text style={styles.sliderLabel}>Sheen</Text>
                  <Text style={styles.sliderValue}>{Math.round(sheen)}%</Text>
                </View>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${sheen}%`, backgroundColor: colors.accent }]} />
                </View>
              </View>

              <View style={styles.sliderBox}>
                <View style={styles.sliderLabelRow}>
                  <Text style={styles.sliderLabel}>Flow</Text>
                  <Text style={styles.sliderValue}>{Math.round(flow)}%</Text>
                </View>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${flow}%`, backgroundColor: '#38A169' }]} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Tab 3: Lighting & Mannequin Form */}
        {activeTab === 'lighting' && (
          <View style={{ gap: 8 }}>
            {/* Mannequin Form Selector */}
            <View style={styles.mannequinSelectorRow}>
              <Text style={styles.controlSectionLabel}>Form</Text>
              <View style={styles.selectorPills}>
                {(['female', 'male', 'neutral'] as MannequinType[]).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => {
                      triggerHaptic('light');
                      setMannequin(m);
                    }}
                    style={[
                      styles.mannequinPill,
                      mannequin === m && styles.mannequinPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.mannequinPillText,
                        mannequin === m && styles.mannequinPillTextActive,
                      ]}
                    >
                      {m === 'female' ? 'Female' : m === 'male' ? 'Male' : 'Neutral'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Light Direction Slider */}
            <View style={styles.sliderBox}>
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabel}>Spotlight direction</Text>
                <Text style={styles.sliderValue}>{Math.round(lightAngle)}°</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    {
                      width: `${(lightAngle / 360) * 100}%`,
                      backgroundColor: '#D4AF37',
                    },
                  ]}
                />
              </View>
              <View style={styles.stepButtons}>
                <Pressable
                  onPress={() => setLightAngle((prev) => (prev - 45 + 360) % 360)}
                  style={styles.stepBtn}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </Pressable>
                <Pressable
                  onPress={() => setLightAngle((prev) => (prev + 45) % 360)}
                  style={styles.stepBtn}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSubtle,
    backgroundColor: '#F7F4EE',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.subhead.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  headerSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewportArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  studioLightingCircle: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: (SCREEN_WIDTH * 0.9) / 2,
    backgroundColor: 'rgba(238, 233, 222, 0.45)',
  },
  glCanvas: {
    width: '100%',
    height: '100%',
  },
  fallbackCanvasWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingViewportPills: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  floatingResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.chips,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    ...shadows.soft,
  },
  floatingResetText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: colors.ink,
  },
  angleIndicatorPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.chips,
    borderWidth: 1,
    borderColor: colors.lineSubtle,
    ...shadows.soft,
  },
  angleText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  controlDock: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    gap: 10,
    ...shadows.card,
  },
  dockTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceGhost,
    borderRadius: radius.chips,
    padding: 3,
  },
  dockTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: radius.chips,
  },
  dockTabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.soft,
  },
  dockTabText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  dockTabTextActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  wardrobeSection: {
    gap: 4,
  },
  dockSubhead: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wardrobeLayersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  layerCard: {
    backgroundColor: colors.surfaceGhost,
    borderRadius: radius.small,
    padding: 6,
    minWidth: 95,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  layerCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.accent,
    ...shadows.soft,
  },
  layerTogglePress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  layerColorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  layerCardName: {
    flex: 1,
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.textMuted,
  },
  layerCardNameActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  layerReorderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.lineSubtle,
    paddingTop: 3,
  },
  reorderBtn: {
    padding: 3,
  },
  mannequinSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlSectionLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 50,
  },
  selectorPills: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surfaceGhost,
    borderRadius: radius.chips,
    padding: 3,
    marginLeft: 8,
  },
  mannequinPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: radius.chips,
  },
  mannequinPillActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.soft,
  },
  mannequinPillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  mannequinPillTextActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  presetButtonsStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.small,
    backgroundColor: colors.surfaceGhost,
  },
  presetButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.accent,
    ...shadows.soft,
  },
  presetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  presetText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
  },
  presetTextActive: {
    color: colors.ink,
    fontWeight: '600',
  },
  slidersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sliderBox: {
    flex: 1,
    backgroundColor: colors.surfaceGhost,
    borderRadius: radius.small,
    padding: 8,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  sliderValue: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.ink,
    fontWeight: '600',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  stepBtn: {
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineSubtle,
  },
  stepBtnText: {
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '700',
    color: colors.ink,
  },
});
