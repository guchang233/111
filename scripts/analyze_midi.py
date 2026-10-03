"""Per-bar map of a piece: time, tempo, key, density, loudness, register, melody contour."""
import sys
from midi_lib import Song, note_name

def bar_map(path, every=1):
    s = Song(path)
    print(f"== {path}: {len(s.bars)} bars, {len(s.notes)} notes, {s.sec(s.end_tick):.1f}s")
    print(" bar   time  bpm   meter key   n  vel  top   RH-melody (top notes on onsets)")
    for bi, (t, num, den) in enumerate(s.bars):
        t1 = s.bars[bi + 1][0] if bi + 1 < len(s.bars) else s.end_tick
        ns = [n for n in s.notes if t <= n['t0'] < t1]
        if bi % every: continue
        vel = sum(n['vel'] for n in ns) / len(ns) if ns else 0
        top = max((n['pitch'] for n in ns), default=0)
        onsets = {}
        for n in ns:
            if n['track'] == 0: onsets[n['t0']] = max(onsets.get(n['t0'], 0), n['pitch'])
        mel = ' '.join(note_name(p) for _, p in sorted(onsets.items())[:10])
        print(f" {bi:3d} {s.sec(t):6.1f} {s.bpm_at(t):5.1f} {num:2d}/{den:<2d} {str(s.key_at(t)):4s} {len(ns):3d} {vel:4.0f} {note_name(top) if top else '-':4s}  {mel}")

for p in sys.argv[1:]:
    bar_map(p)
