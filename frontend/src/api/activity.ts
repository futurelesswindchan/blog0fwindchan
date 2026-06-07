import api from './index'

export const getContributions = () => api.get('/contributions')
export const getPlans = () => api.get('/plans')
export const addPlan = (data: any) => api.post('/admin/plans', data)
export const updatePlan = (id: number, data: any) => api.put(`/admin/plans/${id}`, data)
export const deletePlan = (id: number) => api.delete(`/admin/plans/${id}`)
export const reorderPlans = (data: any[]) => api.put('/admin/plans/reorder', data)
