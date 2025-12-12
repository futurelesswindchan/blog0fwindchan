import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api' // 引入 api

export interface Artwork {
  id: string
  title: string
  thumbnail: string
  fullsize: string
  description: string
  date: string
}

export const useArtworkStore = defineStore('artwork', () => {
  const artworks = ref<Artwork[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  const fetchArtworks = async () => {
    if (loaded.value) return
    loading.value = true
    try {
      const response = await api.get('/artworks')
      artworks.value = response.data.artworks
      loaded.value = true
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
    }
  }

  // 新增作品
  const addArtwork = async (workData: Partial<Artwork>) => {
    const response = await api.post('/artworks', workData)
    artworks.value.push(response.data.artwork)
  }

  // 更新作品
  const updateArtwork = async (id: string, workData: Partial<Artwork>) => {
    const response = await api.put(`/artworks/${id}`, workData)
    const index = artworks.value.findIndex((w) => w.id === id)
    if (index !== -1) {
      artworks.value[index] = response.data.artwork
    }
  }

  // 删除作品
  const deleteArtwork = async (id: string) => {
    await api.delete(`/artworks/${id}`)
    artworks.value = artworks.value.filter((w) => w.id !== id)
  }

  return {
    artworks,
    loading,
    error,
    fetchArtworks,
    addArtwork,
    updateArtwork,
    deleteArtwork,
  }
})
