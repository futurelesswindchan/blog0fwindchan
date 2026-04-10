// frontend\src\composables\useArticleInfo.ts
import { computed, ref, type Ref, type ComputedRef } from 'vue'

/**
 * 目录导航条目类型定义 (Table of Contents Item)
 * @interface TocItem
 * @property {number} level - 标题层级 (1-6)，对应 h1-h6
 * @property {string} text - 标题的纯文本内容
 * @property {string} id - 用于锚点跳转的唯一标识符
 */
export interface TocItem {
  level: number
  text: string
  id: string
}

/**
 * 极简的锚点生成器 (Slugify)
 * @description 模拟 markdown-it-anchor 的默认行为：转小写、移除标点符号、空格转连字符。
 * @param {string} text - 原始标题文本
 * @returns {string} 安全的 HTML id
 */
const slugify = (text: string): string => {
  return (
    text
      .toLowerCase()
      // 移除所有非字母、非数字、非中文字符以及非空格的特殊标点符号
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
      // 将连续空格替换为单个连字符
      .replace(/\s+/g, '-')
      // 移除首尾连字符
      .replace(/^-+|-+$/g, '')
  )
}

/**
 * 文章元数据提取组合式函数 (Composable)
 * @description 负责从原始 Markdown 文本中实时解析出字数、阅读时间、排版行数以及目录结构。
 * @param {Ref<string> | ComputedRef<string>} content - 响应式的 Markdown 文本内容源
 * @returns 包含各项目元数据的响应式对象及更新方法
 */
export function useArticleInfo(content: Ref<string> | ComputedRef<string>) {
  /**
   * @type {Ref<number>} exactLineCount
   * @description 接收并存储由底层排版引擎 (如 pretext) 精确计算出的视觉折行数。
   * 初始化为 0，需由外部组件在完成排版测算后通过 `updateLineCount` 注入。
   */
  const exactLineCount = ref(0)

  /**
   * @type {ComputedRef<number>} estimateWords
   * @description 智能化字数估算。
   * 采用中英文混合统计算法：剔除 Markdown 语法噪音后，中文以单字统计，英文以单词为单位统计（折算系数为 0.5）。
   */
  const estimateWords = computed(() => {
    const contentText = content.value
    if (!contentText) return 0

    // 预处理：利用正则表达式剥离无阅读意义的 Markdown 控制符，但保留超链接文本
    const text = contentText
      .replace(/!\[.*?\]\(.*?\)/g, '') // 剥离图片标记 ![alt](url)
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 提取链接文本，丢弃 URL: [text](url) -> text
      .replace(/[*`>]/g, '') // 剥离强调(*)、代码(`)、引用(>)标记
      .replace(/#+\s/g, '') // 剥离标题锚号 (#)
      .replace(/\n/g, '') // 剥离换行符，打平文本
      .trim()

    // 统计中文字符集 (CJK Unified Ideographs)
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []

    // 统计英文及其他字母组成的单词 (按空格分割)
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, ' ') // 将中文替换为空格，避免粘连
      .split(/\s+/)
      .filter((word) => word.length > 0)

    // 综合统计算法：1个英文单词的阅读视觉占位约等于0.5个中文字符
    return chineseChars.length + Math.ceil(englishWords.length / 2)
  })

  /**
   * @type {ComputedRef<number>} readingTime
   * @description 预估阅读时间 (分钟)。
   * 基于人类平均阅读速度常量 (约 300字/分钟) 进行换算，不足 1 分钟按 1 分钟计算。
   */
  const readingTime = computed(() => {
    return Math.max(1, Math.ceil(estimateWords.value / 300))
  })

  /**
   * @type {ComputedRef<TocItem[]>} articleToc
   * @description 自动提取 Markdown 标题以生成侧边栏目录树 (TOC)。
   * 跳过代码块内部的注释 (#)，并生成符合规范的唯一锚点 ID。
   */
  const articleToc = computed<TocItem[]>(() => {
    const contentText = content.value
    if (!contentText) return []

    const headings: TocItem[] = []
    const slugCounts = new Map<string, number>()

    // 临时挖空所有代码块 (```...```)，防止内部的 `#` 注释被误认为标题
    const cleanText = contentText.replace(/```[\s\S]*?```/g, '')

    // 正则解析：匹配行首的 1-6 个 '#'，随后匹配至少一个空格，最后捕获剩余的标题文本
    const regex = /^(#{1,6})\s+(.+)$/gm
    let match

    while ((match = regex.exec(cleanText)) !== null) {
      const level = match[1].length
      const text = match[2].trim()

      // 防弹装甲 2 & 3：使用 slugify 剔除标点生成基础 ID，并处理同名标题冲突
      let baseSlug = slugify(text)

      // 兜底：如果标题全是标点被清空了，给个默认的前缀
      if (!baseSlug) baseSlug = `heading-${level}`

      let id = baseSlug
      const count = slugCounts.get(baseSlug) || 0

      // 如果发现同名 ID，追加 -1, -2 的后缀保证唯一性
      if (count > 0) {
        id = `${baseSlug}-${count}`
      }
      slugCounts.set(baseSlug, count + 1)

      headings.push({ level, text, id })
    }

    return headings
  })

  /**
   * 更新精准行数
   * @param {number} lines - 从外部排版引擎传入的真实物理行数
   */
  const updateLineCount = (lines: number) => {
    exactLineCount.value = lines
  }

  return {
    estimateWords,
    exactLineCount,
    readingTime,
    articleToc,
    updateLineCount,
  }
}
