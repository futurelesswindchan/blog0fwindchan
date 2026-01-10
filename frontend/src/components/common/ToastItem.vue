<!-- frontend\src\components\common\ToastItem.vue -->
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
    <div class="toast-content">
      <div v-if="title" class="toast-title">{{ title }}</div>
      <div class="toast-message">{{ message }}</div>
    </div>

    <!-- 关闭按钮 -->
    <button class="toast-close" @click="handleClose">
      <i class="fas fa-times"></i>
    </button>

    <!-- 进度条 -->
    <div class="progress-bar-bg">
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

// 关闭逻辑
const handleClose = () => {
  store.remove(props.id)
}

// 开始计时
const startTimer = () => {
  startTime = Date.now()
  timer = window.setTimeout(() => {
    handleClose()
  }, remaining)
}

// 暂停
const pauseTimer = () => {
  isPaused.value = true
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  remaining -= Date.now() - startTime
}

// 恢复
const resumeTimer = () => {
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
  width: 320px;
  padding: 12px 16px;
  margin-top: 12px; /* 间距 */
  display: flex;
  align-items: flex-start; /* 顶部对齐，适应多行文字 */
  gap: 12px;
  overflow: hidden; /* 裁剪进度条 */
  pointer-events: auto; /* 允许点击 */
  transition: all 0.3s ease;
  background-color: var(--dark-text);
  border-radius: 2px;
}

/* 颜色变体 (图标颜色) */
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

/* 图标 */
.toast-icon {
  font-size: 1.2rem;
  padding-top: 2px; /* 视觉微调 */
  flex-shrink: 0;
}

/* 内容 */
.toast-content {
  flex: 1;
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

/* 关闭按钮 */
.toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1.5rem;
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
  background: currentColor; /* 使用当前文字颜色，或者指定颜色 */
  width: 100%;
  transform-origin: left;
  animation: progress-shrink linear forwards;
}

/* 进度条颜色跟随类型 */
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
