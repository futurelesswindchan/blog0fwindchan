// frontend\src\composables\useArticleNavigation.ts
import { computed, type ComputedRef } from 'vue'

/**
 * 可导航文章的基础接口定义
 *
 * 定义了在进行前后篇导航时，文章对象必须具备的基础属性。
 *
 * @interface
 */
export interface NavigableArticle {
  /** 文章的唯一标识符（通常用于路由上的 slug 或 id） */
  id: string
  /** 文章的真实唯一 ID（可选，如果存在则优先用于某些业务逻辑，否则回退到 id） */
  uid?: string
  /** 文章的显示标题 */
  title: string
  /** 文章的发布或更新日期 */
  date: string
  /** 文章的具体内容（可选，导航逻辑中通常不需要加载全量内容） */
  content?: string
}

/**
 * 文章导航组合函数的选项配置接口
 *
 * @interface
 * @template T 继承自 NavigableArticle 的具体文章类型
 */
interface UseArticleNavigationOptions<T extends NavigableArticle> {
  /** 响应式的文章列表集合（通常要求在此之前已经被按照时间等规则排序过） */
  articles: ComputedRef<T[]>
  /** 响应式的当前文章 ID，用于在列表中定位当前所在位置 */
  currentId: ComputedRef<string>
}

/**
 * 文章上下篇导航组合式函数 (Composable)
 *
 * 根据传入的完整文章列表和当前正在阅读的文章 ID，
 * 动态计算出“上一篇”和“下一篇”文章的精简信息（仅保留展示导航所需的 id, uid 和 title），
 * 有效避免不必要的数据传输与内存占用。
 *
 * @template T 继承自 NavigableArticle 的具体文章类型
 *
 * @param {UseArticleNavigationOptions<T>} options - 初始化选项，包含文章列表和当前文章 ID 的响应式引用。
 * @returns {Object} 包含上一篇和下一篇文章计算属性的对象。
 * @property {ComputedRef<Object|null>} prevArticle - 上一篇文章的精简数据。如果当前是第一篇或未找到，则返回 null。
 * @property {ComputedRef<Object|null>} nextArticle - 下一篇文章的精简数据。如果当前是最后一篇或未找到，则返回 null。
 */
export function useArticleNavigation<T extends NavigableArticle>(
  options: UseArticleNavigationOptions<T>,
) {
  const { articles, currentId } = options

  /**
   * 动态计算当前文章在列表中的索引位置。
   * 如果没找到匹配的文章，会返回 -1 哦。
   *
   * @type {ComputedRef<number>}
   */
  const currentIndex = computed(() =>
    articles.value.findIndex((article) => article.id === currentId.value),
  )

  /**
   * 上一篇文章 (Prev Article)
   *
   * 逻辑：如果当前索引 <= 0（说明是第一篇或者列表为空/未找到），则没有上一篇。
   * 否则返回索引 - 1 的文章的精简导航数据。
   *
   * @type {ComputedRef<{id: string, uid: string, title: string} | null>}
   */
  const prevArticle = computed(() => {
    if (currentIndex.value <= 0) return null
    const prev = articles.value[currentIndex.value - 1]
    return prev
      ? {
          id: prev.id,
          uid: prev.uid || prev.id,
          title: prev.title,
        }
      : null
  })

  /**
   * 下一篇文章 (Next Article)
   *
   * 逻辑：如果没找到当前文章 (-1) 或者当前的索引已经是列表最后一小只了，则没有下一篇。
   * 否则返回索引 + 1 的文章的精简导航数据。
   *
   * @type {ComputedRef<{id: string, uid: string, title: string} | null>}
   */
  const nextArticle = computed(() => {
    if (currentIndex.value === -1 || currentIndex.value >= articles.value.length - 1) return null
    const next = articles.value[currentIndex.value + 1]
    return next
      ? {
          id: next.id,
          uid: next.uid || next.id,
          title: next.title,
        }
      : null
  })

  return {
    prevArticle,
    nextArticle,
  }
}
