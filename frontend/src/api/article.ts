import api from './index'

export const createArticle = (data: any) => api.post('/articles', data)
export const deleteArticle = (id: string) => api.delete(`/articles/${id}`)
