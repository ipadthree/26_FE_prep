# JavaScript 时间处理完全指南

JavaScript 中处理时间主要涉及三类东西：**`Date` 对象**（传统、最常用）、**定时器函数**（`setTimeout`/`setInterval` 等）、以及 2026 年正式进入 ES2026 标准的**新一代 `Temporal` API**（用来替代问题多多的 `Date`）。下面依次详细介绍。

---

## 一、Date 对象

### 1. 创建 Date 实例

```javascript
new Date();                          // 当前时间
new Date(1722758400000);             // 毫秒时间戳（从 1970-01-01 UTC 起）
new Date("2026-08-04T12:00:00Z");    // ISO 8601 字符串（推荐的字符串格式）
new Date("2026/08/04");              // 非标准字符串，兼容性较差，不推荐
new Date(2026, 7, 4, 12, 30, 0);     // 年, 月(0起), 日, 时, 分, 秒, 毫秒
```

**⚠️ 最容易踩的坑：月份从 0 开始计数。** `new Date(2026, 0, 1)` 是 1 月 1 日，不是 0 月。这是 JavaScript 从 Java 早期设计直接照搬的历史遗留问题。

不加 `new` 直接调用 `Date()`，返回的是当前时间的字符串，而不是 Date 对象：
```javascript
Date(); // "Tue Aug 04 2026 ..." —— 字符串，不是 Date 实例
```

### 2. 获取时间信息（Getter 方法）

| 方法 | 说明 | 取值范围 |
|---|---|---|
| `getFullYear()` | 年份（四位数） | 如 2026 |
| `getMonth()` | 月份 | **0（1月）~ 11（12月）** |
| `getDate()` | 日 | 1 ~ 31 |
| `getDay()` | 星期几 | 0（周日）~ 6（周六） |
| `getHours()` | 小时 | 0 ~ 23 |
| `getMinutes()` | 分钟 | 0 ~ 59 |
| `getSeconds()` | 秒 | 0 ~ 59 |
| `getMilliseconds()` | 毫秒 | 0 ~ 999 |
| `getTime()` | 时间戳（毫秒） | 自 1970-01-01 UTC 起 |
| `getTimezoneOffset()` | 与 UTC 的时差（分钟） | 本地时区与 UTC 差值 |

以上每个都有对应的 **UTC 版本**（不受本地时区影响）：
```javascript
date.getUTCFullYear();
date.getUTCMonth();
date.getUTCDate();
date.getUTCHours();
// ...以此类推
```

```javascript
const d = new Date(2026, 7, 4, 15, 30, 0);
console.log(d.getFullYear());  // 2026
console.log(d.getMonth());     // 7 —— 表示 8 月！
console.log(d.getDay());       // 2 —— 表示周二
```

### 3. 设置时间信息（Setter 方法）

```javascript
const d = new Date();
d.setFullYear(2027);
d.setMonth(11);        // 12月（0起）
d.setDate(25);
d.setHours(9, 0, 0);   // 时, 分, 秒 可以一起传
```

同样有对应的 UTC 版本：`setUTCFullYear()`、`setUTCMonth()` 等。

这些 setter 有个很实用的特性——**自动进位（溢出计算）**：
```javascript
const d = new Date(2026, 0, 31); // 1月31日
d.setDate(d.getDate() + 1);      // 自动进位成 2月1日
```
这个特性常被用来做“N 天后的日期”这类计算。

### 4. 格式化输出

```javascript
const d = new Date(2026, 7, 4, 15, 30, 0);

d.toString();          // "Tue Aug 04 2026 15:30:00 GMT+0800 (中国标准时间)"
d.toDateString();      // "Tue Aug 04 2026"
d.toTimeString();      // "15:30:00 GMT+0800 (中国标准时间)"
d.toISOString();       // "2026-08-04T07:30:00.000Z" —— 转成 UTC，最适合传输/存储
d.toUTCString();       // "Tue, 04 Aug 2026 07:30:00 GMT"
d.toJSON();            // 效果同 toISOString()，JSON.stringify 时自动调用

// 本地化格式（推荐用于展示给用户看）
d.toLocaleDateString('zh-CN');   // "2026/8/4"
d.toLocaleTimeString('zh-CN');   // "15:30:00"
d.toLocaleString('zh-CN');       // "2026/8/4 15:30:00"
```

`toLocaleString` 系列可以传入配置项，精细控制格式：
```javascript
d.toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
});
// "2026年8月4日星期二"

d.toLocaleString('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit', minute: '2-digit'
});
// 按纽约时区显示
```

### 5. 静态方法

```javascript
Date.now();                          // 当前时间戳（毫秒），最快获取"现在几点"的方式
Date.parse("2026-08-04");            // 把字符串解析为时间戳
Date.UTC(2026, 7, 4, 12, 0, 0);      // 按 UTC 时间生成时间戳
```

