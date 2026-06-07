import api from './index'
import type { Sponsor } from '@/types/sponsor'

export const getSponsors = () => api.get('/sponsors')
export const addSponsor = (data: Partial<Sponsor>) => api.post('/sponsors', data)
export const updateSponsor = (id: number, data: Partial<Sponsor>) => api.put(`/sponsors/${id}`, data)
export const deleteSponsor = (id: number) => api.delete(`/sponsors/${id}`)
