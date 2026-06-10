<!-- frontend\src\components\layout\MobileNavPanel.vue -->
<template>
  <nav
    class="mobile-nav"
    :class="{
      'is-dark': isDarkTheme,
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
      <div class="icon-container">
        <font-awesome-icon :icon="['fas', isDarkTheme ? 'sun' : 'moon']" fixed-width />
      </div>
      <span>{{ isDarkTheme ? '亮色主题' : '暗色主题' }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useGlobalModalStore } from '@/stores/globalModalStore'
import { navItems, themeToggleColors } from '@/site.config'
import { ref, computed } from 'vue'

const { isDarkTheme } = defineProps<{
  isDarkTheme: boolean
}>()

const emit = defineEmits(['close', 'toggle-theme'])
const isClosing = ref(false)
const modalStore = useGlobalModalStore()

const themeButtonStyle = computed(() => ({
  background: isDarkTheme ? themeToggleColors.dark : themeToggleColors.light,
}))

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
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.mobile-nav.is-dark {
  background-color: rgba(0, 0, 0, 0.9);
  color: rgba(255, 255, 255, 0.9);
}

.mobile-nav.sliding-out {
  animation: slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
  transition: background-color 0.3s ease;
  margin: 12px 0;
}

.mobile-nav.is-dark hr {
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
  gap: 12px;
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

.mobile-nav.is-dark .nav-item {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-exact-active,
.nav-item.router-link-active,
.nav-item.active {
  background: rgba(var(--accent-color-rgb), 0.5);
  color: var(--accent-color);
}

.mobile-nav.is-dark .nav-item.router-link-exact-active,
.mobile-nav.is-dark .nav-item.router-link-active,
.mobile-nav.is-dark .nav-item.active {
  background: rgba(var(--accent-color-rgb), 0.6);
  color: #fff;
}

.nav-item svg,
.theme-toggle i {
  opacity: 0.9;
}

.mobile-nav.is-dark .nav-item svg,
.mobile-nav.is-dark .theme-toggle i {
  opacity: 1;
}

.theme-toggle {
  background: v-bind('themeButtonStyle.background') !important;
}

@media (hover: none) {
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
  transition: all 0.3s ease;
  margin-bottom: 8px;
}
</style>
