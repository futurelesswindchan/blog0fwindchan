<!-- src/components/admin/AssetLibraryModal.vue -->
<template>
  <BaseModal
    :show="modalStore.showAssetLibrary"
    width="850px"
    height="700px"
    @close="modalStore.closeAssetLibrary"
  >
    <div class="asset-layout">
      <!-- 顶部工具栏 -->
      <div class="asset-header">
        <div class="header-left">
          <h3>素材中心</h3>
          <p class="asset-hint">
            <span class="info">点击图片即可插入文章。</span>
            <span class="warning">删除前请确认图片未被引用！</span>
          </p>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="asset-content">
        <div v-if="loading" class="state-box">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>加载素材中...</p>
        </div>
        <div v-else-if="assets.length === 0" class="state-box">
          <i class="fas fa-box-open fa-3x"></i>
          <p>空空如也，快去上传一张吧~</p>
        </div>

        <div v-else class="asset-grid">
          <div
            v-for="asset in assets"
            :key="asset.url"
            class="asset-card"
            @click="handleSelect(asset)"
          >
            <div class="img-wrapper">
              <img :src="asset.url" loading="lazy" />
              <!-- 新增：悬停遮罩层 -->
              <div class="hover-overlay">
                <i class="fas fa-plus-circle"></i>
                <span>插入</span>
              </div>
            </div>

            <div class="card-actions">
              <button class="btn-icon delete" @click.stop="deleteAsset(asset)" title="永久删除">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>

            <div class="asset-info">
              <span class="date">{{ asset.date.split(' ')[0] }}</span>
              <span class="name-truncate" :title="asset.name">{{ asset.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar-actions">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleFileChange"
        />
        <!-- 使用全局样式 modal-btn-primary -->
        <button class="modal-btn-primary" @click="triggerUpload" :disabled="uploading">
          <i class="fas" :class="uploading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'"></i>
          {{ uploading ? '正在上传...' : '上传新素材' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { AxiosError } from 'axios'
import { useToast } from '@/composables/useToast'

import BaseModal from '../common/BaseModal.vue'
import api from '@/api'

const { notify, confirm } = useToast()

interface Asset {
  name: string
  url: string
  date: string
}

const modalStore = useGlobalModalStore()
const assets = ref<Asset[]>([])
const loading = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

watch(
  () => modalStore.showAssetLibrary,
  (val) => {
    if (val) fetchAssets()
  },
)

const fetchAssets = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/assets')
    assets.value = res.data.assets
  } catch (e) {
    const err = e as AxiosError<{ error?: string }>

    notify({
      type: 'error',
      title: '素材加载失败了(＃°Д°)！',
      message: `无法获取素材列表：${err.response?.data.error || err.message}`,
    })
  } finally {
    loading.value = false
  }
}

const triggerUpload = () => fileInput.value?.click()

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploading.value = true
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'article')

  try {
    await api.post('/upload', formData)
    await fetchAssets()

    notify({
      type: 'success',
      message: '图片上传成功ヾ(•ω•`)o',
    })
  } catch (error: unknown) {
    const err = error as AxiosError<{ error?: string }>

    let title = ''
    let message = ''

    if (err.response?.data.error === 'File type not allowed') {
      title = '大笨蛋！这传的是什么哇！(＃°Д°)'
      message = '请上传图片文件啦！是图片，不是奇奇怪怪的东西哦！'
    } else {
      title = '坏消息！图片上传失败了哦...'
      message = `${err.response?.data.error || err.message}`
    }

    notify({
      type: 'error',
      title: title,
      message: message,
    })
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const handleSelect = (asset: Asset) => {
  modalStore.handleAssetSelect(asset.url)
}

const deleteAsset = async (asset: Asset) => {
  const isConfirmed = await confirm(
    '如果某些文章中正在使用此图片，将会导致图片无法显示！',
    `真的真的要删除图片 "${asset.name}" 吗？`,
  )

  if (!isConfirmed) return

  try {
    await api.delete('/admin/assets', { params: { filename: asset.name } })
    await fetchAssets()

    notify({
      type: 'success',
      message: '图片已经从库里移除了哦',
    })
  } catch (e: unknown) {
    const err = e as AxiosError<{ error?: string }>

    notify({
      type: 'error',
      title: '呜呜呜...图片删除失败了QAQ!',
      message: `${err.response?.data.error || err.message}`,
    })
  }
}
</script>

<style scoped>
.asset-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.asset-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.5);
}

.header-left h3 {
  margin: 0 0 0.3rem 0;
  color: var(--accent-color);
  font-size: 1.2rem;
}

.asset-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.asset-hint .info {
  color: #339af0;
}
.asset-hint .warning {
  color: #ff9f43;
}

.asset-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f8f9fa;
}
.dark-theme .asset-content {
  background: #1a1a1a;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  gap: 1rem;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.2rem;
}

/* --- 卡片样式优化 --- */
.asset-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 5px solid transparent;
}
.dark-theme .asset-card {
  background: #2a2a2a;
}

.asset-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  border-color: #0077ff;
}

.img-wrapper {
  height: 120px;
  width: 100%;
  position: relative;
  background: #eee;
  overflow: hidden;
}
.img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.asset-card:hover .img-wrapper img {
  transform: scale(1.1); /* 图片微放大 */
}

/* 悬停遮罩层 */
.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  backdrop-filter: blur(2px);
}
.asset-card:hover .hover-overlay {
  opacity: 1;
}
.hover-overlay i {
  font-size: 1.5rem;
  margin-bottom: 4px;
}
.hover-overlay span {
  font-size: 0.9rem;
  font-weight: bold;
}

/* 信息栏 */
.asset-info {
  padding: 8px 10px;
  font-size: 0.8rem;
  color: #666;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
.dark-theme .asset-info {
  background: #2a2a2a;
  color: #aaa;
  border-top-color: rgba(255, 255, 255, 0.05);
}

.name-truncate {
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 删除按钮优化 */
.card-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 10;
}

.btn-icon.delete {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  color: #ff4757;
  border: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.asset-card:hover .btn-icon.delete {
  opacity: 1;
  transform: scale(1);
}

.btn-icon.delete:hover {
  background: #ff4757;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(255, 71, 87, 0.4);
}

.toolbar-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
  background: rgba(255, 255, 255, 0.5);
}

.toolbar-actions .modal-btn-primary {
  margin: 0 auto;
}
</style>
