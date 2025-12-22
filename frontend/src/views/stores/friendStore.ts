import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api' // 引入封装好的 axios 实例

export interface Friend {
  id: string
  name: string
  desc: string
  url: string
  avatar: string
  tags: string[]
}

export const useFriendStore = defineStore('friend', () => {
  const friends = ref<Friend[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  // 获取列表 (保持用 fetch 或换成 api.get 都可以，这里统一换成 api.get 以保持一致)
  const fetchFriends = async () => {
    if (loaded.value) return
    loading.value = true
    try {
      const response = await api.get('/friends')
      friends.value = response.data.friends
      loaded.value = true
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
    }
  }

  // 新增友链
  const addFriend = async (friendData: Partial<Friend>) => {
    const response = await api.post('/friends', friendData)
    // 后端返回了新创建的对象，我们直接 push 到本地数组，省去一次刷新
    friends.value.push(response.data.friend)
  }

  // 更新友链
  const updateFriend = async (id: string, friendData: Partial<Friend>) => {
    const response = await api.put(`/friends/${id}`, friendData)
    // 更新本地数组中的那一项
    const index = friends.value.findIndex((f) => f.id === id)
    if (index !== -1) {
      friends.value[index] = response.data.friend
    }
  }

  // 删除友链
  const deleteFriend = async (id: string) => {
    await api.delete(`/friends/${id}`)
    // 从本地数组移除
    friends.value = friends.value.filter((f) => f.id !== id)
  }

  return {
    friends,
    loading,
    error,
    fetchFriends,
    addFriend,
    updateFriend,
    deleteFriend,
  }
})
