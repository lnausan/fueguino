import React, { useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import { C, DRINKS, DrinkKind, F } from '../theme';
import { CloseIcon, RoundBtn, useLoop } from './kit';
import { haptic, play, sip } from '../sound';

const W = 220;
const H = 250;
const TOP = 52; // nivel lleno
const BOTTOM = 236; // nivel vacío

// Cantidades por bebida: el mate y el tereré se toman de un termo, el cocido en taza, el agua en vaso o botella.
const SIZES: Record<DrinkKind, { max: number; step: number; start: number; chips: { ml: number; label: string }[] }> = {
  amargo: { max: 1500, step: 50, start: 500, chips: [{ ml: 500, label: 'Medio termo' }, { ml: 1000, label: 'Termo' }, { ml: 1500, label: 'Termo grande' }] },
  dulce: { max: 1500, step: 50, start: 500, chips: [{ ml: 500, label: 'Medio termo' }, { ml: 1000, label: 'Termo' }, { ml: 1500, label: 'Termo grande' }] },
  terere: { max: 2000, step: 50, start: 1000, chips: [{ ml: 500, label: 'Medio termo' }, { ml: 1000, label: 'Termo' }, { ml: 2000, label: 'Jarra' }] },
  cocido: { max: 600, step: 10, start: 250, chips: [{ ml: 200, label: 'Taza' }, { ml: 300, label: 'Tazón' }, { ml: 450, label: 'Jarro' }] },
  agua: { max: 1000, step: 10, start: 250, chips: [{ ml: 250, label: 'Vaso' }, { ml: 500, label: 'Botella' }, { ml: 1000, label: 'Botella de 1 L' }] },
};
const AnimatedG = Animated.createAnimatedComponent(G);

const GOURD = 'M30 40 C14 140 50 240 110 240 C170 240 206 140 190 40 Z';
const GLASS = 'M28 34 L192 34 L174 236 Q172 246 162 246 L58 246 Q48 246 46 236 Z';

/** Recipiente con el nivel arrastrable con el dedo. */
export default function Vessel({ kind, unit, onAdd, onClose }: { kind: DrinkKind; unit: 'ml' | 'oz'; onAdd: (ml: number) => void; onClose: () => void }) {
  const k = DRINKS[kind];
  const { max: MAX, step, start, chips } = SIZES[kind];
  const [amount, setAmount] = useState(start);
  const level = useSharedValue(start / MAX);
  const wave = useLoop(1600);

  // Sorbos de bombilla mientras sube el nivel: uno detrás del otro (no se pisan) mientras el dedo
  // sigue subiendo. El tono sube apenas a medida que se llena (en el celular).
  const sipAt = useRef(0);
  const sipNow = (fill: number) => {
    const now = Date.now();
    if (now - sipAt.current < 420) return;
    sipAt.current = now;
    sip(0.6, 0.94 + 0.14 * fill);
  };

  const last = useRef(start);
  const setFromY = (yLocal: number) => {
    const p = Math.max(0, Math.min(1, (BOTTOM - yLocal) / (BOTTOM - TOP)));
    const ml = Math.max(step, Math.round((p * MAX) / step) * step);
    if (ml !== last.current) {
      if (ml > last.current) sipNow(ml / MAX);
      if (Math.floor(ml / 100) !== Math.floor(last.current / 100)) haptic.tap(); // un tic cada 100 ml
      last.current = ml;
    }
    level.value = ml / MAX;
    setAmount(ml);
  };
  const onTouch = (e: GestureResponderEvent) => setFromY(e.nativeEvent.locationY);
  const pick = (ml: number) => {
    haptic.tap();
    if (ml > amount) sipNow(ml / MAX);
    else play('pop', 0.3);
    last.current = ml;
    level.value = withTiming(ml / MAX, { duration: 350 });
    setAmount(ml);
  };

  const liquid = useAnimatedProps(() => ({ translateY: TOP + (1 - level.value) * (BOTTOM - TOP) - 6 }));
  const waveX = useAnimatedProps(() => ({ translateX: -wave.value * 100 }));
  const handle = useAnimatedStyle(() => ({ transform: [{ translateY: TOP + (1 - level.value) * (BOTTOM - TOP) - 17 }] }));

  const conv = (ml: number) => (unit === 'oz' ? Math.round(ml / 29.57) : ml);
  const shape = k.shape === 'gourd' ? GOURD : GLASS;

  return (
    <Animated.View entering={SlideInDown.duration(380)} style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]}>
      <View style={{ position: 'absolute', right: 16, top: 56 }}>
        <RoundBtn label="Cerrar" onPress={onClose}><CloseIcon /></RoundBtn>
      </View>

      <View style={{ alignItems: 'center', marginTop: 130 }}>
        <View
          style={{ width: W, height: H }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={onTouch}
          onResponderMove={onTouch}
          accessibilityRole="adjustable"
          accessibilityLabel={`Cantidad: ${conv(amount)} ${unit}`}
        >
          <Svg width={W} height={H} pointerEvents="none" style={{ overflow: 'visible' }}>
            <Defs><ClipPath id="vessel"><Path d={shape} /></ClipPath></Defs>
            {k.shape === 'mug' && <Path d="M188 80 Q246 78 242 140 Q238 196 180 190" fill="none" stroke={k.color} strokeWidth={20} strokeLinecap="round" />}
            {k.shape !== 'mug' && <Path d="M150 -6 L122 120" stroke={C.ink} strokeWidth={11} strokeLinecap="round" />}
            {k.shape !== 'mug' && <Path d="M150 -6 L122 120" stroke="#D3D7DC" strokeWidth={5} strokeLinecap="round" />}
            <Path d={shape} fill="#EDE7DC" />
            <G clipPath="url(#vessel)">
              <AnimatedG animatedProps={liquid}>
                <AnimatedG animatedProps={waveX}>
                  <Path d="M-10 6 Q2.5 0 15 6 T40 6 T65 6 T90 6 T115 6 T140 6 T165 6 T190 6 T215 6 T240 6 T265 6 T290 6 T315 6 T340 6 L340 300 L-10 300 Z" fill={k.color} />
                </AnimatedG>
                {kind === 'terere' && <Rect x={70} y={12} width={24} height={24} rx={6} fill="#fff" opacity={0.8} />}
                {kind === 'terere' && <Rect x={122} y={18} width={20} height={20} rx={5} fill="#fff" opacity={0.8} />}
              </AnimatedG>
            </G>
            {k.shape === 'gourd' && <Ellipse cx={110} cy={40} rx={80} ry={12} fill="none" stroke="#C9CDD3" strokeWidth={6} />}
          </Svg>
          <Animated.View pointerEvents="none" style={[styles.handle, handle]}>
            <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M6 9 L12 3 L18 9 M6 15 L12 21 L18 15" fill="none" stroke={k.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Animated.View>
        </View>

        <Text style={styles.amount}>{conv(amount).toLocaleString('es-AR')}<Text style={{ fontSize: 22 }}> {unit}</Text></Text>
        <Text style={styles.caption}>{k.caption}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {chips.map(({ ml, label }) => (
            <Pressable key={ml} onPress={() => pick(ml)} style={[styles.chip, { backgroundColor: amount === ml ? k.tint : C.sand }]}>
              <Text style={{ fontFamily: F.heavy, fontSize: 13, color: amount === ml ? k.ink : '#4A423C' }}>{label}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 12, color: amount === ml ? k.ink : C.soft }}>{conv(ml).toLocaleString('es-AR')} {unit}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.caption, { marginTop: 14, color: C.soft, fontSize: 13 }]}>Arrastrá el nivel para ajustar</Text>
      </View>

      <View style={styles.bottom}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: k.tint }} />
        <Pressable onPress={() => { play('sorbo'); haptic.bump(0.5); onAdd(amount); }} style={({ pressed }) => [styles.add, { backgroundColor: k.ink, transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
          <Text style={{ fontFamily: F.black, fontSize: 16, color: '#fff', letterSpacing: 1 }}>+ {k.short}</Text>
        </Pressable>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: k.tint }} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  handle: { position: 'absolute', left: W / 2 - 17, top: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center' },
  amount: { fontFamily: F.title, fontSize: 44, color: C.ink, marginTop: 22 },
  caption: { fontFamily: F.body, fontSize: 14, color: C.muted, marginTop: 4 },
  chip: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', left: 24, right: 24, bottom: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  add: { height: 56, paddingHorizontal: 40, borderRadius: 999, justifyContent: 'center' },
});
