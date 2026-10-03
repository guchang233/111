// LAYER 01 · 声部: the EVA phrase as an exploded view of four parts, played back one part at a time.
import { C, el, show, html, env, clamp, rgba, N, prog, ease, noteName } from '../lib.js';

const INK = '#171615';
const YAW = -24 * Math.PI / 180, PITCH = 10 * Math.PI / 180, S = 0.9, OX = 662, OY = 900, T = 15, W = 1000, ST = 4.6;
const P = (X, Y, Z = 0) => {
  const x1 = X * Math.cos(YAW) + Z * Math.sin(YAW);
  const z1 = -X * Math.sin(YAW) + Z * Math.cos(YAW);
  const y2 = Y * Math.cos(PITCH) - z1 * Math.sin(PITCH);
  return [OX + x1 * S, OY - y2 * S];
};
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

export default {
  bg: 'paper', paper: true,
  init(L, D) {
    const st = L.st, ui = L.ui, ph = D.eva_phrase;
    st.notes = ph.notes.map(N);
    st.len = ph.bar * 8;
    const byRole = (r) => st.notes.filter((n) => n.role === r);
    const lo = (r) => Math.min(...byRole(r).map((n) => n.p)), hi = (r) => Math.max(...byRole(r).map((n) => n.p));
    st.panels = [
      { id: 'P-04', role: 't', name: '时值', en: 'TIME', h: 104, dt: `<b>♩ = 129</b> · 4/4 · 8 小节 = <b>${st.len.toFixed(2)}</b> 秒` },
      { id: 'P-03', role: 'b', name: '低音', en: 'BASS', lo: lo('b') - 1, hi: hi('b') + 1, dt: `左手 · <b>${ph.counts.b}</b> 个音 · 音域 <b>${ph.ranges.b[0].replace('#', '♯')}–${ph.ranges.b[1].replace('#', '♯')}</b>` },
      { id: 'P-02', role: 'h', name: '和声', en: 'HARMONY', lo: lo('h') - 1, hi: hi('h') + 1, dt: `右手内声部 · <b>${ph.counts.h}</b> 个音` },
      { id: 'P-01', role: 'm', name: '旋律', en: 'MELODY', lo: lo('m') - 1, hi: hi('m') + 1, dt: `右手高声部 · <b>${ph.counts.m}</b> 个音 · 音域 <b>${ph.ranges.m[0]}–${ph.ranges.m[1]}</b>` },
    ];
    for (const p of st.panels) if (!p.h) p.h = (p.hi - p.lo) * ST;
    // syncopation: melody onsets that fall between beats
    const beat = ph.bar / 4;
    st.sync = byRole('m').filter((n) => Math.abs(n.s / beat - Math.round(n.s / beat)) > 0.2).map((n) => n.s);

    el(ui, 'div', 'a kicker', 'LAYER 01 <em>/</em> 06 &nbsp;·&nbsp; EXPLODED VIEW', { left: '120px', top: '104px' });
    el(ui, 'div', 'a h-title', '声部', { left: '120px', top: '140px' });
    el(ui, 'div', 'a h-sub', '一段钢琴，拆成四个零件。', { left: '120px', top: '230px' });
    const tb = el(ui, 'div', 'a mono', '', { right: '120px', top: '104px', border: '1.2px solid rgba(23,22,21,0.8)', display: 'grid', gridTemplateColumns: '120px 150px 150px', fontSize: '12.5px', letterSpacing: '0.08em' });
    const cell = (k, v, extra = {}) => el(tb, 'div', '', `<span style="display:block;color:rgba(23,22,21,0.5);font-size:10.5px;letter-spacing:0.16em;margin-bottom:4px">${k}</span>${v}`,
      { borderRight: '1px solid rgba(23,22,21,0.35)', borderBottom: '1px solid rgba(23,22,21,0.35)', padding: '9px 12px 8px', ...extra });
    cell('DWG NO.', '01'); cell('SCALE', '1 : 1'); cell('UNIT', 'Hz · s', { borderRight: 'none' });
    cell('SOURCE', '残酷天使的行动纲领 · 钢琴改编 Animenz', { gridColumn: 'span 3', borderRight: 'none', fontFamily: 'var(--serif-cn)', fontSize: '15px', letterSpacing: '0.02em' });
    cell('BARS', '17–24', { borderBottom: 'none' }); cell('TEMPO', '♩ = 129', { borderBottom: 'none' }); cell('PARTS', '4', { borderBottom: 'none', borderRight: 'none' });
    st.labels = st.panels.map((p) => {
      const d = el(ui, 'div', 'a', `<div class="mono" style="font-size:14px;letter-spacing:0.2em;color:var(--mark)">${p.id}</div>
        <div style="font-family:var(--serif-cn);font-weight:600;font-size:31px;margin-top:8px;line-height:1">${p.name}<i style="font-family:var(--serif-en);font-style:normal;font-weight:600;font-size:19px;letter-spacing:0.16em;margin-left:12px;color:rgba(23,22,21,0.6)">${p.en}</i></div>
        <div style="font-family:var(--serif-cn);font-size:16px;color:rgba(23,22,21,0.62);margin-top:10px;letter-spacing:0.03em" class="dt">${p.dt}</div>`, { left: '120px', width: '440px' });
      d.querySelectorAll('b').forEach((b) => Object.assign(b.style, { fontFamily: 'var(--mono)', fontWeight: 400, color: INK }));
      return d;
    });
    st.now = el(ui, 'div', 'a mono', '', { left: '120px', bottom: '84px', fontSize: '13px', letterSpacing: '0.18em', color: 'rgba(23,22,21,0.55)' });
  },
  draw(L, t, D) {
    const ctx = L.ctx, st = L.st, Cq = D.C;
    const gap = 62 * ease.out(prog(t, Cq.l1_in + 0.5, Cq.l1_in + 2.1));
    const u = t - Cq.l1_replay;                                    // seconds into the replay
    const solo = Cq.l1_solo, clicks = Cq.l1_clicks;
    // which part is sounding
    let active = 'all';
    if (t >= solo[1] && t < solo[2]) active = 'm';
    else if (t >= solo[2] && t < solo[3]) active = 'h';
    else if (t >= solo[3] && t < clicks) active = 'b';
    else if (t >= clicks) active = 't';
    const sw = (role) => {                                         // smooth 0.25 s switch
      const on = (r, a, b) => clamp(Math.min((t - a) / 0.25 + 1, (b - t) / 0.25 + 1));
      if (t < solo[1]) return 1;
      const win = { m: [solo[1], solo[2]], h: [solo[2], solo[3]], b: [solo[3], clicks], t: [clicks, 1e9] }[role];
      return 0.2 + 0.8 * on(role, win[0], win[1]);
    };
    // geometry
    let y0 = 0;
    const geo = st.panels.map((p) => { const g = { ...p, Y0: y0, Y1: y0 + p.h }; y0 += p.h + gap; return g; });
    // assembly lines
    ctx.setLineDash([2, 6]); ctx.strokeStyle = rgba(INK, 0.45 * clamp(gap / 30)); ctx.lineWidth = 0.8;
    for (const X of [0, W]) { const a = P(X, -30), b = P(X, y0 - gap + 30); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
    ctx.setLineDash([]);
    const tx = (s) => (s / st.len) * W;
    geo.forEach((g, i) => {
      const k = sw(g.role);
      ctx.globalAlpha = k;
      poly(ctx, [P(0, g.Y1), P(W, g.Y1), P(W, g.Y1, -T), P(0, g.Y1, -T)]); ctx.fillStyle = '#d9d2c6'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
      poly(ctx, [P(W, g.Y0), P(W, g.Y0, -T), P(W, g.Y1, -T), P(W, g.Y1)]); ctx.fillStyle = '#cfc8bb'; ctx.fill(); ctx.stroke();
      poly(ctx, [P(0, g.Y0), P(W, g.Y0), P(W, g.Y1), P(0, g.Y1)]); ctx.fillStyle = '#f1ede5'; ctx.fill(); ctx.lineWidth = 1.3; ctx.stroke();
      for (let b = 1; b < 32; b++) {
        const a = P(tx(b * st.len / 32), g.Y0), c = P(tx(b * st.len / 32), g.Y1);
        ctx.strokeStyle = rgba(INK, b % 4 === 0 ? 0.32 : 0.14); ctx.lineWidth = b % 4 === 0 ? 0.7 : 0.35;
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...c); ctx.stroke();
      }
      if (g.role !== 't') {
        for (const n of st.notes) {
          if (n.role !== g.role) continue;
          const y = g.Y0 + (n.p - g.lo) * ST, h = g.role === 'm' ? 4.6 : 3.8;
          const played = u >= n.s, sounding = u >= n.s && u < n.s + n.d && t < clicks;
          ctx.fillStyle = sounding ? C.mark : rgba(INK, played || u < 0 ? 1 : 0.38);
          poly(ctx, [P(tx(n.s), y - h / 2), P(tx(n.s + n.d) - 2, y - h / 2), P(tx(n.s + n.d) - 2, y + h / 2), P(tx(n.s), y + h / 2)]);
          ctx.fill();
        }
      } else {
        const beat = st.len / 32;
        for (let b = 0; b < 32; b++) {
          const v = b % 4 === 0 ? 1 : b % 2 === 0 ? 0.7 : 0.5;
          const ct = clicks + b * beat;
          const pulse = t >= clicks && b < 8 ? Math.exp(-Math.max(0, t - ct) / 0.12) * (t >= ct ? 1 : 0) : 0;
          const base = P(tx(b * beat), g.Y0 + 10), top = P(tx(b * beat), g.Y0 + 10 + v * (g.h - 42) * (1 + 0.25 * pulse));
          ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...base); ctx.lineTo(...top); ctx.stroke();
          ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(top[0], top[1], 3.2 + 3 * pulse, 0, Math.PI * 2); ctx.fill();
        }
        for (const s of st.sync) {                                   // syncopated melody onsets, red pencil
          const base = P(tx(s), g.Y0 + 10), top = P(tx(s), g.Y0 + 10 + 0.62 * (g.h - 42));
          ctx.strokeStyle = C.mark; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...base); ctx.lineTo(...top); ctx.stroke();
          ctx.fillStyle = C.mark; ctx.beginPath(); ctx.arc(top[0], top[1], 3.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.font = '400 10.5px "IBM Plex Mono"'; ctx.fillStyle = rgba(INK, 0.55);
        for (let bar = 0; bar < 8; bar++) { const a = P(tx(bar * st.len / 8) + 8, g.Y1 - 18); ctx.fillText(String(17 + bar), a[0], a[1]); }
      }
      // playhead
      if (u >= 0 && u <= st.len) {
        const a = P(tx(u), g.Y0 - 6), c = P(tx(u), g.Y1 + 6);
        ctx.strokeStyle = rgba(C.mark, 0.9); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...c); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // leader to label
      const [ax, ay] = P(0, (g.Y0 + g.Y1) / 2);
      const lab = st.labels[i];
      lab.style.top = (ay - 46) + 'px';
      show(lab, 0.25 + 0.75 * k);
      ctx.strokeStyle = rgba(INK, 0.3 + 0.7 * k); ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(500, ay); ctx.lineTo(ax - 6, ay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(500, ay - 6); ctx.lineTo(500, ay + 6); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ax, ay, 3.6, 0, Math.PI * 2); ctx.fill();
    });
    // dimension line
    const yb = -46, a = P(0, yb), b = P(W, yb);
    ctx.strokeStyle = INK; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    for (const q of [a, b]) { ctx.beginPath(); ctx.moveTo(q[0], q[1] - 7); ctx.lineTo(q[0], q[1] + 7); ctx.stroke(); }
    const m = P(W / 2, yb - 22), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    ctx.save(); ctx.translate(m[0], m[1]); ctx.rotate(ang); ctx.font = '400 13px "IBM Plex Mono"'; ctx.fillStyle = INK; ctx.textAlign = 'center';
    ctx.fillText(`8 BARS = 32 BEATS = ${st.len.toFixed(2)} s`, 0, 0); ctx.restore(); ctx.textAlign = 'left';
    html(st.now, { all: 'NOW PLAYING · 全部声部', m: 'NOW PLAYING · 只剩旋律', h: 'NOW PLAYING · 只剩和声', b: 'NOW PLAYING · 只剩低音', t: 'NOW PLAYING · 只剩拍子' }[active]);
    show(st.now, env(t, Cq.l1_replay - 0.2, Cq.l1_out + 0.4, 0.3, 0.3));
  },
};
