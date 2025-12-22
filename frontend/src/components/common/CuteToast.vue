<template>
  <transition name="cute-fade">
    <div class="cute-toast" :class="type" v-if="visible" role="status" aria-live="polite">
      <div class="face">(￣▽￣)／</div>
      <div class="text">{{ message }}</div>
    </div>
  </transition>
</template>

<script setup lang="ts">
// 定义组件的 props
defineProps({
  message: { type: String, default: '已保存' },
  type: { type: String, default: 'success' },
  visible: { type: Boolean, default: true },
})
</script>

<style scoped>
.cute-toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 5.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.9rem;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(2, 12, 27, 0.12);
  font-weight: 600;
  color: #073b4c;
  backdrop-filter: blur(6px) saturate(1.1);
  z-index: 1100;
  max-width: 90%;
  white-space: nowrap;
}

.cute-toast .content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.cute-toast .face {
  font-size: 1.05rem;
  padding: 0.12rem 0.35rem;
  border-radius: 6px;
}

.cute-toast .text {
  font-size: 0.95rem;
}

.cute-toast.success {
  background: #e6f9f0;
  color: #064e3b;
}
.cute-toast.warn {
  background: #fff4e6;
  color: #663c00;
}
.cute-toast.error {
  background: #ffecec;
  color: #7f1d1d;
}

.dark-theme .cute-toast.success {
  background: #052e1f;
  color: #bff0d8;
}
.dark-theme .cute-toast.warn {
  background: #3a2b14;
  color: #ffe9b5;
}
.dark-theme .cute-toast.error {
  background: #3b0f0f;
  color: #ffc6c6;
}

.progress-wrap {
  height: 4px;
  width: 100%;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  margin-top: 8px;
  overflow: hidden;
}
.cute-toast.success .progress {
  background: rgba(6, 78, 59, 0.85);
}
.cute-toast.warn .progress {
  background: rgba(102, 60, 0, 0.85);
}
.cute-toast.error .progress {
  background: rgba(127, 29, 29, 0.85);
}
.dark-theme .cute-toast .progress {
  opacity: 0.9;
}

.progress {
  height: 100%;
  width: 100%;
  transform-origin: left;
}

@keyframes shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