### 6. 时间运算

`Date` 对象本身没有 `.add()`、`.subtract()` 这类方法，日期运算通常靠**转成毫秒数计算**：

```javascript
const oneDay = 24 * 60 * 60 * 1000;
const tomorrow = new Date(Date.now() + oneDay);

// 计算两个日期相差天数
const diff = (dateB - dateA) / oneDay; // Date 对象相减会自动转为毫秒差
```

也可以用 setter 的自动进位特性：
```javascript
const future = new Date();
future.setDate(future.getDate() + 30); // 30天后
```

正因为这种运算方式繁琐、容易出错（尤其涉及夏令时、时区时），社区长期依赖 `moment.js`、`day.js`、`date-fns` 等第三方库，这也是下面 `Temporal` API 出现的原因。

---

## 二、Intl.DateTimeFormat（本地化格式化的专用工具）

当需要反复格式化大量日期，或需要更精细的本地化控制时，`Intl.DateTimeFormat` 比直接调 `toLocaleString` 性能更好（可以复用格式化器实例）：

```javascript
const formatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
  timeZone: 'Asia/Shanghai'
});

formatter.format(new Date()); // "2026/08/04 15:30"

// 格式化一个区间（比如"8月4日 - 8月10日"）
const rf = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' });
rf.formatRange(new Date(2026, 7, 4), new Date(2026, 7, 10));
// "8月4日至10日"
```

---

## 三、定时器相关函数

这些不是 `Date` 的方法，而是宿主环境（浏览器/Node.js）提供的全局函数，用来"延迟执行"或"周期执行"代码。

| 函数 | 说明 |
|---|---|
| `setTimeout(fn, delay, ...args)` | 延迟 `delay` 毫秒后执行一次 `fn`，返回一个可用于取消的 ID |
| `clearTimeout(id)` | 取消对应的 `setTimeout` |
| `setInterval(fn, delay, ...args)` | 每隔 `delay` 毫秒重复执行 `fn` |
| `clearInterval(id)` | 取消对应的 `setInterval` |
| `requestAnimationFrame(fn)` | 浏览器专用，在下次重绘前执行，适合做动画（比 `setInterval` 更流畅、更省性能） |
| `cancelAnimationFrame(id)` | 取消 `requestAnimationFrame` |
| `queueMicrotask(fn)` | 把 `fn` 加入微任务队列，比 `setTimeout(fn, 0)` 执行得更早 |

```javascript
const id = setTimeout(() => console.log("3秒后执行"), 3000);
clearTimeout(id); // 取消

let count = 0;
const intervalId = setInterval(() => {
  count++;
  if (count >= 5) clearInterval(intervalId);
}, 1000);
```

**注意**：`setTimeout(fn, 0)` 不代表立即执行，它仍会排到宏任务队列末尾，等当前同步代码和微任务全部执行完才轮到它。

---

## 四、高精度计时：performance.now()

`Date.now()` 精度通常只有毫秒级，且可能受系统时间调整影响。如果要**测量代码执行耗时**，应该用 `performance.now()`：

```javascript
const start = performance.now();
// ... 一些耗时操作
const end = performance.now();
console.log(`耗时 ${end - start} 毫秒`); // 可精确到微秒级，且不受系统时间修改影响
```

---

## 五、Temporal API（重要更新：2026 年已成为标准）

这是本主题最值得关注的新进展。`Date` 对象设计于 1995 年，被广泛认为存在诸多缺陷：月份从 0 开始、可变对象容易被意外修改、时区处理薄弱、字符串解析行为不统一等。为解决这些问题，TC39 推动了 `Temporal` 提案，<cite index="3-1,5-1">该提案已于 2026 年 3 月正式达到 Stage 4，成为 ES2026 规范的一部分</cite>，<cite index="4-1">目前已在 Firefox 139+（自 2025 年 5 月起）和 Chrome 144+（自 2026 年 1 月起）原生支持，Edge 也已支持，但 Safari 目前还未正式支持</cite>，<cite index="4-1">生产环境如需兼容 Safari 用户，仍需要引入 polyfill</cite>。

### Temporal 解决了什么问题

<cite index="5-1">Date 对象最初是在十天内仓促设计出来的，直接照搬了 Java 早期的日期 API，而这套设计在 Java 自己后来的版本中就已经被废弃</cite>。它的核心问题包括：
- 月份从 0 开始计数，极易出错
- `Date` 对象可变，调用 setter 会直接修改原对象，容易产生意外副作用
- 时区支持薄弱，不能很好表达"某个具体时区的某个时刻"
- <cite index="3-1">现在提供了完整的 IANA 时区支持，以及严格的格式解析和多历法运算能力，全部内置于语言层面，不再需要依赖第三方库</cite>

