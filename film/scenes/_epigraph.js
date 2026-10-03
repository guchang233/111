// Vertical epigraph scenes: one line from each story, set like a colophon.
import { el, show, env } from '../lib.js';

export function epigraph({ lines, who, accent, shape = 'ring', bg = 'dark' }) {
  return {
    bg,
    init(L) {
      const q = el(L.ui, 'div', 'a vert', lines.join('<br>'), {
        top: '236px', right: '640px', fontWeight: 300, fontSize: '50px', letterSpacing: '0.34em', lineHeight: 2.3, color: '#eee9e0',
      });
      const w = el(L.ui, 'div', 'a vert', who, { top: '520px', right: '912px', fontSize: '20px', letterSpacing: '0.42em', color: 'rgba(236,231,222,0.5)' });
      const mark = el(L.ui, 'span', 'a', '', shape === 'ring'
        ? { top: '486px', right: '917px', width: '9px', height: '9px', border: `1.2px solid ${accent}`, borderRadius: '50%' }
        : { top: '488px', right: '918px', width: '8px', height: '8px', background: accent, transform: 'rotate(45deg)' });
      L.st = { q, w, mark };
    },
    draw(L, t) {
      const s = L.spec.start, e = L.spec.end;
      show(L.st.q, env(t, s + 0.2, e, 1.0, 0.6));
      show(L.st.w, env(t, s + 0.9, e, 1.0, 0.6));
      show(L.st.mark, env(t, s + 0.9, e, 1.0, 0.6));
    },
  };
}
