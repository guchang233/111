"""Dump notes per beat for a bar range: RH (track 0) / LH (track 1), with pitch-class chord guess."""
import sys
from midi_lib import Song, note_name, NAMES

TRIADS = {}
for r in range(12):
    TRIADS[frozenset({r, (r + 4) % 12, (r + 7) % 12})] = NAMES[r]
    TRIADS[frozenset({r, (r + 3) % 12, (r + 7) % 12})] = NAMES[r] + 'm'

def chord_name(pcs):
    pcs = frozenset(pcs)
    for k, v in TRIADS.items():
        if k <= pcs: return v
    return '?'

path, b0, b1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
s = Song(path)
for bi in range(b0, min(b1 + 1, len(s.bars))):
    t, num, den = s.bars[bi]
    t1 = s.bars[bi + 1][0] if bi + 1 < len(s.bars) else s.end_tick
    beat = s.tpb * 4 // den
    print(f"-- bar {bi} @ {s.sec(t):.2f}s {num}/{den} bpm {s.bpm_at(t):.0f}")
    for bt in range(t, t1, beat):
        ns = [n for n in s.notes if bt <= n['t0'] < min(bt + beat, t1)]
        sounding = [n for n in s.notes if n['t0'] <= bt < n['t1'] or bt <= n['t0'] < bt + beat]
        rh = ' '.join(f"{note_name(n['pitch'])}" for n in ns if n['track'] == 0)
        lh = ' '.join(f"{note_name(n['pitch'])}" for n in ns if n['track'] == 1)
        ch = chord_name({n['pitch'] % 12 for n in sounding})
        print(f"   {s.sec(bt):7.2f}  [{ch:4s}]  RH: {rh:44s} LH: {lh}")
