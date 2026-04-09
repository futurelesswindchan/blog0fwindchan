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

    // 预处理：利用正则表达式剥离无阅读意义的 Markdown 控制符
    const text = contentText
      .replace(/!\[.*?\]\(.*?\)/g, '') // 剥离图片标记 ![alt](url)
      .replace(/\[.*?\]\(.*?\)/g, '') // 剥离链接标记 [text](url)
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
   * 通过全局多行正则匹配 `#` 语法的标题结构。
   */
  const articleToc = computed<TocItem[]>(() => {
    const contentText = content.value
    if (!contentText) return []

    const headings: TocItem[] = []

    // 正则解析：匹配行首的 1-6 个 '#'，随后匹配至少一个空格，最后捕获剩余的标题文本
    const regex = /^(#{1,6})\s+(.+)$/gm
    let match

    while ((match = regex.exec(contentText)) !== null) {
      const level = match[1].length
      const text = match[2].trim()

      // 锚点降级处理：将标题转换为小写并将空格替换为连字符，以兼容大多数 Markdown 渲染器的默认 id 生成策略
      const id = text.toLowerCase().replace(/\s+/g, '-')

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
