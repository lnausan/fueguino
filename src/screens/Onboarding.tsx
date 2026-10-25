import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeInDown, FadeInLeft, FadeInRight, FadeInUp, SlideInDown, ZoomIn,
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, DRINKS, F, FUEGUINO_SOMBRERO, PENGUIN } from '../theme';
import { useStore } from '../store';
import { LANGS, T } from '../i18n';
import { haptic, play, tap } from '../sound';
import { BackIcon, Body, Bob, CheckIcon, Clip, CloseIcon, LinkText, MateIcon, Pill, Pulse, RoundBtn, Silhouette, Title, useLoop } from '../ui/kit';
import Vessel from '../ui/Vessel';
import FillingMate from '../ui/FillingMate';

const Screen = ({ children, bg = C.bg }: { children: React.ReactNode; bg?: string }) => (
  <View style={{ flex: 1, backgroundColor: bg, overflow: 'hidden' }}>{children}</View>
);

function Skip({ onPress, light }: { onPress: () => void; light?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: 'absolute', right: 14, top: insets.top + 6, zIndex: 5 }}>
      <LinkText label="OMITIR" onPress={onPress} color={light ? '#fff' : C.soft} />
    </View>
  );
}

// ---------------------------------------------------------------- 1 · Intro
function LangPicker() {
  const { lang, setLang } = useStore();
  return (
    <View style={styles.langRow} accessibilityRole="radiogroup">
      {LANGS.map((l) => {
        const on = l.id === lang;
        return (
          <Pressable
            key={l.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => { tap(); setLang(l.id); }}
            style={({ pressed }) => [styles.langChip, on && styles.langChipOn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <Text style={[styles.langText, on && { color: C.ink }]}>{l.flag} {l.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Intro() {
  const { go, lang } = useStore();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingTop: insets.top + 50 }}>
        <Title style={{ paddingHorizontal: 24 }}>{T[lang].introTitle}</Title>
        {/* El mate se llena y, cuando se completa, aparece Fueguino */}
        <View style={{ marginTop: 24 }}>
          <FillingMate width={Math.min(width - 32, 400)} height={Math.max(220, height - insets.top - insets.bottom - 380)} />
        </View>
      </View>
      <Animated.View entering={FadeInUp.delay(400)} style={[styles.introBottom, { bottom: insets.bottom + 32 }]}>
        <LangPicker />
        <Pill label={T[lang].start} onPress={() => go('primer')} />
      </Animated.View>
    </Screen>
  );
}

// ---------------------------------------------------------------- 2 · Primer mate
export function Primer() {
  const { go, unit, setUnit, addDrink, goal } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 70, 310);
  const [stage, setStage] = useState<'empty' | 'units' | 'vessel' | 'done'>('empty');
  const [amount, setAmount] = useState(0);
  const grow = useSharedValue(0);

  const done = stage === 'done';
  const fill = Math.min(1.04, Math.max(0.08, amount / goal));

  return (
    <Screen>
      <Skip onPress={() => go('recordatorios')} />
      <View style={{ alignItems: 'center', paddingTop: insets.top + 60 }}>
        <Title>{done ? '¡Así se ve tu ronda!' : 'Cebá tu primer mate'}</Title>
        {done && (
          <Animated.Text entering={FadeIn} style={{ fontFamily: F.heavy, color: C.teal, marginTop: 6 }}>
            {unit === 'oz' ? Math.round(amount / 29.57) : amount} {unit} · {Math.round((amount / goal) * 100)}% de tu meta
          </Animated.Text>
        )}
        <View style={{ marginTop: 30 }}>
          <Silhouette size={size} layers={done ? [{ color: C.green, from: 0, to: fill, grow }] : []} />
        </View>
      </View>

      {!done && (
        <View style={[styles.center, { position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 50 }]}>
          <Pulse style={{ width: 80, height: 80 }}>
            <Pressable accessibilityLabel="Cebar un mate amargo" onPress={() => { tap(); setStage('units'); }} style={styles.mateBtn}>
              <Bob amp={4} ms={1600}><MateIcon size={46} /></Bob>
            </Pressable>
          </Pulse>
          <Text style={{ fontFamily: F.black, fontSize: 12, color: C.muted, letterSpacing: 1, marginTop: 8 }}>AMARGO</Text>
        </View>
      )}

      {done && (
        <>
          <Animated.View entering={ZoomIn.delay(800)} style={[styles.toast, { top: insets.top + 60 + 60 + size + 10 }]}>
            <Text style={{ fontFamily: F.semi, color: '#fff', fontSize: 17 }}>¡Primer mate cebado!</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(1200)} style={[styles.bottomRow, { bottom: insets.bottom + 40 }]}>
            <Pill label="CONTINUAR" onPress={() => go('recordatorios')} />
          </Animated.View>
        </>
      )}

      {stage === 'units' && (
        <>
          <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(42,37,36,0.45)' }]}>
            <Pressable style={{ flex: 1 }} onPress={() => setStage('empty')} />
          </Animated.View>
          <Animated.View entering={SlideInDown.duration(380)} style={[styles.sheet, { paddingBottom: insets.bottom + 30 }]}>
            <View style={styles.grab} />
            <Title size={22} style={{ marginVertical: 10 }}>¿En qué unidad medís el agua?</Title>
            {(['ml', 'oz'] as const).map((u) => (
              <Pill key={u} label={u === 'ml' ? 'ml (mililitros)' : 'oz (onzas)'} color={C.teal} textColor="#fff" style={{ width: 240, marginTop: 10 }}
                onPress={() => { setUnit(u); setStage('vessel'); }} />
            ))}
          </Animated.View>
        </>
      )}

      {stage === 'vessel' && (
        <Vessel kind="amargo" unit={unit} onClose={() => setStage('empty')}
          onAdd={(ml) => {
            setAmount(ml);
            addDrink({ kind: 'amargo', amount: ml });
            setStage('done');
            setTimeout(() => { play('festejo', 0.8); haptic.success(); }, 800); // aparece "¡Primer mate cebado!"
            grow.value = 0;
            grow.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
          }} />
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------- 3 · Recordatorios
const SCENES = [
  { text: '¿Unos mates? Ya es la hora', time: '10:15' },
  { text: 'Te queda medio termo', time: '15:40' },
  { text: 'Agua caliente, nunca hirviendo', time: '16:30' },
];

export function Recordatorios() {
  const { go } = useStore();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % 3), 3000);
    return () => clearInterval(id);
  }, []);
  const s = SCENES[i];

  return (
    <Screen>
      <Skip onPress={() => go('meta')} />
      <View style={{ alignItems: 'center', paddingTop: insets.top + 50, paddingHorizontal: 24 }}>
        <Title>Recordatorios amables</Title>
        <Body style={{ marginTop: 6 }}>Un aviso cuando se te pasa la hora del mate</Body>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <Animated.View key={i} entering={FadeIn.duration(600)} style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%" viewBox="0 0 318 360" preserveAspectRatio="xMidYMid slice">
              <Rect width={318} height={360} fill={i === 1 ? '#DCEFF2' : '#CDEBF0'} />
              <Path d="M0 210 L40 150 L70 176 L120 104 L160 168 L200 130 L250 180 L290 120 L318 150 L318 360 L0 360 Z" fill={i === 2 ? '#A7C1CF' : '#8FAFC0'} />
              <Path d="M120 104 L136 128 L126 124 L118 134 L108 122 Z M290 120 L304 140 L294 136 L286 144 L278 134 Z" fill="#fff" />
              {i === 1 && <>
                <Rect x={18} y={170} width={34} height={60} fill="#E58A5A" /><Rect x={60} y={186} width={30} height={44} fill="#F2C14E" />
                <Rect x={236} y={176} width={36} height={54} fill="#6FB3C9" /><Rect x={278} y={190} width={30} height={40} fill="#F29B9B" />
              </>}
              <Rect x={0} y={232} width={318} height={128} fill="#7DC3D3" />
            </Svg>
            <Bob amp={i === 2 ? 6 : 5} rot={i === 2 ? 3 : 0} style={{ position: 'absolute', left: i === 1 ? 30 : 64, top: i === 1 ? 84 : 120 }}>
              <Image source={PENGUIN} style={{ width: i === 1 ? 250 : 190, height: i === 1 ? 250 : 190 }} />
            </Bob>
            {i === 2 ? (
              <View style={{ position: 'absolute', left: 0, right: 0, top: 250, bottom: 0, backgroundColor: 'rgba(77,170,196,0.82)' }} />
            ) : (
              <Svg style={{ position: 'absolute', bottom: -2 }} width="100%" height={110} viewBox="0 0 318 110" preserveAspectRatio="none">
                <Path d="M-10 110 L-10 60 Q10 30 40 44 Q60 14 92 36 Q118 18 140 46 Q170 24 196 46 Q224 16 254 40 Q284 22 300 46 Q322 40 330 60 L330 110 Z" fill="#3FA65A" />
                <Path d="M-10 110 L-10 84 Q24 62 60 78 Q100 58 140 78 Q180 60 220 80 Q262 62 300 78 L330 80 L330 110 Z" fill="#2E8B4A" />
              </Svg>
            )}
          </Animated.View>
          <Animated.View key={'n' + i} entering={FadeInDown.springify()} style={styles.banner}>
            <View style={styles.avatar}><Image source={PENGUIN} style={{ width: 38, height: 38, marginBottom: -6 }} /></View>
            <Text style={{ flex: 1, fontFamily: F.heavy, fontSize: 13, color: C.ink }}>{s.text}</Text>
            <Text style={{ fontFamily: F.body, fontSize: 11, color: C.soft }}>{s.time}</Text>
          </Animated.View>
        </Animated.View>
      </View>
      <View style={[styles.bottomRow, { bottom: insets.bottom + 60 }]}>
        <Pill label="Recordame tomar mate" onPress={() => setAsking(true)} />
      </View>

      {asking && (
        <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: 'rgba(42,37,36,0.4)' }]}>
          <Animated.View entering={ZoomIn.duration(250)} style={styles.alert}>
            <View style={{ padding: 18, gap: 6 }}>
              <Text style={{ fontFamily: F.heavy, fontSize: 16, textAlign: 'center', color: C.ink }}>“Fueguino” quiere enviarte notificaciones</Text>
              <Text style={{ fontFamily: F.body, fontSize: 13, textAlign: 'center', color: '#4A423C' }}>Pueden incluir avisos, sonidos y globos de número.</Text>
            </View>
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#D6D0C6' }}>
              {['No permitir', 'Permitir'].map((l, k) => (
                <Pressable key={l} onPress={() => go('meta')} style={[styles.alertBtn, k === 0 && { borderRightWidth: 1, borderColor: '#D6D0C6' }]}>
                  <Text style={{ fontFamily: k ? F.heavy : F.body, fontSize: 16, color: '#1F6FC9' }}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------- 4 · Meta
const META_ROWS = [
  { key: 'exp', label: 'Experiencia', opts: ['Nunca probé', 'Aprendiz', 'Matero de ley'], add: [-250, 0, 250] },
  { key: 'hora', label: 'Cuándo tomás', opts: ['A la mañana', 'Mañana y tarde', 'Solo a la tarde'], add: [0, 250, 0] },
  { key: 'caf', label: 'Cafeína', opts: ['Soy sensible', 'Normal'], add: [-250, 0] },
  { key: 'clima', label: 'Clima', opts: ['Frío fueguino', 'Templado', 'Calor (¡tereré!)'], add: [0, 0, 250] },
];

/** Silueta de mate (calabaza + bombilla) en blanco translúcido, para el fondo. */
const MateGhost = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Path d="M13 25 C4 42 14 61 32 61 C50 61 60 42 51 25 Z" fill="#fff" fillOpacity={0.16} />
    <Ellipse cx={32} cy={25} rx={19} ry={5.5} fill="#fff" fillOpacity={0.1} stroke="#fff" strokeOpacity={0.32} strokeWidth={3} />
    <Path d="M42 3 L36 27" stroke="#fff" strokeOpacity={0.32} strokeWidth={4} strokeLinecap="round" />
  </Svg>
);

// Ícono de cada opción de la meta (líneas blancas, en el mismo estilo que los mates del fondo)
const SUN_RAYS = 'M12 2.5V4.5M12 19.5V21.5M2.5 12H4.5M19.5 12H21.5M5.3 5.3L6.7 6.7M17.3 17.3L18.7 18.7M5.3 18.7L6.7 17.3M17.3 6.7L18.7 5.3';
const BOLT = 'M13 3L6 13H11L10 21L18 10H13Z';
const META_ICONS: Record<string, string[][]> = {
  exp: [
    ['M12 21V11', 'M12 13C12 8.5 8.5 6 4 6C4 10 7 13 12 13', 'M12 11C12 7 15 5 20 5C20 9 17 11 12 11'],
    ['M6 10C4 16 7 21 12 21C17 21 20 16 18 10Z', 'M6 10C6 11.2 18 11.2 18 10C18 8.8 6 8.8 6 10Z', 'M16 3L13.5 10'],
    ['M12 3L14.6 8.6L20.6 9.2L16 13.2L17.4 19.2L12 16L6.6 19.2L8 13.2L3.4 9.2L9.4 8.6Z'],
  ],
  hora: [
    ['M3 19H21', 'M7 19A5 5 0 0 1 17 19', 'M12 11V4M9.5 6.5L12 4L14.5 6.5'],
    ['M12 8A4 4 0 1 0 12.01 8Z', SUN_RAYS],
    ['M3 19H21', 'M7 19A5 5 0 0 1 17 19', 'M12 4V11M9.5 8.5L12 11L14.5 8.5'],
  ],
  caf: [[BOLT, 'M4 4L20 20'], [BOLT]],
  clima: [
    ['M12 3V21M4.2 7.5L19.8 16.5M4.2 16.5L19.8 7.5', 'M9.5 4.5L12 6L14.5 4.5M9.5 19.5L12 18L14.5 19.5'],
    ['M9 4.5V3M4.5 9H3M5.8 5.8L4.8 4.8M13.2 5.8L14.2 4.8', 'M6.2 11A3.5 3.5 0 0 1 12.5 8', 'M7 20H17A3.5 3.5 0 0 0 16.5 13A5 5 0 0 0 7.2 14.2A3 3 0 0 0 7 20Z'],
    ['M10 14V5A2 2 0 0 1 14 5V14A4 4 0 1 1 10 14Z', 'M12 17V9'],
  ],
};

function MetaIcon({ row, opt }: { row: string; opt: number }) {
  return (
    <Animated.View key={opt} entering={ZoomIn.springify()} style={styles.metaIcon} pointerEvents="none">
      <Svg width={30} height={30} viewBox="0 0 24 24">
        {META_ICONS[row][opt].map((d, i) => (
          <Path key={i} d={d} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    </Animated.View>
  );
}

/** Saltito con bamboleo cada pocos segundos, en ola según `index`, para invitar a tocar. */
function Nudge({ index, active, children }: { index: number; active: boolean; children: React.ReactNode }) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!active) {
      cancelAnimation(v);
      v.value = withTiming(0, { duration: 150 });
      return;
    }
    v.value = withDelay(
      900 + index * 160,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(-0.6, { duration: 170 }),
          withTiming(0.3, { duration: 150 }),
          withTiming(0, { duration: 150 }),
          withDelay(2600, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(v);
  }, [active]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.05 * Math.abs(v.value) }, { rotate: `${2.5 * v.value}deg` }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const WALKER = 240; // tamaño de Fueguino con sombrero que cruza la pantalla

export function Meta() {
  const { go, setGoal } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [sel, setSel] = useState<Record<string, number>>({ exp: 1, hora: 0, caf: 1, clima: 0 });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const goal = Math.max(500, 1000 + META_ROWS.reduce((a, r) => a + r.add[sel[r.key]], 0));
  useEffect(() => setGoal(goal), [goal]);

  const swim = useLoop(11000);
  const swimStyle = useAnimatedStyle(() => {
    const t = swim.value;
    const going = t < 0.5;
    const p = going ? t / 0.5 : (1 - t) / 0.5;
    const x = -WALKER + p * (width + WALKER);
    // Fueguino con sombrero cruza la pantalla de un lado al otro, con un rebote suave
    return { transform: [{ translateX: x }, { translateY: Math.sin(t * Math.PI * 10) * 4 }, { scaleX: going ? 1 : -1 }] };
  });

  return (
    <Screen bg={C.sea}>
      {[[-20, 300, 70], [width - 70, 230, 90], [width - 60, 620, 60], [-26, 640, 84], [40, 760, 46], [width - 110, 60, 50]].map(([l, t, s], k) => (
        <Bob key={k} amp={10} ms={6000 + k * 700} rot={6} style={{ position: 'absolute', left: l, top: t }}>
          <MateGhost size={s} />
        </Bob>
      ))}
      {/* El dibujo ocupa del 22% al 95% del cuadro: así queda entero arriba de "Meta sugerida" */}
      <Animated.View style={[{ position: 'absolute', top: insets.top + 192 - 0.95 * WALKER }, swimStyle]}>
        <Clip source={FUEGUINO_SOMBRERO} size={WALKER} />
      </Animated.View>
      <Skip light onPress={() => go('beneficios')} />

      <View style={{ alignItems: 'center', marginTop: insets.top + 200 }}>
        <Text style={{ fontFamily: F.heavy, color: '#fff', fontSize: 15 }}>Meta sugerida</Text>
        <Animated.Text key={goal} entering={FadeInDown.springify()} style={{ fontFamily: F.title, fontSize: 60, color: '#fff' }}>
          {goal.toLocaleString('es-AR')}<Text style={{ fontSize: 32 }}>ml</Text>
        </Animated.Text>
        <Text style={{ fontFamily: F.semi, color: '#fff', fontSize: 20 }}>Calculá tu meta de agua para el mate</Text>
        <Text style={{ fontFamily: F.body, color: '#fff', fontSize: 13, marginTop: 2 }}>≈ {String(goal / 1000).replace('.', ',')} termo por día</Text>
      </View>

      <View style={{ paddingHorizontal: 40, marginTop: 26, gap: 10 }}>
        {META_ROWS.map((r, k) => (
          <Animated.View key={r.key} entering={FadeInDown.delay(300 + k * 80)}>
            <Nudge index={k} active={!touched[r.key]}>
              <Pressable
                onPress={() => {
                  tap();
                  setSel((s) => ({ ...s, [r.key]: (s[r.key] + 1) % r.opts.length }));
                  setTouched((t) => ({ ...t, [r.key]: true }));
                }}
                style={({ pressed }) => [styles.metaRow, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={{ fontFamily: F.heavy, fontSize: 12, color: '#fff' }}>{r.label}</Text>
                <Text style={{ fontFamily: F.black, fontSize: 16, color: '#fff' }}>{r.opts[sel[r.key]]}</Text>
                <MetaIcon row={r.key} opt={sel[r.key]} />
              </Pressable>
            </Nudge>
          </Animated.View>
        ))}
      </View>
      <View style={[styles.bottomRow, { bottom: insets.bottom + 40 }]}>
        <Pill label="CONTINUAR" dark={false} onPress={() => go('beneficios')} />
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------------- 5 · Beneficios
export function Beneficios() {
  const { go } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cw = (width - 36) / 2;
  const bad = ['Mate a la noche y dormís mal', 'Agua hirviendo que quema la yerba', 'Te olvidás del ritual'];
  const good = ['Dormís mejor: sabés cuándo parar', 'Mates más ricos y parejos', 'Un ritual que te ordena el día'];
  return (
    <Screen>
      <Title style={{ marginTop: insets.top + 50, paddingHorizontal: 40 }}>Sentite bien todos los días</Title>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 26, gap: 4 }}>
        <Animated.View entering={FadeInLeft.delay(300).springify()} style={[styles.benefit, { width: cw, backgroundColor: '#D3C6F7', transform: [{ rotate: '-3deg' }] }]}>
          <Text style={[styles.benTitle, { color: '#3A2C6B' }]}>Sin un buen ritmo</Text>
          {bad.map((b, k) => (
            <Animated.Text key={b} entering={FadeIn.delay(800 + k * 120)} style={[styles.benItem, { color: '#3A2C6B' }]}>✕  {b}</Animated.Text>
          ))}
          <Bob amp={3} rot={2} style={{ position: 'absolute', bottom: -8, left: 10 }}>
            <Image source={PENGUIN} style={{ width: 140, height: 140, opacity: 0.75, transform: [{ rotate: '8deg' }] }} />
          </Bob>
        </Animated.View>
        <Animated.View entering={FadeInRight.delay(900).springify()} style={[styles.benefit, { width: cw, backgroundColor: '#BDEDEF', marginTop: -10, transform: [{ rotate: '2deg' }] }]}>
          <Text style={[styles.benTitle, { color: C.tealDark }]}>Con Fueguino</Text>
          {good.map((b, k) => (
            <Animated.View key={b} entering={FadeIn.delay(1400 + k * 120)} style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              <View style={styles.okDot}><CheckIcon size={11} /></View>
              <Text style={[styles.benItem, { marginTop: 0, flex: 1, color: C.tealDark }]}>{b}</Text>
            </Animated.View>
          ))}
          <Bob amp={14} ms={1600} style={{ position: 'absolute', bottom: -8, left: 10 }}>
            <Image source={PENGUIN} style={{ width: 140, height: 140 }} />
            <Svg width={70} height={26} viewBox="0 0 74 26" style={{ position: 'absolute', left: 34, top: 28 }}>
              <Path d="M4 6 L32 6 L30 18 Q28 24 18 24 Q8 24 6 18 Z M42 6 L70 6 L68 18 Q66 24 56 24 Q46 24 44 18 Z" fill="#E2483D" stroke={C.ink} strokeWidth={2.5} />
              <Path d="M32 9 Q37 6 42 9" fill="none" stroke={C.ink} strokeWidth={2.5} />
            </Svg>
          </Bob>
        </Animated.View>
      </View>
      <Animated.View entering={FadeInUp.delay(1800)} style={[styles.bottomRow, { bottom: insets.bottom + 50 }]}>
        <Pill label="¡Quiero sentirme bien!" onPress={() => go('calculo')} />
      </Animated.View>
    </Screen>
  );
}

// ---------------------------------------------------------------- 6 · Calculando
function DotRing({ r, n, dur, dir, ri }: { r: number; n: number; dur: number; dir: 1 | -1; ri: number }) {
  const t = useLoop(dur);
  const s = useAnimatedStyle(() => ({ transform: [{ rotate: `${dir * t.value * 360}deg` }] }));
  const colors = ['#2BB3C0', '#3F6FD8', '#8B4FC8', '#D94F9B', '#5B5FD6'];
  return (
    <Animated.View style={[StyleSheet.absoluteFill, s]}>
      <Svg width={260} height={260}>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2 + ri * 0.3;
          return <Circle key={i} cx={130 + Math.cos(a) * r} cy={130 + Math.sin(a) * r} r={2.5 + ((i + ri) % 3) * 0.8} fill={colors[(i + ri * 2) % colors.length]} />;
        })}
      </Svg>
    </Animated.View>
  );
}

export function Calculo() {
  const { go } = useStore();
  const insets = useSafeAreaInsets();
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => (x >= 300 ? x : x + 2)), 40);
    return () => clearInterval(id);
  }, []);
  const bars = [
    { label: 'Analizando tus datos', color: '#1F7F88', track: '#D5EEF0' },
    { label: 'Personalizando tu meta', color: '#3F4FC8', track: '#E1E4F7' },
    { label: 'Jugando con pingüinos', color: '#B5367A', track: '#F6DDEA' },
  ];
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: insets.top + 60 }}>
        <View style={{ width: 260, height: 260 }}>
          {[[60, 14, 16000, 1], [78, 18, 20000, -1], [96, 22, 26000, 1], [114, 26, 32000, -1]].map(([r, n, d, dir], ri) => (
            <DotRing key={ri} r={r} n={n} dur={d} dir={dir as 1 | -1} ri={ri} />
          ))}
          <Bob amp={2} ms={2400} style={{ position: 'absolute', left: 84, top: 84 }}>
            <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: '#FBE8D3', overflow: 'hidden' }}>
              <Image source={PENGUIN} style={{ position: 'absolute', left: -24, top: -8, width: 140, height: 140 }} />
            </View>
          </Bob>
        </View>
      </View>
      <View style={{ paddingHorizontal: 36, marginTop: 40, gap: 22 }}>
        {bars.map((b, i) => {
          const p = Math.max(0, Math.min(100, t - i * 100));
          return (
            <View key={b.label}>
              <Text style={{ fontFamily: F.heavy, fontSize: 15, color: b.color }}>{b.label}</Text>
              <View style={{ height: 8, borderRadius: 99, backgroundColor: b.track, marginTop: 8, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${p}%`, backgroundColor: b.color, borderRadius: 99 }} />
              </View>
              <Text style={{ alignSelf: 'flex-end', fontFamily: F.heavy, fontSize: 12, color: C.muted, marginTop: 4 }}>{p}%</Text>
            </View>
          );
        })}
      </View>
      {t >= 300 && (
        <Animated.View entering={FadeInUp} style={[styles.bottomRow, { bottom: insets.bottom + 50 }]}>
          <Pill label="VER MI PLAN" onPress={() => go('pro')} />
        </Animated.View>
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------- 7 · Pro
export function Pro() {
  const { go } = useStore();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<'vida' | 'prueba'>('vida');
  const [showB, setShowB] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setShowB((x) => !x), 3500);
    return () => clearInterval(id);
  }, []);
  const plans = [
    { id: 'vida' as const, title: 'De por vida, pagás una vez', sub: '[PRECIO] · sin pagos recurrentes', badge: true },
    { id: 'prueba' as const, title: '$0 hoy', sub: '3 días gratis, después [PRECIO] por año', badge: false },
  ];
  const perks = [
    ['Todas las bebidas materas', 'Amargo, dulce, tereré, mate cocido y agua, cada una con su color.'],
    ['Desafíos materos', 'Último mate a las 18, semana de tereré, ruta de la yerba y más.'],
    ['Recordatorios amables', 'Solo te aviso cuando se te pasa la hora.'],
  ];
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 50, paddingHorizontal: 22, paddingBottom: 40, alignItems: 'center' }}>
        <View style={{ height: 150, width: '100%', alignItems: 'center', justifyContent: 'flex-end' }}>
          {showB ? (
            <Animated.View key="b" entering={ZoomIn} style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              {[96, 130, 96].map((s, k) => (
                <Bob key={k} amp={10} ms={1600 + k * 200}><Image source={PENGUIN} style={{ width: s, height: s }} /></Bob>
              ))}
            </Animated.View>
          ) : (
            <Animated.View key="a" entering={ZoomIn} style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-end' }}>
              <Bob amp={8}><MateIcon size={80} /></Bob>
              <Bob amp={8} ms={3100}><MateIcon size={80} top="#3FB6CF" body="#C9A27A" /></Bob>
              <Bob amp={8} ms={3300}><MateIcon size={80} top="#E3A13B" /></Bob>
            </Animated.View>
          )}
        </View>
        <Text style={{ fontFamily: F.heavy, color: '#2E7D3A', marginTop: 12 }}>{showB ? '✓ 3 desafíos materos' : '✓ Todas las formas de tomar mate'}</Text>
        <Title size={26} style={{ marginTop: 6, marginBottom: 16 }}>Convertite en maestro cebador</Title>
        {plans.map((p) => {
          const on = plan === p.id;
          return (
            <Pressable key={p.id} onPress={() => setPlan(p.id)} style={[styles.plan, { backgroundColor: on ? C.teal : '#E3F1F2', paddingTop: p.badge ? 34 : 14 }]}>
              <View style={[styles.radio, { borderColor: on ? '#fff' : C.tealDark }]}>{on && <View style={styles.radioDot} />}</View>
              {p.badge && <Text style={styles.badge}>-50% TERMINA PRONTO</Text>}
              <Text style={{ fontFamily: F.black, fontSize: 17, color: on ? '#fff' : C.tealDark }}>{p.title}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 13, color: on ? '#fff' : C.tealDark, marginTop: 2 }}>{p.sub}</Text>
            </Pressable>
          );
        })}
        <Pill label="Continuar" onPress={() => go('home')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        <Text style={{ fontFamily: F.body, fontSize: 12, color: C.soft, marginTop: 8 }}>Maqueta: no se cobra nada.</Text>
        <Title size={22} style={{ marginTop: 26, marginBottom: 10 }}>Qué incluye</Title>
        {perks.map(([t1, t2]) => (
          <View key={t1} style={{ alignSelf: 'stretch', marginBottom: 12 }}>
            <Text style={{ fontFamily: F.black, fontSize: 15, color: C.ink }}>{t1}</Text>
            <Text style={{ fontFamily: F.body, fontSize: 13, color: C.muted }}>{t2}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ position: 'absolute', right: 16, top: insets.top + 6 }}>
        <RoundBtn label="Cerrar" onPress={() => go('home')}><CloseIcon /></RoundBtn>
      </View>
    </Screen>
  );
}

export const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  introBottom: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 16 },
  langRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  langChip: { paddingHorizontal: 12, height: 36, borderRadius: 18, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  langChipOn: { borderColor: C.ink, backgroundColor: C.cream },
  langText: { fontFamily: F.heavy, fontSize: 13, color: C.muted },
  bottomRow: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  mateBtn: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#E9F2DA', alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: C.teal, borderRadius: 99, paddingHorizontal: 18, paddingVertical: 10 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center', paddingTop: 12 },
  grab: { width: 44, height: 5, borderRadius: 99, backgroundColor: '#DDD3C3' },
  card: { width: 318, height: 360, marginTop: 24, borderRadius: 30, borderWidth: 4, borderColor: '#BFE3E6', overflow: 'hidden' },
  banner: { position: 'absolute', left: 12, right: 12, top: 12, height: 54, borderRadius: 16, backgroundColor: 'rgba(255,253,248,0.96)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  avatar: { width: 32, height: 32, borderRadius: 9, backgroundColor: C.teal, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  alert: { width: 280, borderRadius: 18, backgroundColor: '#F4F1EC', overflow: 'hidden' },
  alertBtn: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  metaRow: { height: 54, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 20, paddingRight: 60, justifyContent: 'center' },
  metaIcon: { position: 'absolute', right: 18, top: 12 },
  benefit: { height: 460, borderRadius: 26, padding: 14, overflow: 'hidden' },
  benTitle: { fontFamily: F.title, fontSize: 19, marginBottom: 4 },
  benItem: { fontFamily: F.body, fontSize: 13, lineHeight: 17, marginTop: 8 },
  okDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.teal, alignItems: 'center', justifyContent: 'center' },
  plan: { alignSelf: 'stretch', borderRadius: 18, padding: 14, paddingLeft: 46, marginBottom: 10 },
  radio: { position: 'absolute', left: 14, top: 16, width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  badge: { position: 'absolute', right: 10, top: 10, backgroundColor: '#D1306B', color: '#fff', fontFamily: F.black, fontSize: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
});
