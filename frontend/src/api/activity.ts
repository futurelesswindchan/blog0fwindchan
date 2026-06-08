import api from './index'
import type { PlanItem } from '@/types/activity'

/**
 * 获取历史贡献热力图数据。
 *
 * @returns 包含贡献图表数据的响应
 */
export const getContributions = () => api.get('/contributions')

/**
 * 获取所有计划板数据的列表。
 *
 * @returns 包含所有计划项的响应
 */
export const getPlans = () => api.get('/plans')

/**
 * 新增一条工作/学习计划。
 *
 * @param data 新增的计划项数据（使用 Partial 允许部分字段更新/新增）
 * @returns 包含新增成功的计划信息的响应
 */
export const addPlan = (data: Partial<PlanItem>) => api.post('/admin/plans', data)

/**
 * 更新指定的计划项信息。
 *
 * @param id 计划项的唯一数值 ID
 * @param data 需要更新的字段数据
 * @returns 更新操作的结果响应
 */
export const updatePlan = (id: number, data: Partial<PlanItem>) => api.put(`/admin/plans/${id}`, data)

/**
 * 根据 ID 删除对应的计划项。
 *
 * @param id 需要删除的计划项的唯一数值 ID
 * @returns 删除操作的结果响应
 */
export const deletePlan = (id: number) => api.delete(`/admin/plans/${id}`)

/**
 * 批量更新计划列表的排序。
 *
 * @param data 包含 id 与最新 sort_order 对应关系的数组
 * @returns 重新排序操作的结果响应
 */
export const reorderPlans = (data: { id: number; sort_order: number }[]) => api.put('/admin/plans/reorder', data)