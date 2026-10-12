# -*- coding: utf-8 -*-
"""Procedurally synthesised cat sounds (no audio files shipped) + a tiny cross-platform player.

Meows use a source-filter model: a harmonic voice with a "mi-a-ow" pitch contour and gliding
formants, a little vibrato, jitter and breath noise, soft raised-cosine envelopes and a short room
reverb, so they sound much less like a synthesizer beep. Purrs are trains of damped low pulses that
follow a breathing rhythm. Volume is baked into the generated files (winsound has no volume control).
"""

import math
import os
import random
import shutil
import struct
import subprocess
import threading
import time
import wave

from .config import DATA_DIR, IS_MAC, IS_WIN

RATE = 22050
GEN = "v7"                       # bump to regenerate every cached file
TWO_PI = 2 * math.pi


# --------------------------------------------------------------------------------------------
# DSP helpers (pure Python; a few hundred ms per sound, generated once in a background thread)
# --------------------------------------------------------------------------------------------
def _smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _env(n, attack, release, curve=1.6):
    a, r = max(1, int(attack * RATE)), max(1, int(release * RATE))
    out = [1.0] * n
    for i in range(min(a, n)):
        out[i] = 0.5 - 0.5 * math.cos(math.pi * i / a)
    for i in range(min(r, n)):
        k = (i / r) ** curve
        out[n - 1 - i] *= 0.5 - 0.5 * math.cos(math.pi * k)
    return out


def _lowpass(x, fc):
    a = 1 - math.exp(-TWO_PI * fc / RATE)
    y, out = 0.0, []
    for v in x:
        y += a * (v - y)
        out.append(y)
    return out


def _highpass(x, fc):
    lp = _lowpass(x, fc)
    return [a - b for a, b in zip(x, lp)]


def _reverb(x, mix=0.14, tail=0.25):
    """Tiny Schroeder-style room: three combs + one allpass. Adds a soft tail."""
    n = len(x) + int(tail * RATE)
    src = x + [0.0] * (n - len(x))
    wet = [0.0] * n
    for d_ms, fb in ((29.7, 0.42), (37.1, 0.38), (41.1, 0.35)):
        d = int(d_ms * RATE / 1000)
        buf = [0.0] * n
        for i in range(n):
            buf[i] = src[i] + (fb * buf[i - d] if i >= d else 0.0)
        for i in range(n):
            wet[i] += buf[i] / 3
    d, g = int(5.0 * RATE / 1000), 0.5
    ap = [0.0] * n
    for i in range(n):
        xd = wet[i - d] if i >= d else 0.0
        yd = ap[i - d] if i >= d else 0.0
        ap[i] = -g * wet[i] + xd + g * yd
    wet = _lowpass(ap, 3500)
    return [s * (1 - mix) + w * mix for s, w in zip(src, wet)]


def _normalize(x, peak):
    m = max((abs(v) for v in x), default=0.0) or 1.0
    return [v * peak / m for v in x]


def _fade(x, ms=6):
    k = int(ms * RATE / 1000)
    for i in range(min(k, len(x))):
        x[i] *= i / k
        x[-1 - i] *= i / k
    return x


def _vowel(t, path):
    """path: [(time, F1, F2, F3)] -> interpolated formants at t (smoothstep between points)."""
    if t <= path[0][0]:
        return path[0][1:]
    for (t0, *a), (t1, *b) in zip(path, path[1:]):
        if t <= t1:
            k = _smooth((t - t0) / (t1 - t0))
            return [u + (v - u) * k for u, v in zip(a, b)]
    return path[-1][1:]


