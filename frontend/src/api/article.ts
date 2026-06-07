import api from './index'
import type { ArticleDetail } from '@/types/article'

export const createArticle = (data: Partial<ArticleDetail>) => api.post('/articles', data)
export const deleteArticle = (id: string) => api.delete(`/articles/${id}`)
