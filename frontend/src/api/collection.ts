import api from './index'
import type { CollectionSummary } from '@/stores/articleStore'

export const createCollection = (data: Partial<CollectionSummary>) => api.post('/admin/collections', data)
export const updateCollection = (slug: string, data: Partial<CollectionSummary>) => api.put(`/admin/collections/${slug}`, data)
export const deleteCollection = (slug: string) => api.delete(`/admin/collections/${slug}`)
