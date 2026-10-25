import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

export const RIPPLE_COUNT = 26;

export type Ripple = { x: number; y: number; t0: number; s: number; seed: number; alive: boolean };

export const emptyRipples = (): Ripple[] =>
  Array.from({ length: RIPPLE_COUNT }, () => ({ x: 0, y: 0, t0: 0, s: 0, seed: 0, alive: false }));

const AnimatedPath = Animated.createAnimatedComponent(Path);
const EMPTY = 'M0 0';

/** Anillo levemente ondulado (no un círculo perfecto, para que parezca líquido y no un radar). */
function wavyRing(cx: number, cy: number, r: number, amp: number, phase: number): string {
  'worklet';
  const n = 40;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + amp * (0.6 * Math.sin(5 * a + phase) + 0.4 * Math.sin(3 * a - phase * 1.3));
    const x = cx + Math.cos(a) * r * k;
    const y = cy + Math.sin(a) * r * k;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d + 'Z';
}

function rippleState(r: Ripple, now: number) {
  'worklet';
  const life = 1.4 + 0.7 * r.s;
  const age = now - r.t0;
  if (!r.alive || age < 0 || age > life) return null;
  const p = age / life;
  // Se expande rápido y después frena (curva exponencial), y se desvanece a medida que crece.
  const radius = 6 + (26 + 64 * r.s) * (1 - Math.exp(-age * 3.4));
  const fade = r.s * Math.pow(1 - p, 1.6);
  return { radius, fade, phase: r.seed + age * 2.2, amp: 0.025 + 0.025 * r.s };
}

function RippleSlot({ index, ripples, clock }: { index: number; ripples: SharedValue<Ripple[]>; clock: SharedValue<number> }) {
  const rimProps = useAnimatedProps(() => {
    const st = rippleState(ripples.value[index], clock.value);
    if (!st) return { d: EMPTY, strokeOpacity: 0, strokeWidth: 0 };
    const r = ripples.value[index];
    return {
      d: wavyRing(r.x, r.y, st.radius, st.amp, st.phase),
      strokeOpacity: Math.min(1, st.fade * 0.95),
      strokeWidth: 1.2 + 0.9 * r.s,
    };
  });
  const bandProps = useAnimatedProps(() => {
    const st = rippleState(ripples.value[index], clock.value);
    if (!st) return { d: EMPTY, strokeOpacity: 0, strokeWidth: 0 };
    const r = ripples.value[index];
    const inner = Math.max(2, st.radius - 3.5 - 2 * r.s);
    return {
      d: wavyRing(r.x, r.y, inner, st.amp, st.phase),
      strokeOpacity: st.fade * 0.38,
      strokeWidth: 3 + 3.5 * r.s,
    };
  });
  return (
    <>
      <AnimatedPath animatedProps={bandProps} fill="none" stroke="#1a2205" strokeLinejoin="round" />
      <AnimatedPath animatedProps={rimProps} fill="none" stroke="#f7f3cf" strokeLinejoin="round" />
    </>
  );
}

export default function Ripples({ width, height, ripples, clock }: { width: number; height: number; ripples: SharedValue<Ripple[]>; clock: SharedValue<number> }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: RIPPLE_COUNT }, (_, i) => (
        <RippleSlot key={i} index={i} ripples={ripples} clock={clock} />
      ))}
    </Svg>
  );
}
