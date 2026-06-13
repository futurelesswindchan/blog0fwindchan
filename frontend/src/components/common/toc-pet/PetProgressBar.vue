<!-- frontend/src/components/common/toc-pet/PetProgressBar.vue -->
<template>
  <div class="pet-progress-bar" :class="{ 'is-typing': isTypingMode }">
    <div class="progress-fill" :style="{ width: `${globalProgress}%` }"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 伴随底部的二合一进度条组件。
 *
 * 承担双重职责：
 * 1. 在文章生成时（isTypingMode=true）：作为生成进度条（粉红色系），展示流式读取状态。
 * 2. 在正常阅读时：作为滚动阅读进度条（蓝色/青色系），展示页面被视察的深度。
 */
defineProps<{
  /** 标识当前是否处在流式打字机阅读模式中，会改变进度条的主题色调与动画曲线 */
  isTypingMode: boolean
  /** 全局进度百分比数值（0 ~ 100），可能是生成进度或滚动进度 */
  globalProgress: number
}>()
</script>

<style scoped>
/* --- 二合一进度条 (保留原有赛博配色) --- */
.pet-progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(128, 128, 128, 0.2);
  margin-top: auto;
}
.progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 0 6px rgba(79, 172, 254, 0.4);
  transition:
    width 0.15s ease-out,
    background 0.8s ease,
    box-shadow 0.8s ease;
}
.pet-progress-bar.is-typing .progress-fill {
  background: linear-gradient(90deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
  box-shadow: 0 0 8px rgba(255, 154, 158, 0.5);
  transition: width 1s linear;
}

/* 暗黑模式发光特效保留 */
:global(.dark-theme .pet-progress-bar) {
  background: rgba(128, 128, 128, 0.2);
}
:global(.dark-theme .progress-fill) {
  background: linear-gradient(90deg, #00cdac 0%, #8ddad5 100%);
  box-shadow: 0 0 10px rgba(0, 205, 172, 0.6);
}
:global(.dark-theme .pet-progress-bar.is-typing .progress-fill) {
  background: linear-gradient(90deg, #b122e5 0%, #ff63de 100%);
  box-shadow: 0 0 15px rgba(255, 99, 222, 0.8);
}
</style>
