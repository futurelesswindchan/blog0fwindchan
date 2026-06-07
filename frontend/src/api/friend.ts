import api from './index'
import type { Friend } from '@/types/friend'

export const getFriends = () => api.get('/friends')
export const addFriend = (data: Partial<Friend>) => api.post('/friends', data)
export const updateFriend = (id: string, data: Partial<Friend>) => api.put(`/friends/${id}`, data)
export const deleteFriend = (id: string) => api.delete(`/friends/${id}`)
