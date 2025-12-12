<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>{{ isEdit ? '编辑友链' : '新增友链' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>名称 *</label>
          <input v-model="form.name" required placeholder="大佬的名字" />
        </div>

        <div class="form-group">
          <label>链接 *</label>
          <input v-model="form.url" required placeholder="https://..." />
        </div>

        <ImageUploader v-model="form.avatar" label="头像" />

        <div class="form-group">
          <label>描述</label>
          <input v-model="form.desc" placeholder="一句话介绍" />
        </div>

        <div class="form-group">
          <label>标签 (用逗号分隔)</label>
          <input v-model="tagsInput" placeholder="技术, 宅, 游戏" />
        </div>

        <div class="btn-row">
          <button type="button" @click="$emit('close')">取消提交</button>
          <button type="submit" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交友链' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

import type { Friend } from '@/views/stores/friendStore'

import ImageUploader from '@/components/admin/ImageUploader.vue'

import '@/styles/AdminModals.css'

const props = defineProps<{
  friend?: Friend | null // 如果有值则是编辑模式
}>()

const emit = defineEmits(['close', 'submit'])

const isEdit = !!props.friend
const submitting = ref(false)

const form = reactive({
  name: '',
  url: '',
  avatar: '',
  desc: '',
})
const tagsInput = ref('')

onMounted(() => {
  if (props.friend) {
    form.name = props.friend.name
    form.url = props.friend.url
    form.avatar = props.friend.avatar
    form.desc = props.friend.desc
    tagsInput.value = (props.friend.tags || []).join(', ')
  }
})

const handleSubmit = async () => {
  submitting.value = true
  try {
    const tags = tagsInput.value
      .split(/[,，]/) // 支持中英文逗号
      .map((t) => t.trim())
      .filter((t) => t)

    const payload = { ...form, tags }
    await emit('submit', payload)
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
