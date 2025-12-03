# 风风博客博客开发心得（四）：文章渲染与 Markdown 支持

> 本文总结本站的文章渲染实现细节。内容基于仓库中 `src/components/common/ContentTypeWriter.vue`、`src/composables/useArticleContent.ts`、`src/composables/useCodeHighlight.ts` 和 `src/composables/useArticleInfo.ts` 的实际实现。

## 1. 渲染总体流程（从文件到视图）

站内文章、短篇与专题内容以 Markdown 文件存储（位于 `public/article/...`），前端的展示流程是：

1. 内容加载：按需使用 `fetch` 或 Vite 静态导入读取 `.md` 源文（或通过 store 统一加载）。
2. 预处理：`useArticleContent.ts` 对原始 Markdown 做必要清洗（例如移除前置元信息、做相对路径替换等）。
3. 渲染：由 `ContentTypeWriter.vue` 作为统一入口负责把 Markdown 渲染为 HTML（内部封装了项目的 Markdown 渲染器与代码高亮钩子）。
4. 视觉增强：`useCodeHighlight.ts` 对代码块做高亮并输出带语言标签的 HTML 结构；样式由 `src/styles/codeBlock.css` 控制。
5. 交互与动画：`ContentTypeWriter` 可在渲染后逐字/分块地展示内容以实现打字机效果。

## 2. ContentTypeWriter（统一渲染入口）

`src/components/common/ContentTypeWriter.vue` 是文章正文的统一组件。要点：

- Props（常见）：

  - `content: string` — Markdown 源文本。
  - `markdownOptions?: Record<string, any>` — 传入的渲染器选项（例如是否允许 HTML、linkify、typographer）。
  - `isDarkTheme?: boolean` — 用于决定某些样式或高亮配色。
  - `speed?: number`, `initialDelay?: number`, `chunkSize?: number` — 打字机动画控制参数。

- 行为：组件先把 Markdown 交给渲染器（并通过 `useCodeHighlight` 的 `highlight` 钩子格式化代码块），渲染出带 class 的 HTML，然后根据 `speed` / `chunkSize` 做分块显示，最后完整展示且移除占位光标。

示例（组件调用）：

```html
<ContentTypeWriter
  :content="articleContent"
  :markdown-options="markdownOptions"
  :is-dark-theme="isDarkTheme"
  :speed="20"
  :initial-delay="400"
  :chunk-size="1"
/>
```

（注意：项目中真实组件位于 `src/components/common/ContentTypeWriter.vue`，请以该文件为准。此处示例参数名与源码一致。）

## 3. Markdown 配置与扩展点

项目将 Markdown 的可配置项集中在 `src/composables/useArticleContent.ts`，并把代码高亮的 hook 提供给 Markdown 渲染器：

- 常用选项：

  - `linkify: true` — 自动识别 URL 为链接。
  - `typographer: true` — 智能标点与排版优化。
  - `html: false|true` — 是否允许原生 HTML（由文章来源决定）。

- 扩展点：渲染器接受 `highlight` 回调（来自 `useCodeHighlight.ts`），用于把 code block 转换为带语言标签和高亮 HTML 的结构。

示意接口：

```ts
// src/composables/useArticleContent.ts（概要）
export interface MarkdownOptions {
  linkify: boolean
  typographer: boolean
  html: boolean
  breaks?: boolean
  highlight?: (str: string, lang: string | undefined) => string
}
```

## 4. 代码高亮（`useCodeHighlight.ts`）

实现要点：项目采用 `highlight.js`（在 `useCodeHighlight.ts` 中封装），对代码块做两件事：高亮渲染与语言标签展示。

简化后的核心逻辑如下（与源码逻辑一致）：

```ts
const highlightCode = (code: string, lang?: string) => {
  const displayLang = (lang && languageNames[lang]) || (lang || 'AUTO').toUpperCase()
  const highlighted =
    lang && hljs.getLanguage(lang)
      ? hljs.highlight(code, { language: lang }).value
      : hljs.highlightAuto(code).value

  return `<pre class="code-block"><div class="code-lang">${displayLang}</div><code class="${lang || ''}">${highlighted}</code></pre>`
}
```

要点：

- 若能识别语言则使用指定语言高亮，否则降级为自动识别。
- 返回的 HTML 结构会带 `.code-lang` 用于在样式中显示语言标签。

样式细节见 `src/styles/codeBlock.css`，包含暗色主题适配、滚动条与行号样式等。

## 5. 打字机动画策略

`ContentTypeWriter` 支持把已渲染的 HTML 以“逐字/逐块”方式插入到视图中，策略上会：

- 在首次渲染时按 `initialDelay` 等待；
- 按 `chunkSize` 把 HTML 文本切分为若干段并以 `speed` 频率插入；
- 在动画期间保持光标/占位；动画结束后展示完整文档并移除动画相关样式。

实现细节注意点：在逐字渲染 HTML 时要避免破坏标签结构（源码通过按字符安全地拼接 DOM 或者按 token 分块来保证正确渲染）。

## 6. 字数统计（`useArticleInfo.ts`）

文章信息（如大致字数）通过 `src/composables/useArticleInfo.ts` 来估算，常见实现思路：

- 移除 Markdown 标记与 HTML 后得到纯文本；
- 统计中文字符数与英文单词数，并用经验公式合并为「约多少字」。

示意代码：

````ts
export function useArticleInfo(content: Ref<string> | ComputedRef<string>) {
  const estimateWords = computed(() => {
    const text = (content.value || '')
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/<[^>]+>/g, '') // 移除 HTML
      .replace(/[#>*`~\-\[\]()]/g, '') // 移除常见 Markdown 标记

    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
    const englishWords = (text.replace(/[\u4e00-\u9fff]/g, ' ') || '').match(/[A-Za-z0-9]+/g) || []

    return chineseChars.length + Math.ceil(englishWords.length / 2)
  })

  return { estimateWords }
}
````

页面上常显示 `约 ${estimateWords.value} 字`，用于给读者一个阅读量的预期。

## 7. 移动端与主题适配

- `ContentTypeWriter`、高亮样式与 `.markdown-content` 的样式都支持亮/暗主题（主题状态由 `MainLayout` 的 `isDarkTheme` 管理并持久化到 `localStorage`）。
- 对于移动端，样式表在 `@media (hover: none)` 或 `max-width` 下会降低视觉特效（例如禁用 backdrop-filter、减少动画），以提高性能并避免渲染问题。

## 8. 使用示例（文章视图）

在文章页面（如 `src/views/articles/ArticleDetailView.vue` 或 `src/views/ArticleView.vue`）中，正文区域典型用法如下：

```html
<div class="article-content markdown-content">
  <ContentTypeWriter
    :content="article.content || ''"
    :markdown-options="markdownOptions"
    :is-dark-theme="isDarkTheme"
    :speed="20"
    :initial-delay="400"
    :chunk-size="1"
  />
</div>
```

其中 `markdownOptions` 与 `isDarkTheme` 通常由父组件或对应的 composable 提供。

## 9. 小结

本文对仓库中实际实现做了总结：渲染由 `ContentTypeWriter` 统一入口负责，`useArticleContent` 负责数据预处理，`useCodeHighlight` 负责高亮与语言标签，`useArticleInfo` 提供字数估算。所有逻辑与样式都考虑亮/暗主题与移动端降级策略，确保在不同终端上都能获得稳定且一致的阅读体验。

---

> 没有未来的小风酱 著
> 2025-12-1 (已与全栈架构同步)
