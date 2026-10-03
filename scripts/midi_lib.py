"""Shared MIDI loading: absolute timing through the tempo map, notes, pedal, bars."""
import bisect
import mido

NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

def note_name(m):
    return f"{NAMES[m % 12]}{m // 12 - 1}"

class Song:
    def __init__(self, path):
        mid = mido.MidiFile(path)
        self.tpb = mid.ticks_per_beat
        events = []  # (tick, track, msg)
        for ti, tr in enumerate(mid.tracks):
            t = 0
            for msg in tr:
                t += msg.time
                events.append((t, ti, msg))
        events.sort(key=lambda e: e[0])
        # tempo map
        self.tempo_ticks, self.tempo_us = [0], [500000]
        for t, _, m in events:
            if m.type == 'set_tempo':
                if t == self.tempo_ticks[-1]:
                    self.tempo_us[-1] = m.tempo
                else:
                    self.tempo_ticks.append(t); self.tempo_us.append(m.tempo)
        self.tempo_secs = [0.0]
        for i in range(1, len(self.tempo_ticks)):
            dt = self.tempo_ticks[i] - self.tempo_ticks[i - 1]
            self.tempo_secs.append(self.tempo_secs[-1] + dt * self.tempo_us[i - 1] / 1e6 / self.tpb)
        # meters and keys
        self.meters = []  # (tick, num, den)
        self.keys = []    # (tick, key)
        for t, _, m in events:
            if m.type == 'time_signature':
                if self.meters and self.meters[-1][0] == t: self.meters[-1] = (t, m.numerator, m.denominator)
                else: self.meters.append((t, m.numerator, m.denominator))
            if m.type == 'key_signature':
                if not self.keys or self.keys[-1][1] != m.key or self.keys[-1][0] != t: self.keys.append((t, m.key))
        if not self.meters or self.meters[0][0] != 0: self.meters.insert(0, (0, 4, 4))
        # notes and pedal
        self.notes = []   # dict(start, end, pitch, vel, track, t0, t1)
        self.pedal = []   # (sec, value)
        open_notes = {}
        for t, ti, m in events:
            if m.type == 'note_on' and m.velocity > 0:
                open_notes.setdefault((ti, m.note), []).append((t, m.velocity))
            elif m.type in ('note_off', 'note_on'):
                stack = open_notes.get((ti, m.note))
                if stack:
                    t0, v = stack.pop(0)
                    self.notes.append(dict(t0=t0, t1=t, pitch=m.note, vel=v, track=ti))
            elif m.type == 'control_change' and m.control == 64:
                self.pedal.append((self.sec(t), m.value))
        for n in self.notes:
            n['start'] = self.sec(n['t0']); n['end'] = self.sec(n['t1'])
        self.notes.sort(key=lambda n: (n['t0'], n['pitch']))
        self.end_tick = max(t for t, _, _ in events)
        self.bars = self._bars()

    def sec(self, tick):
        i = bisect.bisect_right(self.tempo_ticks, tick) - 1
        return self.tempo_secs[i] + (tick - self.tempo_ticks[i]) * self.tempo_us[i] / 1e6 / self.tpb

    def bpm_at(self, tick):
        i = bisect.bisect_right(self.tempo_ticks, tick) - 1
        return 60e6 / self.tempo_us[i]

    def key_at(self, tick):
        k = None
        for t, key in self.keys:
            if t <= tick: k = key
        return k

    def _bars(self):
        bars = []  # (tick, num, den)
        mi = 0; t = 0
        while t < self.end_tick:
            while mi + 1 < len(self.meters) and self.meters[mi + 1][0] <= t: mi += 1
            _, num, den = self.meters[mi]
            length = int(self.tpb * 4 * num / den)
            nxt = t + length
            if mi + 1 < len(self.meters) and self.meters[mi + 1][0] < nxt:
                nxt = self.meters[mi + 1][0]
            bars.append((t, num, den))
            t = nxt
        return bars
