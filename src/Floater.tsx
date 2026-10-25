import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { OUTLINE, OUTLINE_POINTS, PIVOT } from './outline';

const fueguino = require('../assets/fueguino.png');
// Silueta difuminada generada a partir de la transparencia de la imagen (para la sombra)
const sombra = require('../assets/fueguino-sombra.png');
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type Pose = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rot: SharedValue<number>;
  sx: SharedValue<number>;
  sy: SharedValue<number>;
};

function usePoseStyle(size: number, pose: Pose, dx = 0, dy = 0) {
  return useAnimatedStyle(() => ({
    transform: [
      { translateX: pose.x.value - PIVOT.x * size + dx },
      { translateY: pose.y.value - PIVOT.y * size + dy },
      { rotate: `${pose.rot.value}deg` },
      { scaleX: pose.sx.value },
      { scaleY: pose.sy.value },
    ],
  }));
}

/** Sombra suave del personaje sobre el fondo, corrida hacia abajo y a la derecha. */
export function FloaterShadow({ size, pose }: { size: number; pose: Pose }) {
  const style = usePoseStyle(size, pose, size * 0.08, size * 0.12);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.box, { width: size, height: size, transformOrigin: `${PIVOT.x * size}px ${PIVOT.y * size}px 0px` }, style]}
    >
      <Animated.Image source={sombra} style={{ width: size, height: size, opacity: 0.78 }} resizeMode="contain" />
    </Animated.View>
  );
}

/** Contorno de espuma: sigue la silueta real, apenas por fuera, ondulando. */
function foamPath(size: number, t: number, grow: number): string {
  'worklet';
  const n = OUTLINE_POINTS;
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const ox = OUTLINE[i * 2];
    const oy = OUTLINE[i * 2 + 1];
    const wobble = 1 + grow + 0.012 * Math.sin(i * 1.7 + t * 3.1) + 0.008 * Math.sin(i * 0.6 - t * 2.3);
    pts.push((PIVOT.x + ox * wobble) * size, (PIVOT.y + oy * wobble) * size);
  }
  const mx = (a: number, b: number) => (a + b) / 2;
  let d = 'M' + mx(pts[(n - 1) * 2], pts[0]).toFixed(1) + ' ' + mx(pts[(n - 1) * 2 + 1], pts[1]).toFixed(1);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    d +=
      'Q' + pts[i * 2].toFixed(1) + ' ' + pts[i * 2 + 1].toFixed(1) + ' ' +
      mx(pts[i * 2], pts[j * 2]).toFixed(1) + ' ' + mx(pts[i * 2 + 1], pts[j * 2 + 1]).toFixed(1);
  }
  return d + 'Z';
}

export function Floater({ size, pose, clock, speed }: { size: number; pose: Pose; clock: SharedValue<number>; speed: SharedValue<number> }) {
  const style = usePoseStyle(size, pose);
  // Espuma muy sutil: casi invisible en reposo, apenas más marcada al moverse.
  const softFoam = useAnimatedProps(() => {
    const k = Math.min(1, speed.value / 420);
    return { d: foamPath(size, clock.value, 0.02 + 0.015 * k), strokeOpacity: 0.04 + 0.1 * k, strokeWidth: 3 + 2 * k };
  });
  const thinFoam = useAnimatedProps(() => {
    const k = Math.min(1, speed.value / 420);
    return { d: foamPath(size, clock.value + 0.4, 0.012 + 0.008 * k), strokeOpacity: 0.16 + 0.24 * k };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.box, { width: size, height: size, transformOrigin: `${PIVOT.x * size}px ${PIVOT.y * size}px 0px` }, style]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <AnimatedPath animatedProps={softFoam} fill="none" stroke="#ffffff" strokeLinejoin="round" />
        <AnimatedPath animatedProps={thinFoam} fill="none" stroke="#ffffff" strokeWidth={1} strokeDasharray="18 7 6 10" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <Animated.Image source={fueguino} style={{ width: size, height: size }} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, top: 0 },
});
