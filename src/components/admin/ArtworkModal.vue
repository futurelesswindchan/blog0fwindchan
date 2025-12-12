<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>{{ isEdit ? '编辑作品' : '新增作品' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>标题</label>
          <input v-model="form.title" placeholder="作品标题" />
        </div>

        <ImageUploader v-model="form.fullsize" label="原图" />

        <ImageUploader v-model="form.thumbnail" label="缩略图" />

        <div class="form-group">
          <label>描述</label>
          <textarea v-model="form.description" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label>日期</label>
          <input type="date" v-model="form.date" />
        </div>

        <div class="btn-row">
          <button type="button" @click="$emit('close')">取消提交</button>
          <button type="submit" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交作品' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

import type { Artwork } from '@/views/stores/artworkStore'

import ImageUploader from '@/components/admin/ImageUploader.vue'

import '@/styles/AdminModals.css'

const props = defineProps<{
  artwork?: Artwork | null
}>()

const emit = defineEmits(['close', 'submit'])

const isEdit = !!props.artwork
const submitting = ref(false)

const form = reactive({
  title: '',
  thumbnail: '',
  fullsize: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
})

onMounted(() => {
  if (props.artwork) {
    form.title = props.artwork.title
    form.thumbnail = props.artwork.thumbnail
    form.fullsize = props.artwork.fullsize
    form.description = props.artwork.description
    form.date = props.artwork.date
  }
})

const handleSubmit = async () => {
  submitting.value = true
  try {
    await emit('submit', { ...form })
    emit('close')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* 简单的弹窗样式，稍后在 Dashboard 里统一优化 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  width: 90%;
  max-width: 500px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
}
.dark-theme .modal-content {
  background: rgba(30, 30, 30, 0.9);
  color: white;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
button {
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  border: none;
}
.submit-btn {
  background: var(--accent-color, #0077ff);
  color: white;
}
.cancel-btn {
  background: #eee;
}
</style>
