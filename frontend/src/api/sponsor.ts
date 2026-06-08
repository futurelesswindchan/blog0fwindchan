import api from './index'
import type { Sponsor } from '@/types/sponsor'

/**
 * 获取所有赞助者列表。
 *
 * @returns 包含所有赞助者记录的响应
 */
export const getSponsors = () => api.get('/sponsors')

/**
 * 添加一个新的赞助者。
 *
 * @param data 赞助者的完整或部分配置信息
 * @returns 包含新增的赞助者响应记录
 */
export const addSponsor = (data: Partial<Sponsor>) => api.post('/sponsors', data)

/**
 * 更新现有赞助者的信息。
 *
 * @param id 要更新的赞助者的数字 ID
 * @param data 需要更改的信息属性
 * @returns 更新成功后的响应
 */
export const updateSponsor = (id: number, data: Partial<Sponsor>) => api.put(`/sponsors/${id}`, data)

/**
 * 删除指定的赞助者记录。
 *
 * @param id 要删除的赞助者的数字 ID
 * @returns 删除执行状态
 */
export const deleteSponsor = (id: number) => api.delete(`/sponsors/${id}`)