import { computed, type ComputedRef } from 'vue'

export interface NavigableArticle {
  id: string
  uid?: string
  title: string
  date: string
  content?: string // 修改为可选字段
}

interface UseArticleNavigationOptions<T extends NavigableArticle> {
  articles: ComputedRef<T[]>
  currentId: ComputedRef<string>
}

export function useArticleNavigation<T extends NavigableArticle>(
  options: UseArticleNavigationOptions<T>,
) {
  const { articles, currentId } = options

  const currentIndex = computed(() =>
    articles.value.findIndex((article) => article.id === currentId.value),
  )

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
