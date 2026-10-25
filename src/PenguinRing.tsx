import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { PENGUIN } from './theme';
import { Carpintero, Castor, LeonMarino, Trucha } from './characters';

// Último golpe del mate (contra un pingüino o un borde): el saltito se contagia desde ahí.
export type Hit = { t: number; s: number; x: number; y: number };
export const emptyHit = (): Hit => ({ t: -10, s: 0, x: 0, y: 0 });

// Quién está en cada lugar de la ronda. Medidas de cada dibujo, en fracciones del lado:
// `top` hasta dónde llega arriba, `foot` dónde apoya, `r` radio del cuerpo para los choques
// y `dy` cuánto más abajo del centro está ese cuerpo.
type Who = 'fueguino' | 'carpintero' | 'castor' | 'trucha' | 'leon';
const SHAPE: Record<Who, { top: number; foot: number; r: number; dy: number }> = {
  fueguino: { top: 0.07, foot: 0.93, r: 0.36, dy: 0.03 },
  carpintero: { top: 0.05, foot: 0.97, r: 0.34, dy: 0.08 },
  castor: { top: 0.13, foot: 0.95, r: 0.36, dy: 0.06 },
  trucha: { top: 0.06, foot: 0.95, r: 0.34, dy: 0.02 },
  leon: { top: 0.11, foot: 0.97, r: 0.38, dy: 0.08 },
};
const ART: Record<Exclude<Who, 'fueguino'>, React.ComponentType<{ size?: number }>> = {
  carpintero: Carpintero,
  castor: Castor,
  trucha: Trucha,
  leon: LeonMarino,
};
const JUMP_TIME = 0.42; // s que dura el saltito
const WAVE_SPEED = 700; // px/s con que el saltito se contagia a los vecinos

export type Spot = {
  who: Who; x: number; y: number; size: number; rot: number; flip: number; phase: number;
  // Círculo del cuerpo, para los choques con el mate
  cx: number; cy: number; r: number;
};

// La ronda de mateada, puesta a mano: [quién, x (fracción del ancho), dónde, escala, giro, espejado].
// 'arriba' apoya la cabeza contra el borde de arriba, 'abajo' se sienta sobre el botón y
// un número es la altura del centro como fracción del alto disponible.
type Place = [Who, number, 'arriba' | 'abajo' | number, number, number, 1 | -1];
// Reparto parejo: 4 Fueguinos (el protagonista) y 2 de cada uno de los demás, sin dos iguales al lado.
const RONDA: Place[] = [
  ['fueguino', 0.07, 'arriba', 1.2, 8, -1],
  ['trucha', 0.29, 'arriba', 0.78, -5, 1],
  ['castor', 0.6, 'arriba', 0.86, 4, 1],
  ['carpintero', 0.86, 'arriba', 1.05, -6, 1],
  ['leon', 0.95, 0.36, 1.1, -7, 1],
  ['fueguino', 0.95, 0.62, 0.85, -4, 1],
  ['carpintero', 0.03, 0.44, 1.05, 8, 1],
  ['fueguino', 0.05, 0.71, 0.84, 4, -1],
  ['castor', 0.12, 'abajo', 1.25, 4, 1],
  ['fueguino', 0.36, 'abajo', 0.8, -3, -1],
  ['trucha', 0.58, 'abajo', 0.8, 5, 1],
  ['leon', 0.88, 'abajo', 1.2, -5, -1],
];

/** Ubica la ronda entre `top` (debajo de la barra de estado) y `bottom` (el borde de arriba del botón). */
export function ronda(width: number, top: number, bottom: number): Spot[] {
  const p = Math.min(width * 0.2, 96);
  return RONDA.map(([who, fx, where, k, rot, flip], i) => {
    const size = p * k;
    const sh = SHAPE[who];
    const x = fx * width;
    const y =
      where === 'arriba' ? top + (0.5 - sh.top - 0.04) * size :
      where === 'abajo' ? bottom - 4 - (sh.foot - 0.5) * size :
      top + where * (bottom - top);
    return { who, x, y, size, rot, flip, phase: i * 1.7, cx: x, cy: y + sh.dy * size, r: sh.r * size };
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
  if (spot.who === 'fueguino') {
    return <Animated.Image source={PENGUIN} style={[styles.penguin, { width: spot.size, height: spot.size }, style]} />;
  }
  const Art = ART[spot.who];
  return (
    <Animated.View style={[styles.penguin, { width: spot.size, height: spot.size }, style]}>
      <Art size={spot.size} />
    </Animated.View>
  );
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
