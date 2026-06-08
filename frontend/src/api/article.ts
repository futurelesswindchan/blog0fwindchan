import api from './index'
import type { ArticleDetail } from '@/types/article'

/**
 * 创建一篇新文章。
 *
 * @param data 文章的部分或全部详情数据
 * @returns 包含新文章信息的响应
 */
export const createArticle = (data: Partial<ArticleDetail>) => api.post('/articles', data)

/**
 * 根据 ID 删除指定文章。
 *
 * @param id 要删除的文章唯一标识符
 * @returns 删除操作的结果响应
 */
export const deleteArticle = (id: string) => api.delete(`/articles/${id}`)