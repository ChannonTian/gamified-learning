# ROADMAP.md — 路线图(优先级由用户定)

> **2026-10-02 转向(用户拍板)**:本任务线**只做 link-match(连连看)**。tile-match 冻结在 v0.87(已上线,已交付功能全部保留),不再排新迭代;其专属候选(四消对照分支等)封存,见文末。

## link-match 现状基线(v1.5,已上线)

- 玩法:动词**原形 ↔ 单一变位**经典连连看(≤2 折角 + 外圈路径);每关专练一种形式。
- 内容:**108 词 / 51 关**——形式分组(每档内先单数各轮、再复数、最后分词;轮数=⌈池/7⌉,每词每种形式至少一次);每关 7 词 × 2 对 = 14 对;4×7 棋盘 + 外圈连线带。
- 模式:关卡 + 无尽 + 每日挑战(180s/日期种子/每日一次)+ 生存(每对间 15s 续命);盘下词行(点击朗读)。
- 引擎:BFS 寻路(坐标约定见 AGENTS 坑记录)、词对校验、布盘可解性模拟、卡死重排 + 相邻成对兜底;教学横幅 + TTS 朗读 + 连击计分 + 消除动效(描线/粒子/弹字)。
- 回归:`node link-match/test/path-engine.test.mjs`(改路径引擎必跑)。
- 地址:https://channontian.github.io/gamified-learning/link-match/

## 下一波(link-match 主线)

### 1. 内容铺量(主体)
- ~~词库扩容/关卡扩容~~ → **A1-B1 收完(v1.5,2026-10-04:108 词 / 51 关,形式分组)**;B2/C1 词池与档位新增继续开放。
- 插画补齐:图鉴中部分词仍是首字母纹章 fallback,补场景插画(元素库与 tile-match 同源拷贝,改动需两边同步或在此产品内收敛)。

### 2. 候选方向(用户拍板后再做)
- ~~每日挑战 / 无尽模式~~ → **已上线(v1.3)**。~~生存模式~~ → **已上线(v1.5)**。
- **竞品调研得出的提升项(2026-10-04,详见 docs/RESEARCH-competitors.md,待拍板)**:
  - P1 连击里程碑庆祝(×3/×5/×8 递进动效+和弦)——对标 Candy Crush 连锁升级
  - P2 主题皮肤系统(纸/黑板/暮色 3 套起步,收集词数解锁)——对标 Zen Match 皮肤/主题
  - P3 交互式首教学(3 步演示替代文字帮助)——借鉴 Royal Match 无教程哲学
  - P4 进度仪式感(档位毕业页、图鉴完成度、每日连续天数展示)——Wordscapes 式
  - P5 分数流动画(得分飞向计分器)+ P6 清盘终章分层动效 + Android 触觉(navigator.vibrate)
  - 远期候选:Onnect 式"定时洗牌"硬核模式;明确不抄:energy/广告/付费墙/near-miss 操控
- 排行榜后端(每日挑战先留接口)。
- PWA/manifest:单文件天然离线,加 manifest 可安装到桌面。
- 更多界面语言(i18n 词典结构已就绪)。

## 词库容量估算(2026-10-01,两产品共用词库;铺量时用 NT2Lex 精确校准)

荷兰语强变化/不规则动词总量约 **200-250**(Onzetaal "200+",含前缀派生);剔除古旧/极罕见/纯书面后,游戏可用约 **150-160**:

| 档 | 可用词(估) | 例 |
|---|---|---|
| A1 | ~15-20 | zijn, hebben, gaan, komen, zien, geven, nemen, eten, drinken, lopen, zitten, liggen, staan, lezen |
| A2 | ~30-35 | blijven, schrijven, spreken, beginnen, begrijpen, brengen, denken, vinden, helpen, kopen, krijgen, vragen, wassen, dragen, verliezen, winnen, hangen |
| B1 | ~45 | bedriegen, bederven, bevelen, bewegen, gelden, smelten, zwellen, wijken, weven, trekken, zwijgen, wijzen, werpen |
| B2 | ~35 | 较低频书面词 |
| C1 | ~15 | 低频文学词 |
| C2 | ~10 | 古旧词(delven, erven 类) |

link-match 每关 7 词 × 轮转取池,同池可支撑的关卡数远多于三消(每词只占用 2 格),扩池前 A1-B1 已够 20+ 关轮换。

## 封存(随任务线转向,不再排期)

- **tile-match 四消对照分支**(原形+三变位同消)——**原型已建:`four-match/`(v0.1,2026-10-03,已上线)**,按存档方案落地(从 A1 起、每关 3 词、12 类型/36 格);待用户试玩定夺:继续调(难度/字号,见 DEVLOG 观察)或回封存。
- **原形百搭块**(易混淆,曾明确否决)。
- tile-match 其余打磨项(音效层次、B2/C1 词池、横幅时长设置)随冻结一并搁置;历史三消密度/关卡推论见本文件在 git 历史(7a65f5e 之前)中的版本。

## 已知边界(暂不处理)

- Chrome 无 nl 语音时的朗读质量取决于系统语言包(设置内有引导与试听)。
- 特小屏(iPhone SE 级)棋盘按高度收缩,字号随格子变小(实测仍完整显示)。