# --------------------------------------------------------------------------------------------
# voices
# --------------------------------------------------------------------------------------------
def _voice(dur, f_of_t, vowels, rnd, breath=0.05, rough=0.0, attack=0.06, release=0.2, am=None):
    """Harmonic source shaped by gliding formants. f_of_t(t in 0..1) -> Hz."""
    n = int(dur * RATE)
    env = _env(n, attack, release)
    out = [0.0] * n
    phase = 0.0
    jit = 0.0
    weights = []
    block = 48
    vib_rate = rnd.uniform(5.0, 6.2)
    noise_lp = 0.0
    for i in range(n):
        t = i / n
        jit += (rnd.uniform(-1, 1) - jit) * 0.02
        vib = 1 + 0.012 * math.sin(TWO_PI * vib_rate * i / RATE) * _smooth((t - 0.25) / 0.3)
        f = f_of_t(t) * vib * (1 + 0.006 * jit)
        phase += TWO_PI * f / RATE
        if i % block == 0:
            F1, F2, F3 = _vowel(t, vowels)
            weights = []
            h = 1
            while h * f < 5200 and h <= 16:
                hf = h * f
                w = (math.exp(-((hf - F1) / (90 + 0.12 * F1)) ** 2)
                     + 0.62 * math.exp(-((hf - F2) / (130 + 0.08 * F2)) ** 2)
                     + 0.22 * math.exp(-((hf - F3) / 260) ** 2)
                     + 0.04) / h ** 0.55
                weights.append(w)
                h += 1
        s = 0.0
        for h, w in enumerate(weights, 1):
            s += w * math.sin(h * phase + (rough * math.sin(phase * 0.5) if h > 1 else 0.0))
        noise_lp += (rnd.uniform(-1, 1) - noise_lp) * 0.35
        s += breath * noise_lp * 3.0
        if am is not None:
            s *= am(i / RATE)
        out[i] = s * env[i]
    return out


def meow(f0, dur, rnd, kitten=False, soft=False, rough=0.0):
    up = rnd.uniform(0.28, 0.42)
    tail = rnd.uniform(0.12, 0.24)

    def f(t):
        rise = math.sin(math.pi * min(1.0, t / 0.62) ** 0.8)
        return f0 * (0.84 + up * rise - tail * max(0.0, t - 0.6) / 0.4)
    if kitten:
        vowels = [(0.0, 420, 2500, 3300), (0.3, 950, 1750, 3100), (0.75, 820, 1400, 3000), (1.0, 600, 1100, 2900)]
    else:
        vowels = [(0.0, 330, 2100, 3000), (0.18, 520, 1900, 2900), (0.42, 920, 1500, 2800),
                  (0.75, 760, 1150, 2700), (1.0, 480, 850, 2600)]
    x = _voice(dur, f, vowels, rnd, breath=0.16 if soft else 0.06, rough=rough,
               attack=0.09 if soft else 0.055, release=0.24 if soft else 0.2)
    x = _lowpass(x, 3400 if soft else 4600)
    return _reverb(x, 0.16)


def trill(f0, rnd, dur=0.42):
    rate = rnd.uniform(24, 30)

    def f(t):
        return f0 * (0.82 + 0.38 * _smooth(t / 0.7) - 0.08 * max(0.0, t - 0.7))
    vowels = [(0.0, 380, 1300, 2600), (0.6, 560, 1400, 2700), (1.0, 640, 1600, 2800)]
    x = _voice(dur, f, vowels, rnd, breath=0.08, attack=0.03, release=0.16,
               am=lambda s: 0.45 + 0.55 * (0.5 + 0.5 * math.sin(TWO_PI * rate * s)) ** 1.5)
    return _reverb(_lowpass(x, 3600), 0.15)


def chirp(f0, rnd, n=4):
    out = []
    for k in range(n):
        d = rnd.uniform(0.045, 0.07)
        x = _voice(d, lambda t, k=k: f0 * (1.15 - 0.3 * t) * (1 - 0.03 * k),
                   [(0.0, 900, 1900, 3000), (1.0, 750, 1500, 2900)], rnd, breath=0.12, attack=0.008, release=0.03)
        out += x + [0.0] * int(rnd.uniform(0.06, 0.1) * RATE)
    return _reverb(_lowpass(out, 4200), 0.12)


def purr(rnd, dur=1.8, f=120.0, light=False):
    n = int(dur * RATE)
    out = [0.0] * n
    t = 0.05
    breath_period = rnd.uniform(1.3, 1.6)
    while t < dur - 0.05:
        cyc = (t % breath_period) / breath_period
        exhale = cyc < 0.62
        amp = (1.0 if exhale else 0.62) * (0.85 + 0.3 * rnd.random())
        rate = (23.5 if exhale else 26.5) * rnd.uniform(0.97, 1.03)
        fr = f * rnd.uniform(0.85, 1.15)
        start = int(t * RATE)
        L = int(0.034 * RATE)
        ph = rnd.uniform(0, TWO_PI)
        for j in range(L):
            i = start + j
            if i >= n:
                break
            e = math.exp(-j / (0.0075 * RATE)) * min(1.0, j / 30)
            out[i] += amp * e * (math.sin(ph + TWO_PI * fr * j / RATE) + 0.45 * rnd.uniform(-1, 1))
        t += 1.0 / rate
    out = _lowpass(_lowpass(out, 520 if light else 700), 900)
    env = _env(n, 0.25, 0.35)
    return [v * e for v, e in zip(out, env)]


