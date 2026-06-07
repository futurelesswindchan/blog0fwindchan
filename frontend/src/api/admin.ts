import api from './index'

export const login = (data: any) => api.post('/admin/login', data)
export const refreshToken = (token: string) => api.post('/admin/refresh', {}, { headers: { Authorization: `Bearer ${token}` } })
