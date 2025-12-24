<!-- frontend\src\components\admin\FriendModal.vue -->
<template>
  <Teleport to="body">
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
  </Teleport>
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
