"""Original score for 《越饿越胖》, built on the same timeline as the picture.

Piano (Salamander, via scripts/piano.py), a filtered string pad, a heartbeat, sub hits on every number
that slams in, risers, month ticks, swishes for the struck slogans. D minor until 七, then D major.
Writes out/audio/diet.wav at -14 LUFS.
"""
import os
import subprocess
import sys

import numpy as np
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'scripts'))
import piano  # noqa: E402
import timeline as TL  # noqa: E402

SR = piano.SR
RNG = np.random.default_rng(48)
tl = TL.build(); C = tl['cues']; DUR = tl['duration']
b = TL.b
OUT = os.path.join(HERE, '..', 'out', 'audio')
os.makedirs(OUT, exist_ok=True)

# chords as MIDI pitch lists (root first)
Dm, Bb, Gm, A, DmC = [50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52], [48, 50, 53, 57]
D, Amaj, Bm, G = [50, 54, 57], [45, 49, 52], [47, 50, 54], [43, 47, 50]
DARK = [Dm, Bb, Gm, A]
TENSE = [Dm, DmC, Bb, A]
LIGHT = [D, Amaj, Bm, G]


def chord_at(bar):
    if bar < 15: return DARK[bar % 4]
    if bar < 26: return TENSE[bar % 4]
    if bar < 48: return DARK[bar % 4]
    if bar < 57: return LIGHT[(bar - 48) % 4]
    return D


class Bus:
    def __init__(self):
        self.x = np.zeros((int((DUR + 8) * SR), 2), np.float32)

    def add(self, clip, at, gain=1.0, pan=0.0):
        if clip.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            clip = np.stack([clip * l * 1.414, clip * r * 1.414], 1)
        s = int(round(at * SR)); e = min(len(self.x), s + len(clip))
        if 0 <= s < len(self.x):
            self.x[s:e] += clip[:e - s] * gain


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- sounds ----
def heartbeat(k=1.0):
    n = int(0.6 * SR); t = np.arange(n) / SR
    def thump(t0, f0, dec, amp):
        u = np.clip(t - t0, 0, None); on = t >= t0
        f = f0 * (1 + 0.8 * np.exp(-u / 0.02))
        return on * amp * np.sin(2 * np.pi * np.cumsum(f * on) / SR) * np.exp(-u / dec)
    y = thump(0.0, 52, 0.09, 1.0) + thump(0.24, 46, 0.08, 0.6)
    return (y * k).astype(np.float32)


def sub_hit(dur=3.0, k=1.0):
    t = np.arange(int(dur * SR)) / SR
    f = 34 + 70 * np.exp(-t / 0.08)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    click = hp(RNG.standard_normal(len(t)), 1500) * np.exp(-t / 0.008) * 0.35
    return ((body + click) * k).astype(np.float32)


def riser(dur):
    t = np.arange(int(dur * SR)) / SR
    n = RNG.standard_normal(len(t))
    y = np.zeros_like(t)
    # sweep a band upward in a few slices
    for i in range(8):
        a, z = int(i * len(t) / 8), int((i + 1) * len(t) / 8)
        lo = 400 * 2 ** (i * 0.6)
        y[a:z] = sosfilt(butter(2, [lo, min(lo * 3, 18000)], 'band', fs=SR, output='sos'), n[a:z])
    return (y * (t / dur) ** 2.2 * 0.5).astype(np.float32)


def tick():
    n = int(0.05 * SR); t = np.arange(n) / SR
    y = sosfilt(butter(2, [1200, 5000], 'band', fs=SR, output='sos'), RNG.standard_normal(n)) * np.exp(-t / 0.004)
    y += np.sin(2 * np.pi * 880 * t) * np.exp(-t / 0.012) * 0.4
    return (y * 0.6).astype(np.float32)


def swish(dur=0.22):
    t = np.arange(int(dur * SR)) / SR
    y = sosfilt(butter(2, [2000, 9000], 'band', fs=SR, output='sos'), RNG.standard_normal(len(t)))
    return (y * np.sin(np.pi * t / dur) ** 1.5 * 0.5).astype(np.float32)


def pad(notes, dur, bright=1200, att=0.5, rel=0.8):
    t = np.arange(int((dur + rel) * SR)) / SR
    y = np.zeros_like(t)
    for m in notes:
        for det in (-0.004, 0.0, 0.005):
            f = hz(m) * (1 + det)
            for h in range(1, 9):
                y += np.sin(2 * np.pi * f * h * t + h * 0.7 + det * 900) / h
    env = np.minimum(1, t / att) * np.where(t < dur, 1, np.exp(-(t - dur) / (rel / 3)))
    y = lp(y * env, bright, 2)
    return (y / (len(notes) * 6)).astype(np.float32)