def hiss(rnd, dur=0.55):
    n = int(dur * RATE)
    x = [rnd.uniform(-1, 1) for _ in range(n)]
    x = _lowpass(_highpass(x, 2200), 6500)
    env = _env(n, 0.035, 0.32, 1.0)
    return _reverb([v * e for v, e in zip(x, env)], 0.1)


def nom(rnd, dur=1.0):
    n = int(dur * RATE)
    out = [0.0] * n
    t = 0.04
    while t < dur - 0.08:
        start = int(t * RATE)
        L = int(rnd.uniform(0.02, 0.04) * RATE)
        amp = rnd.uniform(0.5, 1.0)
        burst = _lowpass([rnd.uniform(-1, 1) for _ in range(L)], rnd.uniform(1200, 2400))
        for j, v in enumerate(burst):
            if start + j < n:
                out[start + j] += amp * v * math.exp(-j / (0.008 * RATE))
        t += rnd.uniform(0.09, 0.2)
    return _reverb(out, 0.08)


def chime(rnd):
    n = int(0.95 * RATE)
    out = [0.0] * n
    for start, f in ((0.0, 1318.5), (0.16, 987.8)):
        s0 = int(start * RATE)
        for j in range(n - s0):
            t = j / RATE
            e = math.exp(-t / 0.28) * min(1.0, j / 60)
            out[s0 + j] += e * (math.sin(TWO_PI * f * t) + 0.18 * math.sin(TWO_PI * 2 * f * t)
                                + 0.08 * math.sin(TWO_PI * 2.76 * f * t))
    return _reverb(out, 0.2, 0.3)


# ---- household sounds for the cat house -------------------------------------------------------
def _ting(out, start, freqs, decay, amp=1.0):
    s0 = int(start * RATE)
    for j in range(len(out) - s0):
        t = j / RATE
        e = math.exp(-t / decay) * min(1.0, j / 20)
        if j > 40 and e < 0.002:
            break
        out[s0 + j] += amp * e * sum(math.sin(TWO_PI * f * t) / (k + 1) for k, f in enumerate(freqs))


def clink(rnd):
    n = int(0.6 * RATE)
    out = [0.0] * n
    _ting(out, 0.0, (2093, 3301, 5040), 0.09)
    _ting(out, 0.11, (1975, 3190), 0.06, 0.45)
    return _reverb(out, 0.18, 0.2)


def dishes(rnd):
    n = int(0.9 * RATE)
    out = [0.0] * n
    t = 0.02
    while t < 0.7:
        f = rnd.uniform(1700, 2900)
        _ting(out, t, (f, f * 1.58, f * 2.4), rnd.uniform(0.04, 0.08), rnd.uniform(0.4, 0.9))
        t += rnd.uniform(0.07, 0.18)
    return _reverb(out, 0.15, 0.2)


def door(rnd):
    n = int(0.7 * RATE)
    out = [0.0] * n
    for i in range(n):
        t = i / RATE
        creak = 0.0
        if 0.02 < t < 0.32:
            f = 260 + 90 * math.sin(t * 22)
            creak = 0.25 * (math.sin(TWO_PI * f * t) > 0) * math.sin(math.pi * (t - 0.02) / 0.3)
        thud = math.exp(-max(0.0, t - 0.38) / 0.06) * math.sin(TWO_PI * 85 * t) if t >= 0.38 else 0.0
        out[i] = creak + thud + 0.05 * rnd.uniform(-1, 1) * (t > 0.38) * math.exp(-(t - 0.38) / 0.05)
    return _reverb(_lowpass(out, 1800), 0.2, 0.25)


def snore(rnd, dur=1.8):
    n = int(dur * RATE)
    out = []
    for i in range(n):
        t = i / RATE
        breath = max(0.0, math.sin(math.pi * t / (dur * 0.62))) if t < dur * 0.62 else \
            0.35 * max(0.0, math.sin(math.pi * (t - dur * 0.62) / (dur * 0.38)))
        buzz = math.sin(TWO_PI * 62 * t) * (0.6 + 0.4 * math.sin(TWO_PI * 31 * t))
        out.append(breath * (0.7 * buzz + 0.5 * rnd.uniform(-1, 1)))
    return _lowpass(_lowpass(out, 420), 600)


