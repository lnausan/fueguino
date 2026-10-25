import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { causticPath } from './caustics';

type Size = { width: number; height: number };

/** Fondo de la piscina: azul oscuro con azulejos (queda por debajo de la luz y del agua). */
export function PoolFloor({ width, height }: Size) {
  const tile = 36;
  const lines = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let x = 0; x <= width + tile; x += tile) out.push({ x1: x, y1: 0, x2: x, y2: height });
    for (let y = 0; y <= height + tile; y += tile) out.push({ x1: 0, y1: y, x2: width, y2: y });
    return out;
  }, [width, height]);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height} fill="#06304f" />
      {lines.map((l, i) => (
        <Line key={i} {...l} stroke="#0c4a74" strokeWidth={1.4} strokeOpacity={0.7} />
      ))}
    </Svg>
  );
}

/** Red de luz del sol en el fondo, en dos capas que se desplazan y respiran a distinto ritmo. */
export function Caustics({ width, height, clock }: Size & { clock: SharedValue<number> }) {
  const margin = 60;
  const w = width + margin * 2;
  const h = height + margin * 2;
  const pathA = useMemo(() => causticPath(w, h, 66, 7), [w, h]);
  const pathB = useMemo(() => causticPath(w, h, 94, 23), [w, h]);

  const styleA = useAnimatedStyle(() => {
    const t = clock.value;
    return {
      opacity: 0.8 + 0.2 * Math.sin(t * 0.9),
      transform: [
        { translateX: -margin + 14 * Math.sin(t * 0.31) },
        { translateY: -margin + 10 * Math.cos(t * 0.23) },
        { scale: 1 + 0.025 * Math.sin(t * 0.41) },
        { rotate: `${1.2 * Math.sin(t * 0.17)}deg` },
      ],
    };
  });
  const styleB = useAnimatedStyle(() => {
    const t = clock.value;
    return {
      opacity: 0.45 + 0.2 * Math.sin(t * 0.7 + 1.3),
      transform: [
        { translateX: -margin - 12 * Math.sin(t * 0.27 + 1) },
        { translateY: -margin + 13 * Math.sin(t * 0.21) },
        { scale: 1.04 + 0.03 * Math.cos(t * 0.33) },
        { rotate: `${-1.5 * Math.sin(t * 0.13)}deg` },
      ],
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, styleB]}>
        <Svg width={w} height={h}>
          <Path d={pathB} fill="none" stroke="#5fd4f5" strokeOpacity={0.16} strokeWidth={10} strokeLinejoin="round" />
          <Path d={pathB} fill="none" stroke="#b8f4ff" strokeOpacity={0.55} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, styleA]}>
        <Svg width={w} height={h}>
          <Path d={pathA} fill="none" stroke="#7fe6ff" strokeOpacity={0.18} strokeWidth={8} strokeLinejoin="round" />
          <Path d={pathA} fill="none" stroke="#e4fdff" strokeOpacity={0.8} strokeWidth={1.4} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Capa de agua: tinte azul por encima del fondo y la luz, con bordes un poco más profundos. */
export function WaterTint({ width, height }: Size) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="deep" cx="50%" cy="45%" r="75%">
          <Stop offset="0" stopColor="#1fa3d6" stopOpacity={0.1} />
          <Stop offset="0.7" stopColor="#0b5d8e" stopOpacity={0.25} />
          <Stop offset="1" stopColor="#021c33" stopOpacity={0.55} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="#1b8cc4" fillOpacity={0.18} />
      <Rect x={0} y={0} width={width} height={height} fill="url(#deep)" />
    </Svg>
  );
}
