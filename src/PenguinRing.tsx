import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { PENGUIN } from './theme';

// Último golpe del mate (contra un pingüino o un borde): el saltito se contagia desde ahí.
export type Hit = { t: number; s: number; x: number; y: number };
export const emptyHit = (): Hit => ({ t: -10, s: 0, x: 0, y: 0 });

// Medidas de la imagen (fracciones del lado): la cabeza llega al 7% del alto y las patas al 93%.
const HEAD = 0.43;
const BODY_R = 0.36; // radio del cuerpo para los choques
const JUMP_TIME = 0.42; // s que dura el saltito
const WAVE_SPEED = 700; // px/s con que el saltito se contagia a los vecinos

export type Spot = {
  x: number; y: number; size: number; rot: number; flip: number; phase: number;
  // Círculo del cuerpo, para los choques con el mate
  cx: number; cy: number; r: number;
};

// La ronda de mateada, puesta a mano: [x (fracción del ancho), dónde, escala, giro, espejado].
// 'arriba' apoya la cabeza contra el borde de arriba, 'abajo' se sienta sobre el botón y
// un número es la altura del centro como fracción del alto disponible.
type Place = [number, 'arriba' | 'abajo' | number, number, number, 1 | -1];
const RONDA: Place[] = [
  [0.07, 'arriba', 1.2, 8, -1],
  [0.29, 'arriba', 0.74, -5, 1],
  [0.6, 'arriba', 0.82, 4, -1],
  [0.86, 'arriba', 1.05, -7, -1],
  [0.98, 0.36, 1.1, -9, -1],
  [0.95, 0.62, 0.85, -4, 1],
  [0.02, 0.44, 1.08, 9, 1],
  [0.05, 0.71, 0.84, 4, -1],
  [0.11, 'abajo', 1.3, 6, 1],
  [0.33, 'abajo', 0.8, -3, -1],
  [0.6, 'abajo', 0.74, 5, 1],
  [0.89, 'abajo', 1.18, -7, -1],
];

/** Ubica la ronda entre `top` (debajo de la barra de estado) y `bottom` (el borde de arriba del botón). */
export function ronda(width: number, top: number, bottom: number): Spot[] {
  const p = Math.min(width * 0.2, 96);
  return RONDA.map(([fx, where, k, rot, flip], i) => {
    const size = p * k;
    const x = fx * width;
    const y =
      where === 'arriba' ? top + (HEAD - 0.04) * size :
      where === 'abajo' ? bottom - 4 - HEAD * size :
      top + where * (bottom - top);
    return { x, y, size, rot, flip, phase: i * 1.7, cx: x, cy: y + 0.03 * size, r: BODY_R * size };
  }).sort((a, b) => a.y - b.y); // los de más abajo quedan adelante
}

function Penguin({ spot, clock, hit }: { spot: Spot; clock: SharedValue<number>; hit: SharedValue<Hit> }) {
  const style = useAnimatedStyle(() => {
    const t = clock.value;
    const h = hit.value;
    const dist = Math.hypot(spot.cx - h.x, spot.cy - h.y);
    const age = t - h.t - dist / WAVE_SPEED;
    let jump = 0;
    if (age > 0 && age < JUMP_TIME) jump = h.s * Math.exp(-dist / 160) * Math.sin((age / JUMP_TIME) * Math.PI);
    const breathe = 1 + 0.025 * Math.sin(t * 1.8 + spot.phase);
    return {
      transform: [
        { translateX: spot.x - spot.size / 2 },
        { translateY: spot.y - spot.size / 2 - jump * 0.3 * spot.size },
        { rotate: `${spot.rot + 8 * jump * Math.sin(spot.phase)}deg` },
        { scaleX: spot.flip * (breathe + 0.14 * jump) },
        { scaleY: breathe + 0.14 * jump },
      ],
    };
  });
  return <Animated.Image source={PENGUIN} style={[styles.penguin, { width: spot.size, height: spot.size }, style]} />;
}

export default function PenguinRing({ spots, clock, hit }: { spots: Spot[]; clock: SharedValue<number>; hit: SharedValue<Hit> }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {spots.map((s, i) => (
        <Penguin key={i} spot={s} clock={clock} hit={hit} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  penguin: { position: 'absolute', left: 0, top: 0 },
});
