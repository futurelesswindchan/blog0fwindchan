import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Friend {
  id: string
  name: string
  desc: string
  url: string
  avatar: string
  tags: string[]
}

// --- API 基地址 ---
// 直接使用相对路径，Vite 代理会自动处理
const API_BASE_URL = '/api'

// 好友链接数据存储
export const useFriendStore = defineStore('friend', () => {
  const friends = ref<Friend[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)
  let fetchPromise: Promise<void> | null = null

  const fetchFriends = async () => {
    if (loaded.value) return
    if (fetchPromise) return fetchPromise

    loading.value = true
    error.value = null

    fetchPromise = (async () => {
      try {
        console.log('📡 Fetching friends from API...')
        const response = await fetch(`${API_BASE_URL}/friends`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()
        // 后端返回的是 { friends: [...] } 结构
        friends.value = data.friends
        loaded.value = true
        console.log('✅ Friends fetched successfully.')
      } catch (err: unknown) {
        console.error('💥 Failed to load friends:', err)
        if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Failed to load friends'
        }
        friends.value = []
        loaded.value = false
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()

    return fetchPromise
  }

  return {
    friends,
    loading,
    error,
    loaded,
    fetchFriends,
  }
})
