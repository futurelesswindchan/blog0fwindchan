<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content asset-modal">
        <div class="modal-header">
          <h3>文章素材库</h3>
          <button class="close-btn" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 工具栏：上传区 -->
        <div class="asset-toolbar">
          <button class="upload-btn" @click="triggerUpload" :disabled="uploading">
            <i class="fas" :class="uploading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'"></i>
            <span>{{ uploading ? '上传中...' : '上传新图片' }}</span>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileChange"
          />
          <span class="hint">点击图片即可插入到文章</span>
        </div>

        <!-- 图片网格 -->
        <div class="asset-grid-wrapper">
          <div v-if="loading" class="loading-state">加载中...</div>
          <div v-else-if="assets.length === 0" class="empty-state">暂无素材，快去上传吧~</div>

          <div v-else class="asset-grid">
            <div
              v-for="asset in assets"
              :key="asset.url"
              class="asset-item"
              @click="selectAsset(asset)"
            >
              <!-- ✨ 新增：删除按钮 -->
              <!-- @click.stop 阻止冒泡，防止触发 selectAsset -->
              <div class="delete-btn" @click.stop="deleteAsset(asset)" title="删除这张图片">
                <i class="fas fa-trash"></i>
              </div>

              <div class="img-box">
                <img :src="asset.url" loading="lazy" />
              </div>
              <div class="asset-meta">
                <span class="asset-date">{{ asset.date.split(' ')[0] }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api'

interface Asset {
  name: string
  url: string
  date: string
}

const emit = defineEmits(['close', 'select'])

const assets = ref<Asset[]>([])
const loading = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const fetchAssets = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/assets')
    assets.value = res.data.assets
  } catch (e) {
    console.error('加载素材失败', e)
    alert('素材库加载失败')
  } finally {
    loading.value = false
  }
}

const triggerUpload = () => {
  fileInput.value?.click()
}

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
  } catch (error) {
    alert('上传失败')
    console.error(error)
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const selectAsset = (asset: Asset) => {
  emit('select', asset.url)
  emit('close')
}

// ✨ 新增：删除逻辑
const deleteAsset = async (asset: Asset) => {
  if (!confirm(`确定要永久删除这张图片吗？\n此操作不可恢复。`)) {
    return
  }

  try {
    // 使用 params 传递 query string
    await api.delete('/admin/assets', {
      params: { filename: asset.name },
    })
    // 删除成功后刷新列表
    await fetchAssets()
  } catch (e) {
    console.error('删除失败', e)
    alert('删除失败，请检查控制台')
  }
}

onMounted(() => {
  fetchAssets()
})
</script>

<style scoped>
/* ...保留之前的样式... */
.asset-modal {
  width: 800px;
  max-width: 90vw;
  height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
}

.asset-toolbar {
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  gap: 15px;
}

.upload-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}
.upload-btn:hover {
  background: #2563eb;
}
.upload-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.hint {
  font-size: 0.85rem;
  color: #888;
}

.asset-grid-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.asset-item {
  position: relative; /* ✨ 为了定位删除按钮 */
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #f5f5f5;
}

.asset-item:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* ✨ 新增：删除按钮样式 */
.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444; /* 红色 */
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.2s;
  z-index: 10;
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
}

/* 鼠标悬停在卡片上时显示删除按钮 */
.asset-item:hover .delete-btn {
  opacity: 1;
}

.img-box {
  height: 100px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-meta {
  padding: 4px 8px;
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  background: white;
}

/* 暗色模式适配 */
.dark-theme .asset-modal {
  background: rgba(30, 30, 30, 0.95);
  color: #eee;
}
.dark-theme .asset-item {
  background: #2a2a2a;
}
.dark-theme .asset-meta {
  background: #333;
  color: #aaa;
}
.dark-theme .delete-btn {
  background: rgba(0, 0, 0, 0.8);
}
.dark-theme .delete-btn:hover {
  background: #ef4444;
}
</style>
