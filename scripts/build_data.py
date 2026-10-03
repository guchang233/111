"""Export everything the picture needs, computed from the MIDI and the samples, to film/data/*.json."""
import json
import os

import numpy as np
import soundfile as sf

import film_timeline
import piano
import segments
from midi_lib import NAMES, note_name

OUT = os.path.join(os.path.dirname(__file__), '..', 'film', 'data')
os.makedirs(OUT, exist_ok=True)

FLAT = {'C#': 'D♭', 'D#': 'E♭', 'F#': 'F♯', 'G#': 'A♭', 'A#': 'B♭'}


def pc_name(pc, prefer_flat=True):
    n = NAMES[pc]
    return FLAT.get(n, n) if prefer_flat else n.replace('#', '♯')


def dump(name, obj):
    with open(os.path.join(OUT, name), 'w') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
    print('wrote', name)


def compact(notes, t_shift=0.0, extra=None):
    out = []
    for n in notes:
        row = [round(n['start'] + t_shift, 4), round(n['end'] - n['start'], 4), n['pitch'], n['vel'], n['track']]
        if extra:
            row.append(extra(n))
        out.append(row)
    return out


def skyline_roles(notes):
    """Melody = top line of the right hand (sustain-aware skyline); harmony = rest of RH; bass = LH."""
    rh = sorted([n for n in notes if n['track'] == 0], key=lambda n: (n['start'], -n['pitch']))
    melody = set()
    cur_end, cur_pitch = -1.0, -1
    i = 0
    while i < len(rh):
        j = i
        while j < len(rh) and rh[j]['start'] - rh[i]['start'] < 0.02:
            j += 1
        top = max(rh[i:j], key=lambda n: n['pitch'])
        if top['start'] >= cur_end - 0.06 or top['pitch'] >= cur_pitch:
            melody.add(id(top)); cur_end, cur_pitch = top['end'], top['pitch']
        i = j
    def role(n):
        if n['track'] == 1:
            return 'b'
        return 'm' if id(n) in melody else 'h'
    return role


TRIADS = []
for r in range(12):
    TRIADS.append((r, 'maj', {r, (r + 4) % 12, (r + 7) % 12}))
    TRIADS.append((r, 'min', {r, (r + 3) % 12, (r + 7) % 12}))


def chords_per_window(notes, edges):
    """Best triad per time window, weighting pitch classes by sounding duration and the bass."""
    out = []
    for a, b in zip(edges[:-1], edges[1:]):
        w = np.zeros(12)
        bass_pc, bass_p = None, 999
        for n in notes:
            ov = min(n['end'], b) - max(n['start'], a)
            if ov <= 0:
                continue
            w[n['pitch'] % 12] += ov * (n['vel'] / 100)
            if n['pitch'] < bass_p and n['start'] < a + 0.25 * (b - a) + 1e-3:
                bass_p, bass_pc = n['pitch'], n['pitch'] % 12
        best = None
        for root, q, pcs in TRIADS:
            score = sum(w[p] for p in pcs) - 0.6 * sum(w[p] for p in range(12) if p not in pcs)
            if bass_pc == root:
                score += 0.35 * w.sum() / 3
            if best is None or score > best[0]:
                best = (score, root, q, pcs)
        _, root, q, pcs = best
        out.append(dict(t=round(a, 4), d=round(b - a, 4), root=root, q=q, pcs=sorted(pcs),
                        name=pc_name(root) + ('m' if q == 'min' else '')))
    return out


def a4_harmonics(n_harm=12):
    """Partial amplitudes of the real A4 piano sample (the 'one note' of layer 05)."""
    r = piano._match(piano.ATTACK, 69, 80)[0]
    d, sr = sf.read(r['sample'])
    x = d[int(0.06 * sr):int(0.86 * sr), 0]
    x = x * np.hanning(len(x))
    N = 1 << 21
    X = np.abs(np.fft.rfft(x, N)); fr = np.fft.rfftfreq(N, 1 / sr)
    f1 = None; parts = []
    for k in range(1, n_harm + 1):
        guess = (f1 or 440.0) * k * (1 + 0.0004 * k * k) ** 0.5 if f1 else 440.0
        m = (fr > guess * 0.97) & (fr < guess * 1.03)
        i = np.argmax(X[m]); f = fr[m][i]; a = X[m][i]
        if k == 1:
            f1 = f
        parts.append([round(float(f), 2), float(a)])
    a1 = parts[0][1]
    return dict(sample=os.path.basename(r['sample']), f1=parts[0][0],
                partials=[[f, round(a / a1, 4)] for f, a in parts])


