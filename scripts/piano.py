"""Offline SFZ piano sampler for the Salamander Grand Piano V3 (Alexander Holm, CC BY 3.0).

Renders MIDI-like note lists to 48 kHz stereo float32, honouring:
  - 16 velocity layers and key ranges from the SFZ, pitch-shifted with soxr
  - amp_veltrack velocity curve, per-group ampeg_release
  - sustain pedal (note release deferred until pedal-up), same-key re-strikes
  - release-triggered samples (damper/hammer noise, string resonance) with rt_decay
"""
import os
import re
from functools import lru_cache

import numpy as np
import soundfile as sf
import soxr

SR = 48000
ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'samples', 'SalamanderGrandPianoV3_44.1khz16bit')
SFZ = os.path.join(ROOT, 'SalamanderGrandPianoV3Retuned.sfz')   # per-sample tune corrections


def _num(v):
    try:
        return float(v)
    except ValueError:
        return v


def parse_sfz(path=SFZ):
    regions, group = [], {}
    for raw in open(path, encoding='latin-1'):
        line = raw.split('//')[0].strip()
        if not line:
            continue
        for header, body in re.findall(r'<(\w+)>([^<]*)', line):
            ops = {k: _num(v) for k, v in re.findall(r'(\w+)=(\S+)', body)}
            if header == 'group':
                group = ops
            elif header == 'region':
                r = dict(group); r.update(ops)
                r.setdefault('lokey', 0); r.setdefault('hikey', 127)
                r.setdefault('lovel', 1); r.setdefault('hivel', 127)
                r.setdefault('pitch_keycenter', 60); r.setdefault('trigger', 'attack')
                r.setdefault('volume', 0.0); r.setdefault('amp_veltrack', 100.0)
                r.setdefault('rt_decay', 0.0); r.setdefault('ampeg_release', 0.3)
                r.setdefault('pitch_keytrack', 100.0); r.setdefault('tune', 0.0)
                r['sample'] = os.path.join(ROOT, str(r['sample']).replace('\\', '/'))
                regions.append(r)
    return regions


REGIONS = parse_sfz()
ATTACK = [r for r in REGIONS if r['trigger'] == 'attack']
RELEASE = [r for r in REGIONS if r['trigger'] == 'release']


def _match(regs, key, vel):
    return [r for r in regs if r['lokey'] <= key <= r['hikey'] and r['lovel'] <= vel <= r['hivel']]


@lru_cache(maxsize=None)
def _load(path):
    data, sr = sf.read(path, dtype='float32', always_2d=True)
    if data.shape[1] == 1:
        data = np.repeat(data, 2, axis=1)
    return data, sr


@lru_cache(maxsize=4096)
def _pitched(path, semitones, keytrack):
    data, sr = _load(path)
    ratio = 2.0 ** (semitones * keytrack / 100.0 / 12.0)
    # Treating the source as if recorded at sr*ratio and converting to SR shifts pitch by `ratio`.
    return soxr.resample(data, sr * ratio, SR, quality='VHQ').astype(np.float32)


def _amp(vel, veltrack):
    return (max(vel, 1) / 127.0) ** (2.0 * veltrack / 100.0)


def _db(x):
    return 10.0 ** (x / 20.0)


def pedal_release(end, pedal):
    """Time the damper actually falls for a key released at `end`."""
    down = False
    for t, v in pedal:
        if t > end:
            break
        down = v >= 64
    if not down:
        return end
    for t, v in pedal:
        if t > end and v < 64:
            return t
    return end + 4.0


