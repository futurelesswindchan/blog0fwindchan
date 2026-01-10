<!-- frontend\src\components\common\ToastManager.vue -->

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast-slide">
        <ToastItem v-for="toast in store.toasts" :key="toast.id" v-bind="toast" />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToastStore } from '@/views/stores/toastStore'
import ToastItem from './ToastItem.vue'

const store = useToastStore()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 9999;
  display: flex;
  /* 反转列方向，使得 DOM 中后面的元素（新 push 的）显示在视觉上的上方 */
  flex-direction: column-reverse;
  pointer-events: none; /* 容器不阻挡点击，子元素单独开启 pointer-events */
}

/* 动画定义：左入右出 */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 列表排序移动时的平滑动画 */
.toast-slide-move {
  transition: all 0.4s ease;
}

/* 进入前状态：向左偏移且透明 */
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-50px) scale(0.9);
}

/* 往左缩回去 */
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

/* 离开时脱离文档流，确保 move 动画生效 */
.toast-slide-leave-active {
  position: absolute;
}
</style>
