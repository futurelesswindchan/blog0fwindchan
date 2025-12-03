<template>
  <nav
    class="nav-panel glass-container"
    :class="{ expanded: isExpanded }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <button class="toggle-btn" @click="$emit('toggle')">
      <i class="fas" :class="toggleIcon" />
    </button>

    <div class="nav-items">
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
        <font-awesome-icon class="icon" :icon="item.iconType" fixed-width />
        <span v-show="isExpanded">{{ item.label }}</span>
      </router-link>
      <!-- 主题切换按钮，放在所有导航项后面 -->
      <button
        class="nav-item theme-toggle"
        :style="themeButtonStyle"
        @click="$emit('toggle-theme')"
        type="button"
      >
        <span class="icon theme-icon-wrapper">
          <i class="fas theme-icon" :class="isDarkTheme ? 'fa-sun' : 'fa-moon'"></i>
        </span>
        <span v-show="isExpanded" class="theme-label">{{
          isDarkTheme ? '切换到亮色主题' : '切换到暗色主题'
        }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  isExpanded: boolean
  isDarkTheme?: boolean
}>()

defineEmits(['toggle', 'toggle-theme'])

const isHovered = ref(false)

const navItems = [
  {
    path: '/home',
    iconType: ['fas', 'home'],
    label: '这是首页',
    exact: true,
    matchPrefix: true,
  },
  { path: '/articles', iconType: ['fas', 'book-open'], label: '文章导航', matchPrefix: true },
  {
    path: '/admin/dashboard',
    iconType: ['fas', 'pen-nib'],
    label: '内容管理',
    matchPrefix: true,
  },
  { path: '/gallery', iconType: ['fas', 'images'], label: '绘画长廊', matchPrefix: true },
  { path: '/friends', iconType: ['fas', 'paw'], label: '友情链接', matchPrefix: true },
  { path: '/settings', iconType: ['fas', 'cog'], label: '设置界面', matchPrefix: true },
]

const toggleIcon = computed(() =>
  props.isExpanded ? 'fa-angle-double-left' : 'fa-angle-double-right',
)

// 主题按钮样式
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
    /* 添加transform过渡 */ opacity 0.2s ease;
  will-change: width, transform; /* 添加transform到will-change */
  padding: 16px 8px;
  position: sticky;
  top: 120px;
  bottom: 20px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  overflow-x: hidden;
  clip-path: inset(0 0 0 0 round 6px);
  z-index: 999;
  transform: translateY(0); /* 初始状态 */
}

/* 添加悬浮效果 */
.nav-panel:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 30px rgba(255, 255, 255, 0.3),
    0 8px 40px rgba(0, 0, 0, 0.2);
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 35px; /* 控制导航项间距 */
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 12px 12px 17px;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  position: relative;
  height: 48px;
  box-sizing: border-box;
  transition: all 0.3s var(--aero-animation); /* 添加过渡效果 */
}

/* 添加悬浮效果 */
.nav-item:not(.router-link-exact-active):not(.router-link-active):hover {
  background: rgba(0, 119, 255, 0.4); /* 半透明蓝色背景 */
  transform: translateY(-2px);
  box-shadow:
    0 4px 15px rgba(0, 119, 255, 0.2),
    0 0 15px rgba(0, 119, 255, 0.1);
}

/* 保持图标和文字颜色不变 */
.nav-item:hover .icon,
.nav-item:hover span {
  color: inherit; /* 继承原来的颜色 */
}

.nav-item span {
  opacity: 0;
  transition: opacity 0.3s;
  white-space: nowrap;
  line-height: 24px; /* 确保文字行高一致 */
  display: inline-block; /* 使行高生效 */
}

.nav-panel.expanded .nav-item span {
  opacity: 1;
  position: relative; /* 改用相对定位而不是static */
  transform: none;
}

.icon {
  width: 24px;
  height: 24px; /* 明确设置图标高度 */
  margin-right: 12px;
  font-size: 1.2em;
  flex-shrink: 0;
  display: flex; /* 确保图标垂直居中 */
  align-items: center;
  justify-content: center;
}

