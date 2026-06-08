import api from './index'

/**
 * 获取所有的资产文件（例如图片）列表。
 *
 * @returns 包含资产文件信息的响应
 */
export const getAssets = () => api.get('/admin/assets')

/**
 * 上传一个新的资产文件（如图片）。
 *
 * @param formData 包含文件的 `FormData` 对象
 * @returns 上传操作的响应结果
 */
export const uploadAsset = (formData: FormData) => api.post('/upload', formData)

/**
 * 根据文件名删除指定的资产文件。
 *
 * @param filename 要删除的文件名
 * @returns 删除操作的结果响应
 */
export const deleteAsset = (filename: string) => api.delete('/admin/assets', { params: { filename } })