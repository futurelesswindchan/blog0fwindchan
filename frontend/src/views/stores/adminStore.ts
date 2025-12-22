// src/views/stores/adminStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

export const useAdminStore = defineStore('admin', () => {
  const router = useRouter()
  // 从 localStorage 初始化 token
  const access_token = ref<string | null>(localStorage.getItem('access_token'))
  const refresh_token = ref<string | null>(localStorage.getItem('refresh_token'))

  const isAuthenticated = computed(() => !!access_token.value)

  // 登录
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/admin/login', { username, password })

      // 后端成功返回了 access_token 和 refresh_token
      access_token.value = response.data.access_token
      refresh_token.value = response.data.refresh_token

      // 将 token 存储到 localStorage 以实现持久化
      localStorage.setItem('access_token', access_token.value!)
      localStorage.setItem('refresh_token', refresh_token.value!)

      return true
    } catch (e) {
      console.error('登录失败:', e)
      return false
    }
  }

  // 刷新 Token
  const refreshToken = async (): Promise<string> => {
    try {
      const response = await api.post(
        '/admin/refresh',
        {},
        {
          headers: {
            // 刷新接口需要携带 refresh_token
            Authorization: `Bearer ${refresh_token.value}`,
          },
        },
      )

      // 更新 access_token
      access_token.value = response.data.access_token
      localStorage.setItem('access_token', access_token.value!)

      return access_token.value!
    } catch (e) {
      console.error('Token 刷新失败:', e)
      // 如果刷新失败，则应该登出
      logout()
      throw e
    }
  }

  // 登出
  const logout = () => {
    // 立即清空内存中的状态
    access_token.value = null
    refresh_token.value = null

    // 清空 localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    // 跳转到登录页，确保应用状态完全重置
    router.push({ name: 'AdminLogin' })
    // 这里可以根据需要，选择是否通知后端将 token 加入黑名单
  }

  return {
    access_token,
    refresh_token,
    isAuthenticated,
    login,
    logout,
    refreshToken,
  }
})
