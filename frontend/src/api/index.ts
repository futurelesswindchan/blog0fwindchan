// src/api/index.ts

import axios from 'axios'
import { useAdminStore } from '@/views/stores/adminStore'

// 创建一个 Axios 实例
const api = axios.create({
  baseURL: '/api', // 基础 URL，所有请求都会自动带上 /api 前缀
})

// --- 1. 请求拦截器 ---
// 在每个请求发送之前，自动添加 Authorization Header
api.interceptors.request.use(
  (config) => {
    const adminStore = useAdminStore()

    // 判断当前请求是否是刷新 Token 的接口
    // 注意：根据你的后端路由，这里是 '/admin/refresh'
    // 也可以判断 config.url?.endsWith('/refresh')
    const isRefreshRequest = config.url?.includes('/refresh')

    // 只有当：
    // 1. 存在 access_token
    // 2. 并且不是刷新请求 (防止覆盖掉 store 里手动传的 refresh_token)
    if (adminStore.access_token && !isRefreshRequest) {
      config.headers['Authorization'] = `Bearer ${adminStore.access_token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// --- 2. 响应拦截器 ---
// 在收到响应后，处理 Token 过期等问题
api.interceptors.response.use(
  (response) => {
    // 响应成功，直接返回
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const adminStore = useAdminStore()

    // 如果是 401 错误，并且不是刷新接口本身的 401 (防止死循环)，且没有重试过
    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes('/refresh') && // 如果是刷新接口报错，直接跳过，不要再尝试刷新
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      try {
        // 调用 store 刷新 token
        const newAccessToken = await adminStore.refreshToken()

        // 更新默认 Header
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken

        // 更新当前请求的 Header
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken

        // 重发请求
        return api(originalRequest)
      } catch (refreshError) {
        // 刷新失败，登出
        adminStore.logout()
        // 使用 router 跳转而不是 window.location.href = ...，体验更好，除非为了彻底清除状态
        return Promise.reject(refreshError)
      }
    }

    // 其他错误，直接抛出
    return Promise.reject(error)
  },
)

export default api
