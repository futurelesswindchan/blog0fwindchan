# Vol.3 沉浸式阅读：Markdown 渲染与代码高亮

> **摘要**：作为一个技术博客，代码块如果长得像记事本一样丑，那简直是对代码的侮辱。本文将揭秘 `ArticleDetailView` 的渲染逻辑，重点讲解如何通过 `useCodeHighlight` 封装 Highlight.js 实现 Mac 风格的代码窗口，以及如何用 CSS 打造舒适的排版体验。

---

## 1. 排版哲学：呼吸感与细节

在 `frontend/src/views/articles/ArticleDetailView.vue` 中，文章的容器被包裹在一个 `.article-view-container` 里。

小风酱深知，阅读体验的好坏往往取决于那些不起眼的细节。于是在 `articleContent.css` 中，对 Markdown 渲染出的原生标签进行了大刀阔斧的魔改：

### 图片的悬浮感

为了让图片看起来不像是死板地贴在屏幕上，小风酱给所有 `img` 标签加了阴影和悬浮动画：

```css
/* articleContent.css */
.markdown-content img {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 基础阴影 */
  transition: transform 0.3s ease;
}

.markdown-content img:hover {
  transform: translateY(-2px); /* 悬停时微微上浮 */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15); /* 阴影加深，模拟高度增加 */
}
```

### 两端对齐

对于长段落，`text-align: justify` 是必须的。它能消除行末参差不齐的锯齿感，让文章块看起来方方正正，极其舒适。

---

## 2. 代码高亮：给代码穿上 IDE 的衣服

这是本篇的重头戏。默认的 Highlight.js 渲染出来的代码块只是一个黑乎乎的框，既没有语言标识，也没有美感。

小风酱想要的效果是：**每一个代码块都像是一个迷你的 VS Code 窗口。**

### 核心逻辑：useCodeHighlight.ts

为了实现这个效果，不能直接用 highlight.js 的默认输出，必须要拦截它的渲染过程，手动注入 HTML 结构。

在 `frontend/src/composables/useCodeHighlight.ts` 中：

```typescript
const highlightCode = (code: string, lang: string) => {
  // 1. 获取高亮后的 HTML 字符串
  const highlighted = hljs.highlight(code, { language: lang }).value

  // 2. 获取语言名称（比如把 'ts' 显示为 'TypeScript'）
  const displayLang = languageNames[lang] || lang.toUpperCase()

  // 3. 关键步骤：手动拼接 HTML 结构
  // 在 code 标签外面包了一层 .code-block
  // 并在顶部塞了一个 .code-lang 标签作为窗口标题栏
  return `<pre class="code-block">
            <div class="code-lang">${displayLang}</div>
            <code class="${lang}">${highlighted}</code>
          </pre>`
}
```

### 样式定制：codeBlock.css

有了上面的结构，就可以在 CSS 里为所欲为了。

**窗口标题栏**：
`.code-lang` 被设计成了顶部的一条蓝条，用来显示语言类型。

```css
.code-block .code-lang {
  width: 100%;
  padding: 0.8rem 1.4rem;
  background: rgba(0, 119, 255, 0.4); /* 标志性的蓝色半透明背景 */
  color: var(--accent-color);
  border-bottom: 1px solid rgba(0, 119, 255, 0.08);
  position: absolute; /* 绝对定位在顶部 */
  top: 0;
}
```

什么？！没有复制按钮？当然是因为~~没有写啦~~手抄代码才更能记忆深刻...是这样是这样！（逃）

**代码内容区**：
为了不让代码被标题栏挡住，`code` 标签设置了巨大的顶部内边距：

```css
.code-block code {
  padding: 4rem 1rem 1rem 1rem; /* 上方留出 4rem 给标题栏 */
}
```

**配色方案**：
小风酱没有使用 Highlight.js 自带的 CSS 文件，而是手动在 `codeBlock.css` 里定义了每一类语法的高亮颜色。
例如，Vue 的标签颜色被定义为红色，属性为橙色，字符串为绿色。这不仅统一了亮/暗模式的体验，还让配色更符合小风酱的个人审美 (ov0)。

```css
/* 自定义 Vue 语法高亮 */
.markdown-content .language-vue .hljs-tag {
  color: #f56c6c;
}
.markdown-content .language-vue .hljs-attr {
  color: #d19a66;
}
```

---

## 3. 底部导航：玻璃质感的指路牌

文章看完了，总得有地方去。`ArticleNavigation.vue` 负责在文章底部展示上一篇和下一篇。

这里的样式设计延续了 Aero 风格，使用了大量的**渐变**和**光效**。

### 按钮的光效

注意看 `.nav-btn::before`，这是一个完全透明的层，但它有一个从左到右滑动的渐变背景。

```css
/* 导航按钮光效 */
.nav-btn::before {
  content: '';
  position: absolute;
  left: -100%; /* 初始位置在按钮左侧外面 */
  width: 100%;
  height: 100%;
  /* 一道白色的流光 */
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.nav-btn:hover::before {
  left: 100%; /* 鼠标悬停时，光从左滑到右 */
}
```

### 移动端适配

在手机上，屏幕宽度寸土寸金。`ArticleNavigation.vue` 做了一个非常激进的响应式处理：

在宽屏模式下，按钮显示图标 + 上一篇文字 + 文章标题。
在窄屏模式下（`< 768px`），CSS 直接把文字隐藏，只保留巨大的箭头图标，并且让按钮高度固定为 48px（符合拇指点击区域标准）。

```css
@media (max-width: 768px) {
  .nav-btn-content {
    display: none; /* 简单粗暴，隐藏文字 */
  }
  .nav-btn i {
    font-size: 1.4rem; /* 放大图标 */
  }
}
```

这样既保证了桌面端的信息量，又保证了移动端的操作便捷性。

---

## 下集预告

阅读体验优化得差不多了，但作为一个全栈博客，怎么能少得了**图片画廊**呢？

下一篇 **Vol.4 画廊与模态框**，将探讨如何管理全局的弹窗状态（告别 Props 地狱），以及如何实现一个支持键盘导航、全屏预览的沉浸式画廊。

---

> 没有未来的小风酱 著