### Temporal 命名空间下的核心类型

`Temporal` 挂在全局命名空间下（类似 `Math`、`Intl`），包含一系列专用类型：

| 类型 | 用途 |
|---|---|
| `Temporal.Now` | 获取当前时刻的入口 |
| `Temporal.Instant` | 一个绝对的时间点（类似时间戳，不含时区/日历信息） |
| `Temporal.ZonedDateTime` | 带时区的日期时间——最常用、最推荐的类型 |
| `Temporal.PlainDate` | 只有日期，没有时间和时区（如生日） |
| `Temporal.PlainTime` | 只有时间，没有日期（如"每天早上 9 点"） |
| `Temporal.PlainDateTime` | 有日期和时间，但不含时区 |
| `Temporal.Duration` | 表示一段时长（用于加减运算） |

```javascript
// 获取当前时刻
const now = Temporal.Now.zonedDateTimeISO();
console.log(now.toString()); // "2026-08-04T15:30:00+08:00[Asia/Shanghai]"

// 只要日期
const today = Temporal.Now.plainDateISO();
console.log(today.toString()); // "2026-08-04"

// 日期运算——不可变，返回新对象，原对象不受影响
const nextWeek = today.add({ days: 7 });
const lastMonth = today.subtract({ months: 1 });

// 自动处理"月末溢出"，行为清晰可预期
const jan31 = Temporal.PlainDate.from("2026-01-31");
console.log(jan31.add({ months: 1 }).toString()); // "2026-02-28"（自动 clamp，不会变成3月）

// 精细修改某个字段（with 方法，而不是直接 mutate）
const changed = today.with({ year: 2027, month: 5 });

// 带时区转换——这是 Date 最难处理的部分，Temporal 原生支持
const tokyo = now.withTimeZone("Asia/Tokyo");
console.log(tokyo.toString());

// 计算两个日期之间的差值
const d1 = Temporal.PlainDate.from("2026-01-01");
const d2 = Temporal.PlainDate.from("2026-08-04");
const duration = d1.until(d2);
console.log(duration.toString()); // "P7M3D" 表示7个月3天

// 比较（Temporal 对象不是原始类型，不能直接用 > < 比较，要用 compare）
Temporal.PlainDate.compare(d1, d2); // -1, 0, 或 1，可直接配合 Array.sort 使用
```

**与 `Date` 的关键区别**：
- 所有 `Temporal` 对象都是**不可变**的：任何运算都返回新对象，原对象永不改变
- 类型划分清晰：`Instant`（绝对时刻）和 `PlainDate`（纯日期）是完全不同的概念，不会像 `Date` 那样混为一谈
- 字符串解析严格、可预期，不存在浏览器间行为不一致的问题

### 当前该怎么选

- 若项目仅面向支持 Temporal 的现代浏览器/Node.js（较新版本）环境，可以直接使用原生 `Temporal`
- 若需要兼容 Safari 或旧环境，需引入 polyfill（`@js-temporal/polyfill` 或 `temporal-polyfill`）
- 短期内 `Date` 仍会大量存在于旧代码和第三方库中，两者需要能互相转换：
```javascript
// Date -> Temporal
Temporal.Instant.fromEpochMilliseconds(Date.now());

// Temporal -> Date
new Date(temporalInstant.epochMilliseconds);
```

---

## 六、常见陷阱小结

1. **月份从 0 开始**：`new Date(2026, 0, 1)` 是 1 月 1 日，`getMonth()` 返回 0~11。
2. **Date 是可变对象**：把一个 `Date` 实例传给函数后，函数内部调用 setter 会直接改变外部的原对象，容易产生隐蔽 bug（这正是 `Temporal` 要解决的问题之一）。
3. **字符串解析不可靠**：`new Date("2026-08-04")` 在不同引擎/环境下可能被当作 UTC 或本地时间处理，行为不完全统一；推荐始终使用完整 ISO 8601 格式（带时区标识）。
4. **`toISOString()` 会转成 UTC**：如果你的服务器和用户不在同一时区，直接用它做展示可能会让日期"看起来差一天"。
5. **`setTimeout(fn, 0)` 不是立即执行**：仍要排队等当前同步任务和微任务完成。
6. **时间戳单位**：JavaScript 的 `Date.now()`、`getTime()` 都是**毫秒**，而很多后端语言（如 Python、Unix 时间戳惯例）常用**秒**，对接时容易差 1000 倍，需要留意。

---

### 参考资料
- Temporal 提案标准化进展：https://www.bloomberg.com/company/stories/temporal-is-now-official-transforming-javascript-dates-times-with-bloomberg-support/
- Temporal 浏览器支持现状：https://jadjoubran.io/blog/javascript-temporal-api
