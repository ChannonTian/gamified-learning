#!/usr/bin/env node
// verify-wiktionary.mjs — 荷兰语/德语动词词形对照 nl/de Wiktionary(零依赖,node 直跑;需联网)
// 用法: node tools/verify-wiktionary.mjs                # 全量:4 个荷兰语产品 + de.json
//       node tools/verify-wiktionary.mjs link-match     # 只查一个产品目录
// 原理:nl Wiktionary 的 {{-nlstam-|原形|单过|分词}} 模板给词干三形;复数过去式以独立词条页
// 指回动词原形为准;de Wiktionary 的 {{Deutsch Verb Übersicht}} 给 Präteritum ich / Partizip II /
// Präsens / Hilfsverb。已知误报白名单见 ALLOW。
import fs from "fs";
import { execFileSync } from "child_process";

const UA = "gamified-learning-content-audit/1.0";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cacheFile = "/tmp/verify-wiktionary-cache.json";
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : {};

async function fetchBatch(host, titles) {
  const need = [...new Set(titles)].filter(t => !(host + "|" + t in cache));
  for (let i = 0; i < need.length; i += 20) {
    const url = `https://${host}/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2&titles=` + encodeURIComponent(need.slice(i, i + 20).join("|"));
    for (let t = 0; t < 5; t++) {
      try {
        const r = JSON.parse(execFileSync("curl", ["-s", "--max-time", "40", "-A", UA, url], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
        for (const p of r.query.pages) cache[host + "|" + p.title] = p.missing ? null : (p.revisions?.[0]?.slots?.main?.content || "");
        break;
      } catch (e) { await sleep(4000 * (t + 1)); }
    }
    await sleep(1200);   // 请求限速
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
}
const get = (host, t) => cache[host + "|" + t];

function tplArgs(wtx, name) {   // 按花括号深度截取模板参数(嵌套 {{}}/ [[]] 感知)
  const start = wtx.indexOf("{{" + name + "|");
  if (start < 0) return null;
  let i = start + 2 + name.length + 1, depth = 1, cur = "", args = [], link = 0;
  while (i < wtx.length) {
    if (wtx.startsWith("{{", i)) { depth++; cur += "{{"; i += 2; continue; }
    if (wtx.startsWith("}}", i)) { depth--; if (depth === 0) break; cur += "}}"; i += 2; continue; }
    if (wtx.startsWith("[[", i)) { link++; cur += "[["; i += 2; continue; }
    if (wtx.startsWith("]]", i)) { link--; cur += "]]"; i += 2; continue; }
    if (wtx[i] === "|" && depth === 1 && link === 0) { args.push(cur); cur = ""; i++; continue; }
    cur += wtx[i]; i++;
  }
  args.push(cur);
  return args;
}
const formsOf = a => {   // 参数里的全部候选词形([[a|b]]/锚点/纯文本)
  const out = new Set();
  const txt = (a || "").replace(/<ref[^>]*>.*?<\/ref>/gs, "").replace(/<[^>]+>/g, " ");
  for (const m of txt.matchAll(/\[\[([^\]|#]*)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g)) { out.add((m[2] || m[1]).trim()); out.add(m[1].trim()); }
  for (const w of txt.replace(/\[\[[^\]]*\]\]/g, " ").replace(/\{\{[^}]*\}\}/g, " ").split(/[^a-zA-ZÀ-ÿëïéèöü']+/)) if (w.length > 1) out.add(w.trim());
  return [...out].filter(Boolean);
};

const NL_ALLOW = new Set([
  "varen",      // nlstam 值为 {{Q|...}} 引用模板,解析为空;voer/gevaren 为标准形
  "doorzien",   // Wiktionary 首条是可分动词 dóórzien(zag door/doorgezien);词库是不可分"看穿" doorzag/doorzien
  "spijten",    // 复数页 "speten" 是同形弱动词(串烤),spijten 的复过按强变化一类为 speten
]);

async function verifyNl(file) {
  const src = fs.readFileSync(file, "utf8");
  const s = src.indexOf("const VERBS=");
  const VERBS = eval(src.slice(src.indexOf("[", s), src.indexOf("];", s) + 1)).filter(x => !x.pron);
  await fetchBatch("nl.wiktionary.org", VERBS.map(v => v.inf).concat(VERBS.map(v => v.pl).filter(Boolean)));
  const flags = [];
  for (const v of VERBS) {
    const wtx = get("nl.wiktionary.org", v.inf);
    if (wtx == null) { flags.push(`${v.inf}: 词条缺失`); continue; }
    const a = tplArgs(wtx, "-nlstam-");
    if (!a) { flags.push(`${v.inf}: 无 nlstam 模板`); continue; }
    const pos = a.filter(x => !/^\s*[a-z0-9]+\s*=/.test(x));
    if (!formsOf(pos[1]).includes(v.sg)) flags.push(`${v.inf}: sg repo=${v.sg} wikt=[${formsOf(pos[1]).join(",")}]`);
    const ppRaw = pos[2] || "";
    if (v.pp != null && !(formsOf(ppRaw).includes(v.pp) || (/\{\{pn\}\}/.test(ppRaw) && v.pp === v.inf)))
      flags.push(`${v.inf}: pp repo=${v.pp} wikt=[${formsOf(ppRaw).join(",")}]`);
    const plw = get("nl.wiktionary.org", v.pl);
    if (plw === null || (plw !== undefined && !plw.includes(v.inf))) flags.push(`${v.inf}: pl repo=${v.pl} 词条页缺失/不指回`);
  }
  return flags.filter(f => !NL_ALLOW.has(f.split(":")[0]));
}

async function verifyDe() {
  const D = JSON.parse(fs.readFileSync("langs/de.json", "utf8"));
  await fetchBatch("de.wiktionary.org", D.verbs.map(v => v.inf));
  const flags = [];
  const norm = x => (x || "").replace(/\[\[|\]\]|''/g, "").replace(/<[^>]+>/g, "").replace(/\(.*?\)/g, "").trim();
  const overviews = wtx => {
    const res = []; let from = 0;
    while (true) {
      const start = wtx.indexOf("{{Deutsch Verb Übersicht", from);
      if (start < 0) break;
      let i = start + 2, depth = 1;
      while (i < wtx.length && depth > 0) {
        if (wtx.startsWith("{{", i)) { depth++; i += 2; continue; }
        if (wtx.startsWith("}}", i)) { depth--; i += 2; continue; }
        i++;
      }
      const o = {};
      for (const part of wtx.slice(start + 2, i - 2).split(/\n\s*\|/)) { const k = part.indexOf("="); if (k > 0) o[part.slice(0, k).trim()] = part.slice(k + 1).trim(); }
      res.push(o); from = i;
    }
    return res;
  };
  for (const v of D.verbs) {
    const wtx = get("de.wiktionary.org", v.inf);
    if (wtx == null) { flags.push(`${v.inf}: 词条缺失`); continue; }
    const ovs = overviews(wtx);
    if (!ovs.length) { flags.push(`${v.inf}: 无变位概览`); continue; }
    const vals = key => { const s = new Set(); for (const o of ovs) for (const k of [key, key + "*"]) if (o[k] != null) for (const x of norm(o[k]).split(/\s*[,/]\s*|\s+oder\s+/)) s.add(x.trim()); return s; };
    for (const [label, repo, key] of [["sg", v.sg, "Präteritum_ich"], ["pp", v.pp, "Partizip II"], ["p1", v.p1, "Präsens_ich"], ["p3", v.p3, "Präsens_er, sie, es"]]) {
      if (repo == null) continue;
      const set = vals(key);
      if (set.size && !set.has(repo)) flags.push(`${v.inf}: ${label} repo=${repo} wikt=[${[...set].join("|")}]`);
    }
    const aux = new Set(); for (const o of ovs) for (const k of ["Hilfsverb", "Hilfsverb*"]) if (o[k]) for (const x of norm(o[k]).split(/\s*[,/]\s*|\s+oder\s+|\s+/)) if (x) aux.add(x);
    const want = v.aux === "bin" ? "sein" : "haben";
    if (!aux.has(want)) flags.push(`${v.inf}: aux repo=${v.aux}(${want}) wikt=[${[...aux].join("|")}]`);
  }
  return flags;
}

const targets = process.argv.slice(2);
const files = targets.length ? targets.map(t => `${t}/index.html`) : ["link-match/index.html", "link-match-demo/index.html", "tile-match/index.html", "four-match/index.html"];
let bad = 0;
for (const f of files) {
  const flags = await verifyNl(f);
  console.log(`===== ${f}: ${flags.length} 处偏差`);
  for (const x of flags) { console.log("   !", x); bad++; }
}
{
  const flags = await verifyDe();
  console.log(`===== langs/de.json: ${flags.length} 处偏差`);
  for (const x of flags) { console.log("   !", x); bad++; }
}
console.log(bad ? `VERIFY FAIL ${bad}` : "VERIFY ALL PASS");
process.exit(bad ? 1 : 0);
