# 风风博客开发心得（四）：文章渲染与 Markdown 支持

> 本文揭秘本站文章是如何从 Markdown 源码变成网页上跳动的字符的。  
> 内容基于 `src/components/common/` 下的打字机组件族及相关 Composable 整理，已与 **2025/12/19 版本** 代码对齐。

## 1. 渲染核心：打字机家族

为了看起来更炫酷，我们在项目中实现了三种不同的打字机机制，分别应对不同的场景。

### 1.1 正文渲染：ContentTypeWriter

在文章详情页，负责渲染 Markdown 正文的是 `src/components/common/ContentTypeWriter.vue`。

它的核心逻辑是**增量渲染**：

1.  **切片**: 接收完整的 Markdown 字符串，维护一个 `currentIndex` 指针。
2.  **循环**: 通过 `setTimeout` 递归调用，每次增加 `chunkSize`。
3.  **喂食**: 实时计算 `displayContent = content.slice(0, currentIndex)`，把这个**不完整**的字符串喂给 `<VueMarkdown>` 组件。

这种做法虽然野路子（Markdown 语法可能会在打字过程中短暂暴露），但它完美避开了操作 DOM 的复杂性，而且那种“`**加粗` 还没打完显示星号”的感觉，反而增加了一种实时写作的真实感。光标使用的是 `>>` 符号，配合 CSS `blink` 动画。

### 1.2 UI 标题：TypeWriter

在顶部导航栏显示“当前位置”的组件是 `src/components/common/TypeWriter.vue`。~~在主页也有用哦~~

它比前者更轻量，专门用于纯文本。

- **特性**: 支持 `IntersectionObserver`，只有当你滚动到它可见时才会开始打字。
- **光标**: 使用更传统的 `|` 符号。
- **逻辑**: 同样是切片逻辑，但它不涉及 Markdown 编译，性能开销极小。

### 1.3 列表动画：v-type-writer 指令

这是最精彩的部分。在文章列表页（如 `FrontEndView.vue`），你会看到文章卡片是一个接一个“打”出来的。

如果用 JS 去控制每一个卡片的文字，性能会爆炸。所以我们写了一个指令 `src/directives/typeWriterDirective.ts`，采用 **JS 计算 + CSS 变量** 的混合驱动模式：

1.  **计算延迟**: 指令挂载时，遍历所有 `.chapter-item`，计算出每个卡片的延迟时间 `itemDelay`。
2.  **注入变量**: 将延迟写入 CSS 变量：`card.style.setProperty('--item-delay', ...)`。
3.  **CSS 驱动**: 实际的动画（卡片浮现、标题打字）全部由 CSS `animation` 完成，JS 只负责触发一个类名 `typing-element`。

这样做既保证了动画的复杂调度，又把繁重的渲染任务交给了浏览器的合成线程，极其流畅。

## 2. 代码高亮：useCodeHighlight

为了让代码块看起来更专业，我们在 `src/composables/useCodeHighlight.ts` 中封装了 `highlight.js`。

我们没有直接使用 `highlight.js` 的默认输出，而是自定义了渲染逻辑，给每个代码块穿了一层“马甲”：

```ts
const highlightCode = (code: string, lang: string) => {
  // 1. 获取显示名称，比如 'js' 显示为 'JavaScript'
  const displayLang = languageNames[lang] || lang.toUpperCase()

  // 2. 高亮代码
  const highlighted = hljs.highlight(code, { language: lang }).value

  // 3. 包装 HTML，添加顶部的语言栏
  return `<pre class="code-block">
            <div class="code-lang">${displayLang}</div>
            <code class="${lang}">${highlighted}</code>
          </pre>`
}
```

在 `src/styles/codeBlock.css` 中，我们把 `.code-lang` 设计成了一个半透明的标题栏，配合 `JetBrainsMono` 字体，让代码块看起来像是一个迷你的 IDE 窗口。

特别地，我们为 Vue 语法定制了专属配色（`.hljs-tag` 为红色，`.hljs-attr` 为橙色），致敬 Vue 官方文档的视觉体验。

## 3. 字数统计：useArticleInfo

在文章开头显示的“约 xxx 字”，是由 `src/composables/useArticleInfo.ts` 计算的。

算法非常朴实无华：

1.  用一堆正则表达式把 Markdown 里的图片、链接、代码块、标题符号统统删掉，只留纯文本。
2.  统计中文字符数量。
3.  统计英文单词数量，除以 2（因为英文单词通常比汉字长，除以 2 换算成“字”的概念比较接近阅读体感）。
4.  两者相加，得出估算值。

## 4. 样式适配

为了配合全站的 Aero 风格，我们在 `codeBlock.css` 里也下了功夫：

- **玻璃质感**: 代码块背景是半透明的 (`rgba(0, 0, 0, 0.7)`)，在暗色模式下会更深一点。
- **滚动条**: 自定义了 `::-webkit-scrollbar`，让代码块内部的滚动条变细、变透明，不再突兀。

## 5. 小结

从 Markdown 正文的增量渲染，到 UI 标题的轻量打字，再到列表卡片的 CSS 变量驱动动画，我们构建了一套完整的“打字机宇宙”。

这些细节虽然增加了不少开发时间，但它们共同营造出了风风博客独特的那种感觉。~~到底是什么感觉啊喂OAO~~

下一篇，我们将聊聊**后端 API 设计与数据管理**，看看这些文章数据是怎么存取和管理的。

---

> 没有未来的小风酱 著  
> 2025-12-19 更新 （已与源码核对，打字机效果其实也是看到了那些AI流式输出才想做的）
