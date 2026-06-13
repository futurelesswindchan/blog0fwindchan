<!-- frontend/src/components/common/toc-pet/PetTocBody.vue -->
<template>
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
        :class="{ 'is-active': activeHeadingId === item.id }"
        :style="{ paddingLeft: `${(item.level - 1) * 12}px` }"
        @click="$emit('scroll-to', item.id)"
      >
        {{ item.text }}
      </li>
    </TransitionGroup>

    <div v-else class="toc-empty">
      {{ isTypingMode ? '正在扫描章节结构 哔哔哔...' : '这里光秃秃的，没有找到目录项呢...' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TocItem } from '@/composables/useArticleInfo'

/**
 * 侧边目录的主体列表组件。
 *
 * 渲染文章结构的层级目录树。在打字机模式下，配合探照灯逻辑呈现“迷雾开图”的效果；
 * 在常规阅读下则显示完整目录，并根据滚动位置高亮当前聚焦的章节。
 */
defineProps<{
  /** 侧边目录当前是否应该显示（控制折叠区） */
  isExpanded: boolean
  /** 当前文章是否正处于「逐字打字机」生成模式中 */
  isTypingMode: boolean
  /** 需要渲染给用户看的目录项数组（打字机模式下会动态增加） */
  visibleTocItems: TocItem[]
  /** 处于屏幕黄金阅读区内的标题 ID，用于判定高亮激活态 */
  activeHeadingId: string
}>()

defineEmits<{
  /** 用户点击某个章节目录，请求平滑滚动到该锚点 */
  (e: 'scroll-to', id: string): void
}>()
</script>

<style scoped>
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
  border-top: 1px solid rgba(39, 36, 36, 0.2);
  padding: 8px 0;
}

.toc-list {
  list-style: none;
  padding: 0 8px;
  margin: 0;
}

.toc-item {
  position: relative;
  padding: 6px 16px;
  font-size: 0.85rem;
  color: var(--light-text);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 高亮状态样式 */
.toc-item.is-active {
  color: #4facfe;
  background: rgba(79, 172, 254, 0.1);
  font-weight: bold;
}
/* 高亮状态左侧的光剑特效 */
.toc-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 0 8px rgba(79, 172, 254, 0.6);
  border-radius: 0 2px 2px 0;
}

.toc-item:hover {
  background: rgba(128, 128, 128, 0.15);
  color: var(--accent-color, #3b82f6);
}

.toc-empty {
  padding: 16px;
  font-size: 0.85rem;
  color: inherit;
  opacity: 0.6;
  text-align: center;
}

/* --- TOC 迷雾开图滑入动画 --- */
.toc-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
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
</style>
