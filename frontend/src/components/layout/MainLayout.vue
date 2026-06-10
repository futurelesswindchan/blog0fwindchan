<!-- src\components\layout\MainLayout.vue -->
<template>
  <div
    class="main-layout theme-transition"
    :class="{ 'dark-theme': isDarkTheme }"
    ref="pageWrapper"
  >
    <!-- 1.壁纸层 -->
    <div class="wallpaper-container">
      <div
        class="wallpaper"
        :style="wallpaperStyle"
        :class="{ 'no-transition': isScrolling }"
      ></div>
    </div>

    <!-- 2.反光效果层 -->
    <ReflectionLayer v-if="!isMobile" />

    <!-- 3.粒子层 -->
    <ParticleLayer v-if="!isMobile" :is-dark-theme="isDarkTheme" />

    <!-- 4.桌面端布局 -->
    <div v-if="!isMobile" class="content-container desktop-layout">
      <!-- a.标题栏 -->
      <header class="title-bar glass-container">
        <div class="left-group">
          <img :src="logo" class="logo" />
          <h1>风风博客</h1>
        </div>

        <div class="center-group">
          <div class="time-display">
            <div class="time-row">
              <span class="time">{{ currentTime }}</span>
              <span class="divider">/</span>
              <span class="date">{{ currentDate }}</span>
            </div>
          </div>
        </div>

        <div class="right-group">
          <span class="current-location" :class="{ 'nav-open': showMobileNav }">
            <TypeWriter
              :text="currentLocation"
              :speed="50"
              :delay="300"
              :enabled="true"
              :show-cursor="false"
              :auto-start="true"
            />
          </span>
        </div>
      </header>

      <!-- b.侧边栏+内容区 -->
      <div class="main-content">
        <!-- 侧边栏导航 -->
        <NavPanel
          :is-expanded="navExpanded"
          :is-dark-theme="isDarkTheme"
          @toggle="navExpanded = !navExpanded"
          @toggle-theme="toggleTheme"
        />

        <!-- 内容视图 -->
        <div class="content-view glass-container">
          <PageTransition />
        </div>
      </div>
    </div>

    <!-- 5.移动端布局 -->
    <div v-else class="content-container mobile-layout">
      <!-- a.标题栏 -->
      <header class="mobile-header glass-container" :class="{ 'nav-open': showMobileNav }">
        <img :src="logo" class="logo" alt="博客logo" />

        <div class="mobile-title">
          <TypeWriter
            :text="currentLocation"
            :speed="500"
            :delay="300"
            :enabled="true"
            :show-cursor="false"
            :auto-start="true"
          />
        </div>

        <button class="nav-toggle" @click="showMobileNav = true">
          <i class="fas fa-bars"></i>
        </button>
      </header>

      <!-- b.移动端侧边栏 -->
      <MobileNavPanel
        v-show="showMobileNav"
        :is-dark-theme="isDarkTheme"
        @close="showMobileNav = false"
        @toggle-theme="toggleTheme"
      />

      <!-- c.移动端遮罩层 -->
      <Transition name="fade">
        <div v-if="showMobileNav" class="mobile-overlay" @click="showMobileNav = false"></div>
      </Transition>

      <!-- d.内容区域 -->
      <div class="content-view glass-container">
        <PageTransition />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThrottledScrollHandler } from '@/composables/useThrottledScrollHandler'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

import { useTheme } from '@/composables/useTheme'
import { useMobileNav } from '@/composables/useMobileNav'
import { useClock } from '@/composables/useClock'

import TypeWriter from '@/components/common/TypeWriter.vue'
import PageTransition from './PageTransition.vue'
import ReflectionLayer from './ReflectionLayer.vue'
import MobileNavPanel from './MobileNavPanel.vue'
import ParticleLayer from './ParticleLayer.vue'
import NavPanel from './NavPanel.vue'

// --- 资源导入 ---
const logo = '/favicon.png'

// --- 状态管理 ---
const navExpanded = ref(false)

// --- 组合式函数 ---
const { isDarkTheme, wallpaperStyle, toggleTheme } = useTheme()
const { isMobile, showMobileNav } = useMobileNav()
const { currentTime, currentDate } = useClock()

// --- 路由与位置 ---
const route = useRoute()
const currentLocation = computed<string>(() => {
  return (route.meta?.title as string) || '首页'
})

// --- 滚动状态监控 ---
const isScrolling = ref(false)
const { handleScroll } = useThrottledScrollHandler(isScrolling)

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  width: 100%;
  position: relative;
  z-index: 1;
  transition: padding-right 0.3s var(--aero-animation);
}

/* 壁纸容器样式 */
.wallpaper-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  will-change: transform;
  background-color: gray;
}

/* 壁纸样式 */
.wallpaper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  transition: background-image 0.6s ease;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
}

