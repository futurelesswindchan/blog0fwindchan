<!-- frontend/src/components/common/ArticleTocPet.vue -->
<template>
  <Teleport to="body">
    <!-- 基础容器：固定在右下角 -->
    <Transition appear name="pet-appear">
      <div
        class="toc-pet-wrapper"
        :class="[currentMood, { 'is-expanded': isExpanded }]"
        v-show="true"
        :style="{ bottom: `${20 + dodgeOffset}px` }"
      >
        <!-- 1. 宠物头部（常态展示区） -->
        <div
          class="pet-header"
          @click="toggleExpand"
          @mouseenter="isHovered = true"
          @mouseleave="isHovered = false"
        >
          <!-- 动态图标 -->
          <div class="pet-icon" :class="{ 'shake-animation': currentMood === 'shocked' }">
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
          <button
            class="fake-close-btn"
            @click.stop="triggerShock"
            :disabled="currentMood === 'shocked'"
            title="关闭"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 2. TOC 目录折叠区 -->
        <!-- 使用 CSS transition 控制高度展开 -->
        <div class="toc-body" :class="{ show: isExpanded }">
          <TransitionGroup
            name="toc-slide"
            tag="ul"
            class="toc-list"
            v-if="visibleTocItems && visibleTocItems.length > 0"
          >
            <li
              v-for="item in visibleTocItems"
              :key="item.id"
              class="toc-item"
              :style="{ paddingLeft: `${(item.level - 1) * 12}px` }"
              @click="scrollToAnchor(item.id)"
            >
              {{ item.text }}
            </li>
          </TransitionGroup>

          <div v-else class="toc-empty">
            {{ isTypingMode ? '正在扫描章节结构 哔哔哔...' : '这里光秃秃的，没有找到目录项呢...' }}
          </div>
        </div>

        <!-- 3. 二合一全局进度条 -->
        <div class="pet-progress-bar" :class="{ 'is-typing': isTypingMode }">
          <div class="progress-fill" :style="{ width: `${globalProgress}%` }"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useReadingProgress } from '@/composables/useReadingProgress'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useToastStore } from '@/views/stores/toastStore'
import { useTocPet } from '@/composables/useTocPet'
import { computed } from 'vue'

import type { TocItem } from '@/composables/useArticleInfo'

/**
 * 组件属性定义
 * @property {TocItem[]} tocItems - 从外部文章解析器传入的目录树数据
 */
interface Props {
  tocItems: TocItem[]
}

// --- 组件属性接收 ---
const props = defineProps<Props>()

// --- Store 与全局状态 ---
const toastStore = useToastStore()
const settingsStore = useSettingsStore()

// 引入宠物状态机与全局进度条状态
const {
  currentMood,
  isExpanded,
  isHovered,
  currentIcon,
  displayMessage,
  triggerShock,
  toggleExpand,
} = useTocPet()

const { globalProgress, isTypingMode, unlockedHeadingIds } = useReadingProgress()

/**
 * 计算属性：根据打字机模式动态过滤目录项
 * @returns {TocItem[]} 可见的目录项列表
 * @description 在打字机模式下，只显示已解锁的标题；非打字机模式下显示全部目录项。
 */
const visibleTocItems = computed(() => {
  // 如果不在打字机模式（瞬间展示/打字完毕），就直接返回全量目录
  if (!isTypingMode.value) return props.tocItems

  // 否则，只返回被探照灯扫过（已解锁）的标题
  return props.tocItems.filter((item: TocItem) => unlockedHeadingIds.value.has(item.id))
})

/**
 * 滚动至指定锚点
 * @param {string} id - 目标 DOM 元素的 ID
 * @description 点击目录项后平滑定位至对应标题区域。
 */
const scrollToAnchor = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    // 预留 80px 的顶部安全区，防止标题被固定头部遮挡
    const y = element.getBoundingClientRect().top + window.scrollY - 120
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

/**
 * 躲避吐司的动态偏移量计算
 * @description 监听全局吐司数量，当吐司出现在右下角时，自动计算向上躲闪的 translateY 距离。
 */
const dodgeOffset = computed(() => {
  // 只有当吐司设置在右下角时，才需要躲避哦
  if (settingsStore.toast.position !== 'bottom-right') return 0

  const toastCount = toastStore.toasts.length
  if (toastCount === 0) return 0

  // 每个吐司平均高度 + gap 约 76px，再额外加 12px 作为和小精灵的呼吸间距
  return toastCount * 76 + 12
})
</script>

<style scoped>
/* --- 基础悬浮容器 (伪装成 Toast awa) --- */
.toc-pet-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 340px;
  z-index: 9990;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* 注入 Toast 灵魂样式 */
  background-color: var(--dark-text);
  color: var(--light-text);
  border-radius: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  /* 统一使用 Toast 的缓动曲线 */
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

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
  transition:
    opacity 0.2s,
    color 0.2s;
  margin-left: 4px;
}
.fake-close-btn:hover {
  opacity: 1;
  color: #ef4444;
}

/* --- 动态情绪样式 --- */
.toc-pet-wrapper.typing .pet-icon {
  color: #ff9a9e;
}
.toc-pet-wrapper.shocked .pet-icon {
  color: #ef4444;
}
.toc-pet-wrapper.shocked .pet-message-wrapper {
  color: #ef4444;
  font-weight: bold;
}

/* 震惊抖动动画 */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px) rotate(-5deg);
  }
  75% {
    transform: translateX(4px) rotate(5deg);
  }
}
.shake-animation {
  animation: shake 0.4s ease-in-out infinite;
}

/* --- TOC 目录区 --- */
.toc-body {
  max-height: 0;
  opacity: 0;
  overflow-y: auto;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); /* 对齐曲线 */
}
.toc-body.show {
  max-height: 400px;
  opacity: 1;
  /* 因为背景是深色了，分隔线需要调淡一点 */
  border-top: 1px solid rgba(39, 36, 36, 0.2);
  padding: 8px 0;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  padding: 6px 16px;
  font-size: 0.85rem;
  color: var(--light-text);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toc-item:hover {
  background: rgba(128, 128, 128, 0.15); /* 适配深色底的悬浮态 */
  color: var(--accent-color, #3b82f6);
}

.toc-empty {
  padding: 16px;
  font-size: 0.85rem;
  color: inherit;
  opacity: 0.6;
  text-align: center;
}

/* --- 二合一进度条 (保留原有赛博配色) --- */
.pet-progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(128, 128, 128, 0.2); /* 换成适配 Toast 底色的轨道颜色 */
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
.dark-theme .pet-progress-bar {
  background: rgba(128, 128, 128, 0.2);
}
.dark-theme .progress-fill {
  background: linear-gradient(90deg, #00cdac 0%, #8ddad5 100%);
  box-shadow: 0 0 10px rgba(0, 205, 172, 0.6);
}
.dark-theme .pet-progress-bar.is-typing .progress-fill {
  background: linear-gradient(90deg, #b122e5 0%, #ff63de 100%);
  box-shadow: 0 0 15px rgba(255, 99, 222, 0.8);
}

/* --- TOC 迷雾开图滑入动画 --- */
.toc-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); /* 统一曲线 */
}
.toc-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.toc-slide-leave-active {
  transition: all 0.3s ease;
}
.toc-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* --- TOC 全局入场/离场动画 --- */
.pet-appear-enter-active,
.pet-appear-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.pet-appear-enter-from,
.pet-appear-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
</style>
