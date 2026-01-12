<!-- src\components\layout\MainLayout.vue -->
<template>
  <div
    class="main-layout theme-transition"
    :class="{ 'dark-theme': isDarkTheme }"
    ref="pageWrapper"
  >
    <!-- 壁纸层 -->
    <div class="wallpaper-container">
      <div
        class="wallpaper"
        :style="wallpaperStyle"
        :class="{ 'no-transition': isScrolling }"
      ></div>
    </div>

    <!-- 添加反光效果层-->
    <ReflectionLayer v-if="!isMobile" />

    <!-- 桌面端布局 -->
    <div v-if="!isMobile" class="content-container desktop-layout">
      <!-- 标题栏 -->
      <header class="title-bar glass-container">
        <div class="left-group">
          <img :src="logo" class="logo" />
          <h1>风风博客</h1>
        </div>
        <div class="center-group" v-if="!isMobile">
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

      <!-- 导航+内容区 -->
      <div class="main-content">
        <NavPanel
          :is-expanded="navExpanded"
          :is-dark-theme="isDarkTheme"
          @toggle="navExpanded = !navExpanded"
          @toggle-theme="toggleWallpaper"
        />
        <!-- 内容视图 -->
        <div class="content-view glass-container">
          <router-view v-slot="{ Component }">
            <template v-if="Component">
              <transition
                :name="transitionName"
                mode="out-in"
                @before-enter="beforeEnter"
                @after-enter="afterEnter"
              >
                <component :is="Component" :key="route.name || route.path" />
              </transition>
            </template>
            <template v-else>
              <div style="color: red; padding: 2em; text-align: center">
                组件未找到（Component is undefined），请检查路由配置和页面组件是否正常导出。
              </div>
            </template>
          </router-view>
        </div>
      </div>
    </div>

    <!-- 移动端布局 -->
    <div v-else class="content-container mobile-layout">
      <!-- 移动端标题栏 -->
      <header class="mobile-header glass-container">
        <img :src="logo" class="logo" alt="博客logo" />
        <div class="mobile-title">
          <!-- 添加包装器 -->
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

      <!-- 移动端侧边栏 -->
      <MobileNavPanel
        v-show="showMobileNav"
        :is-dark-theme="isDarkTheme"
        @close="showMobileNav = false"
        @toggle-theme="toggleWallpaper"
      />

      <!-- 移动端遮罩层 -->
      <Transition name="fade">
        <div v-if="showMobileNav" class="mobile-overlay" @click="showMobileNav = false"></div>
      </Transition>

      <!-- 内容区域 -->
      <div class="content-view glass-container">
        <router-view v-slot="{ Component }">
          <template v-if="Component">
            <transition
              :name="transitionName"
              mode="out-in"
              @before-enter="beforeEnter"
              @after-enter="afterEnter"
            >
              <component :is="Component" :key="route.name || route.path" />
            </transition>
          </template>
          <template v-else>
            <div style="color: red; padding: 2em; text-align: center">
              组件未找到（Component is undefined），请检查路由配置和页面组件是否正常导出。
            </div>
          </template>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThrottledScrollHandler } from '@/composables/useThrottledScrollHandler'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { useRoute } from 'vue-router'

import NavPanel from './NavPanel.vue'
import MobileNavPanel from './MobileNavPanel.vue'
import TypeWriter from '@/components/common/TypeWriter.vue'
import ReflectionLayer from './ReflectionLayer.vue'

// 修改图片导入
const logo = '/favicon.png'
const lightWallpaper = '/assets/images/wallpaper.webp'
const darkWallpaper = '/assets/images/dark-theme-wallpaper.webp'

const navExpanded = ref(false)

const { notify } = useToast()

// 当前页面标题
const route = useRoute()
const currentLocation = computed<string>(() => {
  return (route.meta?.title as string) || '首页'
})

// 主题状态
const isDarkTheme = ref(false)

// 壁纸样式计算属性
const wallpaperStyle = computed(() => ({
  backgroundImage: `url(${isDarkTheme.value ? darkWallpaper : lightWallpaper})`,
  transform: 'translate3d(0,0,0)',
  backfaceVisibility: 'hidden' as const, // 添加类型断言
  willChange: 'transform',
}))

// 壁纸切换函数
const toggleWallpaper = () => {
  isDarkTheme.value = !isDarkTheme.value
  localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')

  notify({
    message: `已切换到${isDarkTheme.value ? '暗色' : '亮色'}主题了哦(/≧▽≦)/`,
    type: 'success',
  })
}

// 初始化主题
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  isDarkTheme.value = savedTheme === 'dark'
})

// 移动端状态控制
const isMobile = ref(false)
const pageWrapper = ref<HTMLElement | null>(null)
const showMobileNav = ref(false)

// 添加滚动位置记录
let scrollPosition = 0

// 添加滚动条宽度记录
const scrollbarWidth = ref(0)

// 检测设备类型
const checkDevice = () => {
  isMobile.value = window.innerWidth < 768
}

