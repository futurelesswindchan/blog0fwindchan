# Vol.5 赛博陪伴：一只会晕车、会摸鱼的目录小精灵！

> **摘要**：谁说博客的目录（TOC）就必须是侧边栏里干巴巴的文字列表？在风风博客里，目录被赋予了生命！  
> 本文将带你揭秘 `useTocPet.ts` 状态机，看看这只陪伴你阅读的赛博小精灵是如何做到“挂机就睡觉”、“滑太快就晕车”，甚至“点关闭就吓得满屏幕乱跑”的！

---

## 1. 拒绝死板：用状态机注入灵魂

普通的目录组件只有“展开”和“收起”两个状态。但在风风博客中，小风酱为 `ArticleTocPet` 引入了一个完整的**情绪状态机 (State Machine)** 。

打开 `frontend/src/composables/useTocPet.ts`，你会发现这只小精灵拥有五种情绪：
`'typing' | 'reading' | 'sleepy' | 'dizzy' | 'shocked'`

配合内置的字典，它能根据当前的情绪，每隔 10 秒从几十条台词中随机抽取一句话跟你闲聊：

- 正常阅读时： _“发现了一个有趣的知识点！快记下来！”_
- 打字机输出时： _“排版引擎高速运转中！嗡嗡嗡...”_
- 甚至当你把鼠标悬停在它头上时，还会触发专属的提示。

它不仅仅是一个 UI 组件，它是你在赛博空间阅读时的专属陪伴-w-。

---

## 2. 摸鱼与陪伴：挂机检测系统

作为一个有性格的赛博生物，如果你把它晾在一边不管，它可是会睡着的！

小风酱在全局挂载了鼠标移动、键盘敲击、滚动等一系列事件的监听器：

```typescript
// 只要用户动了，就立刻唤醒它，并重置 30 秒倒计时
const resetIdleTimer = () => {
  wakeUpPet()
  if (idleTimer) window.clearTimeout(idleTimer)

  idleTimer = window.setTimeout(() => {
    // 只有在普通阅读状态下才会无聊睡着！
    if (currentMood.value === 'reading') {
      currentMood.value = 'sleepy'
      customMessage.value = getRandomMessage() // “呼呼呼... 睡着了 zZZ”
    }
  }, 30000)
}
```

当你正在苦思冥想一段代码，30秒没动鼠标，右下角的小精灵就会偷偷切成 `fa-bed` 图标，并且在头顶的气泡框里冒出一句‘吧唧吧唧...代码...好香...’的梦话。  
而当你一拉滚动条，它又会瞬间惊醒，继续陪你阅读。这种互动感简直拉满的啦awa！

---

## 3. 物理引擎初体验：超速晕车机制

如果在长篇大论的文章里，你疯狂地下拉滚动条，小精灵会怎样？
答案是： **它会晕车！@\_@**

为了实现这个极其生草的功能，小风酱手搓了一个微型“测速仪”：

```typescript
const checkScrollSpeed = () => {
  const currentScrollTop = window.scrollY
  const currentTime = performance.now()
  const timeDiff = currentTime - lastScrollTime

  // 防抖限流：每 50ms 采样一次，防止时间差过小导致算出一个无穷大 (Infinity)
  if (timeDiff > 50) {
    const distance = Math.abs(currentScrollTop - lastScrollTop)
    const speed = distance / timeDiff // 速度公式：v = s / t

    // 测速限值：12 像素/毫秒
    if (speed > 12) {
      triggerDizzy() // 超速啦！快晕！
    }
    lastScrollTop = currentScrollTop
    lastScrollTime = currentTime
  }
}
```

一旦速度超标，小精灵会立马切成闪电图标，大喊：“看不清了看不清了，全都是残影！QAQ”，并且在 2 秒后才会慢慢缓过神来。

---

## 4. 极致的视觉欺诈：假关闭与受惊跑酷

最丧心病狂的设计，莫过于那个右上角的 `X`（关闭）按钮。

作为一个正常的地球人，看到 `X` 肯定想点一下关掉对吧？  
**但这个按钮是个陷阱！** 它绑定的是 `triggerShock` 方法。

当你无情地点击关闭时：

1. 小精灵的情绪瞬间变成 `shocked`，图标变成红色警告。
2. 内部的 `isExpanded` 强制设为 `false`，瞬间收起目录。
3. 开启 `setInterval`，每 500ms 随机生成一次屏幕坐标 `shockPosition`。
4. CSS 层面更是直接挂上了一个 `panic-shake` 的疯狂发抖动画！

```css
/* 吓得瑟瑟发抖的 CSS 动画 */
@keyframes panic-shake {
  25% {
    transform: translateX(-6px) translateY(3px) rotate(-3deg);
  }
  50% {
    transform: translateX(6px) translateY(-3px) rotate(3deg);
  }
  /* ... */
}
```

此时的它会一边喊着 _“你居然想关掉我！呜呜呜QAQ！”_ ，一边在你的屏幕上像老鼠一样疯狂瞬移乱窜！直到几秒后，确认你没有继续追杀它，它才会乖乖回到右下角。

---

## 5. 黄金阅读区：IntersectionObserver 监听

当然，除了卖萌，它作为目录的本职工作也极其出色。

在 `ArticleTocPet.vue` 中，小风酱使用原生的 `IntersectionObserver` 替代了传统的 `scroll` 遍历计算。

```typescript
observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // 只要标题进入了黄金阅读区，就点亮对应的目录项！
      if (entry.isIntersecting) {
        activeHeadingId.value = entry.target.id
      }
    })
  },
  {
    // 划定判定区：避开顶部导航栏 80px，忽略屏幕下半部分 70% 的内容
    rootMargin: '-80px 0px -70% 0px',
  },
)
```

不仅如此，结合即将登场的“打字机模式”，目录还会呈现一种类似 RTX 游戏里\*\*“迷雾开图”\*\* 的特效：只有被排版引擎（打字机）打出来的标题，才会在目录中显影。还没生成的内容，目录里绝对看不到！

---

## 下集预告

小精灵已经乖乖在右下角待命，接下来，就该轮到我们博客最硬核的视觉奇观了！

下一篇 **Vol.6 赛博魔法：高性能打字机引擎**，我们将解开那个让无数前端开发者头秃的难题：  
如何让包含 HTML 标签、代码块、甚至图片的 Markdown 内容，像黑客帝国一样一个字一个字地“敲”出来，而且还不能破坏 DOM 结构？

准备好你的键盘，我们要开始火力全开了！(>w<)

---

> 为想小精灵语录而处理器过载的小风酱 著  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
