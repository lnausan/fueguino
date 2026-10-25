import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, ZoomIn, Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, DRINKS, DrinkKind, F, PENGUIN } from '../theme';
import { useStore } from '../store';
import { Bob, MateIcon, RoundBtn, Silhouette, SilLayer } from '../ui/kit';
import Vessel from '../ui/Vessel';

const KINDS: DrinkKind[] = ['amargo', 'dulce', 'terere', 'cocido', 'agua'];

function DrinkIcon({ kind }: { kind: DrinkKind }) {
  const k = DRINKS[kind];
  if (k.shape === 'gourd') return <MateIcon size={50} top={k.color} />;
  if (k.shape === 'mug')
    return (
      <Svg width={50} height={50} viewBox="0 0 64 64">
        <Path d="M10 22 L46 22 L43 58 Q42 64 36 64 L20 64 Q14 64 13 58 Z" fill={k.color} stroke={C.ink} strokeWidth={3} />
        <Path d="M46 29 Q57 29 56 39 Q55 48 44 47" fill="none" stroke={C.ink} strokeWidth={3} />
      </Svg>
    );
  return (
    <Svg width={50} height={50} viewBox="0 0 64 70">
      <Path d="M14 16 L50 16 L45 64 L19 64 Z" fill="#F2F6F7" />
      <Path d="M16 30 L48 30 L45 64 L19 64 Z" fill={k.color} />
      <Path d="M14 16 L50 16 L45 64 L19 64 Z" fill="none" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}

export function Home() {
  const { go, drinks, addDrink, goal, unit } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 100, 290);
  const [open, setOpen] = useState<DrinkKind | null>(null);
  const [pop, setPop] = useState<{ id: number; text: string; color: string } | null>(null);
  const [chOpen, setChOpen] = useState(true);
  const growNew = useSharedValue(1);

  const total = drinks.reduce((a, d) => a + d.amount, 0);
  const pct = Math.round((total / goal) * 100);
  const layers: SilLayer[] = useMemo(() => {
    let acc = 0;
    return drinks.map((d, i) => {
      const from = Math.min(1, acc / goal);
      acc += d.amount;
      const to = Math.min(1.04, acc / goal);
      return { color: DRINKS[d.kind].color, from, to, grow: i === drinks.length - 1 ? growNew : undefined };
    });
  }, [drinks, goal]);

  const conv = (ml: number) => (unit === 'oz' ? Math.round(ml / 29.57) : ml);
  const challenges = [
    { title: 'Ruta de la yerba', kicker: 'DESAFÍO · 26 MARCAS', text: 'Probá y puntuá yerbas. Las primeras 3 son gratis.', bg: C.navy, tag: 'NUEVO', link: true },
    { title: 'Último mate a las 18', kicker: 'DESAFÍO DE 10 DÍAS', text: 'Cortá la cafeína a tiempo y dormí mejor.', bg: '#6B3F22', tag: 'PRONTO', link: false },
    { title: 'Semana de tereré', kicker: 'DESAFÍO DE 7 DÍAS', text: 'Un tereré bien frío en los días de sol.', bg: '#3F7A2A', tag: 'PRONTO', link: false },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.streak}><Text style={{ fontFamily: F.title, color: '#fff', fontSize: 17 }}>{Math.max(1, drinks.length > 0 ? 1 : 0)}</Text></View>
          <RoundBtn label="Ajustes">
            <Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M4 7 L20 7 M4 12 L20 12 M4 17 L20 17" stroke="#4A423C" strokeWidth={2.4} strokeLinecap="round" /></Svg>
          </RoundBtn>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Animated.Text key={total} entering={FadeInDown.springify()} style={styles.total}>
            {conv(total).toLocaleString('es-AR')} {unit}
          </Animated.Text>
          <Text style={{ fontFamily: F.heavy, fontSize: 13, color: C.muted }}>Agua para mate · {pct}% de tu meta</Text>
          {pop && (
            <Animated.Text key={pop.id} entering={ZoomIn} exiting={FadeOutUp.duration(900)} style={[styles.pop, { color: pop.color }]}>{pop.text}</Animated.Text>
          )}
          <View style={{ marginTop: 6 }}>
            <Silhouette size={size} layers={layers}>
              {total >= goal && <Animated.Image entering={ZoomIn.springify()} source={PENGUIN} style={[StyleSheet.absoluteFill, { width: size, height: size }]} />}
            </Silhouette>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 4, paddingVertical: 8 }}>
          {KINDS.map((k) => (
            <Pressable key={k} accessibilityLabel={`Agregar ${DRINKS[k].name}`} onPress={() => setOpen(k)} style={({ pressed }) => [styles.bev, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
              <View>
                <DrinkIcon kind={k} />
                <View style={styles.plus}><Text style={{ fontFamily: F.black, fontSize: 12, color: C.ink, lineHeight: 14 }}>+</Text></View>
              </View>
              <Text style={styles.bevLabel}>{DRINKS[k].short}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 18, gap: 12 }}>
          <Pressable onPress={() => setChOpen((x) => !x)} style={styles.chPill}>
            <Text style={{ fontFamily: F.black, color: '#7A4A0C', fontSize: 15 }}>🏆 3 desafíos materos {chOpen ? '▴' : '▾'}</Text>
          </Pressable>
          <Text style={{ textAlign: 'center', fontFamily: F.heavy, fontSize: 13, color: C.muted }}>Hábitos diarios 0/3</Text>
          {chOpen &&
            challenges.map((c, i) => (
              <Animated.View key={c.title} entering={FadeInDown.delay(i * 80)}>
                <Pressable disabled={!c.link} onPress={() => go('yerbas')} style={({ pressed }) => [styles.chCard, { backgroundColor: c.bg, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <Text style={styles.chKicker}>{c.kicker}</Text>
                  <Text style={styles.chTitle}>{c.title}</Text>
                  <Text style={styles.chText}>{c.text}</Text>
                  <Text style={[styles.chTag, c.link && { backgroundColor: '#F2B544', color: C.ink }]}>{c.tag}</Text>
                  <Bob amp={6} ms={3000} rot={3} style={{ position: 'absolute', right: -6, bottom: -34 }}>
                    <Image source={PENGUIN} style={{ width: 120, height: 120 }} />
                  </Bob>
                </Pressable>
              </Animated.View>
            ))}
        </View>
      </ScrollView>

      {open && (
        <Vessel kind={open} unit={unit} onClose={() => setOpen(null)}
          onAdd={(ml) => {
            growNew.value = 0;
            addDrink({ kind: open, amount: ml });
            growNew.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
            setPop({ id: Date.now(), text: `+${conv(ml)}`, color: DRINKS[open].ink });
            setOpen(null);
          }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 },
  streak: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2BA4B0', borderWidth: 3, borderColor: '#CDEDF0', alignItems: 'center', justifyContent: 'center' },
  total: { fontFamily: 'Fredoka_700Bold', fontSize: 46, color: C.tealBright },
  pop: { position: 'absolute', right: 70, top: 6, fontFamily: 'Fredoka_700Bold', fontSize: 22 },
  bev: { width: 68, alignItems: 'center', gap: 4 },
  plus: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', borderWidth: 2.5, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  bevLabel: { fontFamily: 'Nunito_900Black', fontSize: 10, color: C.muted, letterSpacing: 0.6 },
  chPill: { height: 48, borderRadius: 99, backgroundColor: '#FCEFD3', alignItems: 'center', justifyContent: 'center' },
  chCard: { height: 112, borderRadius: 22, padding: 16, overflow: 'hidden' },
  chKicker: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1, color: '#fff' },
  chTitle: { fontFamily: 'Fredoka_700Bold', fontSize: 21, color: '#fff', marginTop: 4 },
  chText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#fff', marginTop: 4, maxWidth: 190 },
  chTag: { position: 'absolute', right: 12, top: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.22)', color: '#fff', fontFamily: 'Nunito_900Black', fontSize: 10 },
});
