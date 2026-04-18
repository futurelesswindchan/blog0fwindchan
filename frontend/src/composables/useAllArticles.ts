// src/composables/useAllArticles.ts
import { ref, computed } from 'vue'
import { useArticleStore, type ArticleSummary } from '@/views/stores/articleStore'

// 扩展一下接口，打上分类和合集的“钢印” awa
export interface ArticleWithCategory extends ArticleSummary {
  category: string
  collection_id?: string | null
}

export function useAllArticles() {
  const articleStore = useArticleStore()

  // 存储所有拍平后的文章（包含散篇和合集内的文章）
  const allArticles = ref<ArticleWithCategory[]>([])
  const isFetchingGlobal = ref(false)

  // 核心魔法：拉取并合并所有文章
  const fetchAllArticles = async () => {
    isFetchingGlobal.value = true
    try {
      // 1. 先拉取全局索引
      await articleStore.fetchArticleIndex()

      // 2. 收集所有散篇（直接挂在 articles 下的）
      const standaloneArticles: ArticleWithCategory[] = []
      Object.entries(articleStore.articles).forEach(([category, articles]) => {
        articles.forEach((article) => {
          standaloneArticles.push({ ...article, category })
        })
      })

      // 3. 收集所有合集名单
      const allCols = Object.entries(articleStore.collections).flatMap(([category, cols]) =>
        cols.map((col) => ({ slug: col.id, category })),
      )

      // 4. 并发拉取所有合集详情（暴力一点没关系 -w-）
      const collectionResults = await Promise.all(
        allCols.map(async (col) => {
          // 注意：这里使用你配置的请求方式即可，比如 fetch 或 axios
          const response = await fetch(`/api/collection/${col.slug}`)
          if (response.ok) {
            const data = await response.json()
            if (data && data.articles) {
              return data.articles.map((a: ArticleSummary) => ({
                ...a,
                category: col.category,
                collection_id: col.slug,
              }))
            }
          }
          return []
        }),
      )

      // 5. 将散篇和合集文章拍平合并！
      allArticles.value = [...standaloneArticles, ...collectionResults.flat()]
    } catch (error) {
      console.error('💥 全局文章加载失败 QAQ:', error)
    } finally {
      isFetchingGlobal.value = false
    }
  }

  // 赠品：直接提供一个按日期排序的 computed，主页拿来就能用！
  const sortedArticles = computed(() => {
    return [...allArticles.value].sort((a, b) => b.date.localeCompare(a.date))
  })

  return {
    allArticles,
    sortedArticles,
    isFetchingGlobal,
    fetchAllArticles,
  }
}
