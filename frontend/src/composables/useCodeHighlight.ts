// frontend\src\composables\useCodeHighlight.ts
// NOTE: 按需导入语言，避免打包全量 highlight.js（全量约 1.1 MB）
import hljs from 'highlight.js/lib/core'
import langTypeScript from 'highlight.js/lib/languages/typescript'
import langJavaScript from 'highlight.js/lib/languages/javascript'
import langXml from 'highlight.js/lib/languages/xml' // 同时覆盖 html / vue
import langCss from 'highlight.js/lib/languages/css'
import langScss from 'highlight.js/lib/languages/scss'
import langJson from 'highlight.js/lib/languages/json'
import langBash from 'highlight.js/lib/languages/bash'
import langPython from 'highlight.js/lib/languages/python'
import langMarkdown from 'highlight.js/lib/languages/markdown'
import langSql from 'highlight.js/lib/languages/sql'
import langYaml from 'highlight.js/lib/languages/yaml'
import langDiff from 'highlight.js/lib/languages/diff'
import langCpp from 'highlight.js/lib/languages/cpp'
import langJava from 'highlight.js/lib/languages/java'
import langCsharp from 'highlight.js/lib/languages/csharp'
import langGo from 'highlight.js/lib/languages/go'
import langRust from 'highlight.js/lib/languages/rust'
import langKotlin from 'highlight.js/lib/languages/kotlin'

// 注册所有需要高亮的语言
hljs.registerLanguage('typescript', langTypeScript)
hljs.registerLanguage('ts', langTypeScript)
hljs.registerLanguage('javascript', langJavaScript)
hljs.registerLanguage('js', langJavaScript)
hljs.registerLanguage('xml', langXml)
hljs.registerLanguage('html', langXml)
hljs.registerLanguage('vue', langXml)
hljs.registerLanguage('css', langCss)
hljs.registerLanguage('scss', langScss)
hljs.registerLanguage('json', langJson)
hljs.registerLanguage('bash', langBash)
hljs.registerLanguage('sh', langBash)
hljs.registerLanguage('python', langPython)
hljs.registerLanguage('py', langPython)
hljs.registerLanguage('markdown', langMarkdown)
hljs.registerLanguage('md', langMarkdown)
hljs.registerLanguage('sql', langSql)
hljs.registerLanguage('yaml', langYaml)
hljs.registerLanguage('yml', langYaml)
hljs.registerLanguage('diff', langDiff)
hljs.registerLanguage('cpp', langCpp)
hljs.registerLanguage('java', langJava)
hljs.registerLanguage('csharp', langCsharp)
hljs.registerLanguage('go', langGo)
hljs.registerLanguage('rust', langRust)
hljs.registerLanguage('kotlin', langKotlin)

/**
 * 极简的 HTML 实体转义函数
 * @description 防止在 hljs 解析失败时，原始代码中的 < > 等符号破坏 DOM 结构或引发 XSS 风险。
 */
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 代码高亮与结构生成组合式函数
 */
export function useCodeHighlight() {
  // 语言映射配置（用于顶部 Header 显示友好的名称）
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
    sh: 'Shell',
    py: 'Python',
    cpp: 'C++',
    java: 'Java',
    csharp: 'C#',
    go: 'Go',
    rust: 'Rust',
    kotlin: 'Kotlin',
    // 可以继续添加更多语言映射
  }

  /**
   * 代码高亮渲染器
   * @param {string} code - 原始代码字符串
   * @param {string} lang - Markdown 标记的语言类型
   * @returns {string} 拼接好的完整 HTML 字符串（包含 Header、复制按钮和高亮代码）
   */
  const highlightCode = (code: string, lang: string) => {
    const displayLang = languageNames[lang] || (lang ? lang.toUpperCase() : 'CODE')

    let highlighted = ''
    try {
      highlighted =
        lang && hljs.getLanguage(lang)
          ? hljs.highlight(code, { language: lang }).value
          : hljs.highlightAuto(code).value
    } catch (error) {
      // 若高亮引擎崩溃，安全转义原始代码后原样输出
      console.warn('Highlight failed, falling back to raw code.', error)
      highlighted = escapeHtml(code)
    }

    // 使用 code-block-wrapper 包裹，分离 header 和 content
    // 利用 encodeURIComponent 将原汁原味的代码挂载到 data-code 属性上，供一键复制使用
    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-lang">${displayLang}</span>
          <button class="code-copy-btn" data-code="${encodeURIComponent(code)}" title="复制代码">
            <!-- 默认状态：Copy -->
            <span class="btn-content default-content"><i class="fas fa-copy"></i> Copy</span>
            <!-- 成功状态：Copied! (默认隐藏) -->
            <span class="btn-content success-content"><i class="fas fa-check"></i> Copied!</span>
          </button>
        </div>
        <pre class="code-block"><code class="${lang}">${highlighted}</code></pre>
      </div>
    `
  }

  // 通用 Markdown 配置注入
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
