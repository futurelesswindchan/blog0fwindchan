import api from './index'

export const getSponsors = () => api.get('/sponsors')
export const addSponsor = (data: any) => api.post('/sponsors', data)
export const updateSponsor = (id: number, data: any) => api.put(`/sponsors/${id}`, data)
export const deleteSponsor = (id: number) => api.delete(`/sponsors/${id}`)
