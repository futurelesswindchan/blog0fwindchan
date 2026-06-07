/**
 * 文章摘要接口（对应后端 Article.to_dict_simple）。
 * 用于列表页展示。
 */
export interface ArticleSummary {
  id: string // 后端 slug
  uid: string | null
  title: string
  date: string
  collection_id: number | null
}

/**
 * 文章详情接口，包含完整 Markdown 内容。
 */
export interface ArticleDetail extends ArticleSummary {
  content: string
}

/**
 * 合集摘要接口（对应后端 Collection.to_dict_simple）。
 * 用于分类列表页展示卡片。
 */
export interface CollectionSummary {
  id: string // 后端 slug
  name: string
  description: string | null
  article_count: number
}

/**
 * 合集详情接口，包含其下属文章列表。
 */
export interface CollectionDetail extends CollectionSummary {
  articles: ArticleSummary[]
}

/**
 * 带分类标记的文章摘要（用于跨分类聚合场景）。
 */
export interface ArticleWithCategory extends ArticleSummary {
  category: string
}
