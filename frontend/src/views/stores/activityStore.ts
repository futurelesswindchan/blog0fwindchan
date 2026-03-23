import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/index'

/**
 * 每日贡献度数据接口。
 */
export interface ContributionDay {
  date: string
  count: number
}

/**
 * 计划项数据接口。
 */
export interface PlanItem {
  id: number
  content: string
  status: 'todo' | 'doing' | 'done'
  update_date: string
}

/**
 * 活动状态仓库，管理热力图贡献数据和近期计划。
 */
export const useActivityStore = defineStore('activity', () => {
  const contributions = ref<ContributionDay[]>([])
  const plans = ref<PlanItem[]>([])
  const isLoadingPlans = ref(false)

  /**
   * 从后端获取所有贡献度数据。
   *
   * @throws {Error} 请求失败时抛出异常。
   */
  const fetchContributions = async () => {
    try {
      const { data } = await api.get<ContributionDay[]>('/contributions')
      contributions.value = data
    } catch (error) {
      console.error('获取贡献数据失败:', error)
    }
  }

  /**
   * 从后端获取计划看板数据。
   *
   * @throws {Error} 请求失败时抛出异常。
   */
  const fetchPlans = async () => {
    try {
      isLoadingPlans.value = true
      const { data } = await api.get<PlanItem[]>('/plans')
      plans.value = data
    } catch (error) {
      console.error('获取计划数据失败:', error)
    } finally {
      isLoadingPlans.value = false
    }
  }

  /**
   * 新增一条计划事项。
   *
   * @param payload - 包含计划内容与状态的数据载荷。
   */
  const addPlan = async (payload: { content: string; status?: string }) => {
    await api.post('/admin/plans', payload)
  }

  /**
   * 更新指定的计划事项。
   *
   * @param id - 计划的唯一标识符。
   * @param payload - 包含更新后内容与状态的数据载荷。
   */
  const updatePlan = async (id: number, payload: { content: string; status: string }) => {
    await api.put(`/admin/plans/${id}`, payload)
  }

  /**
   * 删除指定的计划事项。
   *
   * @param id - 计划的唯一标识符。
   */
  const deletePlan = async (id: number) => {
    await api.delete(`/admin/plans/${id}`)
  }

  return {
    contributions,
    plans,
    isLoadingPlans,
    fetchContributions,
    fetchPlans,
    addPlan,
    updatePlan,
    deletePlan,
  }
})
