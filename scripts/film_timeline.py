"""Master timeline of the film (v3: a music showcase in three movements).

One source of truth for picture (exported to JSON) and sound. All times are film seconds;
music cue times are derived from the MIDI windows in segments.py, so the picture lands on the notes.
"""
import segments

FPS = 30


def bar_time(name, bar):
    """Seconds from the start of segment `name` to the downbeat of `bar` (in the source MIDI)."""
    s = segments.song(name)
    t0, _ = segments.window(name)
    return s.sec(s.bars[bar][0]) - t0


def seg_len(name):
    a, b = segments.window(name)
    return b - a


def build():
    T = {}
    # ---- I · EVA ----------------------------------------------------------------------
    T['eva_start'] = 0.0
    T['eva_rit'] = bar_time('eva', 7)
    T['eva_pause'] = bar_time('eva', 15)
    T['title_in'] = bar_time('eva', 15) + 3 * (bar_time('eva', 16) - bar_time('eva', 15)) / 4
    T['title_out'] = bar_time('eva', 17) - 0.12
    T['phrase'] = bar_time('eva', 17)
    T['eva_end'] = bar_time('eva', 25)
    T['eva_ch'] = T['eva_end']                                   # the G fanfare follows the phrase directly
    T['eva_ch_bars'] = [T['eva_ch'] + bar_time('eva_chorus', b) for b in range(48, 62)]
    T['eva_ch_end'] = T['eva_ch'] + seg_len('eva_chorus')

    # ---- II · Sincerely ------------------------------------------------------------------
    T['epi_violet'] = T['eva_ch_end'] + 1.6
    T['sin_a'] = T['epi_violet'] + 3.9
    T['sin_a_bars'] = [T['sin_a'] + bar_time('sin_a', b) for b in range(60, 77)]
    T['sin_b'] = T['sin_a'] + seg_len('sin_a')                    # C/E → Dm: the deceptive cadence joins them
    T['sin_b_bars'] = [T['sin_b'] + bar_time('sincerely', b) for b in range(216, 233)]
    T['sin_b_end'] = T['sin_b'] + seg_len('sincerely')

    # ---- III · Frieren --------------------------------------------------------------------
    T['epi_frieren'] = T['sin_b_end'] + 1.4
    T['fri_d'] = T['epi_frieren'] + 3.9
    T['fri_d_end'] = T['fri_d'] + seg_len('fri_d')
    T['fri_a'] = T['fri_d_end'] + 0.9
    T['fri_a_end'] = T['fri_a'] + seg_len('frieren_a')
    T['reb'] = T['fri_a_end'] + 0.6
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
        dict(id='whole', start=T['phrase'] - 0.05, end=T['eva_ch'], fade_in=0.0, fade_out=0.0),
        dict(id='atfield', start=T['eva_ch'], end=T['epi_violet'] + 0.4, fade_in=0.0, fade_out=1.2),
        dict(id='epi_violet', start=T['epi_violet'], end=T['sin_a'] + 0.6, fade_in=0.6, fade_out=0.6),
        dict(id='letter', start=T['sin_a'], end=T['sin_b'] + 0.5, fade_in=0.6, fade_out=0.5),
        dict(id='chords', start=T['sin_b'], end=T['sin_b_end'] + 1.0, fade_in=0.5, fade_out=0.9),
        dict(id='epi_frieren', start=T['epi_frieren'], end=T['fri_d'] + 0.6, fade_in=0.6, fade_out=0.6),
        dict(id='flowers', start=T['fri_d'], end=T['fri_a'] + 0.6, fade_in=0.6, fade_out=0.9),
        dict(id='magic', start=T['fri_a'] - 0.2, end=T['reb'] + 0.8, fade_in=0.8, fade_out=0.8),
        dict(id='rebuild', start=T['reb'], end=T['end'], fade_in=0.8, fade_out=1.2),
    ]
    for s in scenes:
        s.setdefault('fade_in', 0.5); s.setdefault('fade_out', 0.5)
    return dict(fps=FPS, duration=T['end'], cues=T, scenes=scenes)


if __name__ == '__main__':
    tl = build()
    for k, v in tl['cues'].items():
        if isinstance(v, float):
            print(f'{k:14s} {v:8.3f}')
    print('duration', round(tl['duration'], 2))
