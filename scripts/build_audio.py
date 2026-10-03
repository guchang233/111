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
def piano_window(name, src0, src1, gain_fn=None, tail=3.0, use=None):
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
    S = Bus(tl['duration'])        # synth / foley (lighter reverb)
    D = Bus(tl['duration'])        # dry: clicks and keys stay close

    eva_t = lambda b: film_timeline.bar_time('eva', b)

    # Act I — EVA as written, then the teardown passes
    P.add(piano_window('eva', 0.0, eva_t(25), gain_fn=lambda n: 1.55 if n['start'] < eva_t(17) else 1.0, tail=3.2), C['eva_start'])
    S.add(sub_boom(), C['title_in'], 0.35)
    S.add(swish(1.1), C['l1_in'] - 0.2, 1.0)

    phrase = [dict(n, start=n['start'], end=n['end']) for n in segments.notes('eva') if n['start'] >= eva_t(17) - 1e-3]
    with open(os.path.join(DATA, 'eva_phrase.json')) as f:
        roles = {(round(r[0] + eva_t(17), 3), r[2]): r[5] for r in json.load(f)['notes']}
    bar = (eva_t(25) - eva_t(17)) / 8
    def solo(n):
        k = int((n['start'] - eva_t(17)) / (2 * bar) + 1e-6)
        role = roles.get((round(n['start'], 3), n['pitch']), 'h')
        return 1.0 if k == 0 else (1.0 if 'mhb'[k - 1] == role else 0.0)
    P.add(piano_window('eva', eva_t(17), eva_t(25), gain_fn=solo, tail=2.5), C['l1_replay'], 0.9)
    for k in range(8):
        D.add(click(k % 4 == 0), C['l1_clicks'] + k * bar / 4, 0.55)

    a, b = C['l2_src']
    P.add(fade(piano_window('eva', a, b, tail=2.0), 0.02, 1.4), C['l2_audio'], 1.25)

    # Act II — Sincerely
    sin = piano_window('sincerely', 0.0, film_timeline.bar_time('sincerely', 232), tail=3.4)
    P.add(fade(sin, 0.0, 1.6), C['sin_start'], 0.46)

    # layer 04: the callback, the spiral of fifths, the comma, the proof, Zhu Zaiyu, the cost
    P.add(fade(piano_window('eva', eva_t(17), eva_t(19), tail=1.8), 0.0, 1.2), C['l4_callback'], 0.7)
    c4 = 261.6256
    for k, ts in enumerate(C['l4_steps']):
        r = 1.5 ** k
        while r >= 2: r /= 2
        S.add(tone(c4 * r, 1.1, ORGAN[:3], decay=0.45, a=0.006, r=0.3), ts, 0.32)
    S.add(tone(c4, 4.4, ORGAN, a=0.25, r=0.8), C['l4_gap'] + 0.3, 0.2)
    S.add(tone(c4 * 3 ** 12 / 2 ** 19, 4.4, ORGAN, a=0.25, r=0.8), C['l4_gap'] + 0.3, 0.2)
    for i, line in enumerate(C['typing'] + [C['typing_sign']]):
        for j, ch in enumerate(line['text']):
            if ch != ' ':
                D.add(typekey(strong=(j == 0)), line['start'] + j * line['interval'], 0.42)
    et = [c4 * 2 ** (((7 * k) % 12) / 12) for k in range(12)]
    for k, f in enumerate(et):
        S.add(tone(f, 0.9, ORGAN[:3], decay=0.35, a=0.006, r=0.3), C['l4_close'] + 0.3 + k * 0.17, 0.26)
    S.add(tone(c4, 2.2, ORGAN, a=0.05, r=0.9), C['l4_close'] + 0.3 + 12 * 0.17, 0.16)
    S.add(tone(2 * c4, 2.2, ORGAN, a=0.05, r=0.9), C['l4_close'] + 0.3 + 12 * 0.17, 0.16)
    f3 = 174.6141
    for ratio in (1.0, 5 / 4, 3 / 2):
        S.add(tone(f3 * ratio, 2.7, ORGAN, a=0.15, r=0.6), C['l4_just'], 0.17)
    for semis in (0, 4, 7):
        S.add(tone(f3 * 2 ** (semis / 12), 3.8, ORGAN, a=0.15, r=0.8), C['l4_et'], 0.17)

    # Act III — Frieren
    a, b = C['fri_a_src']
    P.add(fade(piano_window('frieren_a', a, b, tail=3.0), 0.0, 2.0), C['fri_a'], 1.3)
    P.add(piano.render([dict(start=0.0, end=2.4, pitch=69, vel=78)], [], duration=9.0), C['a4'], 1.0)
    with open(os.path.join(DATA, 'a4.json')) as f:
        partials = json.load(f)['partials']
    dur = C['l6_fade'] + 1.0 - C['a4_additive']
    drops = [t - C['a4_additive'] for t in C['l6_drop']]
    add = additive_a4(partials, dur, drops)
    n_f = int(1.0 * SR); add[-n_f:] *= np.linspace(1, 0, n_f)
    S.add(add, C['a4_additive'], 0.19)

    for k, t in enumerate(C['bom_cards'][:-1]):
        D.add(tick(), t, 0.5)

    a, b = C['reb_src']
    reb = piano_window('frieren_b', a, b, tail=4.0)
    P.add(fade(reb, 0.0, 3.0), C['reb'], 0.95)

    # ---- mix ----
    p = piano.reverb(P.x, wet=0.24)[:len(P.x)]
    s = piano.reverb(S.x, wet=0.16)[:len(S.x)]
    mix = p + s + D.x
    n = int((tl['duration'] + 0.5) * SR)
    mix = mix[:n]
    raw = os.path.join(OUT, 'master_raw.wav')
    piano.write(raw, mix, peak_db=-3.0)
    final = os.path.join(OUT, 'master.wav')
    # two-pass loudness normalisation to -15 LUFS, true peak -1.5 dBTP; 28 Hz high-pass for rumble
    probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af',
                            'highpass=f=28,loudnorm=I=-15:TP=-1.5:LRA=13:print_format=json', '-f', 'null', '-'],
                           capture_output=True, text=True).stderr
    js = json.loads(probe[probe.rindex('{'):probe.rindex('}') + 1])
    af = ('highpass=f=28,loudnorm=I=-15:TP=-1.5:LRA=13:measured_I={input_i}:measured_TP={input_tp}:'
          'measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true').format(**js)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s24le', final], check=True)
    print('master:', final, 'measured', js['input_i'], 'LUFS ->', -15)
    return final


if __name__ == '__main__':
    build()
