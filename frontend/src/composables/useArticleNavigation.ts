/**
 * @fileoverview 文章智能上下文导航钩子
 * @description 根据当前文章的属性（是否属于合集、所属分类），在全站文章池中自动筛选出合法的导航范围。
 *
 * 导航逻辑优先级：
 * 1. 若当前文章属于合集 (collection_id 存在)，则导航范围严格锁定在该合集内。
 * 2. 若当前文章为散篇，则导航范围锁定在同分类 (category) 的所有散篇中。
 */

import { computed, type Ref } from 'vue'
import type { ArticleWithCategory } from '@/composables/useAllArticles'

/**
 * 导航配置接口
 */
interface NavigationSource {
  /** 当前正在阅读的文章对象 */
  currentArticle: Ref<ArticleWithCategory | null>
  /** 全局拍平后的文章总列表 (包含所有分类和合集) */
  allArticles: Ref<ArticleWithCategory[]>
}

/**
 * 智能计算上一篇与下一篇
 *
 * @param {NavigationSource} source - 数据源配置
 * @returns {{ prevArticle: ComputedRef<ArticleWithCategory | null>, nextArticle: ComputedRef<ArticleWithCategory | null> }}
 */
export function useArticleNavigation({ currentArticle, allArticles }: NavigationSource) {
  /**
   * @description 严格上下文过滤列表
   * @returns {ArticleWithCategory[]} 过滤后的文章数组
   */
  const contextList = computed(() => {
    const current = currentArticle.value
    if (!current || !allArticles.value.length) return []

    if (current.collection_id) {
      // 🚀 场景 A：合集模式
      // 仅筛选出属于同一个合集的文章，并保持它们在合集内的原始顺序
      return allArticles.value.filter((a) => a.collection_id === current.collection_id)
    } else {
      // 🚀 场景 B：散篇模式
      // 仅筛选出属于同分类、且【不属于】任何合集的文章
      return allArticles.value.filter((a) => a.category === current.category && !a.collection_id)
    }
  })

  /**
   * @description 获取当前文章在上下文列表中的索引
   */
  const currentIndex = computed(() => {
    if (!currentArticle.value) return -1
    return contextList.value.findIndex((a) => a.id === currentArticle.value?.id)
  })

  /**
   * @description 计算上一篇文章
   */
  const prevArticle = computed(() => {
    const idx = currentIndex.value
    return idx > 0 ? contextList.value[idx - 1] : null
  })

  /**
   * @description 计算下一篇文章
   */
  const nextArticle = computed(() => {
    const idx = currentIndex.value
    return idx !== -1 && idx < contextList.value.length - 1 ? contextList.value[idx + 1] : null
  })

  return {
    prevArticle,
    nextArticle,
    contextList, // 顺便把列表也吐出来，调试时很有用哦 owo
  }
}
