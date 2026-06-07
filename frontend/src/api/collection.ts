import api from './index'

export const createCollection = (data: any) => api.post('/admin/collections', data)
export const updateCollection = (slug: string, data: any) => api.put(`/admin/collections/${slug}`, data)
export const deleteCollection = (slug: string) => api.delete(`/admin/collections/${slug}`)
