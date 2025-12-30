// frontend\src\composables\useCodeHighlight.ts
import hljs from 'highlight.js'

export function useCodeHighlight() {
  // 语言映射配置
  const languageNames: Record<string, string> = {
    ts: 'TypeScript',
    js: 'JavaScript',
    vue: 'Vue',
    css: 'CSS',
    scss: 'SCSS',
    html: 'HTML',
    xml: 'XML',
    json: 'JSON',
    bash: 'Bash',
    // 可以继续添加更多语言映射
  }

  // 代码高亮处理函数
  const highlightCode = (code: string, lang: string) => {
    const displayLang = languageNames[lang] || lang.toUpperCase()
    const highlighted =
      lang && hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang }).value
        : hljs.highlightAuto(code).value

    return `<pre class="code-block">
              <div class="code-lang">${displayLang}</div>
              <code class="${lang}">${highlighted}</code>
            </pre>`
  }

  // Markdown配置
  const codeHighlightOptions = {
    highlight: highlightCode,
    langPrefix: 'hljs language-',
    html: true,
  }

  return {
    highlightCode,
    codeHighlightOptions,
    languageNames,
  }
}
