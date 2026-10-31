import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const data=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('/* ================= i18n')[0];
const migration=html.slice(html.indexOf('const SAVE_KEY='),html.indexOf('function persist()'));
function load(seed){
  const ctx=vm.createContext({window:{addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(seed)}});
  vm.runInContext(data+'\n'+migration+'\nthis.result={save,LINK_LEVELS,VERBS,NOUNS,TIERS};',ctx);
  return JSON.parse(JSON.stringify(ctx.result));
}
test('current save survives repeated reloads with every group and mode score intact',()=>{
  const seed={lvOrder:'v5',done:{L0:true,L3:true,L12:true,L16:true,L20:true},best:{L0:100,L12:250,L20:500,Survival:900},counts:{eten:3},dailyBest:{'2026-10-31':123},dailyDone:'2026-10-31'};
  let current=seed;
  for(let i=0;i<3;i++){
    current=load(current).save;
    for(const key of Object.keys(seed)) assert.deepEqual(current[key],seed[key],key);
    assert.deepEqual(current.gUnlocked,{PR:2,PS:2,LN:2,MV:2,PT:2});
  }
});
test('v4 progress and scores migrate once; score-only saves also migrate',()=>{
  for(const done of [{L0:true,L12:true},{}]){
    const saved=load({lvOrder:'v4',done,best:{L12:123,Survival:99}}).save;
    assert.deepEqual(saved.done,Object.keys(done).length?{L0:true,L20:true}:{});
    assert.deepEqual(saved.best,{L20:123,Survival:99});
    assert.deepEqual(load(saved).save,saved);
  }
});
test('v2/v3 migration and fresh independent unlocks',()=>{
  assert.deepEqual(load(null).save.gUnlocked,{PR:1,PS:1,LN:1,MV:1,PT:1});
  for(const lvOrder of ['v2','v3']){
    const saved=load({lvOrder,done:{L0:true},best:{L0:123}}).save;
    assert.equal(saved.done.L20,true);
    assert.equal(saved.best.L20,123);
    assert.deepEqual(load(saved).save,saved);
  }
});
test('all 74 levels have unique words, valid forms and complete type-pool coverage',()=>{
  const {LINK_LEVELS:levels,VERBS:verbs,NOUNS:nouns,TIERS:tiers}=load(null);
  assert.equal(levels.length,74);
  for(const lv of levels){
    assert.equal(new Set(lv.verbs).size,lv.verbs.length,lv.id);
    for(const vi of lv.verbs){
      const word=(lv.noun?nouns:verbs)[vi];
      assert.ok(word?.inf && typeof word[lv.type]==='string' && word[lv.type].length,lv.id);
    }
  }
  const pools=tiers.flatMap(tr=>['sg','pl','pp'].map(f=>[tr.band,f,tr.pool]));
  pools.push(...['p1','p3','p6'].map(f=>['PS',f,tiers[0].pool]));
  for(const f of ['de','ht','en','s','ap']) pools.push([['de','ht'].includes(f)?'LN':'MV',f,nouns.flatMap((w,i)=>w[f]?[i]:[])]);
  for(const [band,f,pool] of pools){
    const covered=new Set(levels.filter(l=>l.band===band&&l.type===f).flatMap(l=>l.verbs));
    assert.deepEqual(pool.filter(vi=>!covered.has(vi)),[],band+':'+f);
  }
});
test('person-form feedback includes and highlights the practiced form',()=>{
  const ctx=vm.createContext({window:{addEventListener(){}},save:{style:'A'},artSVG:()=>'',glossOf:v=>v.en});
  vm.runInContext(data+'\n'+html.slice(html.indexOf('function wordCardHTML'),html.indexOf('function nounCardHTML'))+'\nthis.card=wordCardHTML(VIDX.zijn,"p1");',ctx);
  assert.match(ctx.card,/<span class="bf on">ben<\/span>/);
});
