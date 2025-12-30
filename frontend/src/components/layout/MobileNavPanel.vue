<!-- frontend\src\components\layout\MobileNavPanel.vue -->
<template>
  <nav
    class="mobile-nav"
    :class="{
      'dark-theme': isDarkTheme,
      'sliding-out': isClosing,
    }"
    @animationend="onAnimationEnd"
  >
    <div class="nav-header">
      <h2>导航菜单</h2>
      <button class="close-btn" @click="handleClose">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="nav-items nav-items-grid">
      <hr />
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
        @click="handleClose"
      >
        <!-- 统一图标容器 -->
        <div class="icon-container">
          <font-awesome-icon :icon="item.iconType" fixed-width />
        </div>
        <span>{{ item.label }}</span>
      </router-link>
      <hr />
    </div>

    <!-- 2. 设置按钮 -->
    <button class="nav-item settings-item" @click="openSettings">
      <div class="icon-container">
        <font-awesome-icon :icon="['fas', 'cog']" fixed-width />
      </div>
      <span>设置界面</span>
    </button>

    <!-- 3. 主题切换 -->
    <button class="nav-item theme-toggle" :style="themeButtonStyle" @click="$emit('toggle-theme')">
      <!-- 统一图标容器，修复对齐 -->
      <div class="icon-container">
        <i class="fas" :class="isDarkTheme ? 'fa-sun' : 'fa-moon'"></i>
      </div>
      <span>{{ isDarkTheme ? '亮色主题' : '暗色主题' }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { ref, computed } from 'vue'

const { isDarkTheme } = defineProps<{
  isDarkTheme: boolean
}>()

const emit = defineEmits(['close', 'toggle-theme'])
const isClosing = ref(false)
const modalStore = useGlobalModalStore()

const themeButtonStyle = computed(() => ({
  background: isDarkTheme ? 'rgba(251, 114, 153, 0.3)' : 'rgba(66, 133, 244, 0.5)',
}))

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

const openSettings = () => {
  modalStore.openSettings()
  handleClose()
}

const handleClose = () => {
  if (!isClosing.value) {
    isClosing.value = true
  }
}

const onAnimationEnd = () => {
  if (isClosing.value) {
    emit('close')
    isClosing.value = false
  }
}
</script>

<style scoped>
.mobile-nav {
  position: fixed;
  padding: 20px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  transition: none;
  transform-origin: unset;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.9);
  transition: all 0.3s ease;
}

.dark-theme .mobile-nav {
  background-color: rgba(0, 0, 0, 0.9);
  color: rgba(255, 255, 255, 0.9);
}

@keyframes slideIn {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes slideOut {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

.mobile-nav {
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.mobile-nav.sliding-out {
  animation: slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.nav-item,
.close-btn,
.theme-toggle {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

.close-btn:active,
.theme-toggle:active,
.nav-item:active {
  opacity: 0.7;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-radius: 8px;
  padding: 0px 16px;
}
.nav-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: inherit;
  opacity: 0.9;
}
.close-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  padding: 8px;
  cursor: pointer;
  opacity: 0.8;
}

hr {
  border: none;
  height: 1px;
  background-color: rgba(0, 0, 0, 1);
  transition: all 0.3s ease;
  margin: 12px 0;
}
.dark-theme hr {
  background-color: rgba(255, 255, 255, 1);
}

.nav-items-grid {
  word-break: keep-all;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-items: stretch;
  padding: 0 2px;
}
.nav-items-grid hr {
  grid-column: 1 / -1;
}
.nav-items-grid .nav-item {
  width: 95%;
  min-width: 0;
  font-size: 0.98rem;
  padding: 10px 15px;
  margin: 0 auto;
  box-sizing: border-box;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.85);
  text-decoration: none;
  gap: 12px; /* 控制图标和文字的间距 */
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

/* 移动端图标容器对齐 */
.icon-container {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1em;
}

.dark-theme .nav-item {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-exact-active,
.nav-item.router-link-active,
.nav-item.active {
  background: rgba(0, 119, 255, 0.5);
  color: var(--accent-color);
}
.dark-theme .nav-item.router-link-exact-active,
.dark-theme .nav-item.router-link-active,
.dark-theme .nav-item.active {
  background: rgba(0, 119, 255, 0.6);
  color: #fff;
}

.nav-item svg,
.theme-toggle i {
  color: var(--accent-color);
  opacity: 0.9;
}
.dark-theme .nav-item svg,
.dark-theme .theme-toggle i {
  opacity: 1;
}

.theme-toggle {
  background: v-bind('themeButtonStyle.background') !important;
}

@media (hover: none) {
  .mobile-overlay {
    backdrop-filter: none;
  }
  .mobile-nav {
    will-change: auto;
    backface-visibility: visible;
    -webkit-backface-visibility: visible;
  }
}

.theme-toggle,
.nav-items-grid .nav-item,
.settings-item {
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  transition: 0.3s ease;
  margin-bottom: 8px;
}
</style>
