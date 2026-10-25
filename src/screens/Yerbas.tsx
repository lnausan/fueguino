import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, SlideInDown, ZoomIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, FREE_CATAS, MARCAS, PENGUIN, YERBATERAS } from '../theme';
import { useStore } from '../store';
import { BackIcon, Bob, CheckIcon, LockIcon, MateIcon, PackTile, Pill, Pulse, RoundBtn, Title } from '../ui/kit';

const marca = (id: string) => MARCAS.find((m) => m.id === id) ?? MARCAS[0];

function Header({ title, onBack, right }: { title?: string; onBack: () => void; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <RoundBtn label="Volver" onPress={onBack}><BackIcon /></RoundBtn>
      {title ? <Text style={styles.headerTitle}>{title}</Text> : <View style={{ flex: 1 }} />}
      {right}
    </View>
  );
}

function MiniMates({ score, size = 14 }: { score: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((k) => (
        <Svg key={k} width={size} height={size} viewBox="0 0 64 64">
          <Path d="M15 22 C11 42 18 58 32 58 C46 58 53 42 49 22 Z" fill={k <= score ? C.green : '#EDE7DC'} stroke={C.ink} strokeWidth={5} />
        </Svg>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- Ruta de la yerba
export function YerbasDesafio() {
  const { go, back, catas } = useStore();
  const n = catas.length;
  const left = Math.max(0, FREE_CATAS - n);
  const xs = [60, 200, 90, 220, 70, 200];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header onBack={back} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
        <Animated.View entering={ZoomIn.springify()} style={styles.hero}>
          <Text style={styles.heroKicker}>DESAFÍO MATERO</Text>
          <Text style={styles.heroTitle}>Ruta de la yerba</Text>
          <Text style={styles.heroText}>Probá y puntuá las yerbas más vendidas del país</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            <Text style={styles.chip}>20 yerbateras</Text>
            <Text style={styles.chip}>{MARCAS.length} marcas</Text>
          </View>
          <Bob amp={8} rot={3} style={{ position: 'absolute', right: -8, bottom: -22 }}>
            <Image source={PENGUIN} style={{ width: 160, height: 160 }} />
          </Bob>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.freeBar}>
          <Text style={{ fontFamily: F.black, color: '#2F4A12', fontSize: 14 }}>
            {left > 0 ? `Te ${left === 1 ? 'queda 1 cata gratis' : `quedan ${left} catas gratis`}` : 'Usaste tus catas gratis'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[0, 1, 2].map((i) => <MateIcon key={i} size={22} straw={false} top={i < n ? C.green : '#E9E3D8'} body={i < n ? C.brown : '#fff'} />)}
          </View>
        </Animated.View>

        <View style={{ height: 6 * 64, marginTop: 20 }}>
          {xs.map((x, i) => {
            const done = i < n;
            const next = i === n && i < FREE_CATAS;
            const locked = i >= FREE_CATAS && !done;
            const node = (
              <View style={[styles.node, { backgroundColor: done ? C.green : locked ? '#EDE7DC' : '#fff', borderColor: done ? C.greenInk : locked ? '#D9CCB5' : C.teal }]}>
                {done ? <CheckIcon size={22} /> : locked ? <LockIcon size={22} /> : <MateIcon size={28} straw={false} />}
              </View>
            );
            return (
              <Animated.View key={i} entering={ZoomIn.delay(300 + i * 100)} style={{ position: 'absolute', left: x, top: i * 64, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {next ? <Pulse>{node}</Pulse> : node}
                <View>
                  <Text style={{ fontFamily: F.black, fontSize: 13, color: C.ink }}>Cata {i + 1}</Text>
                  <Text style={{ fontFamily: F.body, fontSize: 12, color: done ? '#3F6F1A' : locked ? C.soft : '#1F6F75' }}>
                    {done ? 'Probada' : next ? 'Te toca' : locked ? 'Pro' : 'Gratis'}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pill label="Elegir mi próxima yerba" onPress={() => go('catalogo')} style={{ alignSelf: 'stretch' }} />
        <Pressable onPress={() => go('ranking')} style={{ height: 40, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: F.black, color: C.teal }}>Ver mi ranking</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Catálogo
export function YerbasCatalogo() {
  const { go, back, catas, select } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'todas' | 'pendientes' | 'probadas'>('todas');
  const [paywall, setPaywall] = useState(false);
  const insets = useSafeAreaInsets();
  const scores = Object.fromEntries(catas.map((c) => [c.id, c.score]));
  const freeLeft = Math.max(0, FREE_CATAS - catas.length);
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const groups = useMemo(
    () =>
      YERBATERAS.map(([emp], gi) => ({
        emp, rank: gi + 1,
        items: MARCAS.filter((m) => m.empresa === emp).filter((m) => {
          const t = scores[m.id] != null;
          if (q && !norm(m.name).includes(norm(q)) && !norm(emp).includes(norm(q))) return false;
          if (filter === 'probadas' && !t) return false;
          if (filter === 'pendientes' && t) return false;
          return true;
        }),
      })).filter((g) => g.items.length),
    [q, filter, catas],
  );
  const lockedCount = MARCAS.filter((m) => scores[m.id] == null).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="Elegí tu yerba" onBack={back}
        right={<Text style={[styles.freePill, freeLeft === 0 && { backgroundColor: '#FCE3EC', color: '#8A1F48' }]}>{freeLeft > 0 ? `${freeLeft} gratis` : 'Pro'}</Text>} />
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <TextInput value={q} onChangeText={setQ} placeholder="Buscar marca o yerbatera" placeholderTextColor={C.soft} style={styles.search} accessibilityLabel="Buscar marca o yerbatera" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['todas', 'pendientes', 'probadas'] as const).map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filter, filter === f && { backgroundColor: C.ink }]}>
              <Text style={{ fontFamily: F.heavy, fontSize: 13, color: filter === f ? C.bg : '#4A423C' }}>
                {f === 'todas' ? 'Todas' : f === 'pendientes' ? 'Por probar' : 'Probadas'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }}>
        {groups.length === 0 && <Text style={{ textAlign: 'center', fontFamily: F.body, color: C.muted, marginTop: 40 }}>No encontré yerbas con ese nombre.</Text>}
        {groups.map((g, gi) => (
          <Animated.View key={g.emp} entering={FadeInRight.delay(Math.min(600, gi * 50))} style={{ marginTop: 12 }}>
            <Text style={styles.groupTitle}><Text style={{ color: C.teal }}>#{g.rank} </Text>{g.emp.toUpperCase()}</Text>
            {g.items.map((m) => {
              const tasted = scores[m.id] != null;
              const locked = !tasted && freeLeft === 0;
              return (
                <View key={m.id} style={[styles.row, tasted && { backgroundColor: '#F2F7EA', borderColor: '#CFE3B4' }]}>
                  <PackTile name={m.name} color={m.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.semi, fontSize: 17, color: C.ink }}>{m.name}</Text>
                    <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{m.name === m.empresa ? `Yerbatera ${m.empresa}` : m.empresa}</Text>
                  </View>
                  {tasted ? (
                    <MiniMates score={scores[m.id]} />
                  ) : locked ? (
                    <Pressable onPress={() => setPaywall(true)} style={[styles.small, { backgroundColor: '#EDE7DC', flexDirection: 'row', gap: 4 }]}>
                      <LockIcon size={14} color="#4A423C" /><Text style={{ fontFamily: F.black, fontSize: 12, color: '#4A423C' }}>PRO</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => { select(m.id); go('puntuar'); }} style={[styles.small, { backgroundColor: C.teal }]}>
                      <Text style={{ fontFamily: F.black, fontSize: 13, color: '#fff' }}>Probar</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </Animated.View>
        ))}
        <Text style={{ textAlign: 'center', fontFamily: F.body, fontSize: 12, color: C.soft, marginTop: 20 }}>Orden según el ranking de ventas de yerbateras.</Text>
      </ScrollView>

      {paywall && (
        <>
          <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(42,37,36,0.45)' }]}>
            <Pressable style={{ flex: 1 }} onPress={() => setPaywall(false)} />
          </Animated.View>
          <Animated.View entering={SlideInDown.duration(380)} style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <Bob amp={6}><Image source={PENGUIN} style={{ width: 120, height: 120 }} /></Bob>
            <Title size={22}>Usaste tus 3 catas gratis</Title>
            <Text style={{ fontFamily: F.body, color: C.muted, textAlign: 'center', marginVertical: 8 }}>
              Con Fueguino Pro desbloqueás las {lockedCount} marcas que faltan y armás tu ranking completo.
            </Text>
            <Pill label="Ver Fueguino Pro" onPress={() => { setPaywall(false); go('pro'); }} style={{ alignSelf: 'stretch' }} />
            <Pressable onPress={() => setPaywall(false)} style={{ height: 44, justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.black, color: C.teal }}>Ahora no</Text>
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- Puntuar
const VERDICTS = ['Tocá un mate para puntuar', 'No es para mí', 'Ni fu ni fa', 'Rica', 'Muy rica', '¡Buenísima!'];
const ATTRS = [
  { key: 'amargor', label: 'Amargor', lo: 'Suave', hi: 'Intensa' },
  { key: 'cuerpo', label: 'Cuerpo', lo: 'Liviana', hi: 'Con cuerpo' },
  { key: 'rinde', label: 'Rinde', lo: 'Se lava rápido', hi: 'Dura mucho' },
  { key: 'aroma', label: 'Aroma', lo: 'Leve', hi: 'Intenso' },
];
const TAGS = ['Con palo', 'Sin palo', 'Suave', 'Para tereré', 'Con yuyos'];

export function YerbasPuntuar() {
  const { go, back, selected, saveCata, catas } = useStore();
  const insets = useSafeAreaInsets();
  const m = marca(selected);
  const [score, setScore] = useState(0);
  const [attrs, setAttrs] = useState<Record<string, number>>({ amargor: 3, cuerpo: 3, rinde: 3, aroma: 3 });
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const usedBefore = catas.filter((c) => c.id !== m.id).length;
  const leftAfter = Math.max(0, FREE_CATAS - (usedBefore + 1));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header onBack={back} right={<Text style={styles.freePill}>Cata {Math.min(usedBefore + 1, FREE_CATAS)} de {FREE_CATAS} gratis</Text>} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 130, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 170 }}>
          <Animated.View entering={FadeInDown.springify()}><Bob amp={3} rot={4} ms={3000}><PackTile name={m.name} color={m.color} w={90} /></Bob></Animated.View>
          <Bob amp={4} rot={2} ms={2400}><Image source={PENGUIN} style={{ width: 160, height: 160 }} /></Bob>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Title>{m.name}</Title>
          <Text style={{ fontFamily: F.body, color: C.muted }}>{m.empresa}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: F.black, fontSize: 15, color: C.ink }}>¿Qué te pareció?</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((k) => (
              <Pressable key={k} accessibilityLabel={`${k} mates`} onPress={() => setScore(k)}>
                <Animated.View key={`${k}-${k <= score}`} entering={k <= score ? ZoomIn.delay((k - 1) * 50).springify() : undefined}>
                  <MateIcon size={50} top={k <= score ? C.green : '#E9E3D8'} body={k <= score ? C.brown : '#EDE7DC'} />
                </Animated.View>
              </Pressable>
            ))}
          </View>
          <Animated.Text key={score} entering={FadeInDown} style={{ fontFamily: F.semi, fontSize: 18, color: '#3F6F1A' }}>{VERDICTS[score]}</Animated.Text>
        </View>
        <View style={styles.box}>
          {ATTRS.map((a) => (
            <View key={a.key} style={{ marginBottom: 10 }}>
              <Text style={{ fontFamily: F.black, fontSize: 14, color: C.ink, marginBottom: 6 }}>{a.label}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((k) => (
                  <Pressable key={k} accessibilityLabel={`${a.label} ${k} de 5`} onPress={() => setAttrs((s) => ({ ...s, [a.key]: k }))}
                    style={{ flex: 1, height: 26, borderRadius: 8, backgroundColor: k <= attrs[a.key] ? C.teal : '#EDE7DC' }} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                <Text style={styles.tiny}>{a.lo}</Text><Text style={styles.tiny}>{a.hi}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <Pressable key={t} onPress={() => setTags((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}
                style={[styles.tag, on && { backgroundColor: '#DCEBE8', borderColor: C.teal }]}>
                <Text style={{ fontFamily: F.heavy, fontSize: 13, color: on ? C.tealDark : '#4A423C' }}>{t}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput value={note} onChangeText={setNote} placeholder="Notas (opcional): ej. rinde bien, ideal para la mañana" placeholderTextColor={C.soft} multiline style={[styles.search, { height: 70, paddingTop: 10 }]} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pill label={score ? 'Guardar cata' : 'Elegí cuántos mates le das'} color={score ? C.ink : '#E4D8C3'} textColor={score ? C.bg : C.soft}
          style={{ alignSelf: 'stretch' }}
          onPress={() => { if (!score) return; saveCata({ id: m.id, score, attrs, tags, note }); setSaved(true); }} />
      </View>

      {saved && (
        <Animated.View entering={FadeIn} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(42,37,36,0.5)', alignItems: 'center', justifyContent: 'center' }]}>
          <Animated.View entering={ZoomIn.springify()} style={styles.savedCard}>
            <Bob amp={14} ms={1200} style={{ marginTop: -70 }}><Image source={PENGUIN} style={{ width: 120, height: 120 }} /></Bob>
            <Title size={22}>¡{m.name} ya está en tu ranking!</Title>
            <MiniMates score={score} size={22} />
            <Text style={{ fontFamily: F.heavy, color: leftAfter > 0 ? '#3F6F1A' : '#8A1F48', marginTop: 6, textAlign: 'center' }}>
              {leftAfter > 0 ? `Te ${leftAfter === 1 ? 'queda 1 cata gratis' : `quedan ${leftAfter} catas gratis`}` : 'Usaste tus 3 catas gratis. ¡Seguí con Pro!'}
            </Text>
            <Pill label="Ver mi ranking" onPress={() => go('ranking')} style={{ alignSelf: 'stretch', marginTop: 10 }} />
            <Pressable onPress={() => go(leftAfter > 0 ? 'catalogo' : 'pro')} style={{ height: 40, justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.black, color: C.teal }}>{leftAfter > 0 ? 'Probar otra yerba' : 'Ver Fueguino Pro'}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- Ranking
export function YerbasRanking() {
  const { go, back, catas } = useStore();
  const { width } = useWindowDimensions();
  const list = [...catas].sort((a, b) => b.score - a.score).map((c) => ({ ...marca(c.id), score: c.score }));
  const pct = Math.round((list.length / MARCAS.length) * 100);
  const order = [1, 0, 2];
  const heights = [120, 86, 64];
  const colBg = ['#2D6A6C', '#4E8A8B', '#7FA9AA'];
  const freeLeft = Math.max(0, FREE_CATAS - list.length);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title="Tu ranking de yerbas" onBack={back} />
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 50 }}>
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: F.black, fontSize: 13, color: C.ink }}>{list.length} de {MARCAS.length} marcas probadas</Text>
            <Text style={{ fontFamily: F.black, fontSize: 13, color: C.teal }}>{pct}%</Text>
          </View>
          <View style={{ height: 12, borderRadius: 99, backgroundColor: '#EDE7DC', marginTop: 6, overflow: 'hidden' }}>
            <Animated.View entering={FadeInRight.duration(800)} style={{ height: '100%', width: `${pct}%`, backgroundColor: C.green }} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 330 }}>
          {order.map((idx) => {
            const it = list[idx];
            return (
              <View key={idx} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                {it ? (
                  <Animated.View entering={FadeInDown.delay(500 + idx * 150).springify()} style={{ alignItems: 'center', gap: 4 }}>
                    {idx === 0 && (
                      <Bob amp={5} ms={2400} style={{ marginBottom: -10 }}>
                        <Image source={PENGUIN} style={{ width: 92, height: 92 }} />
                        <Text style={{ position: 'absolute', left: 32, top: -18, fontSize: 24 }}>👑</Text>
                      </Bob>
                    )}
                    <PackTile name={it.name} color={it.color} w={46} />
                    <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.ink, textAlign: 'center' }}>{it.name}</Text>
                    <MiniMates score={it.score} size={12} />
                  </Animated.View>
                ) : (
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <View style={styles.qBox}><Text style={{ fontFamily: F.title, fontSize: 22, color: C.soft }}>?</Text></View>
                    <Text style={{ fontFamily: F.heavy, fontSize: 12, color: C.soft }}>Por probar</Text>
                  </View>
                )}
                <Animated.View entering={FadeInDown.delay(200 + order.indexOf(idx) * 120)} style={[styles.col, { height: heights[idx], backgroundColor: colBg[idx] }]}>
                  <Text style={{ fontFamily: F.title, fontSize: 26, color: '#fff' }}>{idx + 1}</Text>
                </Animated.View>
              </View>
            );
          })}
        </View>

        {list.slice(3).map((r, i) => (
          <View key={r.id} style={[styles.row, { marginTop: 0 }]}>
            <Text style={{ width: 26, fontFamily: F.title, fontSize: 18, color: C.teal }}>{i + 4}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.black, fontSize: 15, color: C.ink }}>{r.name}</Text>
              <Text style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{r.empresa}</Text>
            </View>
            <Text style={{ fontFamily: F.title, fontSize: 16, color: '#3F6F1A' }}>{r.score}/5</Text>
          </View>
        ))}

        <View style={[styles.nextCard, { backgroundColor: freeLeft > 0 ? '#3F7A2A' : C.navy }]}>
          <Text style={{ fontFamily: F.title, fontSize: 18, color: '#fff' }}>
            {freeLeft > 0 ? `Te ${freeLeft === 1 ? 'queda 1 cata gratis' : `quedan ${freeLeft} catas gratis`}` : `Faltan ${MARCAS.length - list.length} marcas`}
          </Text>
          <Text style={{ fontFamily: F.body, fontSize: 13, color: '#fff' }}>
            {freeLeft > 0 ? 'Elegí otra yerba y seguí armando tu podio.' : 'Desbloquealas con Fueguino Pro y completá la ruta.'}
          </Text>
        </View>
        <Pill label={freeLeft > 0 ? 'Probar otra yerba' : 'Ver Fueguino Pro'} onPress={() => go(freeLeft > 0 ? 'catalogo' : 'pro')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  headerTitle: { flex: 1, fontFamily: F.title, fontSize: 22, color: C.ink },
  hero: { height: 206, borderRadius: 26, backgroundColor: C.navy, padding: 18, overflow: 'hidden' },
  heroKicker: { fontFamily: F.black, fontSize: 11, letterSpacing: 1.2, color: '#fff' },
  heroTitle: { fontFamily: F.title, fontSize: 28, color: '#fff', marginTop: 4 },
  heroText: { fontFamily: F.body, fontSize: 13, color: '#fff', maxWidth: 200, marginTop: 4 },
  chip: { fontFamily: F.black, fontSize: 11, color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, overflow: 'hidden' },
  freeBar: { marginTop: 14, height: 52, borderRadius: 16, backgroundColor: C.greenTint, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  node: { width: 58, height: 58, borderRadius: 29, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 26, backgroundColor: C.bg, borderTopWidth: 2, borderColor: C.sand },
  freePill: { fontFamily: F.black, fontSize: 12, color: '#2F4A12', backgroundColor: C.greenTint, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, overflow: 'hidden' },
  search: { height: 44, borderRadius: 14, borderWidth: 2, borderColor: C.line, backgroundColor: '#fff', paddingHorizontal: 14, fontFamily: F.body, fontSize: 15, color: C.ink },
  filter: { height: 36, paddingHorizontal: 14, borderRadius: 99, backgroundColor: C.sand, justifyContent: 'center' },
  groupTitle: { fontFamily: F.black, fontSize: 12, letterSpacing: 0.8, color: C.soft, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, borderWidth: 2, borderColor: '#EFE6D6', backgroundColor: '#fff', marginBottom: 8 },
  small: { height: 38, paddingHorizontal: 14, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center', padding: 24 },
  box: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#EFE6D6', borderRadius: 22, padding: 14 },
  tiny: { fontFamily: F.heavy, fontSize: 11, color: C.soft },
  tag: { height: 36, paddingHorizontal: 14, borderRadius: 99, borderWidth: 2, borderColor: C.line, backgroundColor: '#fff', justifyContent: 'center' },
  savedCard: { width: 320, borderRadius: 28, backgroundColor: C.bg, padding: 20, alignItems: 'center', gap: 6 },
  qBox: { width: 46, height: 56, borderRadius: 10, borderWidth: 3, borderStyle: 'dashed', borderColor: '#D9CCB5', alignItems: 'center', justifyContent: 'center' },
  col: { alignSelf: 'stretch', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, alignItems: 'center', paddingTop: 8 },
  nextCard: { borderRadius: 22, padding: 16, gap: 2 },
});