/* 滚动时禁用过渡 */
.wallpaper.no-transition {
  transition: none;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 标题栏布局调整 */
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* 中间时间组样式 */
.center-group {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

/* 修改时间组样式 */
.time-display {
  display: flex;
  align-items: center;
  pointer-events: none;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time {
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: 1px;
  color: var(--accent-color);
  text-shadow: 0 0 10px rgba(var(--accent-color-rgb), 0.3);
  transition: all 0.3s var(--aero-animation);
}

.divider {
  font-size: 1.2rem;
  opacity: 0.6;
  margin: 0 2px;
  transform: rotate(15deg); /* 让斜杠稍微倾斜 */
  color: inherit;
}

.date {
  font-size: 1.1rem;
  opacity: 0.8;
  color: inherit;
  transition: all 0.3s var(--aero-animation);
}

/* 暗色主题适配 */
.dark-theme .time {
  color: #90caf9;
  text-shadow: 0 0 10px rgba(144, 202, 249, 0.3);
}

.dark-theme .date,
.dark-theme .divider {
  color: rgba(255, 255, 255, 0.9);
}

/* 添加悬停效果 */
@media (hover: hover) {
  .time-display:hover .time {
    transform: scale(1.05);
    text-shadow: 0 0 15px rgba(var(--accent-color-rgb), 0.5);
  }

  .time-display:hover .date {
    opacity: 1;
  }

  .time-display:hover .divider {
    opacity: 0.8;
  }
}

.left-group {
  display: flex;
  align-items: center;
  gap: 15px; /* 控制Logo与标题间距 */
}

.logo {
  width: 45px; /* 适当放大Logo */
  height: 45px;
  margin-right: 0; /* 移除原有右边距 */
  border-radius: 6px;
  transition: transform 0.3s;
}

.logo:hover {
  transform: rotate(15deg) scale(1.1);
}

.right-group {
  display: flex;
  align-items: center;
  gap: 20px; /* 增加间距 */
  position: relative; /* 添加相对定位 */
}

/* 为当前位置文本添加样式 */
.current-location {
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px; /* 确保有足够空间显示文字 */
  margin-left: 20px; /* 确保与主题按钮有足够间距 */
  flex: 1;
  text-align: right; /* 靠右对齐 */
}

/* 暗色主题下的当前位置文字颜色 */
.dark-theme .current-location {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* 使用 showMobileNav 状态来控制文本颜色 */
.mobile-header .current-location {
  font-size: 1.1rem;
  font-weight: 500;
  flex: 1;
  text-align: center;
  margin: 0 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50%;
  color: inherit;
  transition: color 0.3s var(--aero-animation);
}

/* 深色主题适配 */
.dark-theme .mobile-header .current-location {
  color: rgba(255, 255, 255, 0.9);
}

.main-content {
  display: flex;
  gap: 20px;
}

/* 优化内容视图容器 */
.content-view {
  flex: 1;
  position: relative;
  min-height: 600px;
  perspective: 1000px; /* 添加过渡时的透视效果 */
}

/* 移动端样式 */
.mobile-layout {
  padding-top: 56px; /* 标题栏高度 */
}

.mobile-layout .content-view {
  margin: 12px 0 12px 0;
  border-radius: 12px;
}

.mobile-nav {
  position: fixed;
  top: 90px;
  left: 8px;
  bottom: 10px;
  width: 280px;
  z-index: 999;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  touch-action: none;
}

.dark-theme .mobile-overlay {
  background: rgba(0, 0, 0, 0.3);
}

/* 移动端标题栏基础样式 */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  box-sizing: border-box;
  backdrop-filter: blur(5px);
  transition: all 0.3s var(--aero-animation);
}

/* Logo 样式优化 */
.mobile-header .logo {
  width: 35px;
  height: 35px;
  border-radius: 8px;
  transition: transform 0.3s var(--aero-animation);
}

.mobile-header .logo:active {
  transform: scale(0.95);
}

/* 导航切换按钮样式 */
.mobile-header .nav-toggle {
  width: 35px;
  height: 35px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s var(--aero-animation);
  -webkit-tap-highlight-color: transparent;
}

.mobile-header .nav-toggle i {
  font-size: 1.2rem;
  transition: transform 0.3s var(--aero-animation);
}

/* 按钮点击效果 */
.mobile-header .nav-toggle:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.2);
}

.mobile-header .nav-toggle:active i {
  transform: rotate(90deg);
}

/* 深色主题适配 */
.dark-theme .mobile-header .nav-toggle {
  background: rgba(0, 0, 0, 0.2);
}

.dark-theme .mobile-header .nav-toggle:active {
  background: rgba(0, 0, 0, 0.3);
}

/* 移动端标题样式 */
.mobile-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 1rem;
  max-width: 100%;
}

.mobile-title :deep(.type-writer) {
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
  transition: color 0.3s var(--aero-animation);
}

/* 侧边栏打开时的文字颜色 */
.mobile-header.nav-open .mobile-title :deep(.type-writer) {
  color: white !important;
}

/* 深色主题适配 */
.dark-theme .mobile-title :deep(.type-writer) {
  color: rgba(255, 255, 255, 0.9);
}

/* 添加以下过渡动画样式 */
.fade-enter-active,
.fade-leave-active,
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform var(--page-transition-duration) var(--page-transition-timing),
    opacity var(--page-transition-duration) var(--page-transition-timing),
    filter var(--page-transition-duration) var(--page-transition-timing);
  will-change: transform, opacity;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  filter: var(--page-transition-blur);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
  filter: var(--page-transition-blur);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
  filter: var(--page-transition-blur);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
  filter: var(--page-transition-blur);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
  filter: var(--page-transition-blur);
}
</style>
