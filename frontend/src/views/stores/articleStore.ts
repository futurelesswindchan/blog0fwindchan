// frontend\src\views\stores\articleStore.ts
import { defineStore } from 'pinia'

// --- 数据接口定义 (与后端返回结构对齐) ---

// 文章摘要接口（用于列表页展示）
export interface ArticleSummary {
  id: string // 后端的 slug
  uid: string // 后端的 uid
  title: string
  date: string
  collection_id?: string | null // 为了适配旧文章数据、没有合集的文章，所以这是可选项
}

// 文章详情接口，包含完整内容（Markdown 格式）
export interface ArticleDetail extends ArticleSummary {
  content: string // Markdown 内容
}

// 合集摘要接口（用于分类列表页展示卡片）
export interface CollectionSummary {
  id: string // 后端的 slug
  name: string
  description?: string
  article_count: number
}
// 合集详情接口（用于点进合集后的列表页）
export interface CollectionDetail extends CollectionSummary {
  articles: ArticleSummary[]
}

interface ArticleState {
  // 存储各分类下的文章列表 (摘要信息)
  articles: {
    [key: string]: ArticleSummary[]
  }

  // 存储各分类下的合集列表 (摘要信息)
  collections: {
    [key: string]: CollectionSummary[]
  }

  // 存储当前正在阅读的文章详情 (包含完整内容)
  currentArticle: ArticleDetail | null
  isLoading: boolean
  error: string | null

  // 储存当前正在查看的合集详情（包含文章列表）
  currentCollection: CollectionDetail | null
}

// --- API 基地址 (本地开发调试用) ---
// 直接使用相对路径，Vite 代理会自动处理
const API_BASE_URL = '/api'

export const useArticleStore = defineStore('article', {
  state: (): ArticleState => ({
    articles: {
      // 预先定义一些键以符合类型，虽然下面的 fetch 会动态填充
      frontend: [],
      topics: [],
      novels: [],
      tools: [],
    },
    collections: {},
    currentArticle: null,
    currentCollection: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    // 获取指定分类下的文章列表
    getArticleList: (state) => (category: string) => {
      return state.articles[category] || []
    },

    // 获取指定分类下的合集列表
    getCollectionList: (state) => (category: string) => {
      return state.collections[category] || []
    },
  },

  actions: {
    /**
     * 1. 获取文章列表索引 (替换原来的 fetchArticleIndex)\
     * 请求后端的 /api/articles/index 接口
     */
    async fetchArticleIndex() {
      // 如果数据已经加载过，就不要重复请求
      if (Object.keys(this.articles).length > 0 && this.articles.frontend.length > 0) return

      this.isLoading = true
      this.error = null
      try {
        console.log('📡 Fetching article index from API...')
        const response = await fetch(`${API_BASE_URL}/articles/index`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        // 数据结构验证：确保返回的是一个对象，键是分类名，值是数组
        if (typeof data !== 'object' || data === null) {
          throw new Error('API return invalid format')
        }

        // 将后端返回的分类数据映射到这里的 state
        // 使用解构赋值来处理默认值，防止某个键不存在导致错误
        const {
          _collections = {},
          frontend = [],
          topics = [],
          novels = [],
          tools = [],
          ...otherCategories // 捕获未来可能新增的其他分类
        } = data

        this.articles = {
          frontend,
          topics,
          novels,
          tools,
          ...otherCategories,
        }

        this.collections = _collections // 重点在这里!
        // 我们需要把collections单独解构出来,这样剩下的依然是独立文章

        console.log('✅ Article index fetched successfully.')
      } catch (error) {
        console.error('💥 加载文章索引失败:', error)
        this.error = error instanceof Error ? error.message : '未知错误'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 2. 获取单篇文章详情 (替换原来的 fetchArticle)\
     * 请求后端的 /api/article/{category}/{id} 接口
     * @param category 分类 slug (如 'frontend')
     * @param id 文章 slug (如 'about-blog')
     */
    async fetchArticle(category: string, id: string) {
      // 如果当前已经加载了这篇文章，就不重复请求
      if (this.currentArticle && this.currentArticle.id === id) return

      this.isLoading = true
      this.currentArticle = null // 先清空旧数据，避免闪烁
      this.error = null

      try {
        console.log(`📡 Fetching article: ${category}/${id}...`)
        // 注意：这里需要传入 category 和 id 两个参数来构建 URL
        const url = `${API_BASE_URL}/article/${category}/${id}`
        const response = await fetch(url)

        if (!response.ok) {
          // 如果是 404，抛出特定错误
          if (response.status === 404) {
            throw new Error('文章不存在 (404)')
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // 直接解析 JSON，后端返回的数据里已经包含了 content 字段
        const articleData: ArticleDetail = await response.json()

        this.currentArticle = articleData
        console.log(`✅ Article '${id}' loaded successfully.`)
      } catch (error) {
        console.error(`💥 加载文章内容失败 [${category}/${id}]:`, error)
        this.error = error instanceof Error ? error.message : '未知错误'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 3. 获取单个合集的详情及其包含的文章\
     * 请求后端的 /api/collection/{slug} 接口
     * @param slug 合集的 slug (如 'novelA-collection')
     */
    async fetchCollectionDetail(slug: string) {
      // 如果当前已经加载了这个合集，就不重复请求
      if (this.currentCollection && this.currentCollection.id === slug) return

      this.isLoading = true
      this.currentCollection = null
      this.error = null
      try {
        console.log(`📡 Fetching collection detail: ${slug}...`)
        const response = await fetch(`${API_BASE_URL}/collection/${slug}`)

        if (!response.ok) {
          if (response.status === 404) throw new Error('合集不存在 (404)')
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        this.currentCollection = await response.json()
        console.log(`✅ Collection '${slug}' loaded successfully.`)
      } catch (error) {
        console.error(`💥 加载合集内容失败 [${slug}]:`, error)
        this.error = error instanceof Error ? error.message : '未知错误'
      } finally {
        this.isLoading = false
      }
    },
  },
})
