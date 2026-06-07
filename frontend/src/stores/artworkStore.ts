// src/views/stores/artworkStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getArtworks, getArtworkById, addArtwork, updateArtwork, deleteArtwork } from '@/api/artwork' // 保持使用封装好的 axios 实例，以便处理 JWT

export interface Artwork {
  id: string
  title: string
  thumbnail: string
  fullsize: string
  description: string
  date: string
}

export const useArtworkStore = defineStore('artwork', () => {
  // --- State ---
  const artworks = ref<Artwork[]>([])
  // 新增：存储当前选中的作品详情 (与 articleStore 对齐)
  const currentArtwork = ref<Artwork | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)
  // 标记列表是否已加载，避免重复请求
  const loaded = ref(false)

  // --- Getters ---
  // 新增：通过 ID 获取列表中的作品 (同步获取，不发请求)
  const getArtworkById = computed(() => (id: string) => {
    return artworks.value.find((w) => w.id === id)
  })

  // --- Actions ---

  /**
   * 1. 获取作品列表
   * 对应 articleStore 的 fetchArticleIndex
   */
  const fetchArtworks = async (forceRefresh = false) => {
    // 缓存策略：如果已加载且不强制刷新，则直接返回
    if (loaded.value && artworks.value.length > 0 && !forceRefresh) {
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('📡 Fetching artworks list...')
      const response = await api.get('/artworks')

      // 假设后端返回结构为 { artworks: [...] }
      artworks.value = response.data.artworks
      loaded.value = true
      console.log(`✅ Artworks list fetched successfully. Count: ${artworks.value.length}`)
    } catch (err: unknown) {
      console.error('💥 Failed to load artworks:', err)
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Failed to load artworks'
      }
      // 请求失败重置状态
      artworks.value = []
      loaded.value = false
    } finally {
      loading.value = false
    }
  }

  /**
   * 2. 获取单幅作品详情
   * 对应 articleStore 的 fetchArticle
   * 虽然列表里可能有数据，但有时需要单独拉取最新详情
   */
  const fetchArtworkDetail = async (id: string) => {
    // 如果当前 store 里已经是这个作品，就不重复请求
    if (currentArtwork.value && currentArtwork.value.id === id) {
      return
    }

    loading.value = true
    currentArtwork.value = null // 先清空，避免闪烁
    error.value = null

    try {
      console.log(`📡 Fetching artwork detail: ${id}...`)

      // 优先尝试从本地列表中查找（如果列表已加载）
      const localArtwork = artworks.value.find((w) => w.id === id)
      if (localArtwork) {
        console.log('✅ Found artwork in local cache.')
        currentArtwork.value = localArtwork
        loading.value = false
        return
      }

      // 如果本地没有，则请求后端接口
      const response = await api.get(`/artworks/${id}`)
      currentArtwork.value = response.data.artwork
      console.log(`✅ Artwork '${id}' loaded successfully.`)
    } catch (err: unknown) {
      console.error(`💥 Failed to load artwork [${id}]:`, err)
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Unknown error'
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 3. 新增作品
   */
  const addArtwork = async (workData: Partial<Artwork>) => {
    loading.value = true
    try {
      console.log('📡 Adding new artwork...')
      const response = await addArtwork(workData)
      const newArtwork = response.data.artwork

      // 更新本地列表
      artworks.value.push(newArtwork)
      console.log('✅ Artwork added successfully.')
      return newArtwork
    } catch (err) {
      console.error('💥 Failed to add artwork:', err)
      throw err // 抛出错误供 UI 层处理 (比如显示 Toast)
    } finally {
      loading.value = false
    }
  }

  /**
   * 4. 更新作品
   */
  const updateArtwork = async (id: string, workData: Partial<Artwork>) => {
    loading.value = true
    try {
      console.log(`📡 Updating artwork: ${id}...`)
      const response = await updateArtwork(id, workData)
      const updatedArtwork = response.data.artwork

      // 更新列表中的数据
      const index = artworks.value.findIndex((w) => w.id === id)
      if (index !== -1) {
        artworks.value[index] = updatedArtwork
      }

      // 如果当前正看着这张图，也同步更新
      if (currentArtwork.value && currentArtwork.value.id === id) {
        currentArtwork.value = updatedArtwork
      }

      console.log('✅ Artwork updated successfully.')
    } catch (err) {
      console.error(`💥 Failed to update artwork [${id}]:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 5. 删除作品
   */
  const deleteArtwork = async (id: string) => {
    loading.value = true
    try {
      console.log(`📡 Deleting artwork: ${id}...`)
      await deleteArtwork(id)

      // 从本地列表移除
      artworks.value = artworks.value.filter((w) => w.id !== id)

      // 如果删除的是当前选中的，清空选中状态
      if (currentArtwork.value && currentArtwork.value.id === id) {
        currentArtwork.value = null
      }

      console.log('✅ Artwork deleted successfully.')
    } catch (err) {
      console.error(`💥 Failed to delete artwork [${id}]:`, err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    artworks,
    currentArtwork,
    loading,
    error,

    // Getters
    getArtworkById,

    // Actions
    fetchArtworks,
    fetchArtworkDetail,
    addArtwork,
    updateArtwork,
    deleteArtwork,
  }
})

})
