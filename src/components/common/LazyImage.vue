<template>
  <div class="lazy-image-container" ref="containerRef" :style="containerStyle">
    <img
      :src="currentSrc"
      :alt="alt"
      :class="[className, { loaded: isLoaded }]"
      @load="onLoad"
      @error="onError"
    />
    <div v-if="!isLoaded && !hasError" class="loading-placeholder">
      <div class="loading-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
    </div>
    <div v-if="hasError" class="error-placeholder">
      <i class="fas fa-image"></i>
      <span>加载中喵</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { CSSProperties } from 'vue'

const props = defineProps<{
  src: string
  alt?: string
  className?: string
  containerStyle?: CSSProperties
}>()

const containerRef = ref<HTMLElement | null>(null)
const currentSrc = ref('')
const isLoaded = ref(false)
const hasError = ref(false)
let observer: IntersectionObserver | null = null
let retryCount = 0
const MAX_RETRIES = 3

const onLoad = () => {
  requestAnimationFrame(() => {
    isLoaded.value = true
    hasError.value = false
  })
}

const onError = () => {
  hasError.value = true
  if (retryCount < MAX_RETRIES) {
    retryCount++
    setTimeout(() => {
      // 重试加载
      currentSrc.value = props.src + '?retry=' + retryCount
    }, 1000 * retryCount)
  }
}

const setupIntersectionObserver = () => {
  if (!containerRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        const img = new Image()
        img.onload = () => {
          currentSrc.value = props.src
        }
        img.onerror = onError
        img.src = props.src
        observer?.disconnect()
        observer = null
      }
    },
    {
      rootMargin: '100px',
      threshold: 0,
    },
  )

  observer.observe(containerRef.value)
}

onMounted(() => {
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
  will-change: opacity;
  backface-visibility: hidden;
}

img {
  opacity: 0;
  transition: opacity 0.3s ease;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

img.loaded {
  opacity: 1;
}

.loading-placeholder,
.error-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  gap: 0.5rem;
}

.loading-spinner i,
.error-placeholder i {
  font-size: 2rem;
  color: var(--accent-color);
  opacity: 0.6; /* 降低不透明度 */
}

.error-placeholder {
  color: var(--accent-color); /* 使用主题色替换红色 */
  background: rgba(255, 255, 255, 0.1); /* 添加柔和背景 */
  backdrop-filter: blur(2px);
}

.error-placeholder i {
  margin-bottom: 0.3rem;
}

.error-placeholder span {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 深色主题适配 */
.dark-theme .error-placeholder {
  background: rgba(0, 0, 0, 0.1);
}
</style>
