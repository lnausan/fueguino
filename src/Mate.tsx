import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { leafPaths, mulberry32 } from './yerba';

// Mate visto desde arriba. `size` es el diámetro de la calabaza; la bombilla sobresale hacia abajo.
// El dibujo usa unidades de 0.01·size con el origen en el centro de la boca (el pivote).
const TOP = 0.5; // desde el pivote hasta el borde de arriba de la caja, en fracciones de size
const BOX_H = 1.44; // alto de la caja (calabaza + bombilla), en fracciones de size

// Contorno para los choques, relativo al pivote y en fracciones de size: la calabaza y la bombilla.
export const MATE_OUTLINE: number[] = [
  ...Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return [Math.cos(a) * 0.5, Math.sin(a) * 0.5];
  }).flat(),
  -0.04, 0.6, 0.04, 0.6, -0.048, 0.92, 0.048, 0.92,
];
export const MATE_OUTLINE_POINTS = MATE_OUTLINE.length / 2;

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
      { translateX: pose.x.value - size / 2 + dx },
      { translateY: pose.y.value - TOP * size + dy },
      { rotate: `${pose.rot.value}deg` },
      { scaleX: pose.sx.value },
      { scaleY: pose.sy.value },
    ],
  }));
}

const BOMBILLA = 'M-3.6 14 L3.6 14 L4.9 86 Q4.9 92 0 92 Q-4.9 92 -4.9 86 Z';
const VIEWBOX = `-50 ${-TOP * 100} 100 ${BOX_H * 100}`;

function Box({ size, pose, dx, dy, children }: { size: number; pose: Pose; dx?: number; dy?: number; children: React.ReactNode }) {
  const style = usePoseStyle(size, pose, dx, dy);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.box, { width: size, height: size * BOX_H, transformOrigin: `${size / 2}px ${TOP * size}px 0px` }, style]}
    >
      <Svg width={size} height={size * BOX_H} viewBox={VIEWBOX}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Sombra suave sobre la yerba, corrida hacia abajo y a la derecha. */
export function MateShadow({ size, pose }: { size: number; pose: Pose }) {
  return (
    <Box size={size} pose={pose} dx={size * 0.06} dy={size * 0.09}>
      <Circle r={53} fill="#141a04" fillOpacity={0.14} />
      <Circle r={50.5} fill="#141a04" fillOpacity={0.2} />
      <Path d={BOMBILLA} fill="#141a04" fillOpacity={0.28} />
    </Box>
  );
}

export function Mate({ size, pose }: { size: number; pose: Pose }) {
  const tex = useMemo(() => {
    const inside = (x: number, y: number) => x * x + y * y < 35 * 35;
    const dry = leafPaths({ x: -36, y: -36, w: 72, h: 72, inside }, 700, 0.8, 2.6, 3, 5);
    const rand = mulberry32(17);
    const bubbles: { x: number; y: number; r: number }[] = [];
    while (bubbles.length < 46) {
      const x = (rand() - 0.5) * 66;
      const y = 6 + rand() * 30;
      if (x * x + y * y < 33 * 33) bubbles.push({ x, y, r: 0.5 + rand() * rand() * 2.2 });
    }
    return { dry, bubbles };
  }, []);

  return (
    <Box size={size} pose={pose}>
      <Defs>
        <RadialGradient id="calabaza" cx="45%" cy="40%" r="60%">
          <Stop offset="0" stopColor="#6a4a33" />
          <Stop offset="1" stopColor="#24170f" />
        </RadialGradient>
        <LinearGradient id="virola" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f5f4f0" />
          <Stop offset="0.45" stopColor="#bdbab3" />
          <Stop offset="0.8" stopColor="#6c6964" />
          <Stop offset="1" stopColor="#9d9a93" />
        </LinearGradient>
        <LinearGradient id="bombilla" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#7a705c" />
          <Stop offset="0.35" stopColor="#efe6cc" />
          <Stop offset="0.7" stopColor="#b3a585" />
          <Stop offset="1" stopColor="#6e6450" />
        </LinearGradient>
        <RadialGradient id="hondo" cx="40%" cy="35%" r="65%">
          <Stop offset="0.6" stopColor="#000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000" stopOpacity={0.45} />
        </RadialGradient>
        <ClipPath id="boca">
          <Circle r={35.6} />
        </ClipPath>
      </Defs>

      {/* Calabaza y virola de metal */}
      <Circle r={50} fill="url(#calabaza)" />
      <Circle r={46.5} fill="url(#virola)" />
      <Path d="M-41.5 -14.5 A44 44 0 0 1 -14.5 -41.5" stroke="#fff" strokeOpacity={0.75} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Circle r={38.2} fill="#55534e" />
      <Circle r={37} fill="#d6d3cc" />

      {/* Yerba: seca arriba, mojada con espumita abajo */}
      <G clipPath="url(#boca)">
        <Circle r={36} fill="#9aa257" />
        <Path d={tex.dry[0]} fill="#c5c98c" />
        <Path d={tex.dry[1]} fill="#717c34" />
        <Path d={tex.dry[2]} fill="#b0b46a" />
        <Path d="M-40 6 C-26 0 -12 9 2 4 S26 -2 40 5 L40 40 L-40 40 Z" fill="#4c4520" />
        <Path d="M-40 6 C-26 0 -12 9 2 4 S26 -2 40 5" stroke="#d9cf9e" strokeOpacity={0.55} strokeWidth={1.4} fill="none" />
        {tex.bubbles.map((b, i) => (
          <Circle key={i} cx={b.x} cy={b.y} r={b.r} fill="#e8dfb6" fillOpacity={0.35} stroke="#f3ecd0" strokeOpacity={0.6} strokeWidth={0.4} />
        ))}
        <Circle r={36} fill="url(#hondo)" />
      </G>

      {/* Bombilla: entra en la yerba mojada y sale por el borde */}
      <Ellipse cx={0.6} cy={14.6} rx={6.4} ry={3} fill="#1e1a0c" fillOpacity={0.6} />
      <Path d={BOMBILLA} fill="#000" fillOpacity={0.25} transform="translate(1.6 1.4)" />
      <Path d={BOMBILLA} fill="url(#bombilla)" stroke="#4d4537" strokeWidth={0.6} />
      <Path d="M-1.3 16 L-1.6 88" stroke="#fffbea" strokeOpacity={0.7} strokeWidth={0.9} strokeLinecap="round" />
    </Box>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, top: 0 },
});