# ---------------------------------------------------------------- build ----
def build():
    P, S, X = Bus(), Bus(), Bus()        # piano, pad/strings, effects (dry)
    notes, pedal = [], []
    beat, bar = C['beat'], C['bar']
    n_bars = int(round(DUR / bar))

    def note(t, m, d, v):
        notes.append(dict(start=t, end=t + d, pitch=m, vel=int(np.clip(v, 1, 127))))

    for k in range(n_bars):
        t0 = b(k); ch = chord_at(k)
        pedal += [(t0 - 0.03, 0), (t0 + 0.06, 127)]
        if k < 1 or 39 <= k < 42 or k >= 59:
            continue
        root = ch[0]
        # left hand: low octave on the downbeat
        lv = 62 if k < 15 else 80 if k < 26 else 66 if k < 48 else 70
        if k >= 57:
            continue
        note(t0, root - 12, bar, lv); note(t0, root - 24, bar, lv - 10)
        if 15 <= k < 26:                                 # 二: a repeated-note ostinato that tightens
            sub = 2 if k < 19 else 4
            for i in range(4 * sub):
                note(t0 + i * beat / sub, root, beat / sub * 0.9, 50 + (k - 15) * 5 + (8 if i % sub == 0 else 0))
            note(t0, ch[-1] + 24, bar, 70)
        elif 48 <= k < 57:                               # 七: open, warm arpeggios
            arp = [ch[0], ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[1] + 24]
            for i, m in enumerate(arp):
                note(t0 + i * beat / 2, m, beat, 64 + (10 if i == 0 else 0))
        else:                                            # quiet: sparse right hand
            top = sorted(c + 24 for c in ch)
            note(t0 + beat * 0, top[2], beat * 1.5, 54)
            note(t0 + beat * 1.5, top[1], beat, 48)
            note(t0 + beat * 2.5, top[0], beat * 1.5, 46)
    # the end: one D-major chord after a breath, and the last line of the motif under the sources
    for m, v in [(38, 60), (50, 58), (57, 55), (62, 54), (66, 56), (74, 50)]:
        note(C['stop'] + beat, m, 4 * bar, v)
    for i, m in enumerate([74, 69, 66, 62]):
        note(C['roll'] + i * bar * 0.75, m, bar, 50)
    pr = piano.render(notes, sorted(pedal), duration=len(P.x) / SR - 1)[:len(P.x)]
    P.x[:len(pr)] += pr

    # strings pad, by section
    for k in range(n_bars):
        if k < 2 or 39 <= k < 42 or k >= 57:
            continue
        g = 0.6 if k < 15 else 0.6 + 0.04 * (k - 15) if k < 26 else 0.55 if k < 48 else 1.15
        bright = 900 if k < 15 else 900 + 260 * (k - 15) if k < 26 else 1000 if k < 48 else 2200
        ch = chord_at(k)
        S.add(pad([ch[0] - 12] + ch + [ch[1] + 12], bar, bright), b(k), g)

    # heartbeat: cold open and 二 every beat, 七 every other beat
    for k in range(n_bars):
        for i in range(4):
            t = b(k, i)
            if k < 6: X.add(heartbeat(0.55 + 0.1 * k), t, 0.9)
            elif 15 <= k < 26: X.add(heartbeat(0.5 + 0.05 * (k - 15)), t, 0.8)
            elif 48 <= k < 57 and i % 2 == 0: X.add(heartbeat(0.4), t, 0.6)
    # hits and risers
    for t, k in [(C['title'], 1.3), (C['nwo'], 0.8), (C['m_1570'], 0.9), (C['m_plus4'], 1.1), (C['bl_loss'], 0.8), (C['bl_gain'], 1.0),
                 (C['bone'] + C['beat'] * 3.2, 0.7), (C['x3'], 0.9), (C['x6'], 1.0), (C['an_x'], 1.2)]:
        X.add(sub_hit(k=k), t, 0.9)
    for t, d in [(C['title'], bar), (C['m_plus4'], bar * 0.5), (C['ph_in'], bar), (C['x3'], bar * 0.5), (C['an_x'], bar * 0.75)]:
        X.add(riser(d), t - d, 0.35)
    # 72 months ticking
    t0, t1 = C['bl_days'] + 0.4, C['bl_days_end'] - 0.2
    for i in range(72):
        X.add(tick(), t0 + (t1 - t0) * i / 72, 0.35, pan=((i % 12) / 11 - 0.5) * 0.8)
    # slogans: a low thump as each appears, a swish as each is struck
    for i in range(12):
        X.add(sub_hit(0.5, 0.5), C['ph_in'] + i * C['beat'] / 2, 0.5)
        X.add(swish(), C['ph_strike'] + i * C['beat'] / 4, 0.5, pan=(i % 3 - 1) * 0.5)
    # 他们停不下来: everything drops out for one beat before the line
    gap0, gap1 = int((b(23) - beat) * SR), int(b(23) * SR)
    for B in (P, S):
        B.x[gap0:gap1] *= np.linspace(1, 0.15, gap1 - gap0)[:, None]

    mix = piano.reverb(P.x, wet=0.26)[:len(P.x)] * 1.0 + piano.reverb(S.x, wet=0.35)[:len(S.x)] * 0.9 + X.x
    mix = mix[:int((DUR + 0.2) * SR)]
    fade = int(1.0 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    raw = os.path.join(OUT, 'diet_raw.wav'); final = os.path.join(OUT, 'diet.wav')
    piano.write(raw, mix, peak_db=-3.0)
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    gain = -14.0 - float(err[err.rindex('I:'):].split()[1])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af',
                    f'highpass=f=25,volume={gain:.2f}dB,alimiter=limit=0.76:attack=2:release=80:level=false',
                    '-ar', str(SR), '-c:a', 'pcm_s24le', final], check=True)
    print('score:', final, f'gain {gain:+.1f} dB')


if __name__ == '__main__':
    build()
