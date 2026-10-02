/*
 * link-match 路径引擎回归测试(零依赖:node test/path-engine.test.mjs)
 *
 * 背景:v1.1 曾出现"点击判定坐标系整体偏移一格"(attemptPair/findAnyPairNow 调用处
 * 多传 +1,而 findPathOcc 内部已 +1 转外圈坐标)——有路判不能连、没路出提示、连线画偏。
 * 另有折线回溯丢失起点 A 导致相邻块连线退化成点。
 *
 * 本测试三道关:
 *   T1  独立参照实现(直连/一折/二折三段枚举,与 BFS 思路不同)对照全部判定,必须零分歧
 *   T2  返回折线合法性:端点=两块本身、每段共线连续、中间不穿块、≤2 折角
 *   T3  全消链路:findAnyPair→消除→卡死重排→相邻兜底,300 局必须全清
 *
 * ⚠️ 坐标约定:findPathOcc(occ, r1, c1, r2, c2) 接收 0 基棋盘坐标,内部 +1 转外圈。
 * 调用方禁止再 +1(那就是 v1.1 的 bug)。改引擎必须跑通本测试。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const COLS=4, ROWS=7;
globalThis.COLS=COLS; globalThis.ROWS=ROWS;
const html=readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'),'utf8');
const a=html.indexOf('function occFrom(g){');
const b=html.indexOf('function simulateSolvable');
if(a<0||b<0||b<=a) throw new Error('engine anchors not found in index.html');
const engine=html.slice(a,b);
(0,eval)(engine.replace(/\bconst DR=/,'globalThis.DR=').replace(/\bconst DC=/,'globalThis.DC='));

/* ---- 独立参照实现:三段枚举 ---- */
function refConnect(occ, ar, ac, br, bc){
  const A=[ar+1,ac+1], B=[br+1,bc+1];
  const H=ROWS+2, W=COLS+2;
  const occP=(r,c)=> r>=0&&r<H&&c>=0&&c<W && occ[r][c];
  const freeP=(r,c)=> (r===A[0]&&c===A[1]) || (r===B[0]&&c===B[1]) || !occP(r,c);
  const clearH=(row,c1,c2)=>{ for(let c=Math.min(c1,c2)+1;c<Math.max(c1,c2);c++) if(occP(row,c)) return false; return true; };
  const clearV=(col,r1,r2)=>{ for(let r=Math.min(r1,r2)+1;r<Math.max(r1,r2);r++) if(occP(r,col)) return false; return true; };
  if(A[0]===B[0] && clearH(A[0],A[1],B[1])) return true;
  if(A[1]===B[1] && clearV(A[1],A[0],B[0])) return true;
  const c1=[A[0],B[1]], c2=[B[0],A[1]];
  if(freeP(c1[0],c1[1]) && clearH(A[0],A[1],B[1]) && clearV(B[1],A[0],B[0])) return true;
  if(freeP(c2[0],c2[1]) && clearV(A[1],A[0],B[0]) && clearH(B[0],A[1],B[1])) return true;
  for(let x=0;x<W;x++){
    if(x===A[1]||x===B[1]) continue;
    if(freeP(A[0],x) && freeP(B[0],x) && clearH(A[0],A[1],x) && clearV(x,A[0],B[0]) && clearH(B[0],x,B[1])) return true;
  }
  for(let y=0;y<H;y++){
    if(y===A[0]||y===B[0]) continue;
    if(freeP(y,A[1]) && freeP(y,B[1]) && clearV(A[1],A[0],y) && clearH(y,A[1],B[1]) && clearV(B[1],y,B[0])) return true;
  }
  return false;
}

let mism=0, checked=0, paths=0;
function rndOcc(density){
  const occ=Array.from({length:ROWS+2},()=>Array(COLS+2).fill(false));
  for(let r=1;r<=ROWS;r++)for(let c=1;c<=COLS;c++) occ[r][c]=Math.random()<density;
  return occ;
}
function cellsOf(occ){ const l=[]; for(let r=1;r<=ROWS;r++)for(let c=1;c<=COLS;c++) if(occ[r][c]) l.push([r,c]); return l; }

