import api from './index'
import type { Artwork } from '@/stores/artworkStore'

export const getArtworks = () => api.get('/artworks')
export const getArtworkById = (id: string) => api.get(`/artworks/${id}`)
export const addArtwork = (data: Partial<Artwork>) => api.post('/artworks', data)
export const updateArtwork = (id: string, data: Partial<Artwork>) => api.put(`/artworks/${id}`, data)
export const deleteArtwork = (id: string) => api.delete(`/artworks/${id}`)
