"""Genera los sonidos sintetizados de la app en assets/sounds/ (WAV mono, 44.1 kHz):
pop y festejo. Los sorbos (sorbo*.wav) son grabaciones reales: ver assets/sounds/CREDITOS.md.
Uso: python3 scripts/generate-sounds.py
"""
import math
import os
import struct
import wave

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


def save(name, samples, peak=0.85):
    m = max(1e-9, max(abs(s) for s in samples))
    k = peak / m
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s * k)) * 32767)) for s in samples))


def n(sec):
    return int(sec * SR)


def lowpass(x, hz):
    a = 1 - math.exp(-2 * math.pi * hz / SR)
    y, out = 0.0, []
    for s in x:
        y += a * (s - y)
        out.append(y)
    return out


def fade(x, fin=0.004, fout=0.01):
    a, b = n(fin), n(fout)
    out = list(x)
    for i in range(min(a, len(out))):
        out[i] *= i / a
    for i in range(min(b, len(out))):
        out[-1 - i] *= i / b
    return out


# Pop de botón: "blup" suave y corto, grave
def pop():
    d = n(0.06)
    out, ph = [], 0.0
    for i in range(d):
        t = i / SR
        f = 300 + 260 * math.exp(-t * 70)
        ph += 2 * math.pi * f / SR
        out.append(math.sin(ph) * math.sin(math.pi * min(1, t / 0.006)) * math.exp(-t * 75))
    return lowpass(fade(out, 0.001, 0.012), 2500)


# Festejo: arpegio tipo marimba al llegar a la meta
def festejo():
    notes = [523.25, 659.25, 783.99, 1046.5]
    d = n(1.1)
    out = [0.0] * d
    for k, f in enumerate(notes):
        start = n(0.11 * k)
        last = k == len(notes) - 1
        for j in range(d - start):
            t = j / SR
            dec = 5 if last else 9
            v = (math.sin(2 * math.pi * f * t) + 0.35 * math.sin(2 * math.pi * f * 4 * t) * math.exp(-t * 30)) * math.exp(-t * dec)
            out[start + j] += v * (1.2 if last else 1)
    return fade(out, 0.001, 0.05)


if __name__ == '__main__':
    save('pop', pop(), 0.45)
    save('festejo', festejo(), 0.6)
    print('Sonidos generados en', os.path.normpath(OUT))