// 监听窗口大小变化
onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)

  // 计算滚动条宽度
  scrollbarWidth.value = window.innerWidth - document.documentElement.clientWidth
})

// 添加滚动状态跟踪
const isScrolling = ref(false)
const { handleScroll } = useThrottledScrollHandler(isScrolling)

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkDevice)
})

// 锁定滚动
const lockScroll = () => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.style.paddingRight = `${scrollbarWidth}px`
}

// 解锁滚动
const unlockScroll = () => {
  document.documentElement.style.overflow = ''
  document.documentElement.style.paddingRight = ''
}

// 优化移动导航状态监听
watch(showMobileNav, (isOpen) => {
  if (isOpen) {
    // 保存当前滚动位置
    scrollPosition = window.scrollY
    lockScroll()
  } else {
    unlockScroll()
    // 恢复滚动位置
    window.scrollTo(0, scrollPosition)
  }
})

// 组件卸载时确保解锁
onUnmounted(() => {
  unlockScroll()
})

// 添加时间显示
const currentTime = ref('')
const currentDate = ref('')
let timeInterval: number | null = null

// 格式化时间函数
const updateDateTime = () => {
  const now = new Date()
  currentTime.value = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)

  currentDate.value = new Intl.DateTimeFormat('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)
}

// 在组件挂载时启动时间更新
onMounted(() => {
  updateDateTime() // 立即更新一次
  timeInterval = window.setInterval(updateDateTime, 1000)
})

// 在组件卸载时清除定时器
onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// 监听路由变化以触发打字效果
watch(
  currentLocation,
  () => {
    // TypeWriter组件会自动处理文本变化
  },
  { immediate: true },
)

// 页面切换过渡动画----=-
const transitionName = ref('fade')
const isTransitioning = ref(false)

// 根据路由变化决定过渡效果
watch(
  () => route.path,
  (to, from) => {
    const toDepth = to.split('/').length
    const fromDepth = from.split('/').length
    transitionName.value = toDepth < fromDepth ? 'slide-right' : 'slide-left'
  },
)

// 过渡动画钩子
const beforeEnter = () => {
  isTransitioning.value = true
}

const afterEnter = () => {
  isTransitioning.value = false
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  width: 100%;
  position: relative;
  z-index: 1;
  /* 添加过渡效果 */
  transition: padding-right 0.3s var(--aero-animation);
}

/* 优化壁纸容器样式 */
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
  background-color: var(--bg-color); /* 添加背景色防止闪白 */
}

/* 优化壁纸样式 */
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
  pointer-events: none; /* 防止干扰鼠标事件 */
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
  text-shadow: 0 0 10px rgba(0, 119, 255, 0.3);
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
    text-shadow: 0 0 15px rgba(0, 119, 255, 0.5);
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

.wallpaper-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px; /* 增加内边距 */
  border-radius: 8px;
  width: 100px; /* 增加宽度 */
  height: 40px; /* 固定高度 */
  border: 1px solid var(--aero-border-color);
  color: rgba(0, 0, 0, 0.75);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s var(--aero-animation);
  backdrop-filter: var(--aero-blur);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
  justify-content: center; /* 添加居中对齐 */
  transition: all 0.3s ease-in-out;
  opacity: 0.9;
}

.wallpaper-toggle i {
  font-size: 1.2rem; /* 增大图标 */
  width: 20px;
}

.wallpaper-toggle span {
  min-width: 40px;
  font-size: 1rem;
}

/* 调整当前位置文本容器 */
.current-location {
  margin-left: 20px; /* 确保与主题按钮有足够间距 */
  flex: 1;
  min-width: 120px;
  text-align: right; /* 靠右对齐 */
}

/* 暗色主题下的按钮文字颜色 */
.dark-theme .wallpaper-toggle {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 暗色主题下的当前位置文字颜色 */
.dark-theme .current-location {
  color: rgba(255, 255, 255, 0.9) !important;
}

/* 暗色主题下按钮的悬浮和激活状态 */
.dark-theme .wallpaper-toggle:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(255, 255, 255, 0.1);
}

.dark-theme .wallpaper-toggle:active {
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.2);
}

/* 为当前位置文本添加样式 */
.current-location {
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px; /* 确保有足够空间显示文字 */
}

.current-location-mobile {
  display: none; /* 移动端显示 */
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

/* 侧边栏打开时的文字颜色 */
.mobile-header .current-location.nav-open {
  color: white !important;
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
}

.view-component {
  width: 100%;
  min-height: 200px;
  /* 移除 position: absolute/left/top */
  transition: box-shadow 0.5s ease;
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

/* 移动端光标样式优化 */
.mobile-title :deep(.cursor) {
  display: inline-block;
  margin-left: 2px;
  color: var(--accent-color);
  animation: blink 1s infinite;
}

.dark-theme .mobile-title :deep(.cursor) {
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

/* 添加过渡时的模糊效果 */
.content-view {
  perspective: 1000px;
}

.view-transitioning {
  overflow: hidden;
  filter: var(--page-transition-blur);
}
</style>
