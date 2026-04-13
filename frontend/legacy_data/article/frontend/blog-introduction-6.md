# Vol.6 赛博魔法：高性能打字机引擎的“三位一体”

> **摘要**：在网页上实现打字机特效很简单，但如果要给包含高亮代码块、图片、复杂嵌套 HTML 的 Markdown 文章加打字机呢？直接切分字符串？那你的页面会当场崩溃！  
> 本文将带你深入风风博客的渲染核心，看看小风酱是如何利用原生 API 驯服 DOM，并为了极致性能，硬生生把打字机引擎拆成了“三套武备”的！

---

## 1. 灾难起源：为什么不能直接 Slice 字符串？

如果只是打印一句名言，我们完全可以用 `text.slice(0, index)`，每隔 50 毫秒多切一个字。

但是，如果你的内容是 Markdown 渲染出来的 HTML：  
`<p>我是一段带有 <a href="#">超链接</a> 的文字</p>`

当打字机截取到一半，输出 `<p>我是一段带有 <a h` 时，浏览器会直接懵逼，DOM 结构完全破裂，页面满屏乱码💥！

为了解决这个问题，小风酱在 `ContentTypeWriter.vue` 中祭出了一套**航母级的解决方案**。

## 2. 航母级引擎：ContentTypeWriter 与 TreeWalker

核心思路是： **先让 VueMarkdown 全量渲染出完整的 DOM 树，然后再偷偷把它们“抽空”，最后逐帧填回去！**

### 2.1 隐形斗篷与文本抽空

利用浏览器原生的 `document.createTreeWalker` API，代码像一个幽灵一样遍历刚刚渲染好的 DOM 树：

```typescript
const walker = document.createTreeWalker(
  contentRef.value,
  NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
)

while (currentNode) {
  if (currentNode.nodeType === Node.ELEMENT_NODE) {
    // 遇到元素标签 (如 div, p, img)，给它穿上隐身衣 (opacity: 0)
    el.classList.add('typing-hidden-block')
    actions.push({ type: 'reveal', node: el })
  } else if (currentNode.nodeType === Node.TEXT_NODE) {
    // 遇到纯文本，把字抽走存进队列，然后把 DOM 里的字清空！
    actions.push({ type: 'text', node: currentNode, text })
    currentNode.nodeValue = ''
  }
}
```

### 2.2 极致性能的 requestAnimationFrame 逐帧回填

抽空之后，DOM 结构完好无损，只是变成了透明和空壳。  
接着，开启 `requestAnimationFrame` 循环。在每一帧里，按照队列顺序：

- 遇到元素，脱下隐身衣 ( `typing-reveal-block`)。
- 遇到文本节点，一点点修改它的 `node.nodeValue`。

```typescript
  const typeLoop = (time: number) => {
    // 帧间限流控制
    if (time - lastTime < props.speed) {
      animationFrameId = requestAnimationFrame(typeLoop)
      return
    }
    lastTime = time

    // 接下来的显示逻辑...
    // 阶段一：瞬间执行所有的 reveal 动作，直到碰到文本节点（实现代码块、引用块等背景平滑浮现）
    // 阶段二：执行纯文本逐字输出逻辑

  // 队列执行完毕，结束动画
    else {
      finishTyping()
    }
  }
```

因为我们修改的是纯文本节点的内容， **绝不触碰 HTML 标签结构**，所以哪怕里面有再复杂的超链接、加粗、代码块，都不会崩坏！而且文本都是可以被鼠标正常选中的哦！(owo)

### 2.3 消除抖动：高度锁定与 Pretext 引擎

打字机最让人抓狂的体验就是：随着字越来越多，页面会被不断撑高，滚动条疯狂跳动（回流 Reflow）。

为了彻底消灭抖动，小风酱引入了 `@chenglou/pretext` 引擎。  
在打字开始前，先在后台静默算出这堆文字在当前屏幕宽度下**到底会折成多少行**，然后直接用 `lockedHeight.value = containerRef.value.clientHeight` 把外层容器的高度**死死锁住**！  
打字期间，高度一像素都不会变，稳如泰山！

---

## 3. 灵活的武备库：史山还是艺术？

你可能会在源码里发现，除了 `ContentTypeWriter`，居然还有 `TypeWriter.vue` 和 `vTypeWriterDirective.ts`！  
这难道是传说中的“史山代码”吗？不！这是极客因地制宜的架构智慧与艺术！

不同的战术场景，需要不同的武器：

### 🗡️ 冲锋舟级：TypeWriter (适用于标语、短句)

在主页的 Slogan 这种纯文本场景，用 TreeWalker 简直是高射炮打蚊子，杀坤用牛刀。  
所以小风酱写了一个极简的组件，内部直接用纯粹的 `slice` 切割字符串，配合 `useIntersectionObserver`，只有当用户滚动到这行字时才开始打字，轻量且高效。

### 🛡️ 阵列级：vTypeWriter (适用于文章卡片列表)

当你在“技术手札”看到那一排排文章卡片像瀑布一样逐个浮现，并且标题一个个打出来时，那其实是一个 Vue 自定义指令 `v-type-writer`。

它没有用 JS 去疯狂操作文本，而是巧妙地利用了 **CSS 动画**！

```css
/* 纯 CSS 驱动的文字打字动画！ */
.type-writer.typing-text .chapter-item h3 {
  animation: typing-text 0.8s steps(var(--text-length)) var(--text-delay) both;
}
@keyframes typing-text {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
```

指令只需要给每个卡片算出延迟时间 ( `--text-delay`)，然后给容器挂上一个类名，接下来的所有打字效果全交给了浏览器的 GPU 硬件加速去跑！  
这种解耦设计，让列表在滚动时丝滑无比，一点都不卡顿awa！

---

## 4. 魔法的结尾

你看！这三套引擎各司其职：

- 复杂的文章正文交给 **TreeWalker + rAF** 精准操控。
- 简单的短句交给 **JS 字符串切割**。
- 列表的瀑布流交给 **CSS 原生动画**。

这哪里是史山，这明明是一座精密运作的赛博兵工厂呀！(≧▽≦)

---

## 下集预告

经过了这番折腾，我们的文章终于可以像黑客代码一样炫酷地跑出来了。  
但是博客里还有一大堆让人头疼的东西——如果文章太多了，要怎么才能准确找到自己需要的OAo？

下一篇 **Vol.7 拒绝重复劳动：封装复用的哲学 & 一次离谱的白屏 BUG！**，我们将回到实用主义：  
看看小风酱是如何通过封装一个万能 Hook，来统领全站的搜索、排序、分页功能的！还有那个离谱到让人怀疑人生的白屏 BUG，是怎么被发现和解决的！

魔法未完，敬请期待！(>w<)

---

> 坚决不承认自己写了史山代码的小风酱 著  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
