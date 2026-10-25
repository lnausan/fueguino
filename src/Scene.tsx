import React, { useEffect, useRef } from 'react';
import { GestureResponderEvent, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  SensorType,
  useAnimatedSensor,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Caustics, PoolFloor, WaterTint } from './PoolLayers';
import Ripples, { RIPPLE_COUNT, Ripple, emptyRipples } from './Ripples';
import { Floater, FloaterShadow } from './Floater';
import { OUTLINE, OUTLINE_POINTS } from './outline';

// ---------- Ajustes de la física ----------
const DEAD_ZONE = 3; // grados de temblor de la mano que se ignoran
const FULL_TILT = 24; // grados (más allá de la zona muerta) para llegar a la fuerza máxima
const MAX_ACCEL = 720; // px/s² con inclinación máxima
const WATER_DRAG = 1.6; // resistencia del agua (1/s): acelera suave y frena por inercia
const LEVEL_FOLLOW = 3.3; // s: el "nivel" sigue la mano (~95% en 10 s)
const ANGLE_SMOOTH = 0.08; // s: filtro del sensor
const INPUT_EASE = 0.18; // s: la fuerza entra de forma gradual
const RESTITUTION = 0.45; // cuánto rebota en las paredes
const MAX_LEAN = 30; // grados de inclinación máxima al moverse
const BUTTON_H = 58;

export default function Scene({ onStart }: { onStart?: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const size = Math.round(Math.min(width * 0.52, 230));

  const buttonBottom = insets.bottom + 18;
  const bounds = {
    left: 8,
    right: width - 8,
    top: insets.top + 8,
    bottom: height - buttonBottom - BUTTON_H - 14,
  };

  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });

  // Estado de la física (todo vive en el hilo de UI)
  const x = useSharedValue(width / 2);
  const y = useSharedValue((bounds.top + bounds.bottom) / 2);
  const vx = useSharedValue(0);
  const vy = useSharedValue(0);
  const rot = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const lean = useSharedValue(0);
  const speed = useSharedValue(0);
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
    let drag = WATER_DRAG;

    // ---------- 2. Mantener apretado sobre el agua: se desliza hacia el dedo ----------
    if (touching.value === 1) {
      const dx = touchX.value - x.value;
      const dy = touchY.value - y.value;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        const pull = Math.min(MAX_ACCEL * 1.25, dist * 7);
        ax += (dx / dist) * pull;
        ay += (dy / dist) * pull;
      }
      drag = WATER_DRAG * 1.7;
    }

    // ---------- 3. Movimiento con resistencia del agua ----------
    let nvx = (vx.value + ax * dt) * Math.exp(-drag * dt);
    let nvy = (vy.value + ay * dt) * Math.exp(-drag * dt);
    if (Math.abs(ax) < 0.5 && Math.abs(ay) < 0.5 && Math.abs(nvx) < 1.5 && Math.abs(nvy) < 1.5) {
      nvx = 0; // quieto de verdad: sin derivas
      nvy = 0;
    }
    let nx = x.value + nvx * dt;
    let ny = y.value + nvy * dt;

    // ---------- 4. Bordes: la silueta rotada nunca sale de la pantalla ----------
    const ang = (rot.value * Math.PI) / 180;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (let i = 0; i < OUTLINE_POINTS; i++) {
      const ox = OUTLINE[i * 2] * size * sx.value;
      const oy = OUTLINE[i * 2 + 1] * size * sy.value;
      const rx = ox * ca - oy * sa;
      const ry = ox * sa + oy * ca;
      if (rx < minX) minX = rx;
      if (rx > maxX) maxX = rx;
      if (ry < minY) minY = ry;
      if (ry > maxY) maxY = ry;
    }
    const impact = (v: number, axis: number) => {
      const s = Math.abs(v);
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
      if (nvx < 0) { impact(nvx, 0); nvx = -nvx * RESTITUTION; }
    } else if (nx + maxX > b.right) {
      nx = b.right - maxX;
      if (nvx > 0) { impact(nvx, 0); nvx = -nvx * RESTITUTION; }
    }
    if (ny + minY < b.top) {
      ny = b.top - minY;
      if (nvy < 0) { impact(nvy, 1); nvy = -nvy * RESTITUTION; }
    } else if (ny + maxY > b.bottom) {
      ny = b.bottom - maxY;
      if (nvy > 0) { impact(nvy, 1); nvy = -nvy * RESTITUTION; }
    }
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

    // ---------- 6. Flotación e inclinación tipo barco ----------
    const spd = Math.sqrt(nvx * nvx + nvy * nvy);
    speed.value = spd;
    const leanTarget = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, (nvx / 380) * MAX_LEAN));
    lean.value = lean.value + (leanTarget - lean.value) * (1 - Math.exp(-dt / 0.35));
    const sway = 1.6 * Math.sin(t * 1.05) + 0.8 * Math.sin(t * 0.47);
    rot.value = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, lean.value + sway));
    const bob = 0.012 * Math.sin(t * 1.6);
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
        const back = size * 0.3;
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
      <PoolFloor width={width} height={height} />
      <FloaterShadow size={size} pose={pose} />
      <Caustics width={width} height={height} clock={clock} />
      <WaterTint width={width} height={height} />
      <Ripples width={width} height={height} ripples={ripples} clock={clock} />
      <Floater size={size} pose={pose} clock={clock} speed={speed} />

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
  root: { flex: 1, backgroundColor: '#06304f', overflow: 'hidden' },
  button: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#001b30',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonText: { color: '#0a3a5c', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
});
