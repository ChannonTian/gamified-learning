// Optional browser QA: NODE_PATH=<playwright modules> node --test link-match/test/browser.test.cjs
// Uses an isolated context and a temporary local HTTP server; never touches player storage.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'));
test('Link match browser regression',async t=>{
  const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(html)});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
  try{
    async function page(){
      const context=await browser.newContext({viewport:{width:390,height:844}});
      const p=await context.newPage();
      await p.addInitScript(()=>{let seed=123456;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}});
      await p.goto(`http://127.0.0.1:${server.address().port}`);
      await p.evaluate(()=>{save.settings.volume=0;save.settings.ttsVolume=0;save.demoDone=true;document.getElementById('menuScreen').classList.remove('on')});
      return p;
    }
    await t.test('group locks also block keyboard activation',async()=>{
      const p=await page();
      await p.evaluate(()=>{openMenu();showMenuView('levels')});
      const locked=p.locator('#lvGrid .lv-btn').nth(1);
      await locked.focus();await p.keyboard.press('Enter');
      assert.equal(await p.evaluate(()=>curLevel),null,'keyboard must not start PR.2');
      assert.equal(await locked.isDisabled(),true);
      assert.equal(await p.locator('#lvGrid .lv-btn:enabled').count(),5);
      await p.close();
    });
    await t.test('reshuffle retains tile identity, source, form, DOM and playable pairs',async()=>{
      const p=await page();
      const result=await p.evaluate(async()=>{
        await startLink(12);
        reshuffleRemaining();
        const invalid=board.flat().filter(Boolean).filter(t=>!tiles.includes(t)||!t.alive||!t.el||t.src!=='n'||!t.f||board[t.r]?.[t.c]!==t).length;
        const pair=NLM3.findPair();
        return {invalid,connected:pair?NLM3.connect(...pair):false};
      });
      assert.deepEqual(result,{invalid:0,connected:true});
      await p.close();
    });
    await t.test('old clear callback cannot finish a newly started level',async()=>{
      const p=await page();
      await p.evaluate(async()=>{
        await startLink(12);
        while(pairsLeft){const pair=NLM3.findPair();if(!pair)throw Error('No pair');NLM3.connect(...pair)}
        await startLink(16);
      });
      await p.waitForTimeout(650);
      const state=await p.evaluate(()=>({level:curLevel?.id,pairs:pairsLeft,wrongDone:!!save.done.L16,clearedDone:!!save.done.L12}));
      assert.deepEqual(state,{level:'L16',pairs:9,wrongDone:false,clearedDone:true});
      await p.close();
    });
    await t.test('leaving the tutorial during its animation does not affect another game',async()=>{
      const p=await page();const errors=[];p.on('pageerror',e=>errors.push(e.message));
      await p.evaluate(async()=>{
        save.demoDone=false;await startLink(0);
        if(!demo)throw Error('missing tutorial');
        demo.inf.el.click();demo.form.el.click();
        await startLink(12);
      });
      await p.waitForTimeout(650);
      assert.deepEqual(await p.evaluate(()=>({level:curLevel.id,pairs:pairsLeft,busy})),{level:'L12',pairs:9,busy:false});
      assert.deepEqual(errors,[]);await p.close();
    });
    await t.test('mode redeals, survival timeout, daily completion and lockout',async()=>{
      const p=await page();const errors=[];p.on('pageerror',e=>errors.push(e.message));
      await p.evaluate(()=>{save.done.L12=true;startEndless()});
      for(let round=0;round<3;round++){
        await p.evaluate(()=>{
          let guard=0;
          while(pairsLeft&&guard++<100){
            const pair=NLM3.findPair();
            if(!pair){reshuffleRemaining();continue}
            if(!NLM3.connect(...pair))throw Error('mode connect failed');
          }
          if(pairsLeft)throw Error('mode stuck');
        });
        await p.waitForFunction(()=>pairsLeft===18);
      }
      assert.ok(await p.evaluate(()=>save.best.Oneindig>0));
      await p.evaluate(()=>{startSurvival();NLM3.connect(...NLM3.findPair());NLM3.forceSurvivalEnd()});
      await p.waitForFunction(()=>curLevel===null);
      assert.ok(await p.evaluate(()=>save.best.Survival>0));
      await p.evaluate(()=>{hideResult();startDaily();NLM3.connect(...NLM3.findPair());NLM3.forceTimeUp()});
      await p.waitForFunction(()=>curLevel===null);
      assert.equal(await p.evaluate(()=>save.dailyDone===todayKey()&&save.dailyBest[todayKey()]>0),true);
      await p.evaluate(()=>startDaily());assert.equal(await p.evaluate(()=>curLevel),null);
      assert.deepEqual(errors,[]);await p.close();
    });
    await t.test('mobile and desktop layouts, languages, themes and actual click input',async()=>{
      const p=await page();const errors=[];p.on('pageerror',e=>errors.push(e.message));
      for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
        await p.setViewportSize(viewport);
        for(const lang of ['nl','en','zh'])for(const theme of ['grug','papier'])for(const dark of [false,true]){
          const failures=await p.evaluate(async({lang,theme,dark})=>{
            Object.assign(save.settings,{uiLang:lang,theme,dark});applySettings();
            await startLink(14);syncSize();
            const errors=[];
            for(const tile of tiles){
              const face=tile.el.querySelector('.face'),r=face.getBoundingClientRect();
              if(!face.textContent||/undefined|null/.test(face.textContent)||face.scrollWidth>face.clientWidth+1||r.left<0||r.right>innerWidth+1)errors.push(face.textContent);
            }
            const board=boardEl.getBoundingClientRect(),dock=document.getElementById('dock').getBoundingClientRect();
            if(board.bottom>dock.top||board.top<0)errors.push('board overlaps dock');
            return errors;
          },{lang,theme,dark});
          assert.deepEqual(failures,[],JSON.stringify({viewport,lang,theme,dark}));
        }
        await p.evaluate(()=>{Object.assign(save.settings,{uiLang:'nl',theme:'grug',dark:false});applySettings()});
        const pair=await p.evaluate(()=>NLM3.findPair());
        await p.locator(`.tile[data-r="${pair[0]}"][data-c="${pair[1]}"]`).click();
        await p.locator(`.tile[data-r="${pair[2]}"][data-c="${pair[3]}"]`).click();
        assert.equal(await p.evaluate(()=>pairsLeft),8);
        await p.waitForTimeout(550);
        if(process.env.QA_SCREENSHOTS)await p.screenshot({path:require('node:path').join(process.env.QA_SCREENSHOTS,`link-match-${viewport.width}.png`)});
      }
      assert.deepEqual(errors,[]);await p.close();
    });
    await t.test('all levels clear with correct feedback and independent progress, then reload',async()=>{
      const p=await page();const errors=[];p.on('pageerror',e=>errors.push(e.message));
      for(let i=0;i<74;i++){
        await p.evaluate(async i=>{hideResult();await startLink(i);NLM3.skipDemo()},i);
        let guard=0;
        while(await p.evaluate(()=>pairsLeft>0)){
          assert.ok(guard++<30,`stuck level ${i}`);
          const result=await p.evaluate(()=>{
            const p=NLM3.findPair();if(!p)return null;
            const a=board[p[0]][p[1]],b=board[p[2]][p[3]],expected=wordOf(a.k==='form'?a:b);
            const ok=NLM3.connect(...p);
            return {ok,expected,highlight:bannerEl.querySelector('.bf.on')?.textContent};
          });
          if(!result){await p.waitForTimeout(550);continue}
          assert.equal(result.ok,true,`connect level ${i}`);
          assert.equal(result.highlight,result.expected,`feedback level ${i}`);
        }
        await p.waitForFunction(()=>curLevel===null);
        assert.equal(await p.evaluate(i=>!!save.done['L'+i],i),true);
      }
      const saved=await p.evaluate(()=>JSON.parse(JSON.stringify(save)));
      await p.reload();
      assert.deepEqual(await p.evaluate(()=>NLM3.save()),saved);
      assert.deepEqual(errors,[]);
      console.log('74/74 levels cleared; feedback and reload verified');
      await p.close();
    });
  }finally{await browser.close();await new Promise(r=>server.close(r))}
});
