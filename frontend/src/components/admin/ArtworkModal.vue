<!-- frontend\src\components\admin\ArtworkModal.vue -->
<template>
  <Teleport to="body">
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
  </Teleport>
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