def rain(rnd, dur=2.4):
    n = int(dur * RATE)
    x = [rnd.uniform(-1, 1) for _ in range(n)]
    x = _lowpass(_highpass(x, 500), 4200)
    out = [v * 0.35 for v in x]
    for _ in range(90):                       # single drops on the window
        _ting(out, rnd.uniform(0, dur - 0.1), (rnd.uniform(2500, 5200),), 0.012, rnd.uniform(0.15, 0.45))
    env = _env(n, 0.5, 0.7, 1.0)
    return [v * e for v, e in zip(out, env)]


def tv(rnd, dur=1.7):
    """A murmur through the wall: syllables of a voice, a little music under it."""
    n = int(dur * RATE)
    out = [0.0] * n
    t = 0.05
    while t < dur - 0.15:
        L = rnd.uniform(0.08, 0.16)
        f0 = rnd.uniform(140, 230)
        s0, s1 = int(t * RATE), int((t + L) * RATE)
        for i in range(s0, min(n, s1)):
            u = (i - s0) / (s1 - s0)
            e = math.sin(math.pi * u)
            tt = i / RATE
            out[i] += e * (math.sin(TWO_PI * f0 * tt) + 0.5 * math.sin(TWO_PI * f0 * 2 * tt) + 0.3 * rnd.uniform(-1, 1))
        t += L + rnd.uniform(0.02, 0.09)
    for i in range(n):
        tt = i / RATE
        out[i] += 0.12 * math.sin(TWO_PI * (392 if tt < dur / 2 else 440) * tt)
    out = _lowpass(_lowpass(out, 900), 1300)
    env = _env(n, 0.2, 0.4)
    return [v * e for v, e in zip(out, env)]


def splash(rnd, dur=0.9):
    n = int(dur * RATE)
    x = [rnd.uniform(-1, 1) for _ in range(n)]
    x = _lowpass(_highpass(x, 900), 5000)
    env = [math.sin(math.pi * min(1.0, i / n)) ** 0.6 for i in range(n)]
    out = [v * e * 0.6 for v, e in zip(x, env)]
    for _ in range(14):
        _ting(out, rnd.uniform(0.1, dur - 0.1), (rnd.uniform(900, 1800),), 0.02, 0.3)
    return out


def clap(rnd, n_claps=3):
    n = int(0.75 * RATE)
    out = [0.0] * n
    for k in range(n_claps):
        s0 = int((0.03 + k * 0.22) * RATE)
        burst = _lowpass(_highpass([rnd.uniform(-1, 1) for _ in range(int(0.05 * RATE))], 700), 3500)
        for j, v in enumerate(burst):
            if s0 + j < n:
                out[s0 + j] += v * math.exp(-j / (0.009 * RATE))
    return _reverb(out, 0.15, 0.15)


def pop(rnd):
    n = int(0.25 * RATE)
    out = []
    for i in range(n):
        t = i / RATE
        f = 500 + 900 * t / 0.25
        out.append(math.exp(-t / 0.07) * math.sin(TWO_PI * f * t))
    return out


# ---- battle sounds: short and punchy
def _thump(rnd, dur, f0, f1, noise, nlp):
    n = int(dur * RATE)
    nz = _lowpass([rnd.uniform(-1, 1) for _ in range(n)], nlp)
    out, ph = [], 0.0
    for i in range(n):
        t = i / RATE
        f = f1 + (f0 - f1) * math.exp(-t / (dur * 0.25))
        ph += TWO_PI * f / RATE
        e = math.exp(-t / (dur * 0.28))
        en = math.exp(-t / (dur * 0.12))
        out.append(e * math.sin(ph) + noise * en * nz[i] * 4)
    return out


def hit(rnd):
    return _thump(rnd, 0.14, 190, 70, 0.7, 2600)


def hit2(rnd):
    x = _thump(rnd, 0.26, 150, 45, 0.9, 1800)
    return _reverb(x, 0.12, 0.12)


def whoosh(rnd, dur=0.2):
    n = int(dur * RATE)
    x = [rnd.uniform(-1, 1) for _ in range(n)]
    out, lp, bp = [], 0.0, 0.0
    for i in range(n):
        u = i / n
        fc = 600 + 2600 * math.sin(math.pi * u)
        a = 1 - math.exp(-TWO_PI * fc / RATE)
        lp += a * (x[i] - lp)
        bp += 0.08 * (lp - bp)
        out.append((lp - bp) * math.sin(math.pi * u) ** 1.5)
    return out


