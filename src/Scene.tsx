import React, { useEffect, useMemo, useRef } from 'react';
import { GestureResponderEvent, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  SensorType,
  useAnimatedSensor,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Caustics, YerbaBed, YerbaTint } from './YerbaBed';
import Ripples, { RIPPLE_COUNT, Ripple, emptyRipples } from './Ripples';
import { MATE_OUTLINE, MATE_OUTLINE_POINTS, Mate, MateShadow } from './Mate';
import PenguinRing, { Hit, emptyHit, ronda } from './PenguinRing';
import { haptic } from './sound';

// ---------- Ajustes de la física ----------
const DEAD_ZONE = 3; // grados de temblor de la mano que se ignoran
const FULL_TILT = 24; // grados (más allá de la zona muerta) para llegar a la fuerza máxima
const MAX_ACCEL = 720; // px/s² con inclinación máxima
const YERBA_DRAG = 1.9; // resistencia de la yerba (1/s): acelera suave y frena por inercia
const LEVEL_FOLLOW = 3.3; // s: el "nivel" sigue la mano (~95% en 10 s)
const ANGLE_SMOOTH = 0.08; // s: filtro del sensor
const INPUT_EASE = 0.18; // s: la fuerza entra de forma gradual
const RESTITUTION = 0.4; // cuánto rebota contra los pingüinos y los bordes
const MAX_LEAN = 30; // grados de giro máximo al moverse
const BUTTON_H = 58;

// En el inicio no hay sonido (en el celular no queda bien): solo vibra al chocar.
// Corre en el hilo de JS; la física le avisa con scheduleOnRN.
const knock = (strength: number) => haptic.bump(strength);

