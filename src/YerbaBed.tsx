import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, G, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { causticPath } from './caustics';
import { leafPaths, stemPath } from './yerba';

type Size = { width: number; height: number };

const LEAF_COLORS = ['#62702f', '#76843c', '#8b984d', '#a0a961'];
const TILE = 200; // la textura es un mosaico que se repite (liviano para el celular)
// Cada hoja que asoma por un borde del mosaico se repite del lado opuesto, así no se ven las uniones
const WRAP = [[0, 0], [-TILE, 0], [0, -TILE], [-TILE, -TILE]];

/** Fondo de yerba (queda por debajo de la luz y del agua): base verde, hojitas, palitos y brillo al centro. */
export function YerbaBed({ width, height }: Size) {
  const tex = useMemo(() => {
    const area = { x: 0, y: 0, w: TILE, h: TILE };
    const n = Math.round((TILE * TILE) / 22);
    return {
      leaves: leafPaths(area, n, 1.4, 5.5, LEAF_COLORS.length, 11),
      fine: leafPaths(area, Math.round(n * 0.7), 0.6, 1.6, 2, 29),
      stems: stemPath(area, Math.round(n / 150), 5, 13, 47),
    };
  }, []);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="yerba" patternUnits="userSpaceOnUse" x={0} y={0} width={TILE} height={TILE}>
          {WRAP.map(([dx, dy]) => (
            <G key={`${dx},${dy}`} transform={`translate(${dx} ${dy})`}>
              {tex.leaves.map((d, i) => (
                <Path key={i} d={d} fill={LEAF_COLORS[i]} />
              ))}
              <Path d={tex.fine[0]} fill="#c4c48c" fillOpacity={0.6} />
              <Path d={tex.fine[1]} fill="#4f5b24" fillOpacity={0.8} />
              <Path d={tex.stems} stroke="#cdbd8a" strokeWidth={1.3} strokeLinecap="round" strokeOpacity={0.8} />
            </G>
          ))}
        </Pattern>
        <RadialGradient id="luz" cx="50%" cy="45%" r="70%">
          <Stop offset="0" stopColor="#e9e2a0" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#3b4716" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="#6c7a36" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#yerba)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#luz)" />
    </Svg>
  );
}

/** Red de luz sobre la yerba mojada, en dos capas que se desplazan y respiran a distinto ritmo. */
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
          <Path d={pathB} fill="none" stroke="#e3ee86" strokeOpacity={0.14} strokeWidth={10} strokeLinejoin="round" />
          <Path d={pathB} fill="none" stroke="#f4f7c4" strokeOpacity={0.5} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, styleA]}>
        <Svg width={w} height={h}>
          <Path d={pathA} fill="none" stroke="#ecf59c" strokeOpacity={0.16} strokeWidth={8} strokeLinejoin="round" />
          <Path d={pathA} fill="none" stroke="#fcffe2" strokeOpacity={0.72} strokeWidth={1.4} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Capa de agua del mate: tinte verde dorado por encima de la yerba y la luz, más hondo en los bordes. */
export function YerbaTint({ width, height }: Size) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="tinte" cx="50%" cy="45%" r="75%">
          <Stop offset="0" stopColor="#d6dc78" stopOpacity={0.08} />
          <Stop offset="0.7" stopColor="#4a5a14" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#141b02" stopOpacity={0.5} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="#8f9c2c" fillOpacity={0.14} />
      <Rect x={0} y={0} width={width} height={height} fill="url(#tinte)" />
    </Svg>
  );
}
