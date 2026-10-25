"""Genera los sonidos sintetizados de la app en assets/sounds/ (WAV mono, 44.1 kHz):
pop, toc, deslizar y festejo. Los sorbos (sorbo*.wav) son grabaciones reales: ver assets/sounds/CREDITOS.md.
Uso: python3 scripts/generate-sounds.py
"""
import math
import os
import random
import struct
import wave

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')
rnd = random.Random(7)


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


def noise(count):
    return [rnd.uniform(-1, 1) for _ in range(count)]


def lowpass(x, hz):
    a = 1 - math.exp(-2 * math.pi * hz / SR)
    y, out = 0.0, []
    for s in x:
        y += a * (s - y)
        out.append(y)
    return out


def highpass(x, hz):
    lp = lowpass(x, hz)
    return [a - b for a, b in zip(x, lp)]


def bandpass(x, lo, hi):
    return lowpass(highpass(x, lo), hi)


def fade(x, fin=0.004, fout=0.01):
    a, b = n(fin), n(fout)
    out = list(x)
    for i in range(min(a, len(out))):
        out[i] *= i / a
    for i in range(min(b, len(out))):
        out[-1 - i] *= i / b
    return out


def loopable(x, cross=0.25):
    """Funde el final con el principio para que el loop no haga click."""
    c = n(cross)
    body = x[: len(x) - c]
    tail = x[len(x) - c:]
    for i in range(c):
        t = i / c
        body[i] = body[i] * t + tail[i] * (1 - t)
    return body


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


# Toc: el mate (calabaza) chocando, golpe de madera
def toc():
    d = n(0.16)
    out = []
    hit = bandpass(noise(d), 600, 3500)
    for i in range(d):
        t = i / SR
        body = (0.9 * math.sin(2 * math.pi * 210 * t) * math.exp(-t * 32)
                + 0.5 * math.sin(2 * math.pi * 520 * t) * math.exp(-t * 48)
                + 0.25 * math.sin(2 * math.pi * 1180 * t) * math.exp(-t * 70))
        out.append(body + 0.6 * hit[i] * math.exp(-t * 160))
    return fade(out, 0.0005, 0.02)


# Deslizar: roce suave sobre la yerba mojada (loop)
def deslizar():
    d = n(2.25)
    base = bandpass(noise(d), 250, 1600)
    swish = [s * (0.65 + 0.35 * math.sin(2 * math.pi * 0.9 * i / SR)) for i, s in enumerate(base)]
    # crujidos sueltos de yerba
    crack = [0.0] * d
    for _ in range(90):
        at = rnd.randrange(d - n(0.01))
        amp = rnd.uniform(0.3, 1)
        for j in range(n(0.006)):
            crack[at + j] += rnd.uniform(-1, 1) * amp * math.exp(-j / (SR * 0.0015))
    crack = highpass(crack, 2500)
    return loopable([a + 0.5 * b for a, b in zip(swish, crack)])


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
    save('toc', toc(), 0.75)
    save('deslizar', deslizar(), 0.6)
    save('festejo', festejo(), 0.6)
    print('Sonidos generados en', os.path.normpath(OUT))
