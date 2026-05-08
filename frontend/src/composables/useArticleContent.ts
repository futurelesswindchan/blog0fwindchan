/**
 * @file useArticleContent.ts
 * @description 封装 Markdown 渲染引擎配置与主题感知逻辑。
 * 集成了 DOMPurify 以防御针对 Markdown 渲染后生成的 HTML 的 Self-XSS 攻击。
 */

import { ref, onMounted, onUnmounted } from 'vue'
import VueMarkdown from 'vue-markdown-render'
import DOMPurify from 'dompurify'

/**
 * Markdown 渲染配置接口
 * @interface MarkdownOptions
 */
export interface MarkdownOptions {
  /** 是否自动转换 URL 链接 */
  linkify: boolean
  /** 是否替换特殊符号（如 (c) -> ©） */
  typographer: boolean
  /** 是否允许内容中的 HTML 标签（注意：启用此项必须配合安全过滤） */
  html: boolean
  /** 是否将换行符转换为 <br> */
  breaks?: boolean
  /** 代码块高亮回调函数 */
  highlight?: (str: string, lang: string) => string
}

export { VueMarkdown }

/**
 * 配置并获取 DOMPurify 净化器实例
 * @description 使用闭包单例模式，避免重复创建实例，并预设安全策略。
 *
 * @returns {typeof DOMPurify} 配置完成的净化器对象
 */
const getPurifier = (): typeof DOMPurify => {
  // 仅在浏览器环境下初始化
  if (typeof window !== 'undefined') {
    // 允许 target="_blank" 属性，这在文章链接中很常见
    DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
      if ('target' in node) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    })
  }
  return DOMPurify
}

/**
 * 文章内容渲染逻辑组合式函数
 * @description 提供主题动态感知、安全过滤后的 Markdown 配置以及工具函数。
 */
export function useArticleContent() {
  const isDarkTheme = ref<boolean>(false)

  /**
   * 基础 Markdown 渲染配置
   * @type {MarkdownOptions}
   */
  const markdownOptions: MarkdownOptions = {
    linkify: true,
    typographer: true,
    html: true,
  }

  /**
   * XSS 安全过滤包装器
   * @description 针对 markdown-it + highlight.js 生成的复杂 HTML 结构进行了白名单放行。
   *
   * @param {string} html - 待清洗的原始 HTML 字符串
   * @returns {string} 过滤后的安全 HTML
   */
  const sanitizeHtml = (html: string): string => {
    return getPurifier().sanitize(html, {
      // 允许的标签：增加代码高亮相关的基本标签
      ADD_TAGS: ['span', 'code', 'pre', 'i', 'button'],

      // 允许的属性白名单
      ADD_ATTR: ['class', 'target', 'rel', 'data-code', 'title'],

      // 强制禁用的高危项目
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover'],
    }) as string
  }

  onMounted(() => {
    const layout: Element | null = document.querySelector('.main-layout')
    isDarkTheme.value = layout?.classList.contains('dark-theme') || false

    const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
      mutations.forEach((mutation: MutationRecord) => {
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

  /**
   * 格式化日期字符串
   *
   * @param {string} dateString - 原始日期字符串
   * @returns {string} 格式化后的本地化日期 (如：2026年5月8日)
   */
  const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    const date: Date = new Date(dateString)
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
    sanitizeHtml,
    VueMarkdown,
  }
}
