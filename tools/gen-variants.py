#!/usr/bin/env python3
"""gen-variants.py — 从 link-match/index.html(引擎母本)生成其他语言的变体游戏。

用法: python3 tools/gen-variants.py fr [es pt de ...]
读取: langs/<code>.json(语言数据)+ link-match/index.html(引擎)
写出: link-match-<code>/index.html(单文件零依赖,与母本同构)

语言数据区以 /*==LANG:DATA==*/ /*==END:DATA==*/、/*==LANG:KEYS==*/…、/*==LANG:I18N==*/…
三个标记圈定,生成时整区替换;标记外的引擎逻辑母本即所得。
zh/en UI 列的通用键自动取自母本 I18N 的 zh/en 列,语言 JSON 只需覆盖内容相关键。
"""
import json, re, sys, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "link-match" / "index.html"

def fail(msg):
    print(f"FATAL: {msg}"); sys.exit(1)

def parse_js_dict(src, start_key):
    """从母本 I18N 里提取某个语言列的键值对(行式 "k":"v", 结构)。"""
    i = src.find(f'{start_key}:{{')
    if i < 0: fail(f"I18N.{start_key} not found")
    j = src.find('},', i)
    if j < 0: fail(f"I18N.{start_key} end not found")
    block = src[i:j]
    pairs = re.findall(r'"([^"]+)":"((?:[^"\\]|\\.)*)"', block)
    if len(pairs) < 40: fail(f"I18N.{start_key}: only {len(pairs)} keys parsed")
    return dict(pairs)

def js_str(v): return json.dumps(v, ensure_ascii=False)

