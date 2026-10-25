import React, { useEffect } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
  Easing, SharedValue, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { C, F, initials } from '../theme';
import { silhouettePath } from './silhouette';

/** Valor 0→1 que se repite en bucle (reloj de animación). */
export function useLoop(ms: number, delay = 0) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1, false));
  }, []);
  return v;
}

/** Flota suavemente arriba/abajo (y opcionalmente gira un poco). */
export function Bob({ children, amp = 8, ms = 2800, rot = 0, style }: { children: React.ReactNode; amp?: number; ms?: number; rot?: number; style?: StyleProp<ViewStyle> }) {
  const t = useLoop(ms);
  const s = useAnimatedStyle(() => {
    const a = Math.sin(t.value * Math.PI * 2);
    return { transform: [{ translateY: -amp * a }, { rotate: `${rot * a}deg` }] };
  });
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

/** Pulso tipo latido (para botones que invitan a tocarse). */
export function Pulse({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useLoop(1600);
  const ring = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - t.value), transform: [{ scale: 0.9 + t.value * 0.8 }] }));
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 999, backgroundColor: '#CFE3B4' }, ring]} />
      {children}
    </View>
  );
}

export function Pill({ label, onPress, dark = true, style, color, textColor }: { label: string; onPress?: () => void; dark?: boolean; style?: StyleProp<ViewStyle>; color?: string; textColor?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: color ?? (dark ? C.ink : C.bg), transform: [{ scale: pressed ? 0.96 : 1 }] },
        style,
      ]}
    >
      <Text style={[styles.pillText, { color: textColor ?? (dark ? C.bg : C.tealDark) }]}>{label}</Text>
    </Pressable>
  );
}

export function LinkText({ label, onPress, color = C.teal }: { label: string; onPress?: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10} style={{ height: 44, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontFamily: F.black, fontSize: 14, color, letterSpacing: 0.5 }}>{label}</Text>
    </Pressable>
  );
}

export function RoundBtn({ onPress, label, children, bg = C.sand }: { onPress?: () => void; label: string; children: React.ReactNode; bg?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.round, { backgroundColor: bg, opacity: pressed ? 0.7 : 1 }]}>
      {children}
    </Pressable>
  );
}

export const BackIcon = ({ color = C.ink }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M15 5 L8 12 L15 19" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const CloseIcon = ({ color = C.ink }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" /></Svg>
);
export const CheckIcon = ({ size = 14, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M5 12.5 L10 17 L19 7" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
export const LockIcon = ({ size = 14, color = C.soft }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={5} y={11} width={14} height={10} rx={2} /><Path d="M8 11 L8 8 A4 4 0 0 1 16 8 L16 11" />
  </Svg>
);

export function Title({ children, style, size = 28 }: { children: React.ReactNode; style?: StyleProp<TextStyle>; size?: number }) {
  return <Text style={[{ fontFamily: F.title, fontSize: size, color: C.ink, textAlign: 'center', lineHeight: size * 1.15 }, style]}>{children}</Text>;
}
export function Body({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontFamily: F.body, fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 21 }, style]}>{children}</Text>;
}

/** Mate (calabaza) dibujado en código. */
export function MateIcon({ size = 40, top = C.green, body = C.brown, straw = true }: { size?: number; top?: string; body?: string; straw?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {straw && <Path d="M44 6 L35 30" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />}
      {straw && <Path d="M44 6 L35 30" stroke="#C9CDD3" strokeWidth={2.5} strokeLinecap="round" />}
      <Path d="M17 28 C13 44 20 56 32 56 C44 56 51 44 47 28 Z" fill={body} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <Ellipse cx={32} cy={28} rx={16} ry={5} fill="#B9BDC4" stroke={C.ink} strokeWidth={3} />
      <Ellipse cx={32} cy={27.5} rx={12} ry={3} fill={top} />
    </Svg>
  );
}

/** Paquete de yerba genérico (sin logos reales). */
export function PackTile({ name, color, w = 42 }: { name: string; color: string; w?: number }) {
  return (
    <Svg width={w} height={w * 1.24} viewBox="0 0 42 52">
      <Path d="M6 10 L36 10 L38 48 Q38 50 36 50 L6 50 Q4 50 4 48 Z" fill={color} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M6 10 L10 3 L32 3 L36 10 Z" fill={color} opacity={0.85} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
      <Rect x={9} y={22} width={24} height={16} rx={4} fill="#FFFDF8" />
      <SvgText x={21} y={34} textAnchor="middle" fontSize={11} fontWeight="bold" fill={C.ink}>{initials(name)}</SvgText>
    </Svg>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function wavePath(w: number, y: number, phase: number) {
  'worklet';
  let d = `M${-10} ${y}`;
  for (let x = -10; x <= w + 10; x += 10) d += ` L${x} ${(y + Math.sin(x / 18 + phase) * 4).toFixed(1)}`;
  return d + ` L${w + 10} ${y + 2000} L-10 ${y + 2000} Z`;
}

/** Una capa de líquido con superficie ondulada que se mueve. */
function Layer({ size, from, to, color, clock, grow }: { size: number; from: number; to: number; color: string; clock: SharedValue<number>; grow: SharedValue<number> }) {
  const props = useAnimatedProps(() => {
    const level = from + (to - from) * grow.value; // fracciones de alto (0 abajo)
    const y = size * (1 - level);
    return { d: grow.value <= 0.001 ? 'M0 0' : wavePath(size, y, clock.value * Math.PI * 2 + from * 9) };
  });
  return <AnimatedPath animatedProps={props} fill={color} />;
}

export type SilLayer = { color: string; from: number; to: number; grow?: SharedValue<number> };

/** Silueta gris de Fueguino que se llena con capas de colores (una por bebida). */
export function Silhouette({ size, layers, children }: { size: number; layers: SilLayer[]; children?: React.ReactNode }) {
  const clock = useLoop(2400);
  const one = useSharedValue(1);
  const d = silhouettePath(size);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id="sil"><Path d={d} /></ClipPath>
        </Defs>
        <Path d={d} fill="#E9E3D8" />
        <G clipPath="url(#sil)">
          {layers.map((l, i) => ({ l, i })).reverse().map(({ l, i }) => (
            <Layer key={i} size={size} from={l.from} to={l.to} color={l.color} clock={clock} grow={l.grow ?? one} />
          ))}
        </G>
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  pillText: { fontFamily: F.black, fontSize: 16, letterSpacing: 1 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

export { AnimatedRect, withSequence, withTiming, withRepeat, withDelay, Easing };