/* T1+T2: 判定一致性 + 折线合法性(400 张随机盘) */
for(let t=0;t<400;t++){
  const occ=rndOcc(0.15+Math.random()*0.7);
  const cells=cellsOf(occ);
  for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){
    const [ar,ac]=cells[i], [br,bc]=cells[j];
    const got=!!findPathOcc(occ,ar-1,ac-1,br-1,bc-1);
    const ref=refConnect(occ,ar-1,ac-1,br-1,bc-1);
    checked++;
    if(got!==ref){ mism++; if(mism<=5) console.log(`MISMATCH board#${t} A=(${ar},${ac}) B=(${br},${bc}) got=${got} ref=${ref}`); continue; }
    if(got){
      const pts=findPathOcc(occ,ar-1,ac-1,br-1,bc-1);
      paths++;
      if(pts[0][0]!==ar||pts[0][1]!==ac||pts[pts.length-1][0]!==br||pts[pts.length-1][1]!==bc){
        throw new Error(`端点错 board#${t} A=(${ar},${ac}) B=(${br},${bc}) pts=${JSON.stringify(pts)}`);
      }
      let bends=0;
      for(let k=0;k<pts.length-1;k++){
        const [r1,c1]=pts[k],[r2,c2]=pts[k+1];
        if(r1!==r2&&c1!==c2) throw new Error(`斜线段 pts=${JSON.stringify(pts)}`);
        if(r1===r2){ const lo=Math.min(c1,c2)+1,hi=Math.max(c1,c2); for(let c=lo;c<hi;c++) if(occ[r1][c]&&!(r1===ar&&c===ac)&&!(r1===br&&c===bc)) throw new Error(`穿块 pts=${JSON.stringify(pts)} @(${r1},${c})`); }
        else { const lo=Math.min(r1,r2)+1,hi=Math.max(r1,r2); for(let r=lo;r<hi;r++) if(occ[r][c1]&&!(r===ar&&c1===ac)&&!(r===br&&c1===bc)) throw new Error(`穿块 pts=${JSON.stringify(pts)} @(${r},${c1})`); }
        if(k>0){ const [r0,c0]=pts[k-1]; if((r0===r1)!==(r1===r2)) bends++; }
      }
      if(bends>2) throw new Error(`>2 折角 pts=${JSON.stringify(pts)} bends=${bends}`);
    }
  }
}
console.log(`T1/T2 判定一致: ${checked} 对, mismatch=${mism}, 折线校验通过 ${paths} 条`);
if(mism>0) process.exit(1);

/* T3: 全消链路(与游戏同逻辑),300 局 */
function randomLevel(){
  const tiles=[];
  for(let v=0;v<7;v++) tiles.push({v,k:"inf"},{v,k:"form"},{v,k:"inf"},{v,k:"form"});
  for(let i=tiles.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [tiles[i],tiles[j]]=[tiles[j],tiles[i]]; }
  const g=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  let n=0; for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++) g[r][c]=tiles[n++];
  return g;
}
function cloneG(g){ return g.map(row=>row.map(t=>t?{...t}:null)); }
let reshuffles=0, fallbacks=0, cleared=0;
for(let t=0;t<300;t++){
  const g=cloneG(randomLevel());
  let stuckGuard=0;
  while(true){
    const p=findAnyPair(g);
    if(p){ g[p[0][0]][p[0][1]]=null; g[p[1][0]][p[1][1]]=null; continue; }
    if(g.flat().every(x=>!x)){ cleared++; break; }
    stuckGuard++; if(stuckGuard>50) throw new Error(`重排死循环 board#${t}`);
    reshuffles++;
    const list=[]; for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++) if(g[r][c]) list.push({t:g[r][c],r,c});
    let done=false;
    for(let tries=0;tries<80&&!done;tries++){
      const pos=[...list.map(p=>[p.r,p.c])];
      for(let i=pos.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pos[i],pos[j]]=[pos[j],pos[i]]; }
      const g2=Array.from({length:ROWS},()=>Array(COLS).fill(null));
      list.forEach((p,i)=>{ g2[pos[i][0]][pos[i][1]]={v:p.t.v,k:p.t.k}; });
      if(findAnyPair(g2)){ list.forEach((p,i)=>{ g[p.r][p.c]=g2[p.r][p.c]; }); done=true; }
    }
    if(!done){
      fallbacks++;
      const infs=[],forms=[];
      for(const p of list)(p.t.k==="inf"?infs:forms).push(p.t);
      const pairs=[];
      while(infs.length&&forms.length){ const inf=infs.shift(); const f=forms.find(x=>x.v===inf.v); if(f){ forms.splice(forms.indexOf(f),1); pairs.push([inf,f]); } else pairs.push([inf,forms.shift()]); }
      while(infs.length) pairs.push([infs.shift(),infs.shift()]);
      while(forms.length){ const x=forms.shift(); const y=forms.shift()||x; pairs.push([x,y]); }
      const pos=[...list.map(p=>[p.r,p.c])].sort((A,B)=>A[0]===B[0]?A[1]-B[1]:A[0]-B[0]);
      for(const p of list) g[p.r][p.c]=null;
      pairs.forEach(([x,y],i)=>{
        const [r1,c1]=pos[i*2],[r2,c2]=pos[i*2+1];
        if(x){ x.r=r1;x.c=c1;g[r1][c1]=x; } if(y){ y.r=r2;y.c=c2;g[r2][c2]=y; }
      });
      if(!findAnyPair(g)) throw new Error(`相邻兜底仍无可连对 board#${t}`);
    }
  }
}
console.log(`T3 全消链路: 300 局全部清空, 重排 ${reshuffles} 次(其中相邻兜底 ${fallbacks} 次)`);
console.log("ALL PASS");
