# Vol.2 动效的艺术：让文字像水一样流淌~

> **摘要**：静态的网页是没有灵魂的。为了让博客看起来像是一个正在实时输出的终端，或者是正在书写的故事，小风酱在打字效果上下足了功夫。本文将揭秘三种不同场景下的打字机实现方案：`ContentTypeWriter`、`TypeWriter` 以及高性能的 `v-typewriter` 指令。

---

## 1. 拒绝生硬：为什么要搞打字机？

在这个快节奏的时代，大家看网页都是一目十行。但小风酱觉得，文字是需要品的。

当文字一个接一个地蹦出来时，读者的视线会被强制锁定在光标的位置，这种**强制性的线性阅读体验**，能让读者更沉浸在内容中（当然，为了防止被打，也提供了立即跳过的功能 qwq）。

为了实现这个效果，风风博客里藏着三套不同的引擎。

---

## 2. 正文渲染引擎：ContentTypeWriter

**场景**：文章详情页，渲染长篇 Markdown 内容。  
**文件**：`frontend/src/components/common/ContentTypeWriter.vue`

这是最重的一个组件。它的难点在于：**输入的不是纯文本，而是 Markdown 源码。**

如果先把 Markdown 转成 HTML 再打字，那么 HTML 标签（如 `<div>`）就会被切断，导致页面布局崩坏。  
如果先打字再转 HTML，那么每次打一个字都要重新编译整个 Markdown，性能会爆炸吗？

~~好像还真不会！得益于现代浏览器的高效 DOM 操作和 Vue 的响应式更新，重新渲染其实并不昂贵。~~

小风酱选择了一个野路子：**增量喂食**。

### 核心逻辑

```typescript
// ContentTypeWriter.vue 片段

// 1. 维护一个指针
const currentIndex = ref(0)

// 2. 计算当前要喂给 Markdown 渲染器的内容
const displayContent = computed(() => {
  return props.content.slice(0, currentIndex.value)
})

// 3. 递归切片
const type = () => {
  if (currentIndex.value < props.content.length) {
    // 每次多切 chunkSize 个字符（比如 15 个），避免太慢
    currentIndex.value += props.chunkSize
    setTimeout(type, props.speed)
  }
}
```

### 视觉效果

这种做法有一个很有趣的副作用：当打字机打到 `**加粗**` 这种语法时，用户会先看到星号 `**`，等后面的星号打出来闭合后，文字会瞬间变成粗体。

这看起来就像是**真的有人在现场写 Markdown** 一样！配合那个 `>>` 样式的光标，极客感拉满 (-v-)。

---

## 3. 轻量级 UI 引擎：TypeWriter

**场景**：顶部导航栏的当前位置、首页的欢迎语。
**文件**：`frontend/src/components/common/TypeWriter.vue`

对于只有一行字的纯文本，不需要 Markdown 编译，所需的是**精准**和**懒加载**。

这个组件引入了 `IntersectionObserver`。只有当组件进入屏幕可视区域时，打字机才会启动。这避免了用户还没滚到底部，底部的文字就已经打完了的尴尬情况。

```typescript
// TypeWriter.vue 片段
import { useIntersectionObserver } from '@vueuse/core'

if (props.autoStart) {
  const { stop } = useIntersectionObserver(
    contentRef,
    ([{ isIntersecting }]) => {
      if (isIntersecting && !hasStarted.value) {
        startTyping() // 看到了才开始打！
        stop() // 打过一次就不用再盯着了
      }
    },
    { threshold: 0.5 },
  )
}
```

光标样式也回归了传统的竖线 `|`，更符合 UI 元素的定位。

---

## 4. 高性能列表引擎：v-typewriter 指令

**场景**：文章列表页，十几个卡片同时出现。
**文件**：`frontend/src/directives/typeWriterDirective.ts`

这是技术含量最高的一个方案。

如果在列表页用 `v-for` 渲染 10 个 `TypeWriter` 组件，意味着浏览器要同时跑 10 个 `setTimeout` 定时器，JS 线程会瞬间繁忙，导致页面掉帧。

为了解决这个问题，小风酱采用了 **JS 计算 + CSS 驱动** 的混合模式。

### 原理揭秘

1.  **JS 负责数学题**：指令挂载时，计算出每个卡片应该延迟多久开始动画。
2.  **CSS 变量负责传话**：将计算好的延迟时间写入 DOM 的 `style` 属性中。
3.  **CSS 动画负责干活**：实际的位移和透明度变化完全由 CSS Animation 完成。

```typescript
// typeWriterDirective.ts 片段

const cards = el.getElementsByClassName('chapter-item')

cards.forEach((card, index) => {
  // 第一个卡片延迟 150ms，第二个 350ms，以此类推...
  const itemDelay = delay + index * elementDelay

  // 把算好的时间塞给 CSS 变量
  card.style.setProperty('--item-delay', `${itemDelay}ms`)

  // 甚至连标题文字的长度都算好，传给 CSS 做步进动画
  const title = card.querySelector('h3')
  title.style.setProperty('--text-length', textLength.toString())
})
```

而在 CSS 中，动画是这样写的：

```css
.chapter-item {
  /* 读取 JS 传来的变量 */
  animation: slideIn 0.5s ease forwards;
  animation-delay: var(--item-delay); /* 关键！ */
}
```

这样一来，JS 只需要在初始化时运行一次，剩下的渲染任务全部交给浏览器的合成线程。哪怕列表有 100 个卡片，动画依然丝般顺滑 (ov0)b。

---

## 下集预告

动效有了，文字也能动了，但作为一个技术博客，核心还得是**阅读体验**。

下一篇 **Vol.3 沉浸式阅读**，将深入探讨 `ArticleDetailView.vue`，看看如何把后端传来的 Markdown 字符串变成漂亮的 HTML，以及如何实现那个带有 Mac 风格窗口头的**代码高亮块**。

---

> 没有未来的小风酱 著
