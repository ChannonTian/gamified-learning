#!/usr/bin/env node
// variant-smoke.mjs <dir> — 校验一个语言变体的数据与关卡生成(零依赖;引擎无关)
// 用法: node tools/variant-smoke.mjs link-match-fr
import fs from 'fs';
import vm from 'vm';
const dir = process.argv[2];
if (!dir) { console.error('usage: variant-smoke.mjs <dir>'); process.exit(1); }
const html = fs.readFileSync(`${dir}/index.html`, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('no script block'); process.exit(1); }
const head = m[1].split('/* ================= i18n')[0];
const ctx = { console, window: { addEventListener() {}, __errs: [] } };
vm.createContext(ctx);
vm.runInContext(head + '\nthis.__x={VERBS,NOUNS,TIERS,LINK_LEVELS,LANG_META};', ctx);
const { VERBS, NOUNS, TIERS, LINK_LEVELS, LANG_META } = ctx.__x;
let fail = 0;
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) { console.log('FAIL', msg, 'got', JSON.stringify(a), 'want', JSON.stringify(b)); fail++; } };
const field = n => { for (const f of LANG_META.ln.concat(LANG_META.mv)) if (n[f]) return f; return null; };

// LANG_META
eq(typeof LANG_META.code, 'string', 'LANG_META.code');
eq(LINK_LEVELS.filter(l => l.grp === 'PR').length, 3, 'PR 3');
eq(LINK_LEVELS.filter(l => l.grp === 'PS').length, 9, 'PS 9');
const ln = LINK_LEVELS.filter(l => l.grp === 'LN');
eq(ln.length, 8, 'LN 8 levels');
const mv = LINK_LEVELS.filter(l => l.grp === 'MV');
eq(mv.length, LANG_META.mv.reduce((s, f) => s + Math.ceil(NOUNS.filter(n => n[f]).length / 9), 0), 'MV level count');
eq(LINK_LEVELS.filter(l => l.grp === 'PT').length, TIERS.reduce((s, tr) => s + Math.ceil(tr.pool.length / 9) * 3, 0), 'PT level count');

// LN:相邻成对同词、提示交替、混编、关内唯一
for (let i = 0; i < ln.length; i += 2) {
  const a = ln[i], b = ln[i + 1];
  eq([a.hint, b.hint], [true, false], `LN pair hint ${a.id}/${b.id}`);
  eq(a.verbs, b.verbs, `LN pair same words ${a.id}/${b.id}`);
}
{
  const got = {};
  for (const l of ln) {
    eq(new Set(l.verbs).size, 9, l.id + ' 9 unique words');
    for (const vi of l.verbs) {
      const f = field(NOUNS[vi]);
      if (!LANG_META.ln.includes(f)) { fail++; console.log('FAIL LN word not article noun', l.id, NOUNS[vi].inf); }
      got[vi] = true;
    }
  }
  const all = NOUNS.map((n, i) => LANG_META.ln.some(f => n[f]) ? i : -1).filter(i => i >= 0);
  eq(all.filter(i => !got[i]).length, 0, 'LN full coverage');
}
// MV:全池覆盖
for (const f of LANG_META.mv) {
  const got = new Set();
  LINK_LEVELS.filter(l => l.band === 'MV' && l.type === f).forEach(l => l.verbs.forEach(vi => got.add(vi)));
  const pool = NOUNS.map((n, i) => n[f] ? i : -1).filter(i => i >= 0);
  const missing = pool.filter(i => !got.has(i));
  if (missing.length) { fail++; console.log('FAIL MV coverage', f, missing.map(i => NOUNS[i].inf)); }
}
// PT:三形态全池覆盖 + 编号
for (const tr of TIERS) {
  for (const ty of ['sg', 'pl', 'pp']) {
    const got = new Set();
    LINK_LEVELS.filter(l => l.band === tr.band && l.type === ty).forEach(l => l.verbs.forEach(vi => got.add(vi)));
    const missing = tr.pool.filter(i => !got.has(i));
    if (missing.length) { fail++; console.log('FAIL PT coverage', tr.band, ty, missing.map(i => VERBS[i].inf)); }
  }
}
// PS: trio 编号 + A1 词有 p1/p3/p6
for (const lv of LINK_LEVELS.filter(l => l.grp === 'PS')) {
  eq(new Set(lv.verbs).size, 9, lv.id + ' 9 unique');
  for (const vi of lv.verbs) if (!VERBS[vi].p1) { fail++; console.log('FAIL no p1', lv.id, VERBS[vi].inf); }
}
// PR:代词组三形态齐
for (const lv of LINK_LEVELS.filter(l => l.grp === 'PR'))
  for (const vi of lv.verbs)
    for (const k of ['sg', 'pl', 'pp']) if (!VERBS[vi][k]) { fail++; console.log('FAIL pron missing', k, VERBS[vi].inf); }
// 组内编号/gpos
for (const lv of LINK_LEVELS) {
  if (lv.grp !== 'PT') eq(lv.num, lv.gpos + 1, lv.grp + ' numbering ' + lv.id);
}
// 存档键不与荷兰语冲突
if (LANG_META.save === 'linkmatch.v1') { fail++; console.log('FAIL save key collides with Dutch'); }
console.log(fail ? `${dir} SMOKE FAIL ${fail}` : `${dir} SMOKE ALL PASS`);
process.exit(fail ? 1 : 0);
