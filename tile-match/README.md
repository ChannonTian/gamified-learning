# Tile Match — 荷兰语强变化动词三消 · 原型

> Sterke werkwoorden · match-3

用三消练习荷兰语不规则动词(sterke werkwoorden)的变位:**单数过去式 + 复数过去式 + 过去分词**三种形式各一个、同动词 3+ 个连成一线即可消除,展示动词原形。

## 玩法

- **4×9 竖屏棋盘(手机优先)**:4 列保证格子够宽(手机上约 90px),9 行占满竖屏空间;4:3 横向词块,字号按本关最长词 canvas 实测自适应——任何词都完整显示;点击选中或拖拽交换相邻两块。
- **匹配规则(核心)**:同一动词的任意 3+ 个变位连成一行/列,**且三种形式各至少一个**才消除;形式不齐则静默弹回、不扣分。4+ 连全消。
- **弱提示系统(可开关)**:形状 = 时间形式(圆角 = 单数过去式,直角 = 复数,切角 = 过去分词);颜色 = 源动词(同动词同色)。两者都刻意做得很淡——认读词形才是主要线索。
- **教学横幅 + 朗读(普通关卡)**:每次消除后底部滑出教学卡(插画 + 原形 + 三变位 + 释义),停留约 3.6 秒或点按关闭,**不阻挡棋盘操作**;用 Web Speech API 以 nl-NL 依次朗读"原形 → 单数 → 复数 → 分词"(设置中显示检测到的语音并可试听)。首次解锁仍是全屏图鉴卡。
- **计分制(无步数上限)**:每消一块 +10 分,连锁按倍数放大,连续有效交换累计 🔥 连击加成;关卡目标 = 收集齐本关全部动词,每关最佳分存 localStorage。
- **防卡死**:开局保证至少 2 个可行组合;闲置自动提示(时长可调/可关,只高亮"滑入后补全连线的那一块");无解自动洗牌。
- **关卡**:A1.1 / A1.2 / B1.1(每关 4 个高频强变化动词,共 12 词),按通关顺序解锁。
- **设置**:插画画风(A 扁平 / B 线稿)、界面及注释语言(Nederlands / 中文)、音效与朗读音量、提示等待时长、颜色提示、形状提示、深色模式。

## 设计依据

- 匹配判定对象是"同一动词的不同变位",消除前必须完成一次变位归属的检索练习——机制即学习内容,避免教育游戏常见的"chocolate-covered broccoli"问题。
- 形式数据以 [nl.wikipedia 强变化动词表](https://nl.wikipedia.org/wiki/Lijst_van_sterke_en_onregelmatige_werkwoorden_in_het_Nederlands)、[DutchGrammar](https://www.dutchgrammar.com/nl/?n=verbs.ir03) 为基准;难度分层参考 [NT2Lex](https://cental.uclouvain.be/nt2lex/)、[Taalboost 0–A2 词频](https://www.taalboost.nl/blog/most-frequent-dutch-verbs-a2)、[inburgering.org](https://inburgering.org/nl/grammar/strong-verbs-patterns)。

## 运行

单文件、零依赖:直接双击 `index.html`,或

```bash
python3 -m http.server 8000   # → http://localhost:8000/tile-match/
```

## 部署(GitHub Pages)

仓库改为 public 后:**Settings → Pages → Deploy from a branch → main / (root)**。游戏地址:`https://<用户名>.github.io/gamified-learning/tile-match/`(根路径的跳转页会自动进入)。

## 路线图(下一波)

- [ ] 每日限时挑战(第 1 关后解锁,日期种子,只用已收集词条,本地最佳成绩,排名接口预留)
- [ ] 无尽模式(第 1 关后解锁,只用已收集词条)
- [ ] 动词铺到 A2+B1 共 60 词(CEFR 分层),插画补齐
- [ ] 释义多语言扩展、界面语言完善
- [ ] 音效打磨

## License

[PolyForm Noncommercial 1.0.0](../LICENSE) —— 非商业使用自由,商业权利保留。
