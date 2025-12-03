// src/api/index.ts

import axios from 'axios'
import { useAdminStore } from '@/views/stores/adminStore' // 引入 admin store

// 创建一个 Axios 实例
const api = axios.create({
  baseURL: '/api', // 基础 URL，所有请求都会自动带上 /api 前缀
})

// --- 1. 请求拦截器 ---
// 在每个请求发送之前，自动添加 Authorization Header
api.interceptors.request.use(
  (config) => {
    const adminStore = useAdminStore()
    if (adminStore.access_token) {
      config.headers['Authorization'] = `Bearer ${adminStore.access_token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// --- 2. 响应拦截器 (精髓所在) ---
// 在收到响应后，处理 Token 过期等问题
api.interceptors.response.use(
  (response) => {
    // 响应成功，直接返回
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const adminStore = useAdminStore()

    // 如果是 401 错误，并且我们还没有尝试过刷新 Token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true // 标记我们已经尝试过一次，防止死循环

      try {
        // 调用 store 里的方法去刷新 token
        const newAccessToken = await adminStore.refreshToken()

        // 更新 Axios 实例的默认 Header
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken

        // 更新原始请求的 Header
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken

        // 重新发送原始请求
        return api(originalRequest)
      } catch (refreshError) {
        // 如果刷新 Token 也失败了，说明身份彻底过期，强制登出
        adminStore.logout()
        // 跳转到登录页，并带上当前页面的路径，方便登录后跳回
        window.location.href = `/admin/login?redirect=${window.location.pathname}`
        return Promise.reject(refreshError)
      }
    }

    // 其他错误，直接抛出
    return Promise.reject(error)
  },
)

export default api
