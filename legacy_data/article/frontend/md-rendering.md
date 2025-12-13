# 风风博客开发心得（四）：文章渲染与 Markdown 支持

> 本文揭秘本站文章是如何从 Markdown 源码变成网页上跳动的字符的。  
> 内容基于 `src/components/common/ContentTypeWriter.vue` 及相关 Composable 整理，已与 2025/12/12 版本代码对齐。

## 1. 渲染核心：ContentTypeWriter

在文章详情页，你看到的那个正在“打字”的组件就是 `src/components/common/ContentTypeWriter.vue`。

### 1.1 “增量渲染”的打字机

很多打字机效果是操作 DOM 节点的（比如把 HTML 树藏起来，一个个显示），但我们的实现方式更加简单粗暴且有趣：**对 Markdown 源码进行切片**。

逻辑如下：

1.  **输入**: 接收完整的 Markdown 字符串 `content`。
2.  **切片**: 设置一个指针 `currentIndex`，通过 `setTimeout` 不断增加它。
3.  **计算**: 实时计算 `displayContent = content.slice(0, currentIndex)`。
4.  **渲染**: 把这个**不完整**的 Markdown 字符串喂给 `<VueMarkdown>` 组件。

```ts
// 核心逻辑简化
const type = () => {
  if (currentIndex.value < props.content.length) {
    // 每次多截取 chunkSize 个字符
    currentIndex.value += props.chunkSize
    setTimeout(type, props.speed)
  }
}
```

这种做法的好处是完全不需要处理复杂的 HTML DOM 结构，坏处是打字过程中偶尔会看到 Markdown 语法暴露。

比如 `**加粗` 还没打出后半个 `**` 时，页面上会显示星号，但这反而增加了一种“正在实时写作”的真实感。

### 1.2 光标动画

组件里还放了一个 `>>` 形状的光标：

```html
<span v-if="isTyping" class="typing-cursor">>></span>
```

配合 CSS 的 `blink` 动画，让它看起来像是在终端里输入一样。

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

## 3. 字数统计：useArticleInfo

在文章开头显示的“约 xxx 字”，是由 `src/composables/useArticleInfo.ts` 计算的。

算法非常朴实无华：

1.  用正则表达式把 Markdown 里的图片、链接、代码块、标题符号统统删掉，只留纯文本。
2.  统计中文字符数量。
3.  统计英文单词数量，除以 2（因为英文单词通常比汉字长，除以 2 换算成“字”的概念比较接近阅读体感）。
4.  两者相加，得出估算值。

```ts
// 核心正则
const text = contentText
  .replace(/\!\[.*?\]\(.*?\)/g, '') // 删图片
  .replace(/\`.*?\`/g, '') // 删行内代码
// ...更多正则
```

## 4. 样式适配

为了配合全站的 Aero 风格，我们在 `codeBlock.css` 里也下了功夫：

- **玻璃质感**: 代码块背景是半透明的 (`rgba(0, 0, 0, 0.7)`)，在暗色模式下会更深一点。
- **滚动条**: 自定义了 `::-webkit-scrollbar`，让代码块内部的滚动条变细、变透明，不再突兀。
- **Vue 高亮**: 特意为 Vue 语法配置了专属颜色（比如 `.hljs-tag` 是红色，`.hljs-attr` 是橙色），致敬 Vue 官方文档的配色。

## 5. 小结

通过 `ContentTypeWriter` 的增量渲染和 `useCodeHighlight` 的自定义封装，我们实现了一个既有动态感又美观的文章阅读体验。

虽然 切片Markdown 的方案听起来有点野路子，但它在实际运行中表现得相当稳定，而且完美避开了操作 DOM 可能带来的安全风险（XSS）。

下一篇，我们将聊聊**后端 API 设计与数据管理**，看看这些文章数据是怎么存取和管理的。

---

> 没有未来的小风酱 著  
> 2025-12-12重写 （已与源码核对，打字机效果其实也是看到了那些AI流式输出才想做的）
