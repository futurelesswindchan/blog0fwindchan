export interface BaseArticle {
  id: string
  uid: string
  title: string
  date: string
  content?: string
}

export interface Article extends BaseArticle {
  category: 'frontend' | 'tools' | 'topics' | 'novels'
}

export type Story = Article