def render(notes, pedal=(), duration=None, release_fx=True, tail=4.0):
    """notes: iterable of dict(start, end, pitch, vel) in seconds; pedal: [(sec, value)] sorted."""
    notes = sorted(notes, key=lambda n: n['start'])
    pedal = sorted(pedal)
    if duration is None:
        duration = max((n['end'] for n in notes), default=0) + tail
    out = np.zeros((int(duration * SR) + SR, 2), np.float32)
    # next strike of the same key cuts the previous one (quick 60 ms fade)
    next_strike = {}
    cut = [None] * len(notes)
    for i in range(len(notes) - 1, -1, -1):
        k = notes[i]['pitch']
        cut[i] = next_strike.get(k)
        next_strike[k] = notes[i]['start']
    for i, n in enumerate(notes):
        key, vel = int(n['pitch']), int(n['vel'])
        regs = _match(ATTACK, key, vel)
        if not regs:
            continue
        r = regs[0]
        y = _pitched(r['sample'], key - int(r['pitch_keycenter']) + r['tune'] / 100.0, float(r['pitch_keytrack']))
        rel_t = pedal_release(n['end'], pedal)
        fade = r['ampeg_release']
        if cut[i] is not None and cut[i] < rel_t + fade:
            rel_t = min(rel_t, cut[i]); fade = min(fade, 0.06)
        hold = max(rel_t - n['start'], 0.0)
        hold_n = int(hold * SR)
        rel_n = int(fade * SR)
        length = min(len(y), hold_n + rel_n)
        env = np.ones(length, np.float32)
        if length > hold_n:
            k = np.arange(length - hold_n, dtype=np.float32) / max(rel_n, 1)
            env[hold_n:] = np.exp(-6.9 * k)          # -60 dB at the end of the release time
        g = _amp(vel, r['amp_veltrack']) * _db(r['volume']) * n.get('gain', 1.0)
        s0 = int(n['start'] * SR)
        if s0 >= len(out):
            continue
        seg = y[:length] * (env * g)[:, None]
        end = min(s0 + length, len(out))
        out[s0:end] += seg[:end - s0]
        if release_fx:
            for rr in _match(RELEASE, key, vel):
                ry = _pitched(rr['sample'], key - int(rr['pitch_keycenter']) + rr['tune'] / 100.0, float(rr['pitch_keytrack']))
                gr = _amp(vel, rr['amp_veltrack']) * _db(rr['volume']) * _db(-rr['rt_decay'] * hold) * n.get('gain', 1.0)
                s1 = int(rel_t * SR)
                e1 = min(s1 + len(ry), len(out))
                if s1 < len(out):
                    out[s1:e1] += ry[:e1 - s1] * gr
    return out[:int(duration * SR)]


# ---------------------------------------------------------------- reverb ----
def _band(x, lo, hi):
    from scipy.signal import butter, sosfilt
    if lo is None:
        sos = butter(4, hi, 'low', fs=SR, output='sos')
    elif hi is None:
        sos = butter(4, lo, 'high', fs=SR, output='sos')
    else:
        sos = butter(4, [lo, hi], 'band', fs=SR, output='sos')
    return sosfilt(sos, x)


@lru_cache(maxsize=4)
def hall_ir(rt_low=2.6, rt_mid=2.1, rt_high=1.2, length=3.2, seed=7):
    """Synthetic stereo hall impulse response: early reflections + frequency-dependent diffuse tail."""
    rng = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2), np.float64)
    for ch in range(2):
        noise = rng.standard_normal(n)
        tail = (_band(noise, None, 400) * np.exp(-6.91 * t / rt_low)
                + _band(noise, 400, 4000) * np.exp(-6.91 * t / rt_mid)
                + _band(noise, 4000, None) * np.exp(-6.91 * t / rt_high))
        tail *= np.clip(t / 0.06, 0, 1) ** 1.5          # diffuse build-up
        pre = int(0.018 * SR)
        ir[pre:, ch] = tail[:n - pre] * 0.35
        for d, g in [(0.011, 0.55), (0.017, 0.4), (0.023, 0.33), (0.031, 0.27), (0.043, 0.2), (0.057, 0.15)]:
            k = int((d + (0.0021 if ch else 0)) * SR)
            ir[k, ch] += g * (1 if rng.random() > 0.5 else -1)
    ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))
    return ir.astype(np.float32)


def reverb(dry, wet=0.24, **kw):
    from scipy.signal import fftconvolve
    ir = hall_ir(**kw)
    out = np.empty((len(dry) + len(ir) - 1, 2), np.float32)
    for ch in range(2):
        out[:, ch] = fftconvolve(dry[:, ch], ir[:, ch])
    res = np.zeros_like(out)
    res[:len(dry)] += dry
    res += out * wet
    return res


def write(path, audio, peak_db=-1.0):
    peak = float(np.max(np.abs(audio))) or 1.0
    audio = audio * (_db(peak_db) / peak)
    sf.write(path, audio, SR, subtype='PCM_24')
    return path
