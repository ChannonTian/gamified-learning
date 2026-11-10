import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const data=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('/* ================= i18n')[0];
const migration=html.slice(html.indexOf('const SAVE_KEY='),html.indexOf('function persist()'));
const wordslice=html.slice(html.indexOf('const wordSrc='),html.indexOf('/* ---- 尺寸'));   // wordSrc/NOUN_FIELD/P_PRONOUN/ppFull/wordOf/twinFor
const cardslice=html.slice(html.indexOf('function wordCardHTML'),html.indexOf('function nounCardHTML'));
function load(seed){
  const ctx=vm.createContext({window:{addEventListener(){}},localStorage:{getItem:()=>JSON.stringify(seed)}});
  vm.runInContext(data+'\n'+migration+'\nthis.result={save,LINK_LEVELS,VERBS,NOUNS,TIERS};',ctx);
  return JSON.parse(JSON.stringify(ctx.result));
}
test('corrupted saves load without crashing and keep all valid progress (2026-11-10 audit)',()=>{
  const bad=load({lvOrder:'v6',done:null,best:7,counts:'x',dailyBest:null,settings:{volume:'80',hintWait:'18',bannerMs:null,dark:1}}).save;
  assert.deepEqual(bad.done,{});
  assert.deepEqual(bad.best,{});
  assert.deepEqual(bad.counts,{});
  assert.deepEqual(bad.dailyBest,{});
  assert.equal(bad.settings.volume,80);          // 数字字符串收编
  assert.equal(bad.settings.hintWait,18);
  assert.equal(bad.settings.bannerMs,15);        // 非法值回默认
  assert.equal(bad.lvOrder,'v6');
  // 合法进度不被防御逻辑误伤
  const good=load({lvOrder:'v6',done:{L0:true,L24:true},best:{L24:500,Survival:900},counts:{eten:3},dailyBest:{'2026-11-10':120},settings:{volume:30,hintWait:22}}).save;
  assert.deepEqual(good.done,{L0:true,L24:true});
  assert.deepEqual(good.best,{L24:500,Survival:900});
  assert.deepEqual(good.counts,{eten:3});
  assert.deepEqual(good.dailyBest,{'2026-11-10':120});
  assert.equal(good.settings.volume,30);
  assert.equal(good.settings.hintWait,22);
});
test('verb forms pinned to authoritative sources (nl.wiktionary/Groene Boekje, 2026-11-10 audit)',()=>{
  const {VERBS}=load(null);
  const byInf=Object.fromEntries(VERBS.map(v=>[v.inf,v]));
  // 曾在线上的四处错误:zweg/zwam·zwammen/stolen/gemoet(Wiktionary 词干三形 + Groene Boekje 唯一收 gemoeten)
  assert.equal(byInf.zwijgen.sg,'zweeg');
  assert.equal(byInf.zwemmen.sg,'zwom');
  assert.equal(byInf.zwemmen.pl,'zwommen');
  assert.equal(byInf.stelen.pl,'stalen');
  assert.equal(byInf.moeten.pp,'gemoeten');
});
test('twinFor: same-text tiles of different words pair up (LN articles, pronoun reflexives)',()=>{
  const ctx=vm.createContext({window:{addEventListener(){}},save:{style:'A'},artSVG:()=>'',glossOf:v=>v.en,localStorage:{getItem:()=>'null'}});
  vm.runInContext(data+'\n'+wordslice+'\nthis.result={twinFor,wordOf,VERBS,NOUNS};',ctx);
  const {twinFor,wordOf,VERBS,NOUNS}=ctx.result;
  const pair=(got,x,y)=>{ assert.ok(got); assert.equal(got[0],x); assert.equal(got[1],y); };   // vm 跨 realm 数组不能 deepEqual,按元素引用比
  // LN 冠词关:man↔de 与 vrouw↔de 的两块 "de" 同形——点 man + vrouw 的 de 应命中 man 的本命 de
  const T=(v,k,f)=>({v,k,f,src:'n',alive:true});
  const ln=[T(0,'inf','de'),T(0,'form','de'),T(1,'inf','de'),T(1,'form','de'),T(2,'inf','ht'),T(2,'form','ht')];
  pair(twinFor(ln[0],ln[3],ln),ln[3],ln[1]);   // man + vrouw 的 de → 换 form 身份
  assert.equal(twinFor(ln[0],ln[5],ln),null);                // man + het(不同形)无替身
  pair(twinFor(ln[2],ln[1],ln),ln[1],ln[3]);   // vrouw + man 的 de → 同样换 form 身份(本命 de 在场时优先换形式块)
  assert.equal(twinFor(ln[0],ln[2],ln),null);                // inf+inf 不构成对
  // 代词组:hij/zij(she)/zij(they) 的反身都是 zichzelf/zich——同形块可互换
  const idx=n=>VERBS.findIndex(v=>v.pron&&v.inf===n);
  const hij=idx('hij'), zijS=idx('zij'), zijT=VERBS.map((v,i)=>v.pron&&v.inf==='zij'?i:-1).filter(i=>i>=0).find(i=>i!==zijS);
  const P=(v,k,f)=>({v,k,f,alive:true});
  const pr=[P(hij,'inf','pp'),P(hij,'form','pp'),P(zijS,'inf','pp'),P(zijS,'form','pp'),P(zijT,'inf','pp'),P(zijT,'form','pp')];
  assert.equal(wordOf(pr[3]),'zichzelf');
  pair(twinFor(pr[0],pr[3],pr),pr[3],pr[1]);   // hij + zij 的 zichzelf → 换 form 身份
  pair(twinFor(pr[2],pr[5],pr),pr[2],pr[4]);   // zij(she) + zij(they) 的 zich → 换 inf 身份(原形同形 zij)
  assert.equal(twinFor(pr[0],pr[5],pr),null);                // hij + zich(不同词且不同形)无替身
});
test('current save survives repeated reloads with every group and mode score intact',()=>{
  const seed={lvOrder:'v6',done:{L0:true,L3:true,L12:true,L20:true,L24:true},best:{L0:100,L12:250,L24:500,Survival:900},counts:{eten:3},dailyBest:{'2026-11-10':123},dailyDone:'2026-11-10'};
  let current=seed;
  for(let i=0;i<3;i++){
    current=load(current).save;
    for(const key of Object.keys(seed)) assert.deepEqual(current[key],seed[key],key);
    assert.deepEqual(current.gUnlocked,{PR:2,PS:2,LN:2,MV:2,PT:2});
  }
});
test('v4 progress and scores migrate once through v5/v6; score-only saves also migrate',()=>{
  for(const done of [{L0:true,L12:true},{}]){
    const saved=load({lvOrder:'v4',done,best:{L12:123,Survival:99}}).save;
    // v4 的 L12(过去时第 1 关)→ v5 +8=20 → v6 +4=24;PR 的 L0 不动
    assert.deepEqual(saved.done,Object.keys(done).length?{L0:true,L24:true}:{});
    assert.deepEqual(saved.best,{L24:123,Survival:99});
    assert.equal(saved.lvOrder,'v6');
    assert.deepEqual(load(saved).save,saved);
  }
});
test('v2/v3 migration and fresh independent unlocks',()=>{
  assert.deepEqual(load(null).save.gUnlocked,{PR:1,PS:1,LN:1,MV:1,PT:1});
  for(const lvOrder of ['v2','v3']){
    const saved=load({lvOrder,done:{L0:true},best:{L0:123}}).save;
    // v2/v3 的 L0(A1 sg 第 1 关)→ v4 +12 → v5 +8 → v6 +4 = L24
    assert.equal(saved.done.L24,true);
    assert.equal(saved.best.L24,123);
    assert.equal(saved.lvOrder,'v6');
    assert.deepEqual(load(saved).save,saved);
  }
});
test('all 78 levels have unique words, valid forms and complete type-pool coverage',()=>{
  const {LINK_LEVELS:levels,VERBS:verbs,NOUNS:nouns,TIERS:tiers}=load(null);
  assert.equal(levels.length,78);
  for(const lv of levels){
    assert.equal(new Set(lv.verbs).size,lv.verbs.length,lv.id);
    for(const vi of lv.verbs){
      const word=(lv.noun?nouns:verbs)[vi];
      const fld=lv.type==='dh'?(word.de?'de':'ht'):lv.type;   // LN 混盘:类型键 dh,词按自带字段校验
      assert.ok(word?.inf && typeof word[fld]==='string' && word[fld].length,lv.id);
    }
  }
  const pools=tiers.flatMap(tr=>['sg','pl','pp'].map(f=>[tr.band,f,tr.pool]));
  pools.push(...['p1','p3','p6'].map(f=>['PS',f,tiers[0].pool]));
  pools.push(['LN','dh',nouns.flatMap((w,i)=>w.de||w.ht?[i]:[])]);
  for(const f of ['en','s','ap']) pools.push(['MV',f,nouns.flatMap((w,i)=>w[f]?[i]:[])]);
  for(const [band,f,pool] of pools){
    const covered=new Set(levels.filter(l=>l.band===band&&l.type===f).flatMap(l=>l.verbs));
    assert.deepEqual(pool.filter(vi=>!covered.has(vi)),[],band+':'+f);
  }
  // LN 每组词两关:短语关(hint:true)→ 裸冠词关(hint:false),同词两关(v1.24)
  const ln=levels.filter(l=>l.band==='LN');
  assert.equal(ln.length,8);
  for(let i=0;i<ln.length;i+=2){
    assert.equal(ln[i].hint,true,ln[i].id);
    assert.equal(ln[i+1].hint,false,ln[i+1].id);
    assert.deepEqual(ln[i].verbs,ln[i+1].verbs,ln[i].id);
  }
});
test('every regular verb is labelled with a first-person perfective auxiliary (ben/heb)',()=>{
  const {VERBS}=load(null);
  const byInf=Object.fromEntries(VERBS.map(v=>[v.inf,v]));
  const regular=VERBS.filter(v=>!v.pron);
  for(const v of regular) assert.ok(v.aux==='ben'||v.aux==='heb',v.inf);
  assert.equal(regular.length,141);
  for(const v of VERBS.filter(v=>v.pron)) assert.equal(v.aux,undefined,v.inf);   // 代词组 pp=反身代词,无助动词
  // zijn 类代表:位移/状态变化/生命阶段(demo 参考词表 8 词 + 查证定稿的两可词)
  for(const w of ['zijn','gaan','komen','blijven','lopen','rijden','beginnen','vergeten','sterven','vallen','smelten','zwellen','krimpen','schrikken','zwemmen','vliegen','klimmen','kruipen','duiken','glijden','springen','zinken','treden','bederven','wijken','dringen','verlopen','verdwijnen','vertrekken','verschijnen','bevriezen','rijzen','bezwijken','blijken','ontgaan','vervliegen','genezen'])
    assert.equal(byInf[w].aux,'ben',w);
  // hebben 类代表:及物/活动/定位动词(两可词按查证结果:gelden/klinken/bestaan/vriezen 天气义/定位动词)
  for(const w of ['hebben','eten','zien','geven','nemen','lezen','spreken','slapen','kopen','winnen','gelden','klinken','bestaan','vriezen','hangen','zitten','liggen','staan','sluiten','breken','trekken','schuiven','schieten','splijten','kunnen','moeten','willen','mogen','genieten','onthouden'])
    assert.equal(byInf[w].aux,'heb',w);
});
test('participle tiles/cards/speech read ben/heb + pp; person and noun tiles untouched',()=>{
  const ctx=vm.createContext({window:{addEventListener(){}},save:{style:'A'},artSVG:()=>'',glossOf:v=>v.en,localStorage:{getItem:()=>'null'}});
  vm.runInContext(data+'\n'+wordslice+'\n'+cardslice+'\nthis.result={wordOf,ppFull,VIDX,cardPP:wordCardHTML(VIDX.zijn,"pp"),cardHeb:wordCardHTML(VIDX.eten,"pp"),cardP1:wordCardHTML(VIDX.zijn,"p1")};',ctx);
  const {wordOf,ppFull,cardPP,cardHeb,cardP1}=ctx.result;
  assert.equal(wordOf({v:0,k:'form',f:'pp'}),'ben geweest');           // pp 磁贴:ben + 分词
  assert.equal(wordOf({v:9,k:'form',f:'pp'}),'heb gegeten');           // eten:heb + 分词
  assert.equal(wordOf({v:0,k:'inf',f:'pp'}),'zijn');                   // 原形侧不带 aux
  assert.equal(wordOf({v:0,k:'form',f:'p1'}),'ik ben');                // 人称变位仍走 P_PRONOUN(p1 ben ≠ aux ben)
  assert.equal(wordOf({v:0,k:'inf',f:'de',hint:true,src:'n'}),'de man');// LN 短语关不受影响
  assert.equal(wordOf({v:0,k:'form',f:'de',src:'n'}),'de');            // LN 裸冠词关:de 词=首词
  assert.equal(wordOf({v:18,k:'form',f:'ht',src:'n'}),'het');          // LN 裸冠词关:ht 内部键显示 het(短语首词,v1.23 线上 bug 回归)
  assert.equal(ppFull({pp:'geweest',aux:'ben'}),'ben geweest');
  assert.equal(ppFull({pp:'geweest'}),'geweest');
  assert.match(cardPP,/<span class="bf on">ben geweest<\/span>/);      // 词卡第四形态带 aux 且高亮
  assert.match(cardHeb,/<span class="bf on">heb gegeten<\/span>/);
  assert.match(cardP1,/<span class="bf on">ik ben<\/span>/);           // 人称组:形带人称(与磁贴同源)
});
