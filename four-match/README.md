# four-match · Sterke werkwoorden match-4(原型)

tile-match 的四消对照分支,独立单文件产品(零依赖,与 tile-match/link-match 解耦)。

## 玩法

交换相邻词块,让**同一动词的 4 个及以上词块**连成一线,且**四种形式齐全**:原形 + 单数过去式 + 复数过去式 + 过去分词。每关 3 个 A1 动词(共 3 关),收集满即过关;计分 + 连锁倍数 + 连击加成,无步数限制。

## 与 tile-match 的差异

| | tile-match(三消) | four-match(四消) |
|---|---|---|
| 消除条件 | 单数过去 + 复数过去 + 分词(3 形) | 原形 + 三变位(4 形) |
| 词形类型 | 3×词数 | 4×词数(12 类型/36 格) |
| 每关词数 | 5 | 3 |
| 形状提示 | 圆角/直角/切角 | 胶囊=原形,圆角/直角/切角同前 |

## 技术

- 存档 key `nlm4.prototype.v1`(与 tile-match 的 `nlm3.prototype.v1` 隔离)。
- 调试钩子 `window.NLM4`(state/swap/findMove/countMoves/errors/install)。
- 朗读带 speechGen 代数令牌(新横幅打断旧朗读链)、trySwap try/catch/finally 自愈、交叉连段按格去重——v0.86/v0.87 的全部防坑设计从第一天内置。

## 测试

`python3 -m http.server 8461` → 打开 `/four-match/`;bot 用 `NLM4.findMove()`(返回 `{a:[r,c], b:[r,c]}`)+ `NLM4.swap(mv.a[0],mv.a[1],mv.b[0],mv.b[1])` 循环走棋。