def gen(code):
    data = json.loads(open(ROOT / "langs" / f"{code}.json", encoding="utf-8").read())
    src = SRC.read_text(encoding="utf-8")

    meta = data["meta"]
    ln_fields, mv_fields = meta["ln"], meta["mv"]
    verbs, nouns, tiers = data["verbs"], data["nouns"], data["tierNames"]
    pronouns = data.get("pronouns", [])
    keys, shape = data["keys"], data.get("shape", {})
    i18n = data["i18n"]
    ui = i18n[code]
    shared_zh = parse_js_dict(src, "zh"); shared_en = parse_js_dict(src, "en")
    zh = {**shared_zh, **i18n.get("zh", {})}
    en = {**shared_en, **i18n.get("en", {})}

    infs = {v["inf"] for v in verbs} | {p["inf"] for p in pronouns}
    # ---- 校验 ----
    for t in tiers:
        for n in t["names"]:
            if n not in infs: fail(f"{code}: TIER {t['band']} 词 {n} 不在 VERBS")
    for v in tiers[0]["names"]:
        vv = next(x for x in verbs if x["inf"] == v)
        for k in ("p1", "p3", "p6"):
            if not vv.get(k): fail(f"{code}: A1 词 {v} 缺 {k}")
    ln_all, mv_all = set(ln_fields), set(mv_fields)
    for n in nouns:
        got = [f for f in ln_fields if n.get(f)] + [f for f in mv_fields if n.get(f)]
        if len(got) != 1: fail(f"{code}: 名词 {n['inf']} 字段异常 {got}")
    for p in pronouns:
        for k in ("sg", "pl", "pp"):
            if not p.get(k): fail(f"{code}: 代词 {p['inf']} 缺 {k}")
    need_shape = set(ln_fields) | set(mv_fields) | {"dh"}
    for f in need_shape:
        if f not in shape: fail(f"{code}: shape 缺 {f}")
    for lang, col in ((code, ui), ("zh", zh), ("en", en)):
        for k in ("band.pr", "band.ps", "band.ln", "band.mv", "help.rules", "card.sent"):
            if k not in col: fail(f"{code}: i18n.{lang} 缺 {k}")

    def noun_js(entries):
        lines = []
        for n in entries:
            fields = {f: n[f] for f in ln_fields + mv_fields if n.get(f)}
            parts = [f'inf:"{n["inf"]}"'] + [f'{k}:{js_str(v)}' for k, v in fields.items()]
            parts.append(f'gloss:{js_str(n.get("gloss") or n.get("en",""))}')
            if n.get("zh"): parts.append(f'zh:{js_str(n["zh"])}')
            lines.append("  {" + ", ".join(parts) + "},")
        return "\n".join(lines)

    def verb_js(entries, pron=False):
        lines = []
        for v in entries:
            parts = [f'inf:"{v["inf"]}"']
            for k in ("sg", "pl", "pp", "p1", "p3", "p6"):
                if v.get(k): parts.append(f'{k}:"{v[k]}"')
            if pron: parts.append("pron:true")
            if v.get("en"): parts.append(f'en:{js_str(v["en"])}')
            if v.get("zh"): parts.append(f'zh:{js_str(v["zh"])}')
            lines.append("  {" + ", ".join(parts) + "},")
        return "\n".join(lines)

    def i18n_js(col):
        return ",\n    ".join(f'{js_str(k)}:{js_str(v)}' for k, v in col.items())

    fixed_keys = ["sg", "pl", "pp", "p1", "p3", "p6"]
    form_key = {k: f"legend.{k}" for k in fixed_keys + ln_fields + mv_fields + ["dh"]}
    short_key = {k: f"short.{k}" for k in fixed_keys + ln_fields + mv_fields + ["dh"]}
    def obj_js(d):
        return "{" + ", ".join(f'{k}:{json.dumps(v, ensure_ascii=False)}' for k, v in d.items()) + "}"

    data_region = f'''const LANG_META={{ code:{js_str(code)}, ui:{js_str(meta["ui"])}, tts:{js_str(meta["tts"])}, save:{js_str(meta["save"])}, ln:{json.dumps(ln_fields)}, mv:{json.dumps(mv_fields)}, pron:{json.dumps(meta["pron"])} }};
const VERBS=[
{verb_js(verbs)}
{verb_js(pronouns, pron=True)}
];
VERBS.forEach((v,i)=>{{ if(v.hue==null) v.hue=Math.round((i*137.508)%360); }});

/* ---- 名词组(冠词 + 复数;字段名=关卡类型键,勿改) ---- */
const NOUNS=[
{noun_js(nouns)}
];
NOUNS.forEach((n,i)=>{{ if(n.hue==null) n.hue=Math.round((i*137.508+73)%360); }});   // 变体语言不手配色相:黄金角自动

/* 每关 9 词;各档轮转覆盖 */
const TIER_NAMES=[
''' + ",\n  ".join('{band:%s, names:%s}' % (js_str(t["band"]), json.dumps(t["names"], ensure_ascii=False)) for t in tiers) + '''
];
const VIDX={}; VERBS.forEach((v,i)=>{ VIDX[v.inf]=i; });
const TIERS=TIER_NAMES.map(t=>({band:t.band, pool:t.names.map(n=>VIDX[n])}));
const NOUN_SHAPE=''' + json.dumps(shape) + ''';
const shapeKey=f=> NOUN_SHAPE[f]||f;
/*==END:DATA==*/'''

    keys_region = f'''/*==LANG:KEYS==*/
const FORM_KEY={obj_js(form_key)};
const SHORT_KEY={obj_js(short_key)};
const PRON_SHORT_KEY={{sg:"short.pr.obj", pl:"short.pr.pos", pp:"short.pr.ref"}};
/*==END:KEYS==*/'''

    i18n_region = f'''/*==LANG:I18N==*/
const I18N={{
  {code}:{{
    {i18n_js(ui)}
  }},
  zh:{{
    {i18n_js(zh)}
  }},
  en:{{
    {i18n_js(en)}
  }},
}};
/*==END:I18N==*/'''

    out = re.sub(r'/\*==LANG:DATA==\*/[\s\S]*?/\*==END:DATA==\*/', lambda m: data_region, src, count=1)
    out = re.sub(r'/\*==LANG:KEYS==\*/[\s\S]*?/\*==END:KEYS==\*/', lambda m: keys_region, out, count=1)
    out = re.sub(r'/\*==LANG:I18N==\*/[\s\S]*?/\*==END:I18N==\*/', lambda m: i18n_region, out, count=1)
    if "/*==LANG:DATA==*/" in out and code != "nl":
        pass  # 标记本身保留(重新生成时仍可用)
    out = out.replace('<html lang="nl">', f'<html lang="{meta.get("htmlLang", code)}">')
    out = re.sub(r'<title>[^<]*</title>', f'<title>{meta["title"]}</title>', out, count=1)
    # 母本里的 nl 残留检查(注释/键名除外)
    out_dir = ROOT / f"link-match-{code}"
    out_dir.mkdir(exist_ok=True)
    (out_dir / "index.html").write_text(out, encoding="utf-8")
    # 校验输出
    for token in ('nl-NL', 'nlVoice', 'I18N.nl', '"linkmatch.v1"'):
        if token in out: fail(f"{code}: 输出残留母本标记 {token}")
    n_levels = out.count('LINK_LEVELS.push({id:')
    print(f"OK {out_dir/'index.html'}  levels≈{n_levels}  verbs={len(verbs)+len(pronouns)}  nouns={len(nouns)}")

if __name__ == "__main__":
    if len(sys.argv) < 2: fail("usage: gen-variants.py <code> [...]")
    for c in sys.argv[1:]:
        gen(c)
