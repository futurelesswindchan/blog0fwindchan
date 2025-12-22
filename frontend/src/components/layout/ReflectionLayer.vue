<template>
  <div class="reflection-layer">
    <div class="reflection-content">
      <div class="reflection-mask header-mask"></div>
      <!-- 只在桌面端渲染 nav-mask -->
      <div v-if="!isMobile" class="reflection-mask nav-mask"></div>
      <div class="reflection-mask content-mask"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 检测是否为移动设备
const isMobile = ref(false)
const checkDevice = () => {
  isMobile.value = window.innerWidth < 768
}

// 初始化检测
onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
})
onUnmounted(() => {
  window.removeEventListener('resize', checkDevice)
})

// 用于存储各个区域的位置信息
const updateMaskPositions = () => {
  const padding = 4
  const header = document.querySelector('.title-bar, .mobile-header')
  const nav = !isMobile.value ? document.querySelector('.nav-panel') : null
  const content = document.querySelector('.content-view')
  // 计算并设置 CSS 变量
  if (header) {
    const rect = header.getBoundingClientRect()
    document.documentElement.style.setProperty(
      '--header-clip',
      `polygon(${rect.left + padding}px ${rect.top + padding}px,
              ${rect.right - padding}px ${rect.top + padding}px,
              ${rect.right - padding}px ${rect.bottom - padding}px,
              ${rect.left + padding}px ${rect.bottom - padding}px)`,
    )
  }

  // 只在桌面端计算 nav
  if (nav) {
    const rect = nav.getBoundingClientRect()
    document.documentElement.style.setProperty(
      '--nav-clip',
      `polygon(${rect.left + padding}px ${rect.top + padding}px,
              ${rect.right - padding}px ${rect.top + padding}px,
              ${rect.right - padding}px ${rect.bottom - padding}px,
              ${rect.left + padding}px ${rect.bottom - padding}px)`,
    )
  } else {
    // 移动端移除 nav 相关变量
    document.documentElement.style.removeProperty('--nav-clip')
  }

  // 内容区
  if (content) {
    const rect = content.getBoundingClientRect()
    document.documentElement.style.setProperty(
      '--content-clip',
      `polygon(${rect.left + padding}px ${rect.top + padding}px,
              ${rect.right - padding}px ${rect.top + padding}px,
              ${rect.right - padding}px ${rect.bottom - padding}px,
              ${rect.left + padding}px ${rect.bottom - padding}px)`,
    )
  }
}
// 监听元素大小变化以更新遮罩位置
let resizeObserver: ResizeObserver | null = null

// 初始化时更新位置并添加监听
onMounted(() => {
  updateMaskPositions()
  window.addEventListener('scroll', updateMaskPositions, { passive: true })
  window.addEventListener('resize', updateMaskPositions)

  resizeObserver = new ResizeObserver(updateMaskPositions)
  const elements = document.querySelectorAll(
    '.title-bar, .mobile-header, .nav-panel, .content-view',
  )
  elements.forEach((el) => resizeObserver?.observe(el))
})

// 清理监听器
onUnmounted(() => {
  window.removeEventListener('scroll', updateMaskPositions)
  window.removeEventListener('resize', updateMaskPositions)
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.reflection-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.reflection-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.reflection-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: none;
}

/* 标题栏反光遮罩 */
.header-mask {
  clip-path: var(--header-clip, none);
  will-change: clip-path;
  background: var(--reflection-gradients);
}

/* 导航栏反光遮罩 */
.nav-mask {
  clip-path: var(--nav-clip, none);
  will-change: clip-path;
  background: var(--reflection-gradients);
}

/* 内容区反光遮罩 */
.content-mask {
  clip-path: var(--content-clip, none);
  will-change: clip-path;
  background: var(--reflection-gradients);
}

.reflection-mask::before,
.reflection-mask::after {
  background: none;
}
</style>