export default function Scene({ onStart }: { onStart?: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const buttonBottom = insets.bottom + 18;
  const buttonTop = height - buttonBottom - BUTTON_H;
  const bounds = { left: 4, right: width - 4, top: insets.top + 4, bottom: buttonTop - 6 };
  const size = Math.round(Math.min(width * 0.42, 190));

  // Ronda de pingüinos alrededor de la yerba; sus cuerpos (círculos) frenan al mate
  const spots = useMemo(() => ronda(width, insets.top * 0.6, buttonTop), [width, insets.top, buttonTop]);
  const bodies = useMemo(() => spots.flatMap((s) => [s.cx, s.cy, s.r]), [spots]);

  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });

  // Estado de la física (todo vive en el hilo de UI)
  const x = useSharedValue(width / 2);
  const y = useSharedValue((bounds.top + bounds.bottom) / 2 - size * 0.25);
  const vx = useSharedValue(0);
  const vy = useSharedValue(0);
  const rot = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const lean = useSharedValue(0);
  const clock = useSharedValue(0);

  const calibrated = useSharedValue(0);
  const pitch0 = useSharedValue(0);
  const roll0 = useSharedValue(0);
  const pitchF = useSharedValue(0);
  const rollF = useSharedValue(0);
  const axCmd = useSharedValue(0);
  const ayCmd = useSharedValue(0);

  const squashX = useSharedValue(0);
  const squashXV = useSharedValue(0);
  const squashY = useSharedValue(0);
  const squashYV = useSharedValue(0);

  const touching = useSharedValue(0);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);

  const ripples = useSharedValue<Ripple[]>(emptyRipples());
  const rippleNext = useSharedValue(0);
  const rippleAcc = useSharedValue(0);
  const hit = useSharedValue<Hit>(emptyHit());
  const lastKnock = useSharedValue(-1);


  // Respaldo para la versión web en el celular (Reanimated no lee sensores en el navegador)
  const webOk = useSharedValue(0);
  const webPitch = useSharedValue(0);
  const webRoll = useSharedValue(0);
  const webAsked = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      webPitch.value = 90 - e.beta; // beta: 90 con el teléfono vertical, 0 boca arriba
      webRoll.value = e.gamma; // gamma: negativo al inclinar a la izquierda
      webOk.value = 1;
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, []);

  // iPhone (Safari) pide permiso para el giroscopio después de un toque
  const askWebPermission = () => {
    if (Platform.OS !== 'web' || webAsked.current || typeof window === 'undefined') return;
    webAsked.current = true;
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().catch(() => {});
    }
  };

  const b = bounds;

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(0.05, Math.max(0.001, (frame.timeSincePreviousFrame ?? 16) / 1000));
    const t = clock.value + dt;
    clock.value = t;

    // ---------- 1. Inclinación a partir de los ángulos del teléfono ----------
    // Reanimated entrega la gravedad apuntando hacia abajo en coordenadas del equipo
    // (en vertical ≈ (0, -9.8, 0); boca arriba ≈ (0, 0, -9.8)).
    const g = sensor.sensor.value;
    let tiltX = 0;
    let tiltY = 0;
    const mag = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);
    let havePose = false;
    let pitch = 0;
    let roll = 0;
    if (mag > 1) {
      pitch = (Math.atan2(-g.z, -g.y) * 180) / Math.PI; // 0 vertical, +90 boca arriba
      roll = (Math.atan2(g.x, Math.sqrt(g.y * g.y + g.z * g.z)) * 180) / Math.PI;
      havePose = true;
    } else if (webOk.value === 1) {
      // En el navegador del celular: ángulos del giroscopio del navegador
      pitch = webPitch.value;
      roll = webRoll.value;
      havePose = true;
    }
    if (havePose) {
      if (calibrated.value === 0) {
        // El nivel es la posición en la que tenés el teléfono al abrir la app
        pitch0.value = pitch;
        roll0.value = roll;
        pitchF.value = pitch;
        rollF.value = roll;
        calibrated.value = 1;
      }
      const wrap = (a: number) => {
        let r = a;
        while (r > 180) r -= 360;
        while (r < -180) r += 360;
        return r;
      };
      const kf = 1 - Math.exp(-dt / ANGLE_SMOOTH);
      pitchF.value = pitchF.value + wrap(pitch - pitchF.value) * kf;
      rollF.value = rollF.value + (roll - rollF.value) * kf;
      // El nivel sigue lentamente a la mano (auto-nivelado si te sentás o te acostás)
      const kl = 1 - Math.exp(-dt / LEVEL_FOLLOW);
      pitch0.value = pitch0.value + wrap(pitchF.value - pitch0.value) * kl;
      roll0.value = roll0.value + (rollF.value - roll0.value) * kl;

      const shape = (d: number) => {
        const m = Math.max(0, Math.abs(d) - DEAD_ZONE);
        const u = Math.min(1, m / FULL_TILT);
        return Math.sign(d) * u * u; // entra suave (ease-in)
      };
      // Alejar la parte de arriba (pitch sube) → sube por la pantalla.
      tiltY = -shape(wrap(pitchF.value - pitch0.value));
      // Inclinar a la izquierda (roll negativo) → va a la izquierda.
      tiltX = shape(rollF.value - roll0.value);
    }
    const ke = 1 - Math.exp(-dt / INPUT_EASE);
    axCmd.value = axCmd.value + (tiltX * MAX_ACCEL - axCmd.value) * ke;
    ayCmd.value = ayCmd.value + (tiltY * MAX_ACCEL - ayCmd.value) * ke;

    let ax = axCmd.value;
    let ay = ayCmd.value;
    let drag = YERBA_DRAG;

    // ---------- 2. Mantener apretado sobre la yerba: se desliza hacia el dedo ----------
    if (touching.value === 1) {
      const dx = touchX.value - x.value;
      const dy = touchY.value - y.value;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        const pull = Math.min(MAX_ACCEL * 1.25, dist * 7);
        ax += (dx / dist) * pull;
        ay += (dy / dist) * pull;
      }
      drag = YERBA_DRAG * 1.7;
    }

    // ---------- 3. Movimiento con resistencia de la yerba ----------
    let nvx = (vx.value + ax * dt) * Math.exp(-drag * dt);
    let nvy = (vy.value + ay * dt) * Math.exp(-drag * dt);
    if (Math.abs(ax) < 0.5 && Math.abs(ay) < 0.5 && Math.abs(nvx) < 1.5 && Math.abs(nvy) < 1.5) {
      nvx = 0; // quieto de verdad: sin derivas
      nvy = 0;
    }
    let nx = x.value + nvx * dt;
    let ny = y.value + nvy * dt;

    // ---------- 4. Bordes: el mate rotado (con la bombilla) nunca sale de la pantalla ----------
    const ang = (rot.value * Math.PI) / 180;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (let i = 0; i < MATE_OUTLINE_POINTS; i++) {
      const ox = MATE_OUTLINE[i * 2] * size * sx.value;
      const oy = MATE_OUTLINE[i * 2 + 1] * size * sy.value;
      const rx = ox * ca - oy * sa;
      const ry = ox * sa + oy * ca;
      if (rx < minX) minX = rx;
      if (rx > maxX) maxX = rx;
      if (ry < minY) minY = ry;
      if (ry > maxY) maxY = ry;
    }
    const impact = (v: number, axis: number, hx: number, hy: number) => {
      const s = Math.abs(v);
      if (s > 60) {
        // Los pingüinos cercanos al golpe dan un saltito, empezando por los más cercanos
        const strength = Math.min(1, (s - 60) / 380);
        hit.value = { t: clock.value, s: strength, x: hx, y: hy };
        // Vibración del golpe (como mucho una cada 90 ms, aunque toque dos cosas a la vez)
        if (clock.value - lastKnock.value > 0.09) {
          lastKnock.value = clock.value;
          scheduleOnRN(knock, strength);
        }
      }
      if (s > 120) {
        const amt = 0.05 * Math.min(1, (s - 120) / 380); // hasta ~5%
        if (axis === 0) {
          squashX.value = amt;
          squashXV.value = 0;
        } else {
          squashY.value = amt;
          squashYV.value = 0;
        }
      }
    };
    if (nx + minX < b.left) {
      nx = b.left - minX;
      if (nvx < 0) { impact(nvx, 0, b.left, ny); nvx = -nvx * RESTITUTION; }
    } else if (nx + maxX > b.right) {
      nx = b.right - maxX;
      if (nvx > 0) { impact(nvx, 0, b.right, ny); nvx = -nvx * RESTITUTION; }
    }
    if (ny + minY < b.top) {
      ny = b.top - minY;
      if (nvy < 0) { impact(nvy, 1, nx, b.top); nvy = -nvy * RESTITUTION; }
    } else if (ny + maxY > b.bottom) {
      ny = b.bottom - maxY;
      if (nvy > 0) { impact(nvy, 1, nx, b.bottom); nvy = -nvy * RESTITUTION; }
    }

    // ---------- 4b. Pingüinos: la calabaza y la bombilla rebotan contra sus cuerpos ----------
    const R = (size / 2) * (sx.value + sy.value) / 2;
    for (let i = 0; i < bodies.length; i += 3) {
      const px = bodies[i];
      const py = bodies[i + 1];
      const pr = bodies[i + 2];
      // Tres puntos del mate: el centro de la boca (con su radio), la mitad y la punta de la bombilla
      for (let k = 0; k < 3; k++) {
        const off = k === 0 ? 0 : k === 1 ? 0.6 * size : 0.92 * size;
        const qx = nx - off * sa;
        const qy = ny + off * ca;
        const reach = (k === 0 ? R : 0.05 * size) + pr;
        const dx = qx - px;
        const dy = qy - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= reach || d < 0.001) continue;
        const ux = dx / d;
        const uy = dy / d;
        nx += ux * (reach - d);
        ny += uy * (reach - d);
        const vn = nvx * ux + nvy * uy;
        if (vn < 0) {
          impact(vn, Math.abs(ux) > Math.abs(uy) ? 0 : 1, px, py);
          nvx -= (1 + RESTITUTION) * vn * ux;
          nvy -= (1 + RESTITUTION) * vn * uy;
        }
      }
    }
    // Si un pingüino lo empujó contra el borde, el borde manda
    nx = Math.max(b.left - minX, Math.min(b.right - maxX, nx));
    ny = Math.max(b.top - minY, Math.min(b.bottom - maxY, ny));

    x.value = nx;
    y.value = ny;
    vx.value = nvx;
    vy.value = nvy;

    // ---------- 5. Aplastamiento con bamboleo (resorte poco amortiguado) ----------
    const K = 340;
    const C = 9;
    squashXV.value += (-K * squashX.value - C * squashXV.value) * dt;
    squashX.value += squashXV.value * dt;
    squashYV.value += (-K * squashY.value - C * squashYV.value) * dt;
    squashY.value += squashYV.value * dt;

    // ---------- 6. Giro al moverse y un vaivén muy leve ----------
    const spd = Math.sqrt(nvx * nvx + nvy * nvy);
    const leanTarget = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, (nvx / 380) * MAX_LEAN));
    lean.value = lean.value + (leanTarget - lean.value) * (1 - Math.exp(-dt / 0.35));
    const sway = 1.2 * Math.sin(t * 0.9) + 0.6 * Math.sin(t * 0.41);
    rot.value = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, lean.value + sway));
    const bob = 0.006 * Math.sin(t * 1.6);
    sx.value = 1 + bob - squashX.value + 0.5 * squashY.value;
    sy.value = 1 + bob - squashY.value + 0.5 * squashX.value;

    // ---------- 7. Ondas: solo al moverse, más y más fuertes cuanto más rápido ----------
    if (spd > 30) {
      const rate = Math.min(16, 2.5 + spd / 45);
      rippleAcc.value += rate * dt;
      while (rippleAcc.value >= 1) {
        rippleAcc.value -= 1;
        const ux = nvx / spd;
        const uy = nvy / spd;
        const back = size * 0.45;
        const list = ripples.value.slice();
        const idx = rippleNext.value;
        list[idx] = {
          x: nx - ux * back + (Math.random() - 0.5) * 10,
          y: ny - uy * back + (Math.random() - 0.5) * 10,
          t0: t,
          s: Math.max(0.15, Math.min(1, (spd - 30) / 420)),
          seed: Math.random() * 6.28,
          alive: true,
        };
        ripples.value = list;
        rippleNext.value = (idx + 1) % RIPPLE_COUNT;
      }
    } else {
      rippleAcc.value = 0;
    }
  });

  const onTouch = (e: GestureResponderEvent) => {
    askWebPermission();
    touchX.value = e.nativeEvent.pageX;
    touchY.value = e.nativeEvent.pageY;
    touching.value = 1;
  };
  const onRelease = () => {
    touching.value = 0;
  };

  const pose = { x, y, rot, sx, sy };

  return (
    <View
      style={styles.root}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={onTouch}
      onResponderMove={onTouch}
      onResponderRelease={onRelease}
      onResponderTerminate={onRelease}
    >
      <YerbaBed width={width} height={height} />
      <MateShadow size={size} pose={pose} />
      <Caustics width={width} height={height} clock={clock} />
      <YerbaTint width={width} height={height} />
      <Ripples width={width} height={height} ripples={ripples} clock={clock} />
      <PenguinRing spots={spots} clock={clock} hit={hit} />
      <Mate size={size} pose={pose} />

      <Pressable
        accessibilityRole="button"
        onPress={() => { askWebPermission(); onStart?.(); }}
        style={({ pressed }) => [
          styles.button,
          { bottom: buttonBottom, height: BUTTON_H, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <Text style={styles.buttonText}>Inicio</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#6c7a36', overflow: 'hidden' },
  button: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a2205',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonText: { color: '#3a4a12', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
});
