import api from './index'
import type { Artwork } from '@/types/artwork'

/**
 * 获取所有画作列表。
 *
 * @returns 包含画作数组的响应
 */
export const getArtworks = () => api.get('/artworks')

/**
 * 根据 ID 获取单张画作的详细信息。
 *
 * @param id 画作的唯一标识符
 * @returns 指定画作的详细数据响应
 */
export const getArtworkById = (id: string) => api.get(`/artworks/${id}`)

/**
 * 新增一张画作。
 *
 * @param data 画作的各个配置字段
 * @returns 新增画作的结果响应
 */
export const addArtwork = (data: Partial<Artwork>) => api.post('/artworks', data)

/**
 * 更新指定画作的信息（如标题、描述、图片链接等）。
 *
 * @param id 需要更新的画作唯一标识符
 * @param data 要更新的字段映射
 * @returns 更新操作的结果响应
 */
export const updateArtwork = (id: string, data: Partial<Artwork>) => api.put(`/artworks/${id}`, data)

/**
 * 根据 ID 删除指定的画作。
 *
 * @param id 要删除的画作唯一标识符
 * @returns 删除操作的结果响应
 */
export const deleteArtwork = (id: string) => api.delete(`/artworks/${id}`)