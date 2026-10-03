"""The musical material used in the film: source MIDI windows and helpers to slice them."""
import os
from midi_lib import Song

MIDI = os.path.join(os.path.dirname(__file__), '..', 'assets', 'midi')

# name: (file, (start bar, beat offset), (end bar, beat offset)) — the end is exclusive.
# Beats are the bar's own beat unit (quarter in 4/4, eighth in 6/8). Bars count from 0 as in analyze_midi.py.
SEGMENTS = {
    'eva':        ('eva.mid', (0, 0), (25, 0)),          # intro arpeggios → ritardando → 残酷な天使のように
    'eva_chorus': ('eva.mid', (48, 0), (61, 1)),         # G fanfare → the chorus → the run lands on low C
    'sin_a':      ('sincerely.mid', (60, 0), (76, 0)),   # pre-chorus → first chorus, ends on C/E
    'sincerely':  ('sincerely.mid', (216, 0), (232, 0)), # flourish → climax chorus (Dm–B♭–C–F)
    'fri_d':      ('frieren.mid', (172, 0), (189, 4)),   # F♯ pickup → the B-minor song, ends on the tonic
    'frieren_a':  ('frieren.mid', (270, 0), (278, 0)),   # the A-major theme with lone bell notes
    'frieren_b':  ('frieren.mid', (316, 0), (348, 0)),   # the finale (the film uses bars 322–344)
}

_songs = {}


def song(name):
    f = SEGMENTS[name][0]
    if f not in _songs:
        _songs[f] = Song(os.path.join(MIDI, f))
    return _songs[f]


def _at(s, bar, beat):
    if bar >= len(s.bars):
        return s.sec(s.end_tick)
    tick, num, den = s.bars[bar]
    return s.sec(tick + int(beat * s.tpb * 4 / den))


def window(name):
    s = song(name)
    _, (b0, k0), (b1, k1) = SEGMENTS[name]
    return _at(s, b0, k0), _at(s, b1, k1)


def bar_range(name):
    _, (b0, _k0), (b1, k1) = SEGMENTS[name]
    return b0, (b1 if k1 > 0 else b1 - 1)


def notes(name, offset=True):
    """Notes starting inside the window, times relative to the window start."""
    s = song(name)
    t0, t1 = window(name)
    out = []
    for n in s.notes:
        if t0 - 1e-6 <= n['start'] < t1 - 1e-6:
            m = dict(n)
            if offset:
                m['start'] -= t0; m['end'] -= t0
            out.append(m)
    return out


def pedal(name, offset=True):
    s = song(name)
    t0, t1 = window(name)
    state = [v for t, v in s.pedal if t <= t0]
    ev = [(0.0 if offset else t0, state[-1])] if state else []
    ev += [((t - t0) if offset else t, v) for t, v in s.pedal if t0 < t < t1 + 4]
    return ev


def auto_pedal(name, offset=True, lift=0.03, catch=0.09):
    """Legato ("syncopated") pedalling: lift just before each harmonic beat group, catch just after.

    The source MIDIs carry almost no usable pedal data, so we pedal the way a pianist
    would follow the harmony: every half bar in simple metres, every dotted quarter in 6/8,
    and every bar for the one-beat rubato bars.
    """
    s = song(name)
    t0, t1 = window(name)
    b0, b1 = bar_range(name)
    ev = []
    for bi in range(b0, b1 + 1):
        tick, num, den = s.bars[bi]
        nxt = s.bars[bi + 1][0] if bi + 1 < len(s.bars) else s.end_tick
        if den == 8 and num % 3 == 0:
            step = s.tpb * 3 // 2                 # dotted quarter
        elif num * 4 // den >= 4:
            step = s.tpb * 2                      # half bar
        else:
            step = nxt - tick                     # short rubato bar: once per bar
        k = tick
        while k < nxt:
            t = s.sec(k)
            ev.append((t - lift, 0)); ev.append((t + catch, 127))
            k += step
    ev.append((t1 + 2.5, 0))
    ev.sort()
    if offset:
        ev = [(max(0.0, t - t0), v) for t, v in ev]
    return ev
