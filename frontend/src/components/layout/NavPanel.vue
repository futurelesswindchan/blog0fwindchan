<!-- frontend\src\components\layout\NavPanel.vue -->
<template>
  <nav
    class="nav-panel glass-container"
    :class="{ expanded: isExpanded }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <button class="toggle-btn" @click="$emit('toggle')">
      <i class="fas" :class="toggleIcon"></i>
    </button>

    <div class="nav-items">
      <!-- 1. 常规导航 -->
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :exact="item.exact"
        :exact-active-class="item.exact ? 'router-link-exact-active' : ''"
        :active-class="item.exact ? '' : 'router-link-active'"
        :class="{
          active: item.matchPrefix && $route.path.startsWith(item.path),
        }"
      >
        <!-- 统一使用 icon 类容器包裹 -->
        <div class="icon-container">
          <font-awesome-icon :icon="item.iconType" fixed-width />
        </div>
        <span v-show="isExpanded">{{ item.label }}</span>
      </router-link>

      <!-- 2. 设置按钮 -->
      <button class="nav-item settings-btn" @click="modalStore.openSettings()">
        <div class="icon-container">
          <i class="fas fa-cog"></i>
        </div>
        <span v-show="isExpanded">设置界面</span>
      </button>

      <!-- 3. 主题按钮 -->
      <button
        class="nav-item theme-toggle"
        :style="themeButtonStyle"
        @click="$emit('toggle-theme')"
        type="button"
      >
        <div class="icon-container">
          <i class="fas" :class="isDarkTheme ? 'fa-sun' : 'fa-moon'"></i>
        </div>
        <span v-show="isExpanded" class="theme-label">{{
          isDarkTheme ? '亮色主题' : '暗色主题'
        }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'

const props = defineProps<{
  isExpanded: boolean
  isDarkTheme?: boolean
}>()

defineEmits(['toggle', 'toggle-theme'])

const isHovered = ref(false)
const modalStore = useGlobalModalStore()

const navItems = [
  {
    path: '/home',
    iconType: ['fas', 'home'],
    label: '这是首页',
    exact: true,
    matchPrefix: true,
  },
  { path: '/articles', iconType: ['fas', 'book-open'], label: '文章导航', matchPrefix: true },
  { path: '/gallery', iconType: ['fas', 'images'], label: '绘画长廊', matchPrefix: true },
  { path: '/friends', iconType: ['fas', 'paw'], label: '友情链接', matchPrefix: true },
  {
    path: '/admin/dashboard',
    iconType: ['fas', 'pen-nib'],
    label: '内容管理',
    matchPrefix: true,
  },
]

const toggleIcon = computed(() =>
  props.isExpanded ? 'fa-angle-double-left' : 'fa-angle-double-right',
)

const themeButtonStyle = computed(() => ({
  background: props.isDarkTheme ? 'rgba(251, 114, 153, 0.3)' : 'rgba(66, 133, 244, 0.5)',
}))
const isDarkTheme = computed(() => !!props.isDarkTheme)
</script>

<style scoped>
.nav-panel {
  width: 60px;
  transition:
    width 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55),
    transform 0.3s var(--aero-animation),
    opacity 0.2s ease;
  will-change: width, transform;
  padding: 16px 8px;
  position: sticky;
  top: 120px;
  bottom: 20px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  overflow-x: hidden;
  clip-path: inset(0 0 0 0 round 6px);
  z-index: 999;
  transform: translateY(0);
}

.nav-panel:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 30px rgba(255, 255, 255, 0.3),
    0 8px 40px rgba(0, 0, 0, 0.2);
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 35px;
}

/* 通用 nav-item 样式 */
.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 12px 12px 17px; /* 左侧 padding 统一 */
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  position: relative;
  height: 48px;
  box-sizing: border-box;
  transition: all 0.3s var(--aero-animation);
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  width: 100%;
  text-align: left;
}

.nav-item:not(.router-link-exact-active):not(.router-link-active):hover {
  background: rgba(0, 119, 255, 0.4);
  transform: translateY(-2px);
  box-shadow:
    0 4px 15px rgba(0, 119, 255, 0.2),
    0 0 15px rgba(0, 119, 255, 0.1);
}

.nav-item:hover .icon-container,
.nav-item:hover span {
  color: inherit;
}

.nav-item span {
  opacity: 0;
  transition: opacity 0.3s;
  white-space: nowrap;
  line-height: 24px;
  display: inline-block;
}

.nav-panel.expanded .nav-item span {
  opacity: 1;
  position: relative;
  transform: none;
}

/* ✨ 核心修复：统一图标容器样式 */
.icon-container {
  width: 24px;
  height: 24px;
  margin-right: 12px; /* 默认有右边距 */
  font-size: 1.2em;
  flex-shrink: 0;
  display: flex; /* 强制 Flex 布局 */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  transition: margin 0.3s; /* 边距过渡 */
}

.nav-panel.expanded {
  width: 200px;
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.toggle-btn {
  position: absolute;
  right: -10px;
  top: 72px;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background: rgb(0, 0, 0, 0.3);
  border: none;
  width: 35px;
  height: 30px;
  border-radius: 30%;
  cursor: pointer;
  color: white;
}

.dark-theme .toggle-btn {
  background: rgba(255, 255, 255, 0.3);
  color: black;
}

:deep(.router-link-exact-active),
:deep(.router-link-active),
.nav-item.router-link-active,
.nav-item.active {
  background: rgb(0, 119, 255) !important;
  color: inherit !important;
  box-shadow:
    0 4px 15px rgba(0, 119, 255, 0.2),
    0 0 15px rgba(0, 119, 255, 0.1);
}

:deep(.router-link-active:not(.router-link-exact-active)) {
  background: inherit;
  color: inherit;
}

:deep(.router-link-active::after) {
  display: none;
}

.theme-toggle {
  background: v-bind('themeButtonStyle.background') !important;
}

/* ✨ 核心修复：收起状态下的样式重置 */
.nav-panel:not(.expanded) .nav-item {
  justify-content: center; /* 按钮内容居中 */
  padding-left: 0; /* 移除内边距 */
  padding-right: 0;
}

.nav-panel:not(.expanded) .icon-container {
  margin-right: 0; /* 移除图标右边距，防止挤偏 */
}

/* 隐藏所有文字标签 */
.nav-panel:not(.expanded) .nav-item span:not(.icon-container) {
  display: none !important;
}

/* 确保主题按钮和设置按钮在收起时尺寸正确 */
.nav-panel:not(.expanded) .theme-toggle,
.nav-panel:not(.expanded) .settings-btn {
  width: 100%;
}
</style>