def block(rnd):
    n = int(0.18 * RATE)
    out = [0.0] * n
    _ting(out, 0.0, (1250, 1870, 3020), 0.05, 1.0)
    click = _highpass([rnd.uniform(-1, 1) for _ in range(int(0.015 * RATE))], 2000)
    for i, v in enumerate(click):
        out[i] += v * 0.8 * (1 - i / len(click))
    return out


def boom(rnd, dur=0.6):
    n = int(dur * RATE)
    nz = _lowpass(_lowpass([rnd.uniform(-1, 1) for _ in range(n)], 400), 300)
    out, ph = [], 0.0
    for i in range(n):
        t = i / RATE
        ph += TWO_PI * (38 + 50 * math.exp(-t / 0.08)) / RATE
        e = math.exp(-t / 0.18)
        out.append(0.8 * e * math.sin(ph) + 5.0 * nz[i] * math.exp(-t / 0.25))
    return _reverb(out, 0.15, 0.2)


def oof(rnd):
    x = _voice(0.2, lambda t: 230 - 70 * t, [(0.0, 600, 1100, 2500), (1.0, 380, 800, 2400)], rnd, breath=0.12,
               attack=0.012, release=0.12)
    return _lowpass(x, 3000)


def rustle(rnd, dur=0.42):
    """(v27) A soft 沙沙 from inside the furniture: a few quiet scratchy bursts of filtered noise."""
    n = int(dur * RATE)
    out, lp = [], 0.0
    bursts = [(0.0, 0.12), (0.15, 0.1), (0.29, 0.12)]
    for i in range(n):
        u = i / RATE
        env = 0.0
        for b0, bl in bursts:
            if b0 <= u < b0 + bl:
                env = math.sin(math.pi * (u - b0) / bl) ** 2
        x = rnd.uniform(-1, 1)
        lp += 0.35 * (x - lp)
        out.append(lp * env * 0.22)
    return _fade(out)


HOUSE_SOUNDS = {"clink": clink, "dishes": dishes, "door": door, "snore": snore, "rain": rain, "tv": tv,
                "splash": splash, "clap": clap, "pop": pop, "hit": hit, "hit2": hit2, "whoosh": whoosh,
                "block": block, "boom": boom, "oof": oof, "rustle": rustle}
BATTLE_SOUNDS = ("hit", "hit2", "whoosh", "block", "boom", "oof")


# loudness of each sound relative to the master volume
LOUD = {"meow": 0.55, "mew": 0.45, "trill": 0.45, "chirp": 0.35, "purr": 0.5, "hiss": 0.22,
        "eat": 0.32, "chime": 0.32, "clink": 0.3, "dishes": 0.26, "door": 0.3, "snore": 0.16, "rain": 0.14,
        "tv": 0.12, "splash": 0.2, "clap": 0.3, "pop": 0.24, "hit": 0.34, "hit2": 0.4, "whoosh": 0.16,
        "block": 0.2, "boom": 0.34, "oof": 0.26, "rustle": 0.12}


def build_specs(voice, kind):
    """{file_stem: (sound, generator)} for one cat's voice."""
    pitch = 1.07 if kind == "calico" else 0.94
    rough = 0.0 if kind == "calico" else 0.12
    seed = 11 if kind == "calico" else 23
    specs = {}

    def add(name, i, fn):
        specs["%s%d" % (name, i)] = (name, fn)

    if voice in ("adult", "chirpy", "soft"):
        soft = voice == "soft"
        for i, (f0, d) in enumerate(((560, 0.62), (650, 0.48), (500, 0.78))):
            add("meow", i, lambda f0=f0, d=d, i=i: meow(f0 * pitch, d * (0.85 if soft else 1.0),
                                                       random.Random(seed + i), soft=soft, rough=rough))
        add("mew", 0, lambda: meow(820 * pitch, 0.28, random.Random(seed + 7), kitten=True, soft=soft))
    elif voice == "kitten":
        for i, (f0, d) in enumerate(((930, 0.32), (1050, 0.26), (880, 0.42))):
            add("meow", i, lambda f0=f0, d=d, i=i: meow(f0 * pitch, d, random.Random(seed + i), kitten=True))
        add("mew", 0, lambda: meow(1150 * pitch, 0.2, random.Random(seed + 7), kitten=True))
    kit = voice == "kitten"
    add("trill", 0, lambda: trill((620 if kit else 470) * pitch, random.Random(seed + 3)))
    add("trill", 1, lambda: trill((680 if kit else 520) * pitch, random.Random(seed + 4), 0.32))
    add("chirp", 0, lambda: chirp((1500 if kit else 1150) * pitch, random.Random(seed + 5)))
    add("purr", 0, lambda: purr(random.Random(seed + 6), f=130 * pitch, light=voice in ("soft", "kitten")))
    add("hiss", 0, lambda: hiss(random.Random(seed + 8)))
    add("eat", 0, lambda: nom(random.Random(seed + 9)))
    add("chime", 0, lambda: chime(random.Random(1)))
    if kind == "calico":                      # household sounds: one shared set
        for name, fn in HOUSE_SOUNDS.items():
            add(name, 0, lambda fn=fn, name=name: fn(random.Random(hash(name) % 1000)))
    return specs


