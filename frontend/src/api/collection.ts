import api from './index'
import type { CollectionSummary } from '@/types/article'

/**
 * 创建一个新的合集。
 *
 * @param data 合集的属性数据
 * @returns 包含新增合集信息的响应
 */
export const createCollection = (data: Partial<CollectionSummary>) => api.post('/admin/collections', data)

/**
 * 更新指定的合集信息。
 *
 * @param slug 合集的名称拼音或英文别名（用于作为唯一路径标识）
 * @param data 需要更新的属性数据
 * @returns 更新操作的结果响应
 */
export const updateCollection = (slug: string, data: Partial<CollectionSummary>) => api.put(`/admin/collections/${slug}`, data)

/**
 * 根据标识符删除指定的合集。
 *
 * @param slug 合集的名称拼音或英文别名
 * @returns 删除操作的结果响应
 */
export const deleteCollection = (slug: string) => api.delete(`/admin/collections/${slug}`)