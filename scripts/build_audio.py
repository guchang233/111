"""Assemble the film's soundtrack from the master timeline.

Piano material is rendered from the MIDI windows (with soloing for the teardown passes);
everything else — metronome, tones, beating pairs, typewriter keys, the additive A4 — is
synthesised here, so picture and sound share exact times.
"""
import json
import os
import subprocess

import numpy as np

import film_timeline
import piano
import segments

SR = piano.SR
OUT = os.path.join(os.path.dirname(__file__), '..', 'out', 'audio')
DATA = os.path.join(os.path.dirname(__file__), '..', 'film', 'data')
os.makedirs(OUT, exist_ok=True)
RNG = np.random.default_rng(1584)


class Bus:
    def __init__(self, seconds):
        self.x = np.zeros((int(seconds * SR) + SR * 6, 2), np.float32)

    def add(self, clip, at, gain=1.0):
        if clip is None or len(clip) == 0:
            return
        s = int(round(at * SR))
        if clip.ndim == 1:
            clip = np.repeat(clip[:, None], 2, axis=1)
        e = min(s + len(clip), len(self.x))
        if s < 0 or s >= len(self.x):
            return
        self.x[s:e] += clip[:e - s] * gain


def fade(clip, fin=0.0, fout=0.0):
    c = clip.copy()
    if fin > 0:
        n = min(int(fin * SR), len(c)); c[:n] *= np.linspace(0, 1, n)[:, None] if c.ndim == 2 else np.linspace(0, 1, n)
    if fout > 0:
        n = min(int(fout * SR), len(c)); c[-n:] *= np.linspace(1, 0, n)[:, None] if c.ndim == 2 else np.linspace(1, 0, n)
    return c


# ------------------------------------------------------------------ piano ----
def piano_window(name, src0, src1, gain_fn=None, tail=3.0, use=None, lift_at_end=False):
    """Render notes of `name` whose onset lies in [src0, src1) (segment-relative seconds)."""
    ns = []
    for n in (use if use is not None else segments.notes(name)):
        if src0 - 1e-6 <= n['start'] < src1 - 1e-6:
            g = gain_fn(n) if gain_fn else 1.0
            if g > 0:
                m = dict(n, start=n['start'] - src0, end=n['end'] - src0, gain=g)
                ns.append(m)
    pd = [(t - src0, v) for t, v in segments.auto_pedal(name) if t >= src0 - 0.2]
    if not pd or pd[0][0] > 0:
        pd.insert(0, (0.0, 127))
    if lift_at_end:                                   # seamless join: let go exactly at the seam
        pd = [(t, v) for t, v in pd if t < src1 - src0 - 0.03] + [(src1 - src0 - 0.03, 0)]
    return piano.render(ns, pd, duration=(src1 - src0) + tail)


# --------------------------------------------------------------- synthesis ----
def env_ar(n, a=0.01, r=0.05):
    e = np.ones(n, np.float32)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def tone(freq, dur, harmonics=(1.0,), decay=None, a=0.012, r=0.12, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    for k, amp in enumerate(harmonics, start=1):
        y += amp * np.sin(2 * np.pi * freq * k * (1 + detune) * t)
    y /= max(sum(harmonics), 1e-9)
    if decay:
        y *= np.exp(-t / decay)
    return (y * env_ar(len(t), a, r)).astype(np.float32)


ORGAN = (1.0, 0.5, 0.33, 0.25, 0.2, 0.16)    # harmonic-rich: makes mistuning audible as beats


def click(accent=False):
    n = int(0.06 * SR); t = np.arange(n) / SR
    f = 2400 if accent else 1700
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.012) + 0.25 * RNG.standard_normal(n) * np.exp(-t / 0.003)
    return (y * (0.9 if accent else 0.6)).astype(np.float32)


def typekey(strong=False):
    """A typewriter strike: a noisy slap, a short metal ping and a soft carriage thump."""
    n = int(0.11 * SR); t = np.arange(n) / SR
    from scipy.signal import butter, sosfilt
    noise = RNG.standard_normal(n)
    slap = sosfilt(butter(2, [1800, 6500], 'band', fs=SR, output='sos'), noise) * np.exp(-t / 0.006)
    ping = np.sin(2 * np.pi * (3100 + RNG.uniform(-180, 180)) * t) * np.exp(-t / 0.018) * 0.22
    thump = np.sin(2 * np.pi * (140 + RNG.uniform(-15, 15)) * t) * np.exp(-t / 0.02) * 0.5
    y = (slap * 1.4 + ping + thump) * (1.0 if strong else RNG.uniform(0.7, 0.95))
    return y.astype(np.float32)


def tick():
    n = int(0.05 * SR); t = np.arange(n) / SR
    from scipy.signal import butter, sosfilt
    y = sosfilt(butter(2, [900, 4000], 'band', fs=SR, output='sos'), RNG.standard_normal(n)) * np.exp(-t / 0.004)
    y += np.sin(2 * np.pi * 620 * t) * np.exp(-t / 0.01) * 0.3
    return (y * 0.5).astype(np.float32)


