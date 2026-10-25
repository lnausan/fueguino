// Sonidos y vibración de la app. Los sorbos son grabaciones reales (CC0, ver assets/sounds/CREDITOS.md);
// el resto se genera con scripts/generate-sounds.py.
// En web el navegador recién deja sonar después del primer toque (el botón "Inicio").
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const SOURCES = {
  pop: require('../assets/sounds/pop.wav'),
  toc: require('../assets/sounds/toc.wav'),
  deslizar: require('../assets/sounds/deslizar.wav'),
  sorbo: require('../assets/sounds/sorbo.wav'),
  sorbo1: require('../assets/sounds/sorbo1.wav'),
  sorbo2: require('../assets/sounds/sorbo2.wav'),
  sorbo3: require('../assets/sounds/sorbo3.wav'),
  sorbo4: require('../assets/sounds/sorbo4.wav'),
  festejo: require('../assets/sounds/festejo.wav'),
};
export type Sfx = keyof typeof SOURCES;

const players: Partial<Record<Sfx, AudioPlayer>> = {};

function player(name: Sfx): AudioPlayer | null {
  try {
    return (players[name] ??= createAudioPlayer(SOURCES[name]));
  } catch {
    return null;
  }
}

/** Configura el audio y deja los sonidos cargados. Se llama una vez al abrir la app. */
export function initSound() {
  // Son efectos: respetan el modo silencio y se mezclan con la música que esté sonando
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  (Object.keys(SOURCES) as Sfx[]).forEach(player);
}

/** Suena una vez desde el principio. */
export function play(name: Sfx, volume = 1) {
  const p = player(name);
  if (!p) return;
  try {
    p.volume = Math.max(0, Math.min(1, volume));
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {}
}

const ramps: Partial<Record<Sfx, ReturnType<typeof setInterval>>> = {};

/** Sonido en loop: lleva el volumen a `volume` de a poco (en `ms`), sin cortes bruscos. 0 lo pausa al final. */
export function loopVolume(name: Sfx, volume: number, ms = 140) {
  const p = player(name);
  if (!p) return;
  const target = Math.max(0, Math.min(1, volume));
  try {
    p.loop = true;
    if (target > 0.01 && !p.playing) {
      p.volume = 0;
      p.play();
    }
  } catch {
    return;
  }
  const from = p.volume;
  const steps = Math.max(1, Math.round(ms / 20));
  let k = 0;
  if (ramps[name]) clearInterval(ramps[name]);
  ramps[name] = setInterval(() => {
    k++;
    try {
      p.volume = from + ((target - from) * k) / steps;
      if (k >= steps) {
        clearInterval(ramps[name]);
        delete ramps[name];
        if (target <= 0.01 && p.playing) p.pause();
      }
    } catch {
      clearInterval(ramps[name]);
      delete ramps[name];
    }
  }, 20);
}

const SIPS: Sfx[] = ['sorbo1', 'sorbo2', 'sorbo3', 'sorbo4'];
let lastSip = -1;

/** Un sorbo de bombilla corto, cada vez uno distinto. `rate` cambia el tono (en el celular). */
export function sip(volume = 0.6, rate = 1) {
  let i = Math.floor(Math.random() * SIPS.length);
  if (i === lastSip) i = (i + 1) % SIPS.length;
  lastSip = i;
  setPitch(SIPS[i], rate);
  play(SIPS[i], volume);
}

/** Cambia el tono (y la velocidad) de un sonido: 1 es normal. En web el navegador mantiene el tono. */
export function setPitch(name: Sfx, rate: number) {
  const p = player(name);
  if (!p) return;
  try {
    p.shouldCorrectPitch = false;
    p.setPlaybackRate(Math.max(0.5, Math.min(2, rate)));
  } catch {}
}

// ---------- Vibración (en web solo donde el navegador la soporte) ----------
const safe = (f: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  f().catch(() => {});
};

export const haptic = {
  tap: () => safe(() => Haptics.selectionAsync()),
  bump: (strength: number) =>
    safe(() =>
      Haptics.impactAsync(
        strength > 0.66 ? Haptics.ImpactFeedbackStyle.Heavy : strength > 0.33 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
      ),
    ),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};

/** Toque de botón: pop + vibración cortita. */
export function tap() {
  play('pop', 0.3);
  haptic.tap();
}
