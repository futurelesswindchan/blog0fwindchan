import api from './index'
import type { PlanItem } from '@/types/activity'

export const getContributions = () => api.get('/contributions')
export const getPlans = () => api.get('/plans')
// 使用 Partial 允许部分字段更新/新增
export const addPlan = (data: Partial<PlanItem>) => api.post('/admin/plans', data)
export const updatePlan = (id: number, data: Partial<PlanItem>) => api.put(`/admin/plans/${id}`, data)
export const deletePlan = (id: number) => api.delete(`/admin/plans/${id}`)
export const reorderPlans = (data: { id: number; sort_order: number }[]) => api.put('/admin/plans/reorder', data)
