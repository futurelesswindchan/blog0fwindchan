<!-- src/components/admin/ImageUploader.vue -->
<template>
  <div class="image-uploader">
    <label v-if="label" class="uploader-label">{{ label }}</label>

    <!-- 状态 1: 已有图片 (显示预览) -->
    <div v-if="modelValue" class="preview-container">
      <img :src="modelValue" alt="Preview" class="preview-image" />
      <div class="overlay">
        <button type="button" class="remove-btn" @click="handleRemove">
          <i class="fas fa-trash"></i> 删除
        </button>
      </div>
    </div>

    <!-- 状态 2: 上传中 -->
    <div v-else-if="uploading" class="upload-box uploading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>上传中...</span>
    </div>

    <!-- 状态 3: 等待上传 (显示点击框) -->
    <div v-else class="upload-box" @click="triggerSelect">
      <i class="fas fa-cloud-upload-alt"></i>
      <span>点击上传图片</span>
      <!-- 隐藏的文件输入框 -->
      <input
        ref="fileInput"
        type="file"
        accept="image/png, image/jpeg, image/gif, image/webp"
        style="display: none"
        @change="handleFileChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { ref } from 'vue'

import api from '@/api'

const { notify } = useToast()

defineProps<{
  modelValue: string
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

// 触发文件选择
const triggerSelect = () => {
  fileInput.value?.click()
}

// 处理文件选择与上传
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 简单校验
  if (!file.type.startsWith('image/')) {
    notify({
      type: 'error',
      title: '大笨蛋！这传的是什么哇！(＃°Д°)',
      message: '请上传图片文件啦！是图片，不是奇奇怪怪的东西哦！',
    })
    return
  }

  uploading.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    // 定义后端返回的数据结构
    const response = await api.post<{ url: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.data.url) {
      emit('update:modelValue', response.data.url)
    }
  } catch (err: unknown) {
    notify({
      type: 'error',
      title: '图片上传失败了呢！(；´д｀)ゞ',
      message: `${err}`,
    })
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

// 删除图片
const handleRemove = () => {
  emit('update:modelValue', '')
}
</script>

<style scoped>
.image-uploader {
  margin-bottom: 1rem;
}

.uploader-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-size: 0.95rem;
  color: var(--text-color);
}

/* 上传框样式 */
.upload-box {
  width: 100%;
  height: 160px;
  border: 2px dashed rgba(0, 119, 255, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
  color: #666;
  gap: 0.5rem;
}

.dark-theme .upload-box {
  border-color: rgba(255, 255, 255, 0.2);
  color: #aaa;
}

.upload-box:hover {
  border-color: var(--accent-color);
  background: rgba(0, 119, 255, 0.05);
  color: var(--accent-color);
}

.upload-box i {
  font-size: 2rem;
}

/* 预览区域样式 */
.preview-container {
  position: relative;
  width: 100%;
  height: 200px; /* 固定高度，或者根据需要调整 */
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保持比例完整显示，背景留白 */
  background: rgba(0, 0, 0, 0.05);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.preview-container:hover .overlay {
  opacity: 1;
}

.remove-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.remove-btn:hover {
  background: #ff7875;
}

.error-msg {
  color: #ff4d4f;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
</style>
