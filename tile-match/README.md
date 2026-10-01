# Tile Match — 荷兰语强变化动词三消 · 原型

> Sterke werkwoorden · match-3

用三消练习荷兰语不规则动词(sterke werkwoorden)的变位:**单数过去式 + 复数过去式 + 过去分词**三种形式各一个、同动词 3+ 个连成一线即可消除,展示动词原形。

## 玩法

- 6×6 棋盘,4:3 横向词块,点击选中或拖拽交换相邻两块。
- **匹配规则(核心)**:同一动词的任意 3+ 个变位连成一行/列,**且三种形式各至少一个**才消除;形式不齐则静默弹回、不扣步数。4+ 连全消。
- **弱提示系统**:形状 = 时间形式(圆角 = 单数过去式,直角 = 复数,切角 = 过去分词);颜色 = 源动词(同动词同色)。两者都刻意做得很淡——认读词形才是主要线索,检索"这个词属于哪个动词"即学习本身。
- **消融展示**:动词首次被消除时弹出图鉴卡(代码生成的插画 + 原形 + 点击展开英语释义);已收录的动词只做大字原形闪现约 1 秒,不打断节奏。
- **防卡死**:开局保证至少 2 个可行组合;闲置 7 秒自动提示(只高亮"滑入后补全连线的那一块");无解自动洗牌。
- 2 个关卡(12 个 A2 高频强变化动词),步数 26/28,进度存 localStorage。

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

## 路线图(阶段二)

- [ ] 动词铺到 A2+B1 共 60 词(CEFR 分层),插画补齐
- [ ] 12 关(每关解锁新词组)、无尽模式(通关后解锁)
- [ ] 每日限时挑战(日期种子,本地最佳成绩,排名接口预留)
- [ ] 释义多语言扩展(当前英语,中文在计划中)、界面语言切换
- [ ] 音效打磨

## License

[PolyForm Noncommercial 1.0.0](../LICENSE) —— 非商业使用自由,商业权利保留。
