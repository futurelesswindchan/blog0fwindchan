# Vol.4 核心引擎：沉浸式阅读与 Markdown 的魔法炼金术

> **摘要**：一个博客如果连文章都看不爽，那和咸鱼有什么区别？！在这一篇中，我们将深入风风博客的核心引擎—— `ArticleDetailView`。  
> 看看小风酱是如何驯服 Markdown 渲染、手搓极客风代码块、设计涂鸦式删除线，以及构建那个“绝不让你篡改”的全局阅读进度条的！

---

## 1. 统一的容器，不同的灵魂

打开博客，你会发现文章被分成了“技术手札”、“幻想物语”和“奇怪杂谈”三个板块。但在代码层面，小风酱才懒得写三个详情页呢！(￣▽￣)

在 `frontend/src/views/articles/ArticleDetailView.vue` 中，所有的文章详情都共用这一个视图。它是怎么知道你在看什么的？靠的是**路由监听与动态推断**：

```typescript
// 动态推断文章所属的分类板块，省去了传 props 的麻烦~
const type = computed(() => {
  if (route.path.includes('/articles/topics/')) return 'topics'
  if (route.path.includes('/articles/novels/')) return 'novels'
  return 'frontend'
})
```

配合 Vue Router 的 `watch(() => route.params.id)`，无论你是从列表点进来，还是在文章底部点击了“下一篇”，页面都会自动拉取新数据，并极其丝滑地 `window.scrollTo({ top: 0, behavior: 'smooth' })` 滚回顶部，给你一个清爽的阅读起点。

---

## 2. 极客代码块：高亮与一键复制

既然不是 Mac 风格，那我们的代码块长什么样？  
答案是： **实用至上的极客风！**

在 `useCodeHighlight.ts` 中，小风酱直接拦截了 `highlight.js` 的渲染结果，给每一段代码套上了一个精美的 `<div class="code-block-wrapper">` 战甲。

而最亮眼的骚操作，莫过于一键复制功能：  
为了防止复制出带有各种 HTML 标签的富文本，小风酱在渲染时，直接把**原汁原味的纯文本代码**用 `encodeURIComponent` 挂载到了按钮的 `data-code` 属性上！

```typescript
// useCodeHighlight.ts 中的魔法拼接
return `
  <div class="code-block-wrapper">
    <div class="code-header">
      <span class="code-lang">${displayLang}</span>
      <button class="code-copy-btn" data-code="${encodeURIComponent(code)}" title="复制代码">
        <span class="btn-content default-content"><i class="fas fa-copy"></i> Copy</span>
        <span class="btn-content success-content"><i class="fas fa-check"></i> Copied!</span>
      </button>
    </div>
    <pre class="code-block"><code class="${lang}">${highlighted}</code></pre>
  </div>
`
```

然后在 `ArticleDetailView.vue` 中，利用**事件代理 (Event Delegation)** 统一监听点击事件。当你点击复制时，按钮会被注入 `.copied` 类名，瞬间变成绿色的 `Copied!`，两秒后又变回原样。这种纯 CSS 驱动的状态切换，性能好到爆炸！💥

---

## 3. 细节狂魔：CSS 涂鸦删除线

如果说代码块是基建，那 CSS 样式就是灵魂。在 `articleContent.css` 里，藏着一个极其抓人眼球的小彩蛋—— **涂鸦删除线**。

普通的 `<del>` 标签只是一条死板的横线，但小风酱利用伪元素 `::before` 和 CSS 的 `repeating-linear-gradient`，画出了一条仿佛是用笔“反复涂抹”的划痕！

```css
/* 模拟多画了几笔的涂鸦划痕 */
.markdown-content del::before,
.markdown-content s::before {
  background: repeating-linear-gradient(
    60deg,
    transparent,
    transparent 8px,
    var(--strike-color) 8px,
    var(--strike-color) 9px
  );
  transform: translateY(-50%);
}
```

**交互高能预警**：当你把鼠标悬停在删除线上时，那些杂乱的涂鸦会优雅地消失，原本的划线会变成一条笔直的、加粗的警示红线！这种细节，简直让人忍不住在文章里疯狂划线awa！

---

## 4. 读心术：TOC 生成与字数估算

一篇文章有多少字？要读多久？目录在哪？
为了不引入沉重的 AST (抽象语法树) 解析库，小风酱在 `useArticleInfo.ts` 里手摇了一套轻量级的正则解析器。

**中英混合字数估算**：
它会先把 Markdown 的图片、链接等“视觉噪音”剥离，然后精准萃取中文字符，再把英文按单词切割，最后采用 `1个英文单词 ≈ 0.5个中文字符` 的视觉占位算法，算出最符合人类直觉的阅读时间。

**TOC 目录提取器**：
这简直是防弹级的设计！为了防止代码块里写的 `# 注释` 被当成标题，它会先临时把所有围栏代码块（```）里的内容替换成占位符，等提取完目录后再还原回来。这样，无论你在代码里写多少标题样式的注释，都不会干扰到目录的生成哦awa

````typescript
// 临时挖空所有代码块，防止内部的 `#` 被误认为标题
const cleanText = contentText.replace(/```[\s\S]*?```/g, '')

// 匹配行首的 1-6 个 '#'，生成目录树
const regex = /^(#{1,6})\s+(.+)$/gm
````

---

## 5. “双轨制”全局阅读进度条

在页面的最下方（或者某个神秘的小精灵脚下），有一道会发光的彩虹进度条。它的背后，是 `useReadingProgress.ts` 管理的全局状态。

为什么叫“双轨制”？  
因为一篇文章有两种形态： **打字机模式** 和 **正常阅读模式**。

在 `ArticleDetailView` 的滚动监听中，藏着一个极其霸道的防御机制：

```typescript
const handleReadingScroll = () => {
  // 防御机制：如果还在打字模式，滚动条不允许篡改进度awa！
  if (isTypingMode.value) return

  // ... 计算滚动比例 (scrollTop / docHeight)
}
```

当文章正在像打字机一样逐字生成时，进度条的控制权完全交给打字引擎；  
只有当打字结束，用户开始自由滚动页面时，滚动条才能接管进度。这种权责分明的设计，确保了进度的计算永远不会在两种模式间打架！

---

## 下集预告

文章渲染好了，进度条也动起来了，但这还不够赛博！  
还记得我们刚才提到的“神秘小精灵”和“打字机模式”吗？

下一篇 **Vol.5 赛博陪伴：打字引擎与 TOC 小桌宠**，我们将揭秘那个会因为你滑得太快而“晕车”、会因为你关掉它而“受惊乱跑”的目录宠物 `ArticleTocPet`！

请备好你的血包，小心被萌到血条见底哦！(>w<)

---

> ~~试图在此处展示删除线效果的小风酱 著~~  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
