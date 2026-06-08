import api from './index'

/**
 * 管理员登录获取认证凭证。
 *
 * @param data 包含用户名和密码等登录凭据的字典
 * @returns 包含 Access Token 和 Refresh Token 的响应
 */
export const login = (data: Record<string, string>) => api.post('/admin/login', data)

/**
 * 使用 Refresh Token 刷新 Access Token，实现无感登录状态续期。
 * 
 * @param token 用于续签的刷新令牌 (Refresh Token)，不可错传为 Access Token
 * @returns 包含全新 Access Token 的响应
 */
export const refreshToken = (token: string) => api.post('/admin/refresh', {}, { headers: { Authorization: `Bearer ${token}` } })