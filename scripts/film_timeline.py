"""Master timeline of the film. One source of truth for picture (exported to JSON) and sound.

All times are film seconds. Music cue times are derived from the MIDI windows in segments.py,
so the picture always lands on the notes.
"""
import segments

FPS = 30


def bar_time(name, bar):
    s = segments.song(name)
    t0, _ = segments.window(name)
    return s.sec(s.bars[bar][0]) - t0


def build():
    T = {}
    # ---- Act I: EVA ---------------------------------------------------------------
    T['eva_start'] = 0.0
    T['eva_rit'] = bar_time('eva', 7)                  # ritardando begins
    T['eva_pause'] = bar_time('eva', 15)
    T['title_in'] = bar_time('eva', 15) + 3 * (bar_time('eva', 16) - bar_time('eva', 15)) / 4   # LH B♭ octave
    T['title_out'] = bar_time('eva', 17) - 0.12
    T['phrase'] = bar_time('eva', 17)
    T['eva_end'] = bar_time('eva', 25)
    phrase_len = T['eva_end'] - T['phrase']
    bar_len = phrase_len / 8

    T['l1_in'] = T['eva_end']
    T['l1_replay'] = T['l1_in'] + 1.25
    T['l1_solo'] = [T['l1_replay'] + k * 2 * bar_len for k in range(4)]      # full / melody / harmony / bass
    T['l1_clicks'] = T['l1_replay'] + phrase_len
    T['l1_out'] = T['l1_clicks'] + 2 * bar_len

    T['l2_in'] = T['l1_out']
    T['l2_audio'] = T['l2_in'] + 0.6
    T['l2_src'] = [bar_time('eva', 6), bar_time('eva', 17)]                  # replayed window (rit. + pause)
    T['l2_audio_end'] = T['l2_audio'] + (T['l2_src'][1] - T['l2_src'][0])
    T['l2_out'] = T['l2_audio_end'] + 0.7

    # ---- Act II: Sincerely ------------------------------------------------------
    T['epi_violet'] = T['l2_out']
    T['sin_start'] = T['epi_violet'] + 3.9
    T['sin_bars'] = [T['sin_start'] + bar_time('sincerely', b) for b in range(216, 233)]
    T['sin_end'] = T['sin_bars'][-1]
    T['l3_out'] = T['sin_end'] + 0.5

    L = T['l4_in'] = T['l3_out']
    T['l4_callback'] = L + 0.4                       # C → F → B♭ → E♭
    T['l4_spiral'] = L + 4.6
    T['l4_steps'] = [T['l4_spiral'] + 0.8 + k * 0.6 for k in range(13)]   # 12 fifths + the miss
    T['l4_gap'] = T['l4_steps'][-1] + 0.6
    T['l4_proof'] = T['l4_gap'] + 4.6
    T['l4_silence'] = T['l4_proof'] + 4.4
    T['l4_zhu'] = T['l4_silence'] + 1.0
    # typed letter (layer 04): one schedule shared by the key clicks and the glyphs
    z = T['l4_zhu'] + 0.4
    T['typing'] = []
    for text, interval, gap in [('一五八四年，朱载堉算出了这个数：', 0.075, 0.45),
                                ('1.059463094359295264561825', 0.068, 0.7),
                                ('把它连乘十二次，正好是 2。', 0.075, 0.0)]:
        T['typing'].append(dict(text=text, start=round(z, 4), interval=interval))
        z += len(text) * interval + gap
    T['l4_close'] = T['l4_zhu'] + 10.2
    T['l4_cost'] = T['l4_close'] + 3.4
    T['l4_just'] = T['l4_cost'] + 0.4
    T['l4_et'] = T['l4_cost'] + 3.4
    T['l4_sign'] = T['l4_cost'] + 8.0
    T['typing_sign'] = dict(text='Sincerely,', start=round(T['l4_sign'] + 0.3, 4), interval=0.09)
    T['l4_out'] = T['l4_sign'] + 2.8

    # ---- Act III: Frieren -------------------------------------------------------
    T['epi_frieren'] = T['l4_out'] + 0.3
    T['fri_a'] = T['epi_frieren'] + 3.9
    T['fri_a_src'] = [0.0, bar_time('frieren_a', 278)]
    T['fri_a_end'] = T['fri_a'] + T['fri_a_src'][1]
    T['a4'] = T['fri_a_end'] + 0.7
    T['a4_additive'] = T['a4'] + 2.6
    T['l6_in'] = T['a4'] + 9.6
    T['l6_drop'] = [T['l6_in'] + 0.5 + k * 0.55 for k in range(11)]       # harmonics 12 → 2 removed
    T['l6_pure'] = T['l6_drop'][-1] + 0.55
    T['l6_fade'] = T['l6_pure'] + 2.4
    T['l6_out'] = T['l6_fade'] + 1.0
    T['bom'] = T['l6_out'] + 0.8
    T['bom_cards'] = [T['bom'] + 1.2 + k * 0.85 for k in range(7)] + [T['bom'] + 1.2 + 7 * 0.85 + 1.2]
    T['bom_out'] = T['bom_cards'][-1] + 3.2

    T['reb'] = T['bom_out']
    T['reb_src'] = [bar_time('frieren_b', 322), bar_time('frieren_b', 344)]
    T['reb_bars'] = {b: T['reb'] + bar_time('frieren_b', b) - T['reb_src'][0] for b in range(322, 345)}
    T['reb_end'] = T['reb'] + (T['reb_src'][1] - T['reb_src'][0])
    T['quote'] = T['reb_bars'][334]
    T['line'] = T['reb_bars'][338]
    T['credits'] = T['reb_bars'][341]
    T['end'] = T['reb_end'] + 1.5

    scenes = [
        dict(id='coldopen', start=0.0, end=T['title_in'], fade_out=0.0),
        dict(id='title', start=T['title_in'], end=T['title_out'], fade_in=0.0, fade_out=0.0),
        dict(id='whole', start=T['phrase'] - 0.05, end=T['l1_in'] + 0.9, fade_in=0.0, fade_out=0.9),
        dict(id='layer01', start=T['l1_in'], end=T['l1_out'] + 0.5, fade_in=0.9, fade_out=0.5),
        dict(id='layer02', start=T['l2_in'], end=T['l2_out'] + 0.4, fade_in=0.5, fade_out=0.6),
        dict(id='epi_violet', start=T['epi_violet'], end=T['sin_start'] + 0.6, fade_in=0.6, fade_out=0.6),
        dict(id='chords', start=T['sin_start'], end=T['l3_out'] + 0.6, fade_in=0.6, fade_out=0.6),
        dict(id='layer04', start=T['l4_in'], end=T['l4_out'] + 0.3, fade_in=0.6, fade_out=0.6),
        dict(id='epi_frieren', start=T['epi_frieren'], end=T['fri_a'] + 0.6, fade_in=0.6, fade_out=0.6),
        dict(id='layer05', start=T['fri_a'], end=T['l6_out'], fade_in=0.6, fade_out=1.0),
        dict(id='bom', start=T['bom'], end=T['bom_out'] + 0.6, fade_in=0.6, fade_out=0.6),
        dict(id='rebuild', start=T['reb'], end=T['end'], fade_in=0.6, fade_out=1.2),
    ]
    for s in scenes:
        s.setdefault('fade_in', 0.5); s.setdefault('fade_out', 0.5)
    return dict(fps=FPS, duration=T['end'], cues=T, scenes=scenes)


if __name__ == '__main__':
    import json
    tl = build()
    for k, v in tl['cues'].items():
        if isinstance(v, float):
            print(f'{k:14s} {v:8.3f}')
    print('duration', round(tl['duration'], 2))
