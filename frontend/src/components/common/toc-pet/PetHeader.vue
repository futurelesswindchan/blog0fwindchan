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

    <!-- 消息展示区：使用过渡动画实现文本平滑切换 -->
    <div class="pet-message-wrapper">
      <Transition name="fade-slide" mode="out-in">
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
 */
defineProps<{
  /** 依据宠物心情推导出的 FontAwesome 类名（如 'fa-bed'） */
  currentIcon: string
  /** 当前宠物说的话，或悬停状态下的交互提示语 */
  displayMessage: string
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

/* 文本平滑过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  position: absolute;
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
