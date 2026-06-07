import api from './index'

export const getAssets = () => api.get('/admin/assets')
export const uploadAsset = (formData: FormData) => api.post('/upload', formData)
export const deleteAsset = (filename: string) => api.delete('/admin/assets', { params: { filename } })
