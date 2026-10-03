// Main title: homage to the Evangelion title cards.
import { el } from '../lib.js';

export default {
  bg: 'dark',
  init(L) {
    const card = el(L.ui, 'div', 'a', '', { left: '180px', top: '-18px', height: '1080px', display: 'flex', flexDirection: 'column', justifyContent: 'center' });
    const cn = { fontFamily: 'var(--serif-cn)', fontWeight: 900, color: '#f2eee6', lineHeight: 1, whiteSpace: 'nowrap', transformOrigin: '0 50%', letterSpacing: '-0.01em' };
    el(card, 'div', '', '第零话', { ...cn, fontSize: '112px', transform: 'scaleX(0.72)', marginBottom: '22px' });
    el(card, 'div', '', '把三首歌', { ...cn, fontSize: '224px', transform: 'scaleX(0.58)', marginBottom: '-4px' });
    el(card, 'div', '', '拆到只剩数字', { ...cn, fontSize: '336px', transform: 'scaleX(0.58)', marginLeft: '-8px' });
    el(card, 'div', '', '<b style="margin-right:26px">EPISODE:0</b>TAKING THREE SONGS APART, UNTIL ONLY NUMBERS REMAIN', {
      fontFamily: 'var(--serif-en)', fontWeight: 700, fontSize: '46px', letterSpacing: '0.01em', color: '#f2eee6', marginTop: '34px',
      whiteSpace: 'nowrap', transform: 'scaleX(0.9)', transformOrigin: '0 50%', fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1',
    });
    el(L.ui, 'div', 'a mono', 'PIANO ARRANGEMENTS <em style="font-style:normal;color:var(--eva)">/</em> ANIMENZ', {
      right: '120px', bottom: '96px', fontSize: '17px', letterSpacing: '0.14em', color: 'rgba(236,231,222,0.42)',
    });
  },
  draw() {},
};
