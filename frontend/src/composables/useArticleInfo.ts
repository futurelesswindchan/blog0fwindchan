import { computed, type Ref, type ComputedRef } from 'vue'

// 改进类型定义以支持响应式值
export function useArticleInfo(content: Ref<string> | ComputedRef<string>) {
  // 估算字数
  const estimateWords = computed(() => {
    const contentText = content.value
    if (!contentText) return 0

    // 移除 Markdown 标记符号
    const text = contentText
      .replace(/\!\[.*?\]\(.*?\)/g, '') // 移除图片标记
      .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接标记
      .replace(/\*\*.*?\*\*/g, '') // 移除加粗标记
      .replace(/\*.*?\*/g, '') // 移除斜体标记
      .replace(/\`.*?\`/g, '') // 移除代码标记
      .replace(/\#+ /g, '') // 移除标题标记
      .replace(/\n/g, '') // 移除换行符
      .trim()

    // 统计中文字符
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []

    // 统计英文单词
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 0)

    // 中文字符数 + 英文单词数
    return chineseChars.length + Math.ceil(englishWords.length / 2)
  })

  return {
    estimateWords,
  }
}
