<!-- src/components/common/BaseModal.vue -->
<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click.self="handleBackdropClick">
      <div class="modal-window" :style="{ width, height }">
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>

        <!-- 内容插槽 -->
        <slot></slot>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

const props = defineProps<{
  show: boolean
  width?: string
  height?: string
}>()

const emit = defineEmits(['close'])

const handleBackdropClick = () => {
  emit('close')
}

// --- 滚动锁定逻辑 ---
const toggleBodyScroll = (isLocked: boolean) => {
  if (isLocked) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// 监听 show 变化
watch(
  () => props.show,
  (val) => {
    toggleBodyScroll(val)
  },
)

// 组件销毁时确保解锁（防止异常关闭导致页面卡死）
onUnmounted(() => {
  toggleBodyScroll(false)
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 确保遮罩层本身不滚动，但如果内容溢出视口，可以在这里处理（通常由 window 处理） */
  overflow: hidden;
}

.modal-window {
  position: relative;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);

  /* 关键：限制最大宽高，防止溢出屏幕 */
  max-width: 95vw;
  max-height: 90vh;
}

.dark-theme .modal-window {
  background: rgba(30, 30, 30, 0.85);
  border-color: rgba(255, 255, 255, 0.05);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-color);
}
.dark-theme .close-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #ddd;
}

.close-btn:hover {
  background: #ff5f56;
  color: white;
  transform: rotate(90deg);
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-window,
.modal-fade-leave-to .modal-window {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>

<!-- 全局模态框 UI 库 -->
<style>
/* 1. 主按钮 */
.modal-btn-primary {
  padding: 0.6rem 1.5rem;
  background: var(--accent-color, #0077ff);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(0, 119, 255, 0.2);
}

.modal-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 119, 255, 0.3);
  filter: brightness(1.1);
}

.modal-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 2. 文本按钮 */
.modal-btn-text {
  padding: 0.6rem 1.2rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  font-weight: 500;
  transition: all 0.2s;
}

.dark-theme .modal-btn-text {
  color: #aaa;
}

.modal-btn-text:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}
.dark-theme .modal-btn-text:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 3. 危险按钮 */
.modal-btn-danger {
  padding: 0.6rem 1.5rem;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.modal-btn-danger:hover {
  background: #ff6b81;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}

/* 4. 通用输入框 */
.modal-input {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
  color: var(--text-color);
  outline: none;
  transition: all 0.2s;
}

.dark-theme .modal-input {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
  color: #eee;
}

.modal-input:focus {
  border-color: var(--accent-color);
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 119, 255, 0.1);
}
.dark-theme .modal-input:focus {
  background: rgba(0, 0, 0, 0.4);
}

/* 5. 标签页导航 */
.modal-nav-pill {
  padding: 0.4rem 1rem;
  border-radius: 8px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dark-theme .modal-nav-pill {
  background: rgba(255, 255, 255, 0.05);
}

.modal-nav-pill:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-nav-pill.active {
  background: #0077ff;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 119, 255, 0.25);
}

/* 6. 开关 */
.toggle-switch {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: #e0e0e0;
  border: none;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch .toggle-knob {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active {
  background: var(--accent-color, #0077ff);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(22px);
}

.dark-theme .toggle-switch {
  background: #444;
}

/* 7. 下拉选择框 */
select {
  appearance: none; /* 移除默认箭头 */
  -webkit-appearance: none;
  padding: 8px 36px 8px 12px; /* 右侧留出箭头空间 */
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  font-size: 0.9rem;
  color: var(--text-color);
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;

  /* 自定义箭头图标 (使用SVG) */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

select:hover {
  background-color: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.2);
}

select:focus {
  border-color: var(--accent-color);
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(0, 119, 255, 0.15);
}
</style>
