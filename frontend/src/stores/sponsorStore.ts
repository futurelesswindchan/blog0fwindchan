// frontend/src/views/stores/sponsorStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/index'

/**
 * 投喂感谢数据接口。
 */
export interface Sponsor {
  id: number
  name: string
  avatar?: string
  url?: string
  message?: string
  date: string
}

/**
 * 投喂感谢状态仓库。
 */
export const useSponsorStore = defineStore('sponsor', () => {
  const sponsors = ref<Sponsor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 从后端获取所有投喂感谢数据。
   */
  const fetchSponsors = async () => {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<{ sponsors: Sponsor[] }>('/sponsors')
      sponsors.value = data.sponsors || []
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = '获取投喂数据失败'
      }
      console.error('💥 Failed to load sponsors:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 新增一条投喂感谢记录。
   *
   * @param payload - 包含投喂者信息的数据载荷。
   * @throws {Error} 请求失败时抛出异常。
   */
  const addSponsor = async (payload: Omit<Sponsor, 'id' | 'date'> & { date?: string }) => {
    await api.post('/sponsors', payload)
  }

  /**
   * 更新指定的投喂感谢记录。
   *
   * @param id - 投喂记录的唯一标识符。
   * @param payload - 包含更新后投喂信息的数据载荷。
   * @throws {Error} 请求失败时抛出异常。
   */
  const updateSponsor = async (id: number, payload: Partial<Sponsor>) => {
    await api.put(`/sponsors/${id}`, payload)
  }

  /**
   * 删除指定的投喂感谢记录。
   *
   * @param id - 投喂记录的唯一标识符。
   * @throws {Error} 请求失败时抛出异常。
   */
  const deleteSponsor = async (id: number) => {
    await api.delete(`/sponsors/${id}`)
  }

  return {
    sponsors,
    loading,
    error,
    fetchSponsors,
    addSponsor,
    updateSponsor,
    deleteSponsor,
  }
})