.nav-panel.expanded {
  width: 200px;
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.toggle-btn {
  position: absolute;
  right: -10px;
  top: 72px;
  z-index: 1001; /* 确保按钮在面板上方 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* 添加投影增强立体感 */
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

/* 修改激活状态的样式 */
:deep(.router-link-exact-active),
:deep(.router-link-active),
.nav-item.router-link-active,
.nav-item.active {
  background: rgb(0, 119, 255) !important; /* 统一使用纯蓝色 */
  color: inherit !important; /* 覆盖主题中的白色文字 */
  box-shadow:
    0 4px 15px rgba(0, 119, 255, 0.2),
    0 0 15px rgba(0, 119, 255, 0.1);
}

/* 移除其他激活样式的覆盖 */
:deep(.router-link-active:not(.router-link-exact-active)) {
  background: inherit;
  color: inherit;
}

/* 移除主题中定义的箭头 */
:deep(.router-link-active::after) {
  display: none;
}

/* 优化壁纸容器样式 */
.wallpaper-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  background-color: #f5f5f5;
  transform: translateZ(0); /* 启用硬件加速 */
  backface-visibility: hidden;
  perspective: 1000;
  will-change: transform; /* 提示浏览器优化性能 */
}

/* 优化壁纸样式 */
.wallpaper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-position: center;
  background-size: cover;
  background-attachment: fixed; /* 在移动端禁用此属性 */
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: background;
}

/* 移动端特定优化 */
@media (max-width: 768px) {
  .wallpaper-container {
    height: 100dvh; /* 使用动态视口高度 */
  }

  .wallpaper {
    background-attachment: scroll; /* 移动端使用滚动而不是固定 */
    /* 扩大背景尺寸以防止边缘出现 */
    background-size: calc(100% + 10px) calc(100% + 10px);
    /* 调整背景位置以补偿扩大的尺寸 */
    background-position: center center;
    margin: -5px;
  }
}

.theme-toggle {
  border: none;
  cursor: pointer;
  gap: 12px;
  border-radius: 8px;
  color: inherit;
  width: 100%;
  height: 48px;
  min-height: 48px;
  background: v-bind('themeButtonStyle.background') !important;
  transition: all 0.3s var(--aero-animation);
  padding: 12px 12px 12px 17px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
}

.theme-toggle .theme-icon-wrapper {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle .theme-icon {
  font-size: 1.2em;
  width: 20px;
  height: 20px;
  display: inline-block;
  text-align: center;
  vertical-align: middle;
  /* 让日月图标宽度一致，避免切换时抖动 */
}

.theme-toggle .theme-label {
  display: inline-block;
  min-width: 110px;
  text-align: left;
  transition: none;
}

.theme-toggle:active {
  opacity: 0.7;
  transform: scale(0.98);
}
.dark-theme .theme-toggle {
  color: rgba(255, 255, 255, 0.9);
}

/* 收起状态下，图标完全居中，且始终显示 */
.nav-panel:not(.expanded) .theme-toggle {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

.nav-panel:not(.expanded) .theme-toggle .theme-label {
  display: none !important;
}

.nav-panel:not(.expanded) .theme-toggle .theme-icon-wrapper {
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
  min-height: 24px !important;
}

.nav-panel:not(.expanded) .theme-toggle .theme-icon {
  display: inline-block !important;
  width: 20px !important;
  height: 20px !important;
  font-size: 1.2em !important;
  text-align: center;
  vertical-align: middle;
  margin: 0 !important;
}

/* 保证收起时按钮宽度和高度与其他按钮一致 */
.nav-panel:not(.expanded) .theme-toggle {
  width: 100%;
  height: 48px;
  min-height: 48px;
}

/* 保证图标始终可见 */
.nav-panel:not(.expanded) .theme-toggle .theme-icon-wrapper,
.nav-panel:not(.expanded) .theme-toggle .theme-icon {
  visibility: visible !important;
  opacity: 1 !important;
}
</style>
