# ROADMAP.md — 路线图(优先级由用户定)

> **2026-10-02 转向(用户拍板)**:本任务线**只做 link-match(连连看)**。tile-match 冻结在 v0.87(已上线,已交付功能全部保留),不再排新迭代;其专属候选(四消对照分支等)封存,见文末。

## link-match 现状基线(v1.2,已上线)

- 玩法:动词**原形 ↔ 单一变位**经典连连看(≤2 折角 + 外圈路径);每关专练一种形式。
- 关卡:9 关 = A1/A2/B1 × 单数过去式/复数过去式/过去分词;每关 7 词 × 2 对 = 14 对;4×7 棋盘 + 外圈连线带。
- 引擎:BFS 寻路(坐标约定见 AGENTS 坑记录)、词对校验、布盘可解性模拟、卡死重排 + 相邻成对兜底;教学横幅 + TTS 朗读 + 连击计分。
- 回归:`node link-match/test/path-engine.test.mjs`(改路径引擎必跑)。
- 地址:https://channontian.github.io/gamified-learning/link-match/

## 下一波(link-match 主线)

### 1. 内容铺量(主体)
- 词库扩容:现有 A1/A2/B1 池向 B2/C1 扩(共用词库容量估算见下表)。
- 关卡扩容:9 关之后延伸关卡链(沿 A1→B1 结构,或新增档位);解锁链现成。
- 插画补齐:图鉴中部分词仍是首字母纹章 fallback,补场景插画(元素库与 tile-match 同源拷贝,改动需两边同步或在此产品内收敛)。

### 2. 候选方向(用户拍板后再做)
- **每日挑战 / 无尽模式**(link-match 版):tile-match 有成熟实现可参考,但产品解耦、不复用运行时。
- 教学横幅时长做成设置项(当前 10s,兼连击窗口)。
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

- **tile-match 四消对照分支**(原形+三变位同消;转向前已定方向:从 A1 起、每关 3 词、3×4=12 类型/36 格)——方案存档于此,重启任务线可捡起。
- **原形百搭块**(易混淆,曾明确否决)。
- tile-match 其余打磨项(音效层次、B2/C1 词池、横幅时长设置)随冻结一并搁置;历史三消密度/关卡推论见本文件在 git 历史(7a65f5e 之前)中的版本。

## 已知边界(暂不处理)

- Chrome 无 nl 语音时的朗读质量取决于系统语言包(设置内有引导与试听)。
- 特小屏(iPhone SE 级)棋盘按高度收缩,字号随格子变小(实测仍完整显示)。
