import api from './index'

export const login = (data: Record<string, string>) => api.post('/admin/login', data)
export const refreshToken = (token: string) => api.post('/admin/refresh', {}, { headers: { Authorization: `Bearer ${token}` } })
