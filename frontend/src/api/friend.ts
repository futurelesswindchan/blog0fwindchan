import api from './index'

export const getFriends = () => api.get('/friends')
export const addFriend = (data: any) => api.post('/friends', data)
export const updateFriend = (id: string, data: any) => api.put(`/friends/${id}`, data)
export const deleteFriend = (id: string) => api.delete(`/friends/${id}`)
