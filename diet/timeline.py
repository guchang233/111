"""《越饿越胖》 master timeline: one grid (80 BPM, 4/4) for picture and score.

Every caption, scene and musical event is placed on bars and beats, so words land on the music.
Run it to export diet/data/timeline.json.
"""
import json
import os

BPM = 80
BEAT = 60 / BPM
BAR = 4 * BEAT
FPS = 30


def b(bar, beat=0.0):
    return round(bar * BAR + beat * BEAT, 4)


# section starts, in bars
S = dict(cold=0, title=6, s1=7, s2=15, s3=26, s4=33, s5=39, s6=42, s7=48, end=57, roll=59, fin=63)

# captions: (bar, beat, bars_long, text, preset, extra)
#   presets: line (centred lower third), mid (centred), slam (huge heavy), kicker (top-left section mark)
CAP = []


def cap(bar, beat, dur, text, preset='line', **kw):
    CAP.append(dict(t0=b(bar, beat), t1=b(bar, beat) + dur * BAR, text=text, preset=preset, **kw))


# ---- cold open ----
cap(4, 0, 0.95, '她瘦了。', 'line')
cap(5, 0, 0.95, '她也更胖了。', 'line', color='red')
# ---- 一 ----
cap(7, 0, 8, '一 · 秤不会告诉你的事', 'kicker')
cap(9, 0, 1.9, '秤只告诉你，你轻了。')
cap(11, 0, 1.9, '它不告诉你，轻掉的是什么。')
cap(13, 0, 0.95, '体重正常，体脂超标。')
cap(14, 0, 0.95, '医学上有个名字：正常体重肥胖。')
# ---- 二 ----
cap(15, 0, 11, '二 · 1944 年，明尼苏达', 'kicker')
cap(16, 0, 1.9, '36 个健康的年轻男人。')
cap(18, 0, 0.95, '网上流行的「1200 大卡减肥餐」，比这还少。')
cap(20, 0, 0.45, '他们开始收藏菜谱。', 'mid', y=430, size=40)
cap(20, 2, 0.45, '梦里全是食物。', 'mid', y=500, size=40)
cap(21, 0, 0.45, '易怒，抑郁，', 'mid', y=570, size=40)
cap(21, 2, 0.45, '没法集中注意力。', 'mid', y=640, size=40)
cap(22, 0, 0.95, '实验结束，可以随便吃了。')
cap(23, 0, 0.95, '他们停不下来。', 'line', color='red')
cap(25, 0, 0.95, '越瘦的人，多长得越多。')
# ---- 三 ----
cap(26, 0, 7, '三 · 身体会记仇', 'kicker')
cap(26, 0, 1.9, '14 名《超级减肥王》选手。')
cap(30, 0, 1.9, '他们的身体，每天仍比预期少烧约 500 大卡。')
cap(32, 0, 0.95, '整整 6 年。', 'line', color='red')
# ---- 四 ----
cap(33, 0, 6, '四 · 16 岁，没有第二次', 'kicker')
cap(34, 0, 1.9, '18 岁之前，你会长出一生骨量的 90%。')
cap(36, 0, 1.4, '饿没了的月经，饿没了的骨量，')
cap(37, 2, 1.4, '有些，不会再回来。', 'line', color='red')
# ---- 五 ----
cap(39, 0, 3, '五 · 谁在教你饿', 'kicker')
# ---- 六 ----
cap(42, 0, 6, '六 · 越减越胖', 'kicker')
cap(42, 0, 1.9, '2516 名青少年，追踪 5 年。')
cap(44, 0, 1.9, '用节食这类方法控制体重的人，5 年后——')
cap(46, 0, 1.9, '神经性厌食，死亡率是同龄人的约 6 倍。')
# ---- 七 ----
cap(48, 0, 9, '七 · 那怎么办', 'kicker', warm=True)
cap(52, 0, 1.4, '体重不是你的分数。', 'mid', y=540, size=64, warm=True)
cap(53, 2, 1.4, '如果你已经停不下来，这不是意志力的问题，', 'line', warm=True)
cap(54, 2, 1.4, '是一种需要、也可以被治疗的病。', 'line', warm=True)

# the phrases diet culture sells (scene 五), one per half beat
PHRASES = ['A4 腰', 'BMI 18 才算瘦', '一天只吃一顿', '饿到胃疼就是在瘦', '不瘦十斤不换头像', '过午不食',
           '锁骨放硬币', '反手摸肚脐', '体重别过百', '少吃一口就是赚', '喝水都胖', '晚饭就吃一个苹果']

CUES = dict(
    beat=BEAT, bar=BAR, bpm=BPM,
    scale_from=b(1), scale_to=b(4),
    title=b(S['title']),
    nwo=b(14, 2),
    m_1570=b(17), m_curve=b(19), m_end=b(22), m_fat=b(24), m_plus4=b(24, 2),
    bl_loss=b(27), bl_gain=b(28), bl_days=b(30), bl_days_end=b(32),
    bone=b(34), bone_gap=b(36),
    ph_in=b(39), ph_strike=b(40, 2), ph_out=b(41, 3),
    dots=b(42), x3=b(44, 2), x6=b(45), an=b(46), an_x=b(47),
    eat=b(49), lift=b(50), sleep=b(51),
    help=b(55), stop=b(57), roll=b(S['roll']), end=b(S['fin']),
)

SCENES = [
    dict(id='cold', start=0, end=b(6)),
    dict(id='title', start=b(6), end=b(7)),
    dict(id='scale', start=b(7), end=b(15)),
    dict(id='minnesota', start=b(15), end=b(26)),
    dict(id='loser', start=b(26), end=b(33)),
    dict(id='bone', start=b(33), end=b(39)),
    dict(id='phrases', start=b(39), end=b(42)),
    dict(id='teens', start=b(42), end=b(48)),
    dict(id='turn', start=b(48), end=b(57)),
    dict(id='stop', start=b(57), end=b(S['fin'])),
]


def build():
    return dict(fps=FPS, duration=b(S['fin']), cues=CUES, sections={k: b(v) for k, v in S.items()},
                scenes=SCENES, captions=CAP, phrases=PHRASES)


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(out, exist_ok=True)
    tl = build()
    with open(os.path.join(out, 'timeline.json'), 'w') as f:
        json.dump(tl, f, ensure_ascii=False, indent=1)
    print('duration', tl['duration'], 's ·', len(CAP), 'captions')
