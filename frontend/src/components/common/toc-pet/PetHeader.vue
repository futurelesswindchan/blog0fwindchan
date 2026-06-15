<!-- frontend/src/components/common/toc-pet/PetHeader.vue -->
<template>
  <div
    class="pet-header"
    @click="$emit('toggle-expand')"
    @mouseenter="$emit('update-hover', true)"
    @mouseleave="$emit('update-hover', false)"
  >
    <!-- 动态图标 -->
    <div class="pet-icon">
      <i class="fas" :class="currentIcon"></i>
    </div>

    <!-- 消息展示区：根据通道类型分发不同切换动画 -->
    <div class="pet-message-wrapper">
      <Transition :name="`msg-${activeChannel}`" mode="out-in">
        <span :key="displayMessage" class="pet-message">{{ displayMessage }}</span>
      </Transition>
    </div>

    <!-- 展开状态指示器 -->
    <div class="expand-indicator">
      <i class="fas fa-chevron-up" :class="{ 'rotate-180': isExpanded }"></i>
    </div>

    <!-- 假的关闭按钮 -->
    <button class="fake-close-btn" @click.stop="$emit('close-click', $event)" title="关闭">
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * TOC 宠物的头部常态展示组件。
 *
 * 负责渲染宠物当前的视觉状态（图标、文本台词），并提供鼠标悬浮探测、
 * 目录展开/收缩点击，以及触发宠物受惊的「假关闭按钮」入口。
 * 通过 activeChannel 接收当前消息通道标识，用于分发不同的切换动画。
 */
import type { MessageChannel } from '@/composables/toc-pet/types'

defineProps<{
  /** 依据宠物心情推导出的 FontAwesome 类名（如 'fa-bed'） */
  currentIcon: string
  /** 当前宠物说的话，或悬停状态下的交互提示语 */
  displayMessage: string
  /** 当前激活的消息通道标识，用于选择切换动画方案 */
  activeChannel: MessageChannel
  /** 侧边目录当前是否为展开状态 */
  isExpanded: boolean
}>()

defineEmits<{
  /** 用户点击头部面板，请求切换目录的展开/折叠 */
  (e: 'toggle-expand'): void
  /** 用户鼠标移入或移出组件区域 */
  (e: 'update-hover', isHovered: boolean): void
  /** 用户点击极其危险的关闭按钮，引发受惊机制 */
  (e: 'close-click', event: MouseEvent): void
}>()
</script>

<style scoped>
/* --- 头部常态区 --- */
.pet-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  position: relative;
  user-select: none;
  gap: 12px;
}

.pet-icon {
  font-size: 1.2rem;
  color: var(--accent-color, #3b82f6); /* 默认改用 info 蓝色 */
  flex-shrink: 0;
  padding-top: 2px;
  text-align: center;
  transition: color 0.3s ease;
}

.pet-message-wrapper {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--light-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pet-message {
  display: inline-block;
}

/* === 消息切换动画：按通道分发 === */

/* idle 通道：柔和滑动（轻松闲聊） */
.msg-idle-enter-active,
.msg-idle-leave-active {
  transition: all 0.3s ease;
}
.msg-idle-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.msg-idle-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  position: absolute;
}

/* interact 通道：轻快淡入（主动交互回应） */
.msg-interact-enter-active,
.msg-interact-leave-active {
  transition: all 0.25s ease-out;
}
.msg-interact-enter-from {
  opacity: 0;
  transform: translateX(8px);
}
.msg-interact-leave-to {
  opacity: 0;
  transform: translateX(-8px);
  position: absolute;
}

/* urgent 通道：模糊震动（紧急事件） */
.msg-urgent-enter-active {
  animation: urgent-shake 0.3s ease-out;
}
.msg-urgent-leave-active {
  transition: all 0.15s ease-in;
}
.msg-urgent-leave-to {
  opacity: 0;
  filter: blur(2px);
  position: absolute;
}

@keyframes urgent-shake {
  0% {
    opacity: 0;
    filter: blur(3px);
    transform: translateX(-4px);
  }
  25% {
    opacity: 0.6;
    filter: blur(1.5px);
    transform: translateX(3px);
  }
  50% {
    opacity: 0.8;
    filter: blur(1px);
    transform: translateX(-2px);
  }
  75% {
    filter: blur(0.5px);
    transform: translateX(1px);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateX(0);
  }
}

/* 展开指示器 */
.expand-indicator {
  font-size: 0.8rem;
  color: inherit;
  opacity: 0.5;
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.rotate-180 {
  transform: rotate(180deg);
}

/* 假关闭按钮 */
.fake-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;
  color: var(--light-text);
  opacity: 0.6;
  transition: opacity 0.2s, color 0.2s;
  margin-left: 4px;
}
.fake-close-btn:hover {
  opacity: 1;
  color: #ef4444;
}

/* 引入全局动态伪类控制 */
:global(.toc-pet-wrapper.typing .pet-icon) {
  color: #ff9a9e;
}
:global(.toc-pet-wrapper.shocked .pet-icon) {
  color: #ef4444;
}
</style>