def _write(path, samples):
    tmp = path + ".tmp"
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1.0, min(1.0, s)) * 32767)) for s in samples))
    os.replace(tmp, path)


# --------------------------------------------------------------------------------------------
# player
# --------------------------------------------------------------------------------------------
class Sounds:
    def __init__(self):
        self.dir = os.path.join(DATA_DIR, "sounds")
        self.lock = threading.Lock()
        self.files = {}                 # (kind, sound) -> [paths]
        self.key = None
        self.building = False
        self.want = None
        self.last = {}
        self.last_any = 0.0
        self.player = None
        if not IS_WIN and not IS_MAC:
            self.player = next((p for p in ("paplay", "aplay") if shutil.which(p)), None)

    def configure(self, voice, volume):
        """Make sure files for this voice / volume exist (built in the background)."""
        key = (voice, int(round(volume / 5.0)) * 5)
        if key == self.key or key == self.want:
            return
        self.want = key
        if not self.building:
            self.building = True
            threading.Thread(target=self._build_loop, daemon=True).start()

    def _build_loop(self):
        try:
            while True:
                with self.lock:
                    key = self.want
                if key is None or key == self.key:
                    break
                files = self._build(*key)
                with self.lock:
                    if self.want == key:
                        self.files, self.key = files, key
                        self._cleanup(key)
        except Exception as ex:
            print("sound build:", ex)
        finally:
            self.building = False

    def _build(self, voice, vol):
        os.makedirs(self.dir, exist_ok=True)
        gain = 0.68 * (vol / 100.0) ** 1.6
        files = {}
        for kind in ("calico", "tabby"):
            for stem, (snd, fn) in build_specs(voice, kind).items():
                if snd == "chime" and kind == "tabby":
                    continue          # one shared chime; play() falls back to the calico file
                path = os.path.join(self.dir, "%s_%s_%s_%s_v%d.wav" % (GEN, voice, kind, stem, vol))
                if not os.path.exists(path):
                    _write(path, _fade(_normalize(fn(), gain * LOUD.get(snd, 0.4))))
                files.setdefault((kind, snd), []).append(path)
                if self.want != (voice, vol):
                    return files          # settings changed again; restart with the new ones
        return files

    def _cleanup(self, key):
        keep = "%s_%s_" % (GEN, key[0])
        suffix = "_v%d.wav" % key[1]
        try:
            for f in os.listdir(self.dir):
                if f.endswith(".wav") and not (f.startswith(keep) and f.endswith(suffix)):
                    os.remove(os.path.join(self.dir, f))
        except OSError:
            pass

    def ready(self):
        return bool(self.files)

    def play(self, sound, kind="calico", min_gap=1.0):
        now = time.monotonic()
        gap_any = 0.06 if sound in BATTLE_SOUNDS else 0.35      # fights are busy: let the hits through
        if now - self.last_any < gap_any or now - self.last.get(sound, 0.0) < min_gap:
            return False
        paths = self.files.get((kind, sound)) or self.files.get(("calico", sound))
        if not paths:
            return False
        self.last[sound] = self.last_any = now
        path = random.choice(paths)
        try:
            if IS_WIN:
                import winsound
                winsound.PlaySound(path, winsound.SND_FILENAME | winsound.SND_ASYNC | winsound.SND_NODEFAULT)
            elif IS_MAC:
                subprocess.Popen(["afplay", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            elif self.player:
                subprocess.Popen([self.player, path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            return False
        return True
