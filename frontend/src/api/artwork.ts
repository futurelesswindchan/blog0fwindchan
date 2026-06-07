import api from './index'

export const getArtworks = () => api.get('/artworks')
export const getArtworkById = (id: string) => api.get(`/artworks/${id}`)
export const addArtwork = (data: any) => api.post('/artworks', data)
export const updateArtwork = (id: string, data: any) => api.put(`/artworks/${id}`, data)
export const deleteArtwork = (id: string) => api.delete(`/artworks/${id}`)
