import { ref, onMounted, onUnmounted } from 'vue'
import VueMarkdown from 'vue-markdown-render'

export interface MarkdownOptions {
  linkify: boolean
  typographer: boolean
  html: boolean
  breaks?: boolean
  highlight?: (str: string, lang: string) => string
}

export { VueMarkdown }

export function useArticleContent() {
  const isDarkTheme = ref(false)

  // Markdown渲染配置
  const markdownOptions: MarkdownOptions = {
    linkify: true,
    typographer: true,
    html: true,
  }

  // 已删除 loadContent 方法，因为现在内容由 Store 直接提供字符串

  // 监听主题变化
  onMounted(() => {
    // 初始检查
    const layout = document.querySelector('.main-layout')
    isDarkTheme.value = layout?.classList.contains('dark-theme') || false

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const el = mutation.target as HTMLElement
          isDarkTheme.value = el.classList.contains('dark-theme')
        }
      })
    })

    if (layout) {
      observer.observe(layout, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }

    onUnmounted(() => {
      observer.disconnect()
    })
  })

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    // 尝试解析日期，防止无效日期报错
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return {
    isDarkTheme,
    markdownOptions,
    formatDate,
    VueMarkdown,
  }
}
