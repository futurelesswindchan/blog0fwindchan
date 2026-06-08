import api from './index'
import type { Friend } from '@/types/friend'

/**
 * 获取所有的“友人帐”（友链）列表。
 *
 * @returns 包含一组友链对象的响应
 */
export const getFriends = () => api.get('/friends')

/**
 * 添加一个新的友情链接。
 *
 * @param data 友链相关的详细配置
 * @returns 添加操作的响应结果
 */
export const addFriend = (data: Partial<Friend>) => api.post('/friends', data)

/**
 * 更新指定的友链信息。
 *
 * @param id 需更新友链的唯一标识符
 * @param data 新的字段配置
 * @returns 更新操作的响应结果
 */
export const updateFriend = (id: string, data: Partial<Friend>) => api.put(`/friends/${id}`, data)

/**
 * 根据 ID 删除特定的友情链接。
 *
 * @param id 需删除友链的唯一标识符
 * @returns 删除操作的结果响应
 */
export const deleteFriend = (id: string) => api.delete(`/friends/${id}`)