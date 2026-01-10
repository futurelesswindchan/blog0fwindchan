<template>
  <Teleport to="body">
    <!--动态绑定位置 class -->
    <div class="toast-container" :class="settingsStore.toast.position">
      <TransitionGroup name="toast-slide">
        <ToastItem v-for="toast in store.toasts" :key="toast.id" v-bind="toast" />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToastStore } from '@/views/stores/toastStore'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import ToastItem from './ToastItem.vue'

const store = useToastStore()
const settingsStore = useSettingsStore()
</script>

<style scoped>
.toast-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  pointer-events: none;
  gap: 12px;
}

/* --- 位置变体 --- */

/* 左下 (默认) */
.toast-container.bottom-left {
  bottom: 20px;
  left: 20px;
  flex-direction: column; /* 新消息在底部，旧消息往上顶 */
}

/* 右下 */
.toast-container.bottom-right {
  bottom: 20px;
  right: 20px;
  flex-direction: column;
  align-items: flex-end; /* 靠右对齐 */
}

/* 右上 */
.toast-container.top-right {
  top: 20px;
  right: 20px;
  flex-direction: column-reverse; /* 新消息在顶部，旧消息往下推 */
  align-items: flex-end;
}

/* 左上 */
.toast-container.top-left {
  top: 20px;
  left: 20px;
  flex-direction: column-reverse;
}

/* 动画定义 */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.toast-slide-move {
  transition: all 0.4s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.toast-slide-leave-active {
  position: absolute;
}
</style>
