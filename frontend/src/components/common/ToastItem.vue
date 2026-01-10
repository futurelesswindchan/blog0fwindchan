<template>
  <div
    class="toast-item"
    :class="type"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
    role="alert"
  >
    <!-- 左侧装饰条/图标区 -->
    <div class="toast-icon">
      <i class="fas" :class="iconClass"></i>
    </div>

    <!-- 内容区 -->
    <div class="toast-content-wrapper">
      <div class="toast-content">
        <div v-if="title" class="toast-title">{{ title }}</div>
        <div class="toast-message">{{ message }}</div>
      </div>

      <!-- 操作按钮区域 -->
      <div v-if="showConfirm" class="toast-actions">
        <button class="action-btn cancel" @click.stop="handleCancel">
          {{ cancelText || '取消' }}
        </button>
        <button class="action-btn confirm" @click.stop="handleConfirm">
          {{ confirmText || '确定' }}
        </button>
      </div>
    </div>

    <!-- 关闭按钮 (视为取消) -->
    <button class="toast-close" @click="handleCancel">
      <i class="fas fa-times"></i>
    </button>

    <!-- 进度条 (仅当 duration > 0 时显示) -->
    <div class="progress-bar-bg" v-if="duration > 0">
      <div
        class="progress-bar"
        :style="{
          animationDuration: duration + 'ms',
          animationPlayState: isPaused ? 'paused' : 'running',
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useToastStore, type ToastType } from '@/views/stores/toastStore'

const props = defineProps<{
  id: number
  message: string
  title?: string
  type: ToastType
  duration: number
  // 新增 Props
  showConfirm?: boolean
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}>()

const store = useToastStore()
const isPaused = ref(false)
let timer: number | null = null
let startTime = 0
let remaining = props.duration

// 图标映射
const iconClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'fa-check-circle'
    case 'warning':
      return 'fa-exclamation-triangle'
    case 'error':
      return 'fa-times-circle'
    case 'info':
    default:
      return 'fa-info-circle'
  }
})

// 处理确定
const handleConfirm = () => {
  if (props.onConfirm) props.onConfirm()
  store.remove(props.id)
}

// 处理取消 (包括点击关闭按钮)
const handleCancel = () => {
  if (props.onCancel) props.onCancel()
  store.remove(props.id)
}

// 计时器逻辑 (仅当 duration > 0 时启用)
const startTimer = () => {
  if (props.duration <= 0) return

  startTime = Date.now()
  timer = window.setTimeout(() => {
    // 超时自动关闭视为取消
    handleCancel()
  }, remaining)
}

const pauseTimer = () => {
  if (props.duration <= 0) return
  isPaused.value = true
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  remaining -= Date.now() - startTime
}

const resumeTimer = () => {
  if (props.duration <= 0) return
  isPaused.value = false
  startTimer()
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.toast-item {
  position: relative;
  width: 340px;
  padding: 12px 16px;
  margin-top: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  overflow: hidden;
  pointer-events: auto;
  transition: all 0.3s ease;
  background-color: var(--dark-text);
  border-radius: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 颜色变体 */
.toast-item.success .toast-icon {
  color: #10b981;
}
.toast-item.warning .toast-icon {
  color: #f59e0b;
}
.toast-item.error .toast-icon {
  color: #ef4444;
}
.toast-item.info .toast-icon {
  color: #3b82f6;
}

.toast-icon {
  font-size: 1.2rem;
  padding-top: 2px;
  flex-shrink: 0;
}

.toast-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast-content {
  font-size: 0.9rem;
  line-height: 1.4;
}

.toast-title {
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--light-text);
}

.toast-message {
  color: var(--light-text);
  word-break: break-all;
}

/* 按钮区域样式 */
.toast-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
}

.action-btn {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-weight: 500;
}

/* 取消按钮：透明背景，浅色文字 */
.action-btn.cancel {
  background: rgba(255, 0, 0, 0.1);
  color: var(--light-text);
}
.action-btn.cancel:hover {
  background: rgba(255, 0, 0, 0.2);
  color: #ef4444;
}

/* 确定按钮：蓝色背景 (跟随 info 主题) */
.action-btn.confirm {
  background: #3b82f6;
  color: var(--dark-text);
}
.action-btn.confirm:hover {
  background: #2563eb;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

/* 关闭按钮 */
.toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;
  opacity: 0.6;
  transition: opacity 0.2s;
  margin-left: 4px;
  color: var(--light-text);
}

.toast-close:hover {
  opacity: 1;
  color: #ef4444;
}

/* 进度条 */
.progress-bar-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.05);
}

.progress-bar {
  height: 100%;
  background: currentColor;
  width: 100%;
  transform-origin: left;
  animation: progress-shrink linear forwards;
}

.toast-item.success .progress-bar {
  background: #10b981;
}
.toast-item.warning .progress-bar {
  background: #f59e0b;
}
.toast-item.error .progress-bar {
  background: #ef4444;
}
.toast-item.info .progress-bar {
  background: #3b82f6;
}

@keyframes progress-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