def swish(dur=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    from scipy.signal import butter, sosfilt
    y = sosfilt(butter(2, [1500, 7000], 'band', fs=SR, output='sos'), RNG.standard_normal(n))
    y *= np.sin(np.pi * t / dur) ** 2
    return (y * 0.12).astype(np.float32)


def sub_boom(dur=2.6):
    t = np.arange(int(dur * SR)) / SR
    f = 52 * np.exp(-t / 1.6) + 34
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / 0.9) * env_ar(len(t), 0.004, 0.2)
    return (y * 0.7).astype(np.float32)


def additive_a4(partials, dur, drops=(), f0=440.0, fade_in=1.6):
    """Exact Fourier series of the A4: harmonic n at n·f0 with the measured amplitudes.
    `drops[k]` = time at which harmonic (12-k) is removed (k = 0 → the 12th)."""
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    n_h = len(partials)
    for k in range(n_h):
        n = k + 1
        amp = partials[k][1]
        g = np.ones_like(t)
        idx = n_h - n                      # harmonic 12 drops first
        if idx < len(drops):
            td = drops[idx]
            g = np.clip(1 - (t - td) / 0.25, 0, 1)
        y += amp * g * np.sin(2 * np.pi * f0 * n * t + 0.37 * n)
    y /= sum(p[1] for p in partials)
    y *= np.clip(t / fade_in, 0, 1)
    return y.astype(np.float32)


# -------------------------------------------------------------------- build ----
def build():
    tl = film_timeline.build(); C = tl['cues']
    P = Bus(tl['duration'])        # piano (reverb: hall)
    S = Bus(tl['duration'])        # synth (lighter reverb)
    L = film_timeline.seg_len
    eva_t = lambda b: film_timeline.bar_time('eva', b)

    # I · EVA: the opening as written, then straight into the chorus
    P.add(piano_window('eva', 0.0, L('eva'), gain_fn=lambda n: 4.0 if n['start'] < eva_t(17) else 1.5,
                       tail=2.0, lift_at_end=True), C['eva_start'])
    S.add(sub_boom(), C['title_in'], 0.35)
    P.add(fade(piano_window('eva_chorus', 0.0, L('eva_chorus'), tail=4.2), 0.0, 1.8), C['eva_ch'], GAIN['eva_chorus'])

    # II · Sincerely: first chorus, then the deceptive cadence drops into the final climax
    P.add(piano_window('sin_a', 0.0, L('sin_a'), tail=2.0, lift_at_end=True), C['sin_a'], GAIN['sin_a'])
    P.add(fade(piano_window('sincerely', 0.0, L('sincerely'), tail=3.4), 0.0, 1.6), C['sin_b'], GAIN['sincerely'])

    # III · Frieren
    P.add(fade(piano_window('fri_d', 0.0, L('fri_d'), tail=3.6), 0.0, 2.2), C['fri_d'], GAIN['fri_d'])
    P.add(fade(piano_window('frieren_a', 0.0, L('frieren_a'), tail=3.0), 0.0, 2.0), C['fri_a'], GAIN['frieren_a'])
    a, b = C['reb_src']
    P.add(fade(piano_window('frieren_b', a, b, tail=4.0), 0.0, 3.0), C['reb'], GAIN['frieren_b'])

    # ---- mix ----
    p = piano.reverb(P.x, wet=0.24)[:len(P.x)]
    s = piano.reverb(S.x, wet=0.16)[:len(S.x)]
    mix = p + s
    n = int((tl['duration'] + 0.5) * SR)
    mix = mix[:n]
    raw = os.path.join(OUT, 'master_raw.wav')
    piano.write(raw, mix, peak_db=-3.0)
    final = os.path.join(OUT, 'master.wav')
    # Mastering: one linear gain to -15 LUFS, then a fast limiter that only shaves piano transients.
    # (loudnorm falls back to dynamic compression whenever a linear gain would clip, which reshapes the
    # balance between sections; this keeps the mix exactly as balanced above.)
    def lufs(path):
        err = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
        return float(err[err.rindex('I:'):].split()[1])
    gain = -15.0 - lufs(raw)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af',
                    f'highpass=f=28,volume={gain:.2f}dB,alimiter=limit=0.84:attack=2:release=60:level=false',
                    '-ar', str(SR), '-c:a', 'pcm_s24le', final], check=True)
    js = {'input_i': f'{-15.0 - gain:.2f}'}
    print('master:', final, 'measured', js['input_i'], 'LUFS ->', -15)
    return final


# per-segment balance, set by ear-proxy: RMS of each passage measured after a first pass
GAIN = {'eva_chorus': 0.62, 'sin_a': 0.8, 'sincerely': 0.5, 'fri_d': 0.75, 'frieren_a': 1.9, 'frieren_b': 1.1}


if __name__ == '__main__':
    build()
