"""Print a structural summary of a MIDI file: tracks, tempo map, meter, notes, pedal."""
import sys, mido
from collections import Counter

NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
def nn(m): return f"{NAMES[m % 12]}{m // 12 - 1}"

def summarize(path):
    mid = mido.MidiFile(path)
    print(f"== {path}\n type={mid.type} tpb={mid.ticks_per_beat} tracks={len(mid.tracks)} length={mid.length:.2f}s")
    tempos, metas = [], []
    for ti, tr in enumerate(mid.tracks):
        t = 0; notes = 0; pitches = []; vels = []; ccs = Counter(); name = ''
        for msg in tr:
            t += msg.time
            if msg.type == 'track_name': name = msg.name
            if msg.type == 'set_tempo': tempos.append((t, mido.tempo2bpm(msg.tempo)))
            if msg.type == 'time_signature': metas.append((t, f"{msg.numerator}/{msg.denominator}"))
            if msg.type == 'key_signature': metas.append((t, f"key {msg.key}"))
            if msg.type == 'note_on' and msg.velocity > 0:
                notes += 1; pitches.append(msg.note); vels.append(msg.velocity)
            if msg.type == 'control_change': ccs[msg.control] += 1
        if notes:
            print(f" track {ti} '{name}': {notes} notes, range {nn(min(pitches))}-{nn(max(pitches))}, vel {min(vels)}-{max(vels)} (mean {sum(vels)/len(vels):.0f}), cc {dict(ccs)}, end tick {t}")
        else:
            print(f" track {ti} '{name}': no notes, cc {dict(ccs)}, end tick {t}")
    tempos.sort()
    print(f" tempo events: {len(tempos)}; first 12: " + ', '.join(f'{tk}:{b:.1f}' for tk, b in tempos[:12]))
    if len(tempos) > 12: print(f"   ... last: {tempos[-1][0]}:{tempos[-1][1]:.1f}; bpm range {min(b for _, b in tempos):.1f}-{max(b for _, b in tempos):.1f}")
    print(" meta: " + ', '.join(f'{tk}:{v}' for tk, v in sorted(metas)[:20]))

for p in sys.argv[1:]:
    summarize(p)
