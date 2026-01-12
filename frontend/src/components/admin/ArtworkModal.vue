<!-- src/components/admin/ArtworkModal.vue -->
<template>
  <BaseModal
    :show="modalStore.showArtworkModal"
    width="700px"
    height="auto"
    @close="modalStore.closeArtworkModal"
  >
    <div class="modal-layout">
      <!-- 1. 头部 -->
      <div class="modal-header">
        <h3>{{ isEdit ? '修缮画作' : '收录新作' }}</h3>
      </div>

      <!-- 2. 滚动区域 -->
      <div class="modal-scroll-area">
        <form id="artwork-form" @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" required placeholder="作品标题" class="modal-input" />
          </div>

          <!-- 图片上传组件 -->
          <div class="form-row">
            <div class="col">
              <ImageUploader v-model="form.fullsize" label="原图 (点击上传)" />
            </div>
            <div class="col">
              <ImageUploader v-model="form.thumbnail" label="缩略图 (可选)" />
            </div>
          </div>

          <div class="form-group">
            <label>描述</label>
            <!-- 结合 modal-input 和自定义 textarea 样式 -->
            <textarea
              v-model="form.description"
              rows="4"
              class="modal-input modal-textarea"
              placeholder="关于这幅作品的故事..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>创作日期</label>
            <input type="date" v-model="form.date" class="modal-input" />
          </div>
        </form>
      </div>

      <!-- 3. 底部 -->
      <div class="modal-footer">
        <button type="button" class="modal-btn-text" @click="CancleSubmit">放弃</button>
        <button type="submit" form="artwork-form" class="modal-btn-primary" :disabled="submitting">
          {{ submitting ? '上传中...' : '确认收录' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useArtworkStore } from '@/views/stores/artworkStore'
import { useToast } from '@/composables/useToast'

import BaseModal from '../common/BaseModal.vue'
import ImageUploader from '@/components/admin/ImageUploader.vue'

const modalStore = useGlobalModalStore()
const artworkStore = useArtworkStore()

const { notify, confirm } = useToast()

const submitting = ref(false)
const isEdit = computed(() => !!modalStore.editingArtwork)

const form = reactive({
  title: '',
  thumbnail: '',
  fullsize: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
})

watch(
  () => modalStore.editingArtwork,
  (newVal) => {
    if (newVal) {
      form.title = newVal.title
      form.thumbnail = newVal.thumbnail
      form.fullsize = newVal.fullsize
      form.description = newVal.description || ''
      form.date = newVal.date
    } else {
      form.title = ''
      form.thumbnail = ''
      form.fullsize = ''
      form.description = ''
      form.date = new Date().toISOString().split('T')[0]
    }
  },
  { immediate: true },
)

const CancleSubmit = async () => {
  const isConfirmed = await confirm(
    '正在编辑中的绘画作品将不会被保存哦！',
    '真的确定要直接离开吗0w0？',
  )
  if (isConfirmed) {
    modalStore.closeArtworkModal()

    notify({
      message: '已离开画廊编辑器啦(￣▽￣)ノ',
      type: 'success',
    })
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const payload = { ...form }
    if (isEdit.value && modalStore.editingArtwork) {
      await artworkStore.updateArtwork(modalStore.editingArtwork.id, payload)
    } else {
      await artworkStore.addArtwork(payload)
    }
    await artworkStore.fetchArtworks()
    modalStore.closeArtworkModal()

    notify({
      type: 'success',
      message: '已成功保存对画廊的更改哦！OvO',
    })
  } catch (e) {
    // console.error(e)
    // alert('操作失败')
    notify({
      type: 'error',
      title: '操作失败了呢…>_<',
      message: `${e}`,
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* 布局容器 */
.modal-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 85vh;
}

/* 头部 */
.modal-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}
.modal-header h3 {
  margin: 0;
  color: var(--accent-color);
  font-size: 1.5rem;
}

/* 滚动区域 */
.modal-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

/* 表单样式 */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.required {
  color: #ff4757;
  margin-left: 4px;
}

/* 并排布局 (图片上传) */
.form-row {
  display: flex;
  gap: 1rem;
}
.col {
  flex: 1;
}

/* 文本域特殊样式 */
.modal-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.5;
}

/* 底部 */
.modal-footer {
  padding: 1rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}
</style>
