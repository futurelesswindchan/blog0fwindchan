import { defineStore } from 'pinia'
import { ref } from 'vue'

// --- 数据接口定义 ---
export interface Artwork {
  id: string // 后端的 id 是 int，但在 URL 里用 string 更通用
  title: string
  thumbnail: string
  fullsize: string
  description: string
  date: string
}

// --- API 基地址 ---
// 直接使用相对路径，Vite 代理会自动处理
const API_BASE_URL = '/api'

export const useArtworkStore = defineStore('artwork', () => {
  const artworks = ref<Artwork[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  // 使用 Promise 来防止并发请求的锁
  let fetchPromise: Promise<void> | null = null

  const fetchArtworks = async () => {
    if (loaded.value) return
    if (fetchPromise) return fetchPromise

    loading.value = true
    error.value = null

    fetchPromise = (async () => {
      try {
        console.log('📡 Fetching artworks from API...')
        const response = await fetch(`${API_BASE_URL}/artworks`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()
        // 后端返回的是 { artworks: [...] } 结构
        artworks.value = data.artworks
        loaded.value = true
        console.log('✅ Artworks fetched successfully.')
      } catch (err: unknown) {
        console.error('💥 Failed to load artworks:', err)
        if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Failed to load artworks'
        }
        // 请求失败要重置状态，允许下次重试
        artworks.value = []
        loaded.value = false
      } finally {
        loading.value = false
        // 请求完成，清除锁
        fetchPromise = null
      }
    })()

    // 返回 promise 以便调用者可以 await
    return fetchPromise
  }

  const reset = () => {
    artworks.value = []
    loading.value = false
    error.value = null
    loaded.value = false
    fetchPromise = null
  }

  return {
    artworks,
    loading,
    error,
    loaded,
    fetchArtworks,
    reset,
  }
})