def main():
    tl = film_timeline.build()
    C = tl['cues']
    dump('timeline.json', tl)
    dump('timeline_pure.json', film_timeline.build(pure=True))

    # ---- EVA intro: arpeggios, ritardando, pause (film time = segment time) ----
    s = segments.song('eva')
    eva = segments.notes('eva')
    intro = [n for n in eva if n['start'] < C['phrase'] - 1e-3]
    t0, _ = segments.window('eva')
    tempos = []
    for tick, us in zip(s.tempo_ticks, s.tempo_us):
        t = s.sec(tick) - t0
        if -1e-6 <= t < C['eva_end']:
            tempos.append([round(t, 4), round(60e6 / us, 1)])
    dump('eva_intro.json', dict(notes=compact(intro), tempos=tempos,
                                rit=[round(C['eva_rit'], 4), round(C['eva_pause'], 4)]))

    # ---- EVA phrase: bars 17–24, roles, chords per half bar ----------------------
    phrase = [n for n in eva if n['start'] >= C['phrase'] - 1e-3]
    role = skyline_roles(phrase)
    edges = [film_timeline.bar_time('eva', 17) + k * (C['eva_end'] - C['phrase']) / 16 for k in range(17)]
    ch = chords_per_window(phrase, edges)
    for c in ch:
        c['t'] = round(c['t'] - C['phrase'], 4)
    rel = [dict(n, start=n['start'] - C['phrase'], end=n['end'] - C['phrase']) for n in phrase]
    role_rel = skyline_roles(rel)
    rows = compact(rel, extra=role_rel)
    cnt = {k: sum(1 for r in rows if r[5] == k) for k in 'mhb'}
    rng = {k: [note_name(min(r[2] for r in rows if r[5] == k)), note_name(max(r[2] for r in rows if r[5] == k))] for k in 'mhb'}
    dump('eva_phrase.json', dict(notes=rows, chords=ch, bpm=129.0, bar=round((C['eva_end'] - C['phrase']) / 8, 4),
                                 counts=cnt, ranges=rng))

    # ---- Sincerely chorus ------------------------------------------------------
    sn = segments.notes('sincerely')
    ss = segments.song('sincerely'); st0, _ = segments.window('sincerely')
    edges = []
    for b in range(216, 232):
        a = film_timeline.bar_time('sincerely', b); z = film_timeline.bar_time('sincerely', b + 1)
        tick, num, den = ss.bars[b]
        if num * 4 // den >= 4:
            edges += [a, (a + z) / 2]
        else:
            edges += [a]
    edges.append(film_timeline.bar_time('sincerely', 232))
    sch = chords_per_window(sn, edges)
    roman = {5: 'I', 7: 'II', 9: 'III', 10: 'IV', 0: 'V', 2: 'VI', 4: 'VII'}     # F major
    for c in sch:
        r = roman.get(c['root'], '')
        c['roman'] = r.lower() if c['q'] == 'min' else r
    # The detector is unreliable in this texture (anticipated bass, added tones), so the chart is
    # annotated by hand from the bass line: vi–IV–V–I ("小室进行"), each change pushed to beat 4.
    beat = (film_timeline.bar_time('sincerely', 219) - film_timeline.bar_time('sincerely', 218)) / 4
    bt = lambda bar, b=0: round(film_timeline.bar_time('sincerely', bar) + b * beat, 4)
    chart = [(0.0, 2, 'min'), (1.83, 10, 'maj'), (bt(218), 0, 'maj'), (bt(218, 3), 5, 'maj'), (bt(219, 3), 0, 'maj/E'),
             (bt(220), 2, 'min'), (bt(220, 3), 10, 'maj'), (bt(222), 0, 'maj'), (bt(222, 3), 5, 'maj'), (bt(223, 3), 0, 'maj/E'),
             (bt(224), 2, 'min'), (bt(224, 3), 10, 'maj'), (bt(226), 0, 'maj'), (bt(226, 3), 5, 'maj'), (bt(227, 3), 0, 'maj/E'),
             (bt(228), 2, 'min'), (bt(228, 3), 10, 'maj'), (bt(230), 0, 'maj'), (bt(230, 3), 5, 'maj'), (bt(231, 3), 0, 'maj/E')]
    end = film_timeline.bar_time('sincerely', 232)
    sch = []
    for i, (t, root, q) in enumerate(chart):
        t2 = chart[i + 1][0] if i + 1 < len(chart) else end
        quality = 'min' if q == 'min' else 'maj'
        pcs = sorted({root, (root + (3 if quality == 'min' else 4)) % 12, (root + 7) % 12})
        r = roman[root]
        sch.append(dict(t=t, d=round(t2 - t, 4), root=root, q=quality, pcs=pcs,
                        name=pc_name(root) + ('m' if quality == 'min' else '') + ('/E' if q.endswith('/E') else ''),
                        roman=(r.lower() if quality == 'min' else r) + ('⁶' if q.endswith('/E') else '')))
    role_s = skyline_roles(sn)
    dump('sincerely.json', dict(notes=compact(sn, extra=role_s), chords=sch,
                                bars=[round(x - C['sin_b'], 4) for x in C['sin_b_bars']]))

    # ---- Frieren: the theme (layer 05) and the finale (rebuild) ---------------
    fa = segments.notes('frieren_a')
    dump('frieren_a.json', dict(notes=compact(fa)))
    fb_all = segments.notes('frieren_b')
    a, b = C['reb_src']
    fb = [dict(n, start=n['start'] - a, end=n['end'] - a) for n in fb_all if a - 1e-3 <= n['start'] < b]
    fbt = [round(film_timeline.bar_time('frieren_b', k) - a, 4) for k in range(322, 345)]
    dump('frieren_b.json', dict(notes=compact(fb), bars=fbt))

    # ---- v3 additions: the EVA chorus, the first Sincerely chorus, Frieren's B-minor song ----
    for name, fname, b0, b1 in [('eva_chorus', 'eva_chorus.json', 48, 62), ('sin_a', 'sin_a.json', 60, 77), ('fri_d', 'fri_d.json', 172, 190)]:
        ns = segments.notes(name)
        role_x = skyline_roles(ns)
        song_ = segments.song(name)
        bars = [round(film_timeline.bar_time(name, k), 4) for k in range(b0, min(b1, len(song_.bars)))]
        dump(fname, dict(notes=compact(ns, extra=role_x), bars=bars, dur=round(film_timeline.seg_len(name), 4)))

    # ---- A4: the measured partials inscribed on the magic circle -----------------
    h = a4_harmonics()
    dump('a4.json', h)
    print('A4 partials:', h['partials'])

    used = len(eva) + len(segments.notes('eva_chorus')) + len(segments.notes('sin_a')) + len(sn) + len(segments.notes('fri_d')) + len(fa) + len(fb)
    print('notes in the film:', used)

if __name__ == '__main__':
    main()
