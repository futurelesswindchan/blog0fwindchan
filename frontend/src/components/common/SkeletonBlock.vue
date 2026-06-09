<!-- src/components/common/SkeletonBlock.vue -->
<template>
  <div
    class="skeleton-block"
    :class="{ 'skeleton-shimmer': animate }"
    :style="{
      width,
      height,
      borderRadius: radius,
    }"
  />
</template>

<script setup lang="ts">
interface Props {
  /** 宽度，支持任意 CSS 长度值 */
  width?: string
  /** 高度，支持任意 CSS 长度值 */
  height?: string
  /** 圆角，传 '50%' 可做圆形 */
  radius?: string
  /** 是否启用微光扫过动画 */
  animate?: boolean
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  radius: '6px',
  animate: true,
})
</script>

<style scoped>
.skeleton-block {
  background: rgba(128, 128, 128, 0.15);
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.25) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: shimmer 1.8s infinite ease-in-out;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 深色模式下微光稍暗一点，底色稍亮一点 */
:global(.dark-theme) .skeleton-block {
  background: rgba(255, 255, 255, 0.08);
}

:global(.dark-theme) .skeleton-shimmer::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.12) 50%,
    transparent 100%
  );
}
</style>
