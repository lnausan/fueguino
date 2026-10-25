import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  Easing, SharedValue, ZoomIn, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { PENGUIN } from '../theme';
import { Bob, useLoop } from './kit';

// El mate de la pantalla Intro, grande: se llena de abajo hacia arriba (la madera se va formando con
// el agua) y, cuando se completa, sale el vapor, el mate se corre y aparece Fueguino al lado.

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const INK = '#2E2A27';
const VIEW = { x: 152, y: 130, w: 136, h: 210 }; // recorte del dibujo
const FILL_MS = 3400;

// Calabaza en forma de huevo, virola alta, bombilla con espiral
const GOURD = 'M178 234C164 250 160 272 162 290C166 318 190 336 220 336C250 336 274 318 278 290C280 272 276 250 262 234Z';
const EMPTY_Y = 336; // nivel vacío
const FULL_Y = 232; // nivel lleno (debajo de la virola)
const WAVE = 'M150 6Q160 0 170 6T190 6T210 6T230 6T250 6T270 6T290 6T310 6T330 6L330 140L150 140Z';
const BOMBILLA = 'M214 200L188 172Q182 165 172 167';

function SteamPuff({ d, i, show, t }: { d: string; i: number; show: SharedValue<number>; t: SharedValue<number> }) {
  const rise = (v: number) => {
    'worklet';
    return ((v + i * 0.33) % 1) * 16;
  };
  const drift = useAnimatedProps(() => ({ transform: [{ translateX: 3 * Math.sin(t.value * 6 + i) }, { translateY: -rise(t.value) }] }));
  const fade = useAnimatedProps(() => ({ strokeOpacity: 0.55 * show.value * (1 - rise(t.value) / 20) }));
  return (
    <AnimatedG animatedProps={drift}>
      <AnimatedPath animatedProps={fade} d={d} fill="none" stroke="#B7AC9C" strokeWidth={4} strokeLinecap="round" />
    </AnimatedG>
  );
}

// El dibujo va aparte (memo) para que el re-render al completarse no toque los props animados
const MateArt = React.memo(function MateArt({ width, height, fill, done }: { width: number; height: number; fill: SharedValue<number>; done: SharedValue<number> }) {
  const wave = useLoop(1500);
  const steam = useLoop(2200);
  const level = useAnimatedProps(() => ({ transform: [{ translateY: EMPTY_Y - fill.value * (EMPTY_Y - FULL_Y) }] }));
  const waveX = useAnimatedProps(() => ({ transform: [{ translateX: -wave.value * 40 }] }));
  return (
    <Svg width={width} height={height} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} style={{ overflow: 'visible' }}>
      <Defs>
        <ClipPath id="calabaza">
          <Path d={GOURD} />
        </ClipPath>
        <LinearGradient id="madera" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#4A2614" />
          <Stop offset="0.35" stopColor="#7A4326" />
          <Stop offset="0.7" stopColor="#5E321B" />
          <Stop offset="1" stopColor="#3E1F10" />
        </LinearGradient>
        <LinearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#8C8984" />
          <Stop offset="0.35" stopColor="#E9E7E2" />
          <Stop offset="0.7" stopColor="#B4B1AA" />
          <Stop offset="1" stopColor="#7A7772" />
        </LinearGradient>
      </Defs>

      {/* Calabaza vacía (clara) y, encima, la madera que se va formando con el agua */}
      <Path d={GOURD} fill="#E7D9C3" />
      <G clipPath="url(#calabaza)">
        <AnimatedG animatedProps={level}>
          <AnimatedG animatedProps={waveX}>
            <Path d={WAVE} fill="url(#madera)" />
            <Path d="M150 6Q160 0 170 6T190 6T210 6T230 6T250 6T270 6T290 6T310 6T330 6" fill="none" stroke="#9A5A35" strokeWidth={3} />
          </AnimatedG>
        </AnimatedG>
        {/* Veta y brillo de la madera */}
        <Path d="M186 252C180 276 182 304 196 326M206 244C202 272 204 304 214 332M244 248C250 276 248 306 238 328" fill="none" stroke="#000" strokeOpacity={0.12} strokeWidth={2} />
        <Path d="M174 284C172 262 180 248 194 242C186 260 186 284 190 310C182 304 176 296 174 284Z" fill="#fff" fillOpacity={0.18} />
      </G>
      <Path d={GOURD} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />

      {/* Aro negro y virola alta de metal cepillado */}
      <Path d="M174 228Q220 240 266 228V236Q220 248 174 236Z" fill="#26221F" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M176 196V229Q220 240 264 229V196Z" fill="url(#metal)" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M188 202V230M200 203V233M214 204V235M228 204V235M242 203V233M254 202V230" stroke="#fff" strokeOpacity={0.25} strokeWidth={1.2} />
      <Ellipse cx={220} cy={196} rx={44} ry={10} fill="#D9D6D0" stroke={INK} strokeWidth={3} />
      <Ellipse cx={220} cy={196.5} rx={35} ry={6.5} fill="#7E8A35" />
      <Path d="M196 196h3M208 194h2M224 198h3M236 195h2M214 199h2" stroke="#B9C16E" strokeWidth={2} strokeLinecap="round" />

      {/* Bombilla recta con la punta curva y el espiralado */}
      <Path d={BOMBILLA} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={BOMBILLA} fill="none" stroke="#CFCBC2" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M194 186L201 179M197 189L204 182M200 192L207 185" stroke="#4A4642" strokeWidth={2} strokeLinecap="round" />

      {/* Vapor, cuando ya está lleno */}
      {['M206 184C198 170 214 160 206 144', 'M226 184C218 166 236 156 226 138', 'M244 186C238 174 250 166 244 154'].map((d, i) => (
        <SteamPuff key={d} d={d} i={i} show={done} t={steam} />
      ))}
    </Svg>
  );
});

export default function FillingMate({ width, height }: { width: number; height: number }) {
  const fill = useSharedValue(0);
  const done = useSharedValue(0);
  const [full, setFull] = useState(false);

  // Mate lo más grande que entre; al completarse se corre para hacerle lugar a Fueguino
  const mateH = Math.min(height, (width * 0.8 * VIEW.h) / VIEW.w);
  const mateW = (mateH * VIEW.w) / VIEW.h;
  const penguin = Math.min(width * 0.5, mateH * 0.44);
  const shift = Math.min((width - mateW) / 2, penguin * 0.4);

  useEffect(() => {
    fill.value = withDelay(500, withTiming(1, { duration: FILL_MS, easing: Easing.inOut(Easing.quad) }, (ok) => {
      if (!ok) return;
      done.value = withTiming(1, { duration: 700 });
      scheduleOnRN(setFull, true);
    }));
  }, []);

  const move = useAnimatedStyle(() => ({ transform: [{ translateX: done.value * shift }] }));

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={move}>
        <MateArt width={mateW} height={mateH} fill={fill} done={done} />
      </Animated.View>

      {/* Fueguino aparece al lado del mate lleno */}
      {full && (
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={{ position: 'absolute', bottom: -penguin * 0.04, left: (width - mateW) / 2 + shift - penguin * 0.6 }}
        >
          <Bob amp={6} ms={2600} rot={2}>
            <Image source={PENGUIN} style={{ width: penguin, height: penguin }} />
          </Bob>
        </Animated.View>
      )}
    </View>
  );
}
